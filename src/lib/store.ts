import { useCallback, useEffect, useRef, useState } from 'react';
import type { AgentAction, AgentMessage, AppState, Task, UserProfile } from '../types';
import { loadState, saveState, uid } from './storage';
import { runAgent } from './agent';
import { computeUrgency } from './scheduler';

export interface Store {
  state: AppState;
  thinking: boolean;
  liveActions: AgentAction[];
  sendToAgent: (text: string) => Promise<void>;
  setProfile: (p: Partial<UserProfile>) => void;
  toggleSubtask: (taskId: string, subId: string) => void;
  setTaskStatus: (taskId: string, status: Task['status']) => void;
  deleteTask: (taskId: string) => void;
  clearAll: () => void;
}

export function useStore(): Store {
  const [state, setState] = useState<AppState>(() => loadState());
  const [thinking, setThinking] = useState(false);
  const [liveActions, setLiveActions] = useState<AgentAction[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    saveState(state);
  }, [state]);

  const pushMessage = useCallback((m: Omit<AgentMessage, 'id' | 'createdAt'>) => {
    setState((s) => ({
      ...s,
      messages: [...s.messages, { ...m, id: uid('msg'), createdAt: new Date().toISOString() }],
    }));
  }, []);

  const sendToAgent = useCallback(
    async (text: string) => {
      if (!text.trim() || thinking) return;
      pushMessage({ role: 'user', content: text });
      setThinking(true);
      setLiveActions([]);
      try {
        const result = await runAgent(stateRef.current, text, (a) =>
          setLiveActions((prev) => [...prev, a]),
        );
        setState((s) => ({
          ...result.state,
          // keep any messages added since (the user msg already in result.state? no — runAgent doesn't touch messages)
          messages: [
            ...s.messages,
            {
              id: uid('msg'),
              role: 'agent',
              content: result.reply,
              actions: result.actions,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      } catch (err: any) {
        pushMessage({
          role: 'system',
          content:
            (err?.message || 'Something went wrong talking to Gemini.') +
            (String(err?.message || '').includes('API key')
              ? ''
              : ' (Check your network / API key and try again.)'),
        });
      } finally {
        setThinking(false);
        setLiveActions([]);
      }
    },
    [pushMessage, thinking],
  );

  const setProfile = useCallback((p: Partial<UserProfile>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...p } }));
  }, []);

  const toggleSubtask = useCallback((taskId: string, subId: string) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id !== taskId
          ? t
          : {
              ...t,
              subtasks: t.subtasks.map((su) => (su.id === subId ? { ...su, done: !su.done } : su)),
            },
      ),
    }));
  }, []);

  const setTaskStatus = useCallback((taskId: string, status: Task['status']) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id !== taskId
          ? t
          : {
              ...t,
              status,
              subtasks: status === 'done' ? t.subtasks.map((su) => ({ ...su, done: true })) : t.subtasks,
            },
      ),
    }));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.filter((t) => t.id !== taskId),
      schedule: s.schedule.filter((b) => b.taskId !== taskId),
    }));
  }, []);

  const clearAll = useCallback(() => {
    setState((s) => ({ ...s, tasks: [], schedule: [], messages: [] }));
  }, []);

  // Refresh urgency scores periodically so deadline pressure stays live.
  useEffect(() => {
    const i = setInterval(() => {
      const now = new Date();
      setState((s) => ({
        ...s,
        tasks: s.tasks.map((t) => ({ ...t, urgencyScore: computeUrgency(t, now) })),
      }));
    }, 60_000);
    return () => clearInterval(i);
  }, []);

  return {
    state,
    thinking,
    liveActions,
    sendToAgent,
    setProfile,
    toggleSubtask,
    setTaskStatus,
    deleteTask,
    clearAll,
  };
}
