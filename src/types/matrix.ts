/** 圖形僅由向量屬性構成，不接受外部圖片或任意 SVG。 */
export const SHAPES = ['circle', 'square', 'triangle', 'star'] as const;
export const ROTATIONS = [0, 90, 180, 270] as const;
export const FILLS = ['solid', 'empty', 'striped'] as const;
export const COUNTS = [1, 2, 3] as const;
export type Shape = (typeof SHAPES)[number];
export type Rotation = (typeof ROTATIONS)[number];
export type Fill = (typeof FILLS)[number];
export type Count = (typeof COUNTS)[number];
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GeometryUnit {
  shape: Shape;
  rotation: Rotation;
  fill: Fill;
  count: Count;
}

export interface MatrixRule {
  attribute: keyof GeometryUnit;
  /** row 表示每列由左至右；column 表示每欄由上至下。 */
  direction: 'row' | 'column';
  step: 1 | 2 | 3;
}

export interface AnswerOption {
  id: string;
  cell: GeometryUnit;
}

export interface MatrixQuestion {
  id: string;
  size: 2 | 3;
  difficulty: Difficulty;
  grid: (GeometryUnit | null)[][];
  /** 共 5–7 個選項：1 個正解與 4–6 個不重複的干擾項。 */
  options: AnswerOption[];
  correctOptionId: string;
  rules: MatrixRule[];
  explanation: string;
  source: 'local' | 'gemini';
}
