import type { Difficulty, MatrixQuestion } from '../types/matrix';

export const ROUND_LENGTH = 8;
export interface Attempt { question: MatrixQuestion; selectedOptionId: string; correct: boolean; durationMs: number }
export interface GameState {
  phase: 'idle' | 'playing' | 'feedback' | 'complete';
  question: MatrixQuestion | null;
  selectedId: string | null;
  answers: Attempt[];
  adaptive: boolean;
  elapsedMs: number;
  startedAt: number;
  sessionId: string;
}
export const initialGame: GameState = { phase: 'idle', question: null, selectedId: null, answers: [], adaptive: true, elapsedMs: 0, startedAt: 0, sessionId: '' };
type Action =
  | { type: 'start'; question: MatrixQuestion; adaptive: boolean; now: number; sessionId: string }
  | { type: 'select'; id: string }
  | { type: 'confirm'; now: number }
  | { type: 'next'; question: MatrixQuestion | null; now: number }
  | { type: 'reset' };

/** 以狀態機鎖住已提交的答案，快速連點也不會重複計分。 */
export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'start': return { ...initialGame, phase: 'playing', question: action.question, adaptive: action.adaptive, startedAt: action.now, sessionId: action.sessionId };
    case 'reset': return initialGame;
    case 'select':
      if (state.phase !== 'playing' || !state.question?.options.some((option) => option.id === action.id)) return state;
      return { ...state, selectedId: action.id };
    case 'confirm': {
      if (state.phase !== 'playing' || !state.question || !state.selectedId) return state;
      const durationMs = Math.max(0, action.now - state.startedAt);
      return { ...state, phase: 'feedback', elapsedMs: state.elapsedMs + durationMs, answers: [...state.answers, { question: state.question, selectedOptionId: state.selectedId, correct: state.selectedId === state.question.correctOptionId, durationMs }] };
    }
    case 'next':
      if (state.phase !== 'feedback') return state;
      if (state.answers.length >= ROUND_LENGTH) return { ...state, phase: 'complete', selectedId: null };
      if (!action.question) return state;
      return { ...state, phase: 'playing', question: action.question, selectedId: null, startedAt: action.now };
  }
}

export function nextDifficulty(state: GameState): Difficulty {
  const level = state.question?.difficulty ?? 'easy';
  if (!state.adaptive) return level;
  const levels: Difficulty[] = ['easy', 'medium', 'hard'];
  const index = levels.indexOf(level);
  const latest = state.answers.at(-1);
  if (latest && !latest.correct) return levels[Math.max(0, index - 1)];
  // 同一難度連續答對兩題才升級，避免在升級後立刻再次跳級。
  if (state.answers.length >= 2 && state.answers.slice(-2).every((answer) => answer.correct && answer.question.difficulty === level)) return levels[Math.min(2, index + 1)];
  return level;
}
export function elapsedTime(state: GameState, now: number): number {
  return state.elapsedMs + (state.phase === 'playing' ? Math.max(0, now - state.startedAt) : 0);
}
export function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
export interface SessionSummary { id: string; date: string; correct: number; total: number; elapsedMs: number }
const storageKey = 'shape-explorers:sessions:v1';
export function readHistory(): SessionSummary[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    if (!Array.isArray(data)) return [];
    return data.filter((item): item is SessionSummary => item && typeof item.id === 'string' && typeof item.date === 'string' && Number.isFinite(Date.parse(item.date)) && Number.isInteger(item.correct) && item.correct >= 0 && item.correct <= ROUND_LENGTH && item.total === ROUND_LENGTH && Number.isFinite(item.elapsedMs) && item.elapsedMs >= 0).slice(0, 10);
  } catch { return []; }
}
export function saveSession(state: GameState): void {
  if (state.phase !== 'complete') return;
  const summary: SessionSummary = { id: state.sessionId, date: new Date().toISOString(), correct: state.answers.filter((answer) => answer.correct).length, total: state.answers.length, elapsedMs: state.elapsedMs };
  try { localStorage.setItem(storageKey, JSON.stringify([summary, ...readHistory().filter((item) => item.id !== summary.id)].slice(0, 10))); }
  catch { /* 無痕或儲存空間不足時，仍可完成當次遊戲。 */ }
}
