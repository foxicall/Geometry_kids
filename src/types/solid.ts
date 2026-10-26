export type SolidKind = 'prism' | 'pyramid';
export type PolygonSides = 3 | 4 | 5 | 6 | 7 | 8;
export type CountField = 'vertices' | 'edges' | 'faces';
export interface Point3D { x: number; y: number; z: number }
export interface SolidSpec { kind: SolidKind; sides: PolygonSides }
export interface SolidMesh {
  vertices: Point3D[];
  edges: [number, number][];
  faces: number[][];
}
export interface SolidQuestion extends SolidSpec { id: string }
export type SolidAnswer = Record<CountField, number>;
export type SolidInputs = Record<CountField, string>;
export interface SolidAttempt {
  question: SolidQuestion;
  answer: SolidAnswer;
  expected: SolidAnswer;
  correct: Record<CountField, boolean>;
  points: number;
}
