import type { ReasoningLevel, ReasoningQuestion } from '../types/reasoning';

export interface ReasoningAttempt { question: ReasoningQuestion; selected: number; correct: boolean; hints: number }
export interface ReasoningState {
  phase: 'intro' | 'playing' | 'feedback' | 'complete';
  questions: ReasoningQuestion[];
  index: number;
  selected: number | null;
  hints: number;
  steps: number;
  attempts: ReasoningAttempt[];
  startedAt: number;
  elapsedMs: number;
  sessionId: string;
}
export const initialReasoning: ReasoningState = { phase: 'intro', questions: [], index: 0, selected: null, hints: 0, steps: 1, attempts: [], startedAt: 0, elapsedMs: 0, sessionId: '' };
type Action =
  | { type: 'start'; questions: ReasoningQuestion[]; now: number; id: string }
  | { type: 'select'; value: number }
  | { type: 'hint' } | { type: 'step' } | { type: 'reset' }
  | { type: 'submit'; now: number } | { type: 'next'; now: number };

/** 提示不扣分；作答鎖定且閱讀解說不計時，避免連點累加或跳題。 */
export function reasoningReducer(state: ReasoningState, action: Action): ReasoningState {
  switch (action.type) {
    case 'reset': return initialReasoning;
    case 'start':
      if (action.questions.length !== 6 || new Set(action.questions.map((q) => q.topic)).size !== 6) throw new Error('每回合需有六種不同觀念');
      return { ...initialReasoning, phase: 'playing', questions: action.questions, startedAt: action.now, sessionId: action.id };
    case 'select': return state.phase === 'playing' && state.questions[state.index].options.includes(action.value) ? { ...state, selected: action.value } : state;
    case 'hint': return state.phase === 'playing' ? { ...state, hints: Math.min(state.hints + 1, state.questions[state.index].hints.length) } : state;
    case 'step': return state.phase === 'feedback' ? { ...state, steps: Math.min(state.steps + 1, state.questions[state.index].steps.length) } : state;
    case 'submit': {
      if (state.phase !== 'playing' || state.selected === null) return state;
      const question = state.questions[state.index];
      return { ...state, phase: 'feedback', elapsedMs: state.elapsedMs + Math.max(0, action.now - state.startedAt), attempts: [...state.attempts, { question, selected: state.selected, correct: state.selected === question.answer, hints: state.hints }] };
    }
    case 'next':
      if (state.phase !== 'feedback') return state;
      if (state.index === state.questions.length - 1) return { ...state, phase: 'complete' };
      return { ...state, phase: 'playing', index: state.index + 1, selected: null, hints: 0, steps: 1, startedAt: action.now };
  }
}

export interface ReasoningRecord { id: string; date: string; level: ReasoningLevel; correct: number; hints: number; elapsedMs: number }
const key = 'geometry-kids:reasoning-records:v1';
export function readReasoningRecords(): ReasoningRecord[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(data)) return [];
    return data.filter((r): r is ReasoningRecord => r && typeof r.id === 'string' && ['warmup', 'bridge', 'challenge'].includes(r.level) && Number.isInteger(r.correct) && r.correct >= 0 && r.correct <= 6 && Number.isInteger(r.hints) && r.hints >= 0 && r.hints <= 18 && Number.isFinite(r.elapsedMs) && r.elapsedMs >= 0 && typeof r.date === 'string' && Number.isFinite(Date.parse(r.date))).slice(0, 20);
  } catch { return []; }
}
export function saveReasoningRecord(state: ReasoningState): boolean {
  if (state.phase !== 'complete') return false;
  const record: ReasoningRecord = { id: state.sessionId, date: new Date().toISOString(), level: state.questions[0].level, correct: state.attempts.filter((a) => a.correct).length, hints: state.attempts.reduce((s, a) => s + a.hints, 0), elapsedMs: state.elapsedMs };
  try { localStorage.setItem(key, JSON.stringify([record, ...readReasoningRecords().filter((r) => r.id !== record.id)].slice(0, 20))); return true; }
  catch { return false; }
}
