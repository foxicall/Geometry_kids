import { COUNT_FIELDS, solidCounts } from './solids';
import type { CountField, SolidAnswer, SolidAttempt, SolidInputs, SolidQuestion } from '../types/solid';

export const SOLID_ROUND_LENGTH = 10;
export const emptyInputs: SolidInputs = { vertices: '', edges: '', faces: '' };
export interface SolidGameState {
  phase: 'intro' | 'playing' | 'feedback' | 'complete';
  questions: SolidQuestion[];
  index: number;
  inputs: SolidInputs;
  attempts: SolidAttempt[];
  score: number;
  elapsedMs: number;
  startedAt: number;
  sessionId: string;
  nickname: string;
  error: string;
}
export const initialSolidGame: SolidGameState = { phase: 'intro', questions: [], index: 0, inputs: emptyInputs, attempts: [], score: 0, elapsedMs: 0, startedAt: 0, sessionId: '', nickname: '', error: '' };
type SolidAction =
  | { type: 'start'; questions: SolidQuestion[]; now: number; sessionId: string; nickname: string }
  | { type: 'input'; field: CountField; value: string }
  | { type: 'submit'; now: number }
  | { type: 'next'; now: number }
  | { type: 'reset' };

export function parseSolidInputs(inputs: SolidInputs): SolidAnswer | null {
  if (COUNT_FIELDS.some((field) => !/^\d{1,2}$/.test(inputs[field]))) return null;
  return { vertices: Number(inputs.vertices), edges: Number(inputs.edges), faces: Number(inputs.faces) };
}

/** 提交與換關皆檢查階段，連點不會重複計分或跳過關卡。 */
export function solidGameReducer(state: SolidGameState, action: SolidAction): SolidGameState {
  switch (action.type) {
    case 'reset': return initialSolidGame;
    case 'start': {
      if (action.questions.length !== SOLID_ROUND_LENGTH) throw new Error('一輪必須有 10 題');
      action.questions.forEach(solidCounts);
      return { ...initialSolidGame, phase: 'playing', questions: action.questions, startedAt: action.now, sessionId: action.sessionId, nickname: action.nickname.trim().slice(0, 20) || '小小建築師' };
    }
    case 'input': return state.phase === 'playing' ? { ...state, inputs: { ...state.inputs, [action.field]: action.value }, error: '' } : state;
    case 'submit': {
      if (state.phase !== 'playing') return state;
      const answer = parseSolidInputs(state.inputs);
      if (!answer) return { ...state, error: '請在頂點、邊、面三格都填入 0–99 的整數。' };
      const question = state.questions[state.index];
      const expected = solidCounts(question);
      const correct = { vertices: answer.vertices === expected.vertices, edges: answer.edges === expected.edges, faces: answer.faces === expected.faces };
      const points = COUNT_FIELDS.reduce((sum, field) => sum + (correct[field] ? 10 : -5), 0);
      return { ...state, phase: 'feedback', error: '', score: Math.max(0, state.score + points), elapsedMs: state.elapsedMs + Math.max(0, action.now - state.startedAt), attempts: [...state.attempts, { question, answer, expected, correct, points }] };
    }
    case 'next':
      if (state.phase !== 'feedback') return state;
      if (state.index === SOLID_ROUND_LENGTH - 1) return { ...state, phase: 'complete' };
      return { ...state, phase: 'playing', index: state.index + 1, inputs: emptyInputs, startedAt: action.now };
  }
}

export interface SolidRecord { id: string; nickname: string; score: number; elapsedMs: number; correct: number; date: string }
const storageKey = 'geometry-kids:solid-records:v1';
export function solidRecords(): SolidRecord[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(data)) return [];
    return data.filter((record): record is SolidRecord => record && typeof record.id === 'string' && typeof record.nickname === 'string' && record.nickname.length <= 20 && Number.isInteger(record.score) && record.score >= 0 && record.score <= 300 && Number.isFinite(record.elapsedMs) && record.elapsedMs >= 0 && Number.isInteger(record.correct) && record.correct >= 0 && record.correct <= 30 && Number.isFinite(Date.parse(record.date))).slice(0, 20);
  } catch { return []; }
}
export function saveSolidRecord(state: SolidGameState): void {
  if (state.phase !== 'complete') return;
  const record: SolidRecord = { id: state.sessionId, nickname: state.nickname, score: state.score, elapsedMs: state.elapsedMs, correct: state.attempts.reduce((sum, attempt) => sum + COUNT_FIELDS.filter((field) => attempt.correct[field]).length, 0), date: new Date().toISOString() };
  try { localStorage.setItem(storageKey, JSON.stringify([record, ...solidRecords().filter((item) => item.id !== record.id)].slice(0, 20))); }
  catch { /* 瀏覽器拒絕儲存時，結算仍可正常顯示。 */ }
}
