// ---- Core domain model for Clutch ----

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

export interface SubTask {
  id: string;
  title: string;
  estimateMins: number;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  /** ISO datetime of the hard deadline, if any. */
  deadline?: string;
  /** Minutes of focused effort the agent estimates this needs. */
  estimateMins: number;
  priority: Priority;
  status: TaskStatus;
  /** Free-form tag, e.g. "CS101", "Finance", "Job". */
  category?: string;
  subtasks: SubTask[];
  /** Agent's one-line rationale for the assigned priority. */
  reasoning?: string;
  /** Generated deliverable content (draft email, outline, plan...). */
  deliverable?: Deliverable;
  /** When the agent has placed this on the calendar. */
  scheduledFor?: string;
  /** Optional goal this task contributes to. */
  goalId?: string;
  createdAt: string;
  /** RICE-style composite the agent computes for ordering. */
  urgencyScore?: number;
}

export interface Deliverable {
  kind: 'email' | 'outline' | 'plan' | 'message' | 'checklist' | 'draft';
  title: string;
  content: string;
  createdAt: string;
}

export interface ScheduleBlock {
  id: string;
  taskId: string;
  taskTitle: string;
  start: string; // ISO
  end: string; // ISO
  reason: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  /** Names of tools the agent invoked while producing this turn. */
  actions?: AgentAction[];
  createdAt: string;
}

export interface AgentAction {
  tool: string;
  summary: string;
}

export interface UserProfile {
  name: string;
  /** Working hours used by the scheduler, 0-23. */
  dayStartHour: number;
  dayEndHour: number;
  /** Persona tuning for recommendations. */
  role: string;
  /** Free text: how the user likes to work. */
  workStyle: string;
}

export interface Streak {
  /** Consecutive days with at least one completed task. */
  count: number;
  /** Local YYYY-MM-DD of the most recent completion. */
  lastDate?: string;
}

export interface Goal {
  id: string;
  title: string;
  deadline?: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  /** Local YYYY-MM-DD dates the habit was completed. */
  history: string[];
  createdAt: string;
}

export interface AppState {
  profile: UserProfile;
  tasks: Task[];
  schedule: ScheduleBlock[];
  messages: AgentMessage[];
  lastReviewAt?: string;
  streak?: Streak;
  goals?: Goal[];
  habits?: Habit[];
}
