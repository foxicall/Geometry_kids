import type { GameAction, GameBoard, GameValidation, IMOMode } from '../types/game';
import { getLevel, levels } from './levels';
import { arithmetic, gridEdges, integer, metricPresets, reverseOptions } from './math';

/** 挑戰禁止修改題目參數；探索則開放參數，但兩者共用同一套數學。 */
export function transition(b: GameBoard, a: GameAction, mode: IMOMode): GameBoard {
  const free = mode === 'playground';
  switch (b.kind) {
    case 'place':
      if (
        a.type === 'place' &&
        integer(a.slot, 0, 4) &&
        integer(a.digit, 0, 9) &&
        (free || [0, 2, 4, 7, 9].includes(a.digit))
      )
        return { ...b, slots: b.slots.map((n, i) => (i === a.slot ? a.digit : n)) };
      break;
    case 'roman':
      if (a.type === 'roman' && /^[IVXLCDM]$/.test(a.symbol) && b.text.length < 15)
        return { ...b, text: b.text + a.symbol };
      if (a.type === 'roman-delete') return { ...b, text: b.text.slice(0, -1) };
      break;
    case 'rounding':
      if (free && a.type === 'round-number' && integer(a.value, 0, 99999))
        return { ...b, number: a.value, choice: null };
      if (free && a.type === 'round-precision' && [10, 100, 1000].includes(a.value))
        return { ...b, precision: a.value, choice: null };
      if (a.type === 'round-choice' && integer(a.value, 0, 100000))
        return { ...b, choice: a.value };
      break;
    case 'reverse':
      if (a.type === 'reverse' && Object.hasOwn(reverseOptions, a.operation)) {
        const [op, value] = reverseOptions[a.operation],
          next = arithmetic(b.current, op, value);
        if (next !== null && Math.abs(next) <= 1000000)
          return { ...b, current: next, operations: [...b.operations, a.operation] };
      }
      break;
    case 'unitary':
      if (a.type === 'unit' && integer(a.value, 0, 1000)) return { ...b, unit: a.value };
      if (a.type === 'quantity' && integer(a.value, 1, 20)) return { ...b, quantity: a.value };
      if (free && a.type === 'unitary-count' && integer(a.value, 1, 12))
        return { ...b, count: a.value, total: a.value * 60, unit: null };
      break;
    case 'fraction':
      if (a.type === 'slice' && integer(a.index, 0, b.slices.length - 1))
        return { ...b, slices: b.slices.map((v, i) => (i === a.index ? !v : v)) };
      if (free && a.type === 'denominator' && integer(a.value, 1, 32))
        return { ...b, slices: Array.from({ length: a.value }, (_, i) => b.slices[i] ?? false) };
      if (a.type === 'divide-fraction') {
        const n = b.slices.filter(Boolean).length,
          d = b.slices.length;
        if (integer(a.value, 2, d) && n % a.value === 0 && d % a.value === 0)
          return { ...b, slices: Array.from({ length: d / a.value }, (_, i) => i < n / a.value) };
      }
      break;
    case 'compare':
      if (
        free &&
        a.type === 'compare-value' &&
        integer(a.value, a.field === 'b' || a.field === 'd' ? 1 : 0, 12)
      ) {
        const next = { ...b, [a.field]: a.value, normalized: false, choice: null };
        if (next.a <= next.b && next.c <= next.d) return next;
      }
      if (a.type === 'normalize') return { ...b, normalized: true };
      if (a.type === 'compare-choice' && ['left', 'equal', 'right'].includes(a.value))
        return { ...b, choice: a.value };
      break;
    case 'metric':
      if (free && a.type === 'metric-preset' && integer(a.value, 0, metricPresets.length - 1))
        return { ...b, preset: a.value, converted: null, portion: null };
      if (a.type === 'convert' && integer(a.value, 0, 100000)) return { ...b, converted: a.value };
      if (a.type === 'portion' && integer(a.value, 0, 100000)) return { ...b, portion: a.value };
      break;
    case 'perimeter':
      if (a.type === 'fence' && gridEdges(b.cells).has(a.edge) && !b.fences.includes(a.edge))
        return { ...b, fences: [...b.fences, a.edge] };
      if (free && a.type === 'cell' && integer(a.index, 0, 15))
        return {
          ...b,
          cells: b.cells.includes(a.index)
            ? b.cells.filter((n) => n !== a.index)
            : [...b.cells, a.index],
          fences: [],
        };
      if (free && a.type === 'side' && integer(a.value, 1, 5)) return { ...b, side: a.value };
      break;
    case 'symmetry':
      if (
        free &&
        a.type === 'shape' &&
        ['square', 'rectangle', 'triangle', 'hexagon', 'circle'].includes(a.value)
      )
        return { ...b, shape: a.value, tried: [], lastAxis: null };
      if (a.type === 'fold' && integer(a.angle, 0, 179) && !b.tried.includes(a.angle))
        return { ...b, tried: [...b.tried, a.angle], lastAxis: a.angle };
      break;
    case 'pictograph':
      if (
        a.type === 'icons' &&
        Number.isInteger(a.value * (free ? 2 : 1)) &&
        a.value >= 0 &&
        a.value <= 10
      )
        return { ...b, icons: a.value };
      if (free && a.type === 'scale' && integer(a.value, 2, 10)) return { ...b, scale: a.value };
      if (a.type === 'share' && integer(a.numerator, 0, 1000) && integer(a.denominator, 1, 1000))
        return { ...b, shareN: a.numerator, shareD: a.denominator };
      break;
    case 'matrix':
      if (a.type === 'operator' && ['+', '−', '×', '÷'].includes(a.value))
        return { ...b, [a.slot]: a.value };
      if (a.type === 'unknown' && integer(a.value, 0, 100)) return { ...b, unknown: a.value };
      if (free && a.type === 'probe' && integer(a.index, 0, 2) && integer(a.value, 0, 30))
        return {
          ...b,
          probe: b.probe.map((v, i) => (i === a.index ? a.value : v)) as [number, number, number],
        };
      break;
    case 'compass':
      if (a.type === 'turn' && [-4, -2, -1, 1, 2, 4].includes(a.value))
        return { ...b, turns: [...b.turns, a.value] };
      if (free && a.type === 'start-direction' && integer(a.value, 0, 7))
        return { ...b, start: a.value, turns: [] };
  }
  return b;
}
export interface GameSession {
  levelId: string;
  mode: IMOMode;
  board: GameBoard;
  history: GameBoard[];
  moves: number;
  hintIndex: number;
  status: 'playing' | 'won' | 'exhausted';
  validation: GameValidation;
  notice: string;
}
export type SessionAction =
  | { type: 'act'; action: GameAction }
  | { type: 'undo' }
  | { type: 'hint' }
  | { type: 'reset' }
  | { type: 'mode'; mode: IMOMode }
  | { type: 'level'; id: string };
export function createSession(id = levels[0].id, mode: IMOMode = 'challenge'): GameSession {
  const level = getLevel(id),
    board = structuredClone(level.initialBoard);
  return {
    levelId: level.id,
    mode,
    board,
    history: [],
    moves: 0,
    hintIndex: 0,
    status: 'playing',
    validation: level.validate(board),
    notice: '',
  };
}
export function sessionReducer(state: GameSession, action: SessionAction): GameSession {
  const level = getLevel(state.levelId);
  if (action.type === 'level') return createSession(action.id, state.mode);
  if (action.type === 'mode')
    return action.mode === state.mode
      ? state
      : {
          ...createSession(state.levelId, action.mode),
          notice: '已切換模式，盤面與步數重新開始；已完成紀錄保留。',
        };
  if (action.type === 'reset')
    return {
      ...createSession(state.levelId, state.mode),
      notice: '本關已重新開始；已完成紀錄保留。',
    };
  if (action.type === 'hint')
    return { ...state, hintIndex: Math.min(level.hints.length, state.hintIndex + 1) };
  if (action.type === 'undo') {
    const board = state.history.at(-1);
    return board
      ? {
          ...state,
          board,
          history: state.history.slice(0, -1),
          moves: state.moves - 1,
          status: 'playing',
          validation: level.validate(board),
          notice: '已復原上一步，步數也退回一格。',
        }
      : state;
  }
  if (state.status !== 'playing') return state;
  const next = transition(state.board, action.action, state.mode);
  if (JSON.stringify(next) === JSON.stringify(state.board))
    return { ...state, notice: '這次盤面沒有改變。請檢查範圍，或選另一個操作；不扣步數。' };
  const validation = level.validate(next),
    moves = state.moves + 1;
  const status =
    state.mode === 'playground'
      ? 'playing'
      : validation.solved
        ? 'won'
        : moves >= level.stepLimit
          ? 'exhausted'
          : 'playing';
  return {
    ...state,
    board: next,
    history: [...state.history, state.board],
    moves,
    validation,
    status,
    notice: '',
  };
}
export const COMPLETED_KEY = 'geometry-kids:imo-completed:v1';
export function readCompleted(storage: Pick<Storage, 'getItem'>): string[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(COMPLETED_KEY) ?? '[]');
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id): id is string => typeof id === 'string' && levels.some((l) => l.id === id),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}
export function writeCompleted(storage: Pick<Storage, 'setItem'>, ids: string[]): boolean {
  try {
    storage.setItem(
      COMPLETED_KEY,
      JSON.stringify(ids.filter((id) => levels.some((l) => l.id === id))),
    );
    return true;
  } catch {
    return false;
  }
}
