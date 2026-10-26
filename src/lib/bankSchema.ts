import { z } from 'zod';
import { questionSchema, validateQuestion, visualKey } from './matrix';
import type { MatrixQuestion } from '../types/matrix';

export const bankSchema = z.object({ version: z.literal(1), questions: z.array(questionSchema).max(1000) }).strict();
export function questionFingerprint(question: MatrixQuestion): string {
  return JSON.stringify(question.grid.map((row) => row.map((cell) => cell ? visualKey(cell) : null)));
}
/** 匯入檔案也視為不可信資料；重複編號或相同畫面不進入題庫。 */
export function validateBank(input: unknown): { version: 1; questions: MatrixQuestion[] } {
  const bank = bankSchema.parse(input);
  const questions = bank.questions.map(validateQuestion);
  if (new Set(questions.map((question) => question.id)).size !== questions.length) throw new Error('題目編號重複');
  if (new Set(questions.map(questionFingerprint)).size !== questions.length) throw new Error('題目內容重複');
  return { version: 1, questions };
}
