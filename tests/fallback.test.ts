import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { CANDIDATE_MODELS } from '../scripts/generateQuestions';
import { generateWithFallback, localFallback } from '../scripts/lib/generateWithFallback';
import { GenerationError, generateBatch } from '../scripts/lib/gemini';
import { safeDiagnostics } from '../scripts/lib/diagnostics';
import { validateBank } from '../src/lib/bankSchema';

const options = { count: 3, difficulty: 'easy' as const };
describe('模型降級與離線題庫', () => {
  it('按指定順序重試，3.8-flash 成功就停止', async () => {
    expect(CANDIDATE_MODELS).toEqual(['gemini-3.8', 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash']);
    const bank = localFallback(options);
    bank.questions.forEach((question) => { question.source = 'gemini'; });
    const generate = vi.fn().mockRejectedValueOnce(new GenerationError('api_error', 'HTTP 404')).mockResolvedValueOnce(bank);
    const result = await generateWithFallback(options, CANDIDATE_MODELS, generate, () => {});
    expect(generate.mock.calls.map(([request]) => request.model)).toEqual(['gemini-3.8', 'gemini-3.8-flash']);
    expect(result.model).toBe('gemini-3.8-flash');
    expect(result.source).toBe('gemini');
  });
  it('四個模型全失敗仍產出有效本地題庫並明確警告', async () => {
    const generate = vi.fn().mockRejectedValue(new GenerationError('api_error', 'HTTP 400', { status: 400, errorDetails: [{ reason: 'INVALID_ARGUMENT' }] }));
    const logs: string[] = [];
    const result = await generateWithFallback(options, CANDIDATE_MODELS, generate, (message) => logs.push(message));
    expect(generate.mock.calls.map(([request]) => request.model)).toEqual([...CANDIDATE_MODELS]);
    expect(result.source).toBe('local');
    expect(validateBank(result.bank).questions).toHaveLength(3);
    expect(result.bank.questions.every((question) => question.source === 'local')).toBe(true);
    expect(logs.join('\n')).toContain('INVALID_ARGUMENT');
    expect(logs.at(-1)).toContain('警告');
  });
  it('模型輸出不合法時繼續候選清單，而非接受錯誤答案', async () => {
    const bank = localFallback(options);
    bank.questions.forEach((question) => { question.source = 'gemini'; });
    const generator = vi.fn().mockResolvedValueOnce('not json').mockResolvedValueOnce(JSON.stringify(bank));
    const result = await generateWithFallback(options, CANDIDATE_MODELS, (request) => generateBatch(request, generator), () => {});
    expect(result.model).toBe('gemini-3.8-flash');
    expect(generator).toHaveBeenCalledTimes(2);
  });
  it('各難度 12 題的離線題庫可重現且無重複', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const bank = localFallback({ count: 12, difficulty });
      expect(bank).toEqual(localFallback({ count: 12, difficulty }));
      expect(validateBank(bank).questions).toHaveLength(12);
    }
  });
  it('保留 400 回應結構，遮蔽巢狀標頭、JSON 訊息與 URL 的認證資料', () => {
    const credential = 'synthetic-private-credential';
    const error = { status: 400, message: JSON.stringify({ error: { message: 'Invalid schema', apiKey: credential } }), response: { headers: { authorization: 'Bearer synthetic-token', 'x-goog-api-key': credential }, data: { reason: 'INVALID_ARGUMENT', url: `https://example.test?key=${credential}` } }, errorDetails: [{ field: 'responseJsonSchema' }] };
    const diagnostics = safeDiagnostics(error, credential);
    const serialized = JSON.stringify(diagnostics);
    expect(serialized).toContain('400');
    expect(serialized).toContain('responseJsonSchema');
    expect(serialized).toContain('INVALID_ARGUMENT');
    expect(serialized).not.toContain(credential);
    expect(serialized).not.toContain('synthetic-token');
    expect(serialized).toContain('[REDACTED]');
  });
  it('CLI 離線寫檔可重複執行；非法參數不會破壞舊題庫', () => {
    const directory = mkdtempSync(join(tmpdir(), 'geometry-bank-'));
    const output = join(directory, 'generatedQuestions.json');
    const arguments_ = ['--import', 'tsx', 'scripts/generateQuestions.ts', '--offline', '--out', output];
    try {
      execFileSync(process.execPath, arguments_, { stdio: 'pipe' });
      const first = readFileSync(output, 'utf8');
      expect(validateBank(JSON.parse(first)).questions).toHaveLength(3);
      execFileSync(process.execPath, arguments_, { stdio: 'pipe' });
      expect(readFileSync(output, 'utf8')).toBe(first);
      expect(() => execFileSync(process.execPath, [...arguments_, '--count', '0'], { stdio: 'pipe' })).toThrow();
      expect(readFileSync(output, 'utf8')).toBe(first);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
});
