import { GoogleGenAI } from '@google/genai';
import { validateBank } from '../../src/lib/bankSchema';
import { responseSchema } from './responseSchema';
import { safeDiagnostics } from './diagnostics';
import { describeRules } from '../../src/lib/matrix';
import type { Difficulty } from '../../src/types/matrix';

export class GenerationError extends Error {
  constructor(public readonly code: 'missing_key' | 'api_error' | 'invalid_output' | 'invalid_input', message: string, public readonly diagnostics?: unknown) { super(message); this.name = 'GenerationError'; }
}
export interface BatchOptions { count: number; difficulty: Difficulty; model: string }
export type Generate = (prompt: string, schema: unknown, model: string) => Promise<string | undefined>;

/** 此模組僅在 Node 維護腳本匯入，絕不能由 src/ 或 Vite define 匯入。 */
export const requestGemini: Generate = async (prompt, schema, model) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey?.trim()) throw new GenerationError('missing_key', 'Gemini 未啟用：請在環境設定安全提供 GEMINI_API_KEY。本地遊戲不受影響。');
  const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 45000, retryOptions: { attempts: 1 } } });
  try {
    const response = await ai.models.generateContent({
      model, contents: prompt,
      config: { responseMimeType: 'application/json', responseJsonSchema: schema, temperature: 0.5, maxOutputTokens: 12000 },
    });
    return response.text;
  } catch (error) {
    // 保留 status、message、response、errorDetails 等欄位，先遮蔽認證資料。
    const status = typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number' ? error.status : null;
    const hint = status === 429 ? '請檢查配額，稍後再試。' : status === 401 || status === 403 ? '請檢查環境中的金鑰授權與目的網域。' : status === 404 ? '此模型目前不支援該帳戶或 API。' : '請檢查網路、模型與服務狀態。';
    throw new GenerationError('api_error', `Gemini 呼叫失敗${status ? `（HTTP ${status}）` : ''}；${hint}`, safeDiagnostics(error, apiKey));
  }
};

export async function generateBatch(options: BatchOptions, generate: Generate = requestGemini) {
  if (!Number.isInteger(options.count) || options.count < 1 || options.count > 12 || !['easy', 'medium', 'hard'].includes(options.difficulty) || !/^(?:models\/)?[a-zA-Z0-9._-]+$/.test(options.model)) {
    throw new GenerationError('invalid_input', 'count 必須為 1–12，difficulty 為 easy、medium 或 hard，model 必須是有效模型名稱。');
  }
  const size = options.difficulty === 'easy' ? 2 : 3;
  const ruleCount = { easy: 1, medium: 2, hard: 3 }[options.difficulty];
  const prompt = `請創作 ${options.count} 題國小學生用的原創幾何矩陣練習。不可複製任何標準化測驗題，也不可提供智力評估。只回傳符合 JSON schema 的 JSON，version=1。
每題 difficulty=${options.difficulty}，size=${size}，source=gemini，使用不同 id。grid 是 ${size}×${size}，只有右下角為 null。
每題恰有 ${ruleCount} 條規則。attribute 是 shape/rotation/fill/count；direction=row 表示由左至右，column 表示由上至下。step 代表循環索引位移。
固定循環順序：shape=[circle,square,triangle,star]，rotation=[0,90,180,270]，fill=[solid,empty,striped]，count=[1,2,3]。
以 grid[0][0] 為起點，每一格 (r,c) 的每個屬性索引 = 起點索引 + 所有該屬性 row 規則的 step*c + column 規則的 step*r，再取循環長度的餘數。未列規則的屬性不可改變。step 不能等於循環長度。
rotation 規則只可用於 triangle 或 star，且整個矩陣皆需有可辨識方向。circle 與 square 的 90 度旋轉視覺相同，不可當作不同選項。斜線方向固定於畫格。
每題 5–7 個選項，含唯一可由上述規則推得的正確答案與 4–6 個視覺不重複的干擾項；correctOptionId 必須精確指向正解。options 中的 id 必須唯一。
使用繁體中文簡短解釋規律。生成後請逐格重新計算，確保題目及答案符合 rules。`;
  let text: string | undefined;
  try { text = await generate(prompt, responseSchema(options.count, options.difficulty), options.model); }
  catch (error) {
    if (error instanceof GenerationError) throw error;
    throw new GenerationError('api_error', 'Gemini 呼叫失敗；未更新題庫。');
  }
  try {
    if (!text) throw new Error('空白回應');
    const bank = validateBank(JSON.parse(text));
    if (bank.questions.length !== options.count) throw new Error('題數不一致');
    for (const question of bank.questions) {
      if (question.difficulty !== options.difficulty || question.size !== size || question.rules.length !== ruleCount || question.source !== 'gemini') throw new Error('題目難度或來源不一致');
      // 題解由已驗證的規則產生，避免模型文字與圖形不符。
      question.explanation = describeRules(question.rules);
    }
    return bank;
  } catch {
    throw new GenerationError('invalid_output', 'Gemini 回傳的題庫未通過格式、規律或唯一正解驗證；未更新題庫，請重新生成。');
  }
}
