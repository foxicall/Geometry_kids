import { createQuestion } from '../../src/lib/questions';
import { questionFingerprint, validateBank } from '../../src/lib/bankSchema';
import { generateBatch, GenerationError } from './gemini';
import { safeDiagnostics } from './diagnostics';
import type { BatchOptions } from './gemini';

type Bank = ReturnType<typeof validateBank>;
type BatchGenerator = (options: BatchOptions) => Promise<Bank>;
type Log = (message: string) => void;

/** 固定種子生成可重現的原創備援題，仍走同一套語意驗證。 */
export function localFallback(options: Pick<BatchOptions, 'count' | 'difficulty'>): Bank {
  if (!Number.isInteger(options.count) || options.count < 1 || options.count > 12 || !['easy', 'medium', 'hard'].includes(options.difficulty)) throw new GenerationError('invalid_input', 'count 必須為 1–12，difficulty 必須為 easy、medium 或 hard。');
  let seed = 20261026;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const questions = new Map<string, Bank['questions'][number]>();
  // 有限次取樣排除矩陣重複，不能讓合法的 12 題請求偶爾失敗。
  for (let attempt = 0; attempt < 256 && questions.size < options.count; attempt++) {
    const question = createQuestion(options.difficulty, `local-${options.difficulty}-${questions.size + 1}`, random);
    const fingerprint = questionFingerprint(question);
    if (!questions.has(fingerprint)) questions.set(fingerprint, question);
  }
  if (questions.size !== options.count) throw new GenerationError('invalid_output', '內建題庫生成不足，未更新檔案。');
  return validateBank({ version: 1, questions: [...questions.values()] });
}

export async function generateWithFallback(
  options: Pick<BatchOptions, 'count' | 'difficulty'>,
  candidates: readonly string[],
  generate: BatchGenerator = generateBatch,
  log: Log = console.warn,
) {
  // 先驗證參數與備援題，錯誤的 CLI 參數不可假裝成功。
  const fallback = localFallback(options);
  for (const model of candidates) {
    log(`嘗試 Gemini 模型：${model}`);
    try {
      const bank = await generate({ ...options, model });
      return { bank, model, source: 'gemini' as const };
    } catch (error) {
      log(`模型 ${model} 未成功，詳細錯誤：\n${JSON.stringify(safeDiagnostics(error), null, 2)}`);
      if (error instanceof GenerationError && error.code === 'invalid_input') throw error;
      if (error instanceof GenerationError && error.code === 'missing_key') break;
    }
  }
  log('警告：Gemini 未啟用、離線或候選模型皆失敗，改用已驗證的內建規則題庫；本機遊戲可繼續使用。');
  return { bank: fallback, model: null, source: 'local' as const };
}
