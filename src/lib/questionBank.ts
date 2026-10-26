import data from '../data/generatedQuestions.json';
import { questionFingerprint, validateBank } from './bankSchema';
import { createQuestion } from './questions';
import type { Difficulty, MatrixQuestion } from '../types/matrix';

export const generatedQuestions = validateBank(data).questions;

/** 優先使用已驗證的題目，用完即接續本地規則題；瀏覽器不呼叫 Gemini。 */
export function sessionQuestion(difficulty: Difficulty, id: string, previous: MatrixQuestion[] = []): MatrixQuestion {
  const seen = new Set(previous.map(questionFingerprint));
  const available = generatedQuestions.filter((question) => question.difficulty === difficulty && !seen.has(questionFingerprint(question)));
  if (!available.length) return createQuestion(difficulty, id);
  return { ...available[Math.floor(Math.random() * available.length)], id };
}
