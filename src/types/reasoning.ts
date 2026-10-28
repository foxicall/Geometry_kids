export type ReasoningLevel = 'warmup' | 'bridge' | 'challenge';
export type ReasoningTopic = 'angles' | 'height' | 'cut' | 'similar' | 'squares' | 'path';
export type ReasoningDiagram =
  | { kind: 'angles'; mode: 'sum' | 'isosceles' | 'bisector'; left: number; right: number; top: number }
  | { kind: 'height'; mode: 'area' | 'ratio' | 'inverse'; left: number; right: number; height: number }
  | { kind: 'cut'; mode: 'corner' | 'notch' | 'trapezoid'; width: number; height: number; cutWidth: number; cutHeight: number }
  | { kind: 'similar'; mode: 'length' | 'area' | 'inverse'; side: number; area: number; scale: number }
  | { kind: 'squares'; mode: 'area' | 'hypotenuse' | 'leg'; a: number; b: number; c: number }
  | { kind: 'path'; mode: 'road' | 'diagonal' | 'unfold'; width: number; height: number; split: number; diagonal: number };
export interface ReasoningStep { title: string; text: string; calculation: string }
export interface ReasoningQuestion {
  id: string;
  topic: ReasoningTopic;
  level: ReasoningLevel;
  title: string;
  prompt: string;
  given: string[];
  prerequisite: string;
  concept: string;
  unit: '度' | '公分' | '平方公分';
  answer: number;
  options: number[];
  hints: string[];
  steps: ReasoningStep[];
  diagram: ReasoningDiagram;
}
