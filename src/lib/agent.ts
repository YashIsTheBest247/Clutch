import { Type, type FunctionDeclaration } from '@google/genai';
import type {
  AgentAction,
  AppState,
  Deliverable,
  Priority,
  Task,
  TaskStatus,
} from '../types';
import { getClient, MODEL } from './gemini';
import { uid } from './storage';
import { autoSchedule, computeUrgency } from './scheduler';

// ---------------------------------------------------------------------------
// Tool surface the agent can act through. Each maps to a real mutation of the
// app state — this is what makes Clutch agentic rather than a chatbot: it does
// the work, it doesn't just talk about it.
// ---------------------------------------------------------------------------

const tools: FunctionDeclaration[] = [
  {
    name: 'add_task',
    description:
      'Create a new task/commitment the user must complete. Use whenever the user mentions something to do, a deadline, an assignment, a meeting, a bill, an interview, etc.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Short imperative title, e.g. "Submit CS101 essay".' },
        deadline: {
          type: Type.STRING,
          description:
            'Hard deadline as ISO 8601 with offset (e.g. 2026-06-28T17:00:00+05:30). Compute from relative phrases using the current time given to you. Omit if none.',
        },
        estimateMins: { type: Type.NUMBER, description: 'Your estimate of focused minutes required.' },
        priority: { type: Type.STRING, enum: ['critical', 'high', 'medium', 'low'] },
        category: { type: Type.STRING, description: 'Optional grouping tag, e.g. "CS101", "Finance".' },
        notes: { type: Type.STRING, description: 'Any useful context.' },
        reasoning: { type: Type.STRING, description: 'One line: why this priority.' },
      },
      required: ['title', 'estimateMins', 'priority'],
    },
  },
  {
    name: 'decompose_task',
    description:
      'Break an existing task into an ordered list of concrete, individually-actionable subtasks. Do this for any task that is non-trivial.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskRef: { type: Type.STRING, description: 'The task id, or an exact-enough title to match.' },
        subtasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              estimateMins: { type: Type.NUMBER },
            },
            required: ['title', 'estimateMins'],
          },
        },
      },
      required: ['taskRef', 'subtasks'],
    },
  },
  {
    name: 'set_priority',
    description: 'Re-rank a task and record why.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskRef: { type: Type.STRING },
        priority: { type: Type.STRING, enum: ['critical', 'high', 'medium', 'low'] },
        reasoning: { type: Type.STRING },
      },
      required: ['taskRef', 'priority'],
    },
  },
  {
    name: 'generate_deliverable',
    description:
      'PRODUCE the actual work product for a task and attach it — e.g. write the draft email, the essay outline, the study plan, the bill-payment checklist, the message to send. Write complete, ready-to-use content, not a description of it.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskRef: { type: Type.STRING },
        kind: {
          type: Type.STRING,
          enum: ['email', 'outline', 'plan', 'message', 'checklist', 'draft'],
        },
        title: { type: Type.STRING },
        content: { type: Type.STRING, description: 'The full, finished deliverable in Markdown.' },
      },
      required: ['taskRef', 'kind', 'title', 'content'],
    },
  },
  {
    name: 'update_task_status',
    description: 'Mark a task todo / in_progress / blocked / done.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskRef: { type: Type.STRING },
        status: { type: Type.STRING, enum: ['todo', 'in_progress', 'blocked', 'done'] },
      },
      required: ['taskRef', 'status'],
    },
  },
  {
    name: 'build_schedule',
    description:
      'Place all open tasks onto the calendar in focused blocks within the user working hours, earliest-deadline-first. Call this after adding/repriotizing tasks, or when the user asks for a plan/schedule.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'add_commitment',
    description:
      'Record a FIXED real-life event that blocks time (a class, meeting, gym, appointment) so the schedule is built AROUND it. Use when the user mentions a fixed time commitment, not a task to complete.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        start: { type: Type.STRING, description: 'ISO 8601 start with offset.' },
        end: { type: Type.STRING, description: 'ISO 8601 end with offset.' },
      },
      required: ['title', 'start', 'end'],
    },
  },
  {
    name: 'research_web',
    description:
      'Search the live web (Google) for real-world, up-to-date facts needed to plan or complete a task — opening hours, official portals/links, prices, addresses, dates, or how-to steps. Returns a grounded answer with sources. Use this instead of guessing real-world details.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'A focused, specific search query.' },
        forTask: { type: Type.STRING, description: 'Optional task id/title this research supports.' },
      },
      required: ['query'],
    },
  },
];

function findTask(state: AppState, ref: string): Task | undefined {
  const byId = state.tasks.find((t) => t.id === ref);
  if (byId) return byId;
  const lower = ref.toLowerCase();
  return (
    state.tasks.find((t) => t.title.toLowerCase() === lower) ||
    state.tasks.find((t) => t.title.toLowerCase().includes(lower) || lower.includes(t.title.toLowerCase()))
  );
}

type ToolResult = { result: Record<string, unknown>; action: AgentAction };

/** Execute one tool call against a (mutable) working state. */
async function executeTool(name: string, args: any, state: AppState, now: Date): Promise<ToolResult> {
  switch (name) {
    case 'add_task': {
      const task: Task = {
        id: uid('task'),
        title: args.title,
        notes: args.notes,
        deadline: args.deadline,
        estimateMins: Math.max(10, Number(args.estimateMins) || 45),
        priority: (args.priority as Priority) || 'medium',
        status: 'todo',
        category: args.category,
        subtasks: [],
        reasoning: args.reasoning,
        createdAt: now.toISOString(),
      };
      task.urgencyScore = computeUrgency(task, now);
      state.tasks.push(task);
      return {
        result: { ok: true, taskId: task.id, urgencyScore: task.urgencyScore },
        action: { tool: 'add_task', summary: `Added "${task.title}"` },
      };
    }
    case 'decompose_task': {
      const t = findTask(state, args.taskRef);
      if (!t) return { result: { ok: false, error: 'task not found' }, action: { tool: 'decompose_task', summary: 'No matching task' } };
      t.subtasks = (args.subtasks || []).map((s: any) => ({
        id: uid('sub'),
        title: s.title,
        estimateMins: Math.max(5, Number(s.estimateMins) || 20),
        done: false,
      }));
      t.estimateMins = t.subtasks.reduce((n, s) => n + s.estimateMins, 0) || t.estimateMins;
      t.urgencyScore = computeUrgency(t, now);
      return {
        result: { ok: true, count: t.subtasks.length },
        action: { tool: 'decompose_task', summary: `Broke "${t.title}" into ${t.subtasks.length} steps` },
      };
    }
    case 'set_priority': {
      const t = findTask(state, args.taskRef);
      if (!t) return { result: { ok: false, error: 'task not found' }, action: { tool: 'set_priority', summary: 'No matching task' } };
      t.priority = args.priority as Priority;
      if (args.reasoning) t.reasoning = args.reasoning;
      t.urgencyScore = computeUrgency(t, now);
      return {
        result: { ok: true },
        action: { tool: 'set_priority', summary: `"${t.title}" → ${t.priority}` },
      };
    }
    case 'generate_deliverable': {
      const t = findTask(state, args.taskRef);
      if (!t) return { result: { ok: false, error: 'task not found' }, action: { tool: 'generate_deliverable', summary: 'No matching task' } };
      const deliverable: Deliverable = {
        kind: args.kind,
        title: args.title,
        content: args.content,
        createdAt: now.toISOString(),
      };
      t.deliverable = deliverable;
      if (t.status === 'todo') t.status = 'in_progress';
      return {
        result: { ok: true },
        action: { tool: 'generate_deliverable', summary: `Drafted ${args.kind}: "${args.title}"` },
      };
    }
    case 'update_task_status': {
      const t = findTask(state, args.taskRef);
      if (!t) return { result: { ok: false, error: 'task not found' }, action: { tool: 'update_task_status', summary: 'No matching task' } };
      t.status = args.status as TaskStatus;
      if (t.status === 'done') t.subtasks.forEach((s) => (s.done = true));
      return {
        result: { ok: true },
        action: { tool: 'update_task_status', summary: `"${t.title}" → ${t.status}` },
      };
    }
    case 'add_commitment': {
      const cmt = {
        id: uid('cmt'),
        title: args.title,
        start: args.start,
        end: args.end,
      };
      state.commitments = [...(state.commitments ?? []), cmt];
      return {
        result: { ok: true },
        action: { tool: 'add_commitment', summary: `Blocked "${cmt.title}"` },
      };
    }
    case 'build_schedule': {
      state.tasks.forEach((t) => (t.urgencyScore = computeUrgency(t, now)));
      const busy = (state.commitments ?? []).map((c) => ({
        id: c.id,
        taskId: '',
        taskTitle: c.title,
        start: c.start,
        end: c.end,
        reason: 'fixed commitment',
      }));
      const blocks = autoSchedule(state.tasks, state.profile, busy, now);
      state.schedule = blocks;
      const byTask = new Map<string, number>();
      blocks.forEach((b) => byTask.set(b.taskId, (byTask.get(b.taskId) || 0) + 1));
      blocks.forEach((b) => {
        const t = state.tasks.find((x) => x.id === b.taskId);
        if (t && !t.scheduledFor) t.scheduledFor = b.start;
      });
      return {
        result: {
          ok: true,
          blocks: blocks.slice(0, 12).map((b) => ({ task: b.taskTitle, start: b.start, end: b.end })),
          totalBlocks: blocks.length,
        },
        action: { tool: 'build_schedule', summary: `Scheduled ${byTask.size} tasks into ${blocks.length} focus blocks` },
      };
    }
    case 'research_web': {
      try {
        const ai = getClient();
        const res = await ai.models.generateContent({
          model: MODEL,
          contents: args.query,
          config: { tools: [{ googleSearch: {} }] },
        });
        const meta = (res.candidates?.[0] as any)?.groundingMetadata;
        const sources: string[] = (meta?.groundingChunks ?? [])
          .map((c: any) => c?.web?.uri)
          .filter(Boolean)
          .slice(0, 4);
        return {
          result: { ok: true, answer: res.text ?? '', sources },
          action: { tool: 'research_web', summary: `Researched: “${String(args.query).slice(0, 48)}”` },
        };
      } catch (e: any) {
        return {
          result: { ok: false, error: e?.message || 'search failed' },
          action: { tool: 'research_web', summary: 'Web research unavailable' },
        };
      }
    }
    default:
      return { result: { ok: false, error: 'unknown tool' }, action: { tool: name, summary: 'Unknown tool' } };
  }
}

function systemInstruction(state: AppState, now: Date): string {
  const p = state.profile;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const cal = state.calibration;
  const calLine =
    cal && cal.samples >= 3 && Math.abs(cal.factor - 1) >= 0.15
      ? `\nLearned calibration: this user historically takes about ${cal.factor}× their own time estimates — pad your estimateMins by roughly that factor.`
      : '';
  return `You are Clutch — an autonomous AI Chief of Staff. Your job is not to remind; it is to PLAN, PRIORITIZE, SCHEDULE, and DO the work so the user never misses a deadline.

Current date & time: ${now.toString()} (timezone: ${tz}). When the user gives relative dates ("tomorrow", "Friday 5pm", "in 3 days"), convert them to absolute ISO 8601 with offset.

User: ${p.name}, role: ${p.role}. Working hours: ${p.dayStartHour}:00–${p.dayEndHour}:00. Work style: ${p.workStyle}${calLine}

How to act:
- Be proactive and decisive. Take actions via tools instead of asking permission for obvious steps.
- When the user describes commitments (even pasted emails, syllabi, or messy notes), extract EVERY task with add_task. Infer realistic time estimates and deadlines.
- Decompose non-trivial tasks into concrete subtasks.
- Prioritize by deadline proximity AND impact. Critical = imminent + high stakes.
- When a task has a clear work product (an email to send, an outline to write, a plan to follow, a checklist), GENERATE it fully with generate_deliverable so the user can act in one click.
- When real-world facts would help (opening hours, official links/portals, prices, addresses, exact dates), call research_web rather than guessing — then use what you learn in deliverables and reply.
- If a file is attached (image OR PDF), read it carefully and extract EVERY task, commitment, deadline, or action item — handwritten notes, whiteboards, screenshots, bills, posters, or a multi-week course syllabus / project brief / contract. For a syllabus, capture each assignment and exam with its own deadline.
- Distinguish fixed events from tasks: a class/meeting/gym/appointment at a set time is a COMMITMENT (use add_commitment) — the schedule is built around it; everything else is a task.
- After creating/changing tasks, call build_schedule to lay out a concrete plan that works around fixed commitments.
- Keep your final text reply short, warm, and confident: tell the user what you DID and the single most important next action. Use Markdown. Never dump raw JSON.`;
}

export interface AgentRunResult {
  state: AppState;
  reply: string;
  actions: AgentAction[];
}

/**
 * Run one agentic turn: the model may call tools repeatedly until it has done
 * the work, then returns a natural-language summary. Mutates a copy of state.
 */
export interface AgentImage {
  /** Base64 (no data: prefix). Image OR PDF — Gemini reads both inline. */
  data: string;
  mimeType: string;
}

export async function runAgent(
  state: AppState,
  userText: string,
  onStep?: (action: AgentAction) => void,
  image?: AgentImage,
  onToken?: (currentTurnText: string) => void,
): Promise<AgentRunResult> {
  const ai = getClient();
  const now = new Date();
  // Deep-ish clone so callers can diff / discard on error.
  const working: AppState = JSON.parse(JSON.stringify(state));

  const contextSummary =
    working.tasks.length === 0
      ? 'The user currently has NO tasks tracked.'
      : 'Current tasks:\n' +
        working.tasks
          .map(
            (t) =>
              `- [${t.id}] "${t.title}" | ${t.status} | ${t.priority} | due ${t.deadline ?? 'none'} | ${t.subtasks.length} subtasks${t.deliverable ? ' | has deliverable' : ''}`,
          )
          .join('\n');

  const commitmentSummary =
    working.commitments && working.commitments.length
      ? '\nFixed commitments (schedule around these): ' +
        working.commitments.map((c) => `${c.title} ${c.start}–${c.end}`).join('; ')
      : '';

  const userParts: any[] = [
    { text: `${contextSummary}${commitmentSummary}\n\n---\nUser says: ${userText || '(see the attached file)'}` },
  ];
  if (image) userParts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  const contents: any[] = [{ role: 'user', parts: userParts }];

  const actions: AgentAction[] = [];
  let reply = '';

  for (let turn = 0; turn < 8; turn++) {
    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents,
      config: {
        systemInstruction: systemInstruction(working, now),
        tools: [{ functionDeclarations: tools }],
        temperature: 0.4,
      },
    });

    let turnText = '';
    const calls: any[] = [];
    for await (const chunk of stream) {
      let delta = '';
      try {
        delta = chunk.text ?? '';
      } catch {
        delta = '';
      }
      if (delta) {
        turnText += delta;
        onToken?.(turnText); // stream the reply live to the UI
      }
      const fcs = chunk.functionCalls;
      if (fcs && fcs.length) calls.push(...fcs);
    }

    if (!calls.length) {
      reply = turnText;
      break;
    }

    onToken?.(''); // clear the live bubble while tools run
    // Record the model's tool-call turn.
    contents.push({
      role: 'model',
      parts: calls.map((c) => ({ functionCall: { name: c.name, args: c.args } })),
    });

    const responseParts: any[] = [];
    for (const call of calls) {
      const { result, action } = await executeTool(call.name as string, call.args ?? {}, working, now);
      actions.push(action);
      onStep?.(action);
      responseParts.push({
        functionResponse: { name: call.name, response: result },
      });
    }
    contents.push({ role: 'user', parts: responseParts });
  }

  if (!reply) {
    reply = actions.length
      ? "Done — I've updated your plan. Check the board for what's next."
      : "I'm here. Tell me what's on your plate and I'll build your plan.";
  }

  // Recompute urgency for ordering freshness.
  working.tasks.forEach((t) => (t.urgencyScore = computeUrgency(t, now)));
  working.lastReviewAt = now.toISOString();

  return { state: working, reply, actions };
}
