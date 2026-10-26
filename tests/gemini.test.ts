import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateBatch, requestGemini } from '../scripts/lib/gemini';
import { createQuestion } from '../src/lib/questions';
import { validateBank } from '../src/lib/bankSchema';
import { describeRules } from '../src/lib/matrix';

const options = { count: 1, difficulty: 'medium' as const, model: 'gemini-flash-latest' };
const sample = () => ({ version: 1, questions: [{ ...createQuestion('medium', 'gemini-sample'), source: 'gemini' as const }] });
afterEach(() => vi.unstubAllEnvs());

describe('Gemini 題庫維護邊界', () => {
  it('成功回應通過逐格驗證，題解由規則產生', async () => {
    const bank = sample();
    bank.questions[0].explanation = '模型可能寫錯的文字';
    const result = await generateBatch(options, async () => JSON.stringify(bank));
    expect(result.questions[0].explanation).toBe(describeRules(bank.questions[0].rules));
    expect(validateBank(result).questions).toHaveLength(1);
  });
  it('沒有金鑰時明確回報未啟用，不送出請求', async () => {
    vi.stubEnv('GEMINI_API_KEY', undefined);
    await expect(requestGemini('prompt', {}, options.model)).rejects.toMatchObject({ code: 'missing_key' });
  });
  it.each([undefined, '', 'not json', '{"version":1,"questions":[]}'])('拒絕空白、非 JSON 與題數不符的輸出 %s', async (text) => {
    await expect(generateBatch(options, async () => text)).rejects.toMatchObject({ code: 'invalid_output' });
  });
  it('拒絕錯誤正解、重複干擾項與錯誤難度', async () => {
    const wrong = sample();
    wrong.questions[0].correctOptionId = 'wrong';
    await expect(generateBatch(options, async () => JSON.stringify(wrong))).rejects.toMatchObject({ code: 'invalid_output' });
    const duplicate = sample();
    duplicate.questions[0].options[1].cell = duplicate.questions[0].options[0].cell;
    await expect(generateBatch(options, async () => JSON.stringify(duplicate))).rejects.toMatchObject({ code: 'invalid_output' });
    const easy = { version: 1, questions: [{ ...createQuestion('easy', 'easy'), source: 'gemini' }] };
    await expect(generateBatch(options, async () => JSON.stringify(easy))).rejects.toMatchObject({ code: 'invalid_output' });
  });
  it('API 失敗保留安全訊息，不轉印原始錯誤內容', async () => {
    await expect(generateBatch(options, async () => { throw new Error('request contained sensitive headers'); })).rejects.toMatchObject({ code: 'api_error', message: 'Gemini 呼叫失敗；未更新題庫。' });
  });
  it('拒絕非法批次大小，不呼叫模型', async () => {
    const generate = vi.fn();
    await expect(generateBatch({ ...options, count: 0 }, generate)).rejects.toMatchObject({ code: 'invalid_input' });
    await expect(generateBatch({ ...options, count: 13 }, generate)).rejects.toMatchObject({ code: 'invalid_input' });
    expect(generate).not.toHaveBeenCalled();
  });
  it('拒絕重複題目編號與相同矩陣', () => {
    const bank = sample();
    expect(() => validateBank({ ...bank, questions: [bank.questions[0], bank.questions[0]] })).toThrow('編號');
    expect(() => validateBank({ ...bank, questions: [bank.questions[0], { ...bank.questions[0], id: 'another-id' }] })).toThrow('內容');
  });
});
