export type IMOMode = 'playground' | 'challenge';
export type IMOConcept =
  | 'place'
  | 'roman'
  | 'rounding'
  | 'reverse'
  | 'unitary'
  | 'fraction'
  | 'compare'
  | 'metric'
  | 'perimeter'
  | 'symmetry'
  | 'pictograph'
  | 'matrix'
  | 'compass';
export type ArithmeticOperator = '+' | '−' | '×' | '÷';
export type SymmetryShape = 'square' | 'rectangle' | 'triangle' | 'hexagon' | 'circle';
export type GameBoard =
  | { kind: 'place'; slots: (number | null)[] }
  | { kind: 'roman'; text: string }
  | { kind: 'rounding'; number: number; precision: number; choice: number | null }
  | { kind: 'reverse'; current: number; operations: string[] }
  | {
      kind: 'unitary';
      count: number;
      total: number;
      wanted: number;
      unit: number | null;
      quantity: number;
    }
  | { kind: 'fraction'; slices: boolean[] }
  | {
      kind: 'compare';
      a: number;
      b: number;
      c: number;
      d: number;
      normalized: boolean;
      choice: 'left' | 'equal' | 'right' | null;
    }
  | { kind: 'metric'; preset: number; converted: number | null; portion: number | null }
  | { kind: 'perimeter'; cells: number[]; fences: string[]; side: number }
  | { kind: 'symmetry'; shape: SymmetryShape; tried: number[]; lastAxis: number | null }
  | {
      kind: 'pictograph';
      scale: number;
      icons: number;
      shareN: number | null;
      shareD: number | null;
    }
  | {
      kind: 'matrix';
      first: ArithmeticOperator | null;
      second: ArithmeticOperator | null;
      unknown: number | null;
      probe: [number, number, number];
    }
  | { kind: 'compass'; start: number; turns: number[] };
export interface GameValidation {
  solved: boolean;
  valid: boolean;
  message: string;
  facts: string[];
}
/** 關卡只保存可序列化盤面；驗證器為純函式，不操作畫面或儲存。 */
export interface GameLevel<S extends GameBoard = GameBoard> {
  id: string;
  concept: IMOConcept;
  title: string;
  subtitle: string;
  goal: string;
  principle: string;
  initialBoard: S;
  stepLimit: number;
  hints: readonly string[];
  validate: (board: S) => GameValidation;
}
export type GameAction =
  | { type: 'place'; slot: number; digit: number }
  | { type: 'roman'; symbol: string }
  | { type: 'roman-delete' }
  | { type: 'round-number'; value: number }
  | { type: 'round-precision'; value: number }
  | { type: 'round-choice'; value: number }
  | { type: 'reverse'; operation: string }
  | { type: 'unit'; value: number }
  | { type: 'quantity'; value: number }
  | { type: 'unitary-count'; value: number }
  | { type: 'slice'; index: number }
  | { type: 'denominator'; value: number }
  | { type: 'divide-fraction'; value: number }
  | { type: 'compare-value'; field: 'a' | 'b' | 'c' | 'd'; value: number }
  | { type: 'normalize' }
  | { type: 'compare-choice'; value: 'left' | 'equal' | 'right' }
  | { type: 'metric-preset'; value: number }
  | { type: 'convert'; value: number }
  | { type: 'portion'; value: number }
  | { type: 'fence'; edge: string }
  | { type: 'cell'; index: number }
  | { type: 'side'; value: number }
  | { type: 'shape'; value: SymmetryShape }
  | { type: 'fold'; angle: number }
  | { type: 'icons'; value: number }
  | { type: 'scale'; value: number }
  | { type: 'share'; numerator: number; denominator: number }
  | { type: 'operator'; slot: 'first' | 'second'; value: ArithmeticOperator }
  | { type: 'unknown'; value: number }
  | { type: 'probe'; index: number; value: number }
  | { type: 'turn'; value: number }
  | { type: 'start-direction'; value: number };
export interface MiniGameProps {
  board: GameBoard;
  mode: IMOMode;
  disabled: boolean;
  hint: number;
  onAction: (action: GameAction) => void;
}
