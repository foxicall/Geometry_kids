import { readFile } from 'node:fs/promises';
import { validateBank } from '../src/lib/bankSchema';

try {
  const file = process.argv[2] || 'src/data/generatedQuestions.json';
  const bank = validateBank(JSON.parse(await readFile(file, 'utf8')));
  console.log(`題庫驗證通過：${bank.questions.length} 題。${bank.questions.length ? '' : '目前使用本地規則生成器。'}`);
} catch {
  console.error('題庫驗證失敗：請檢查 JSON、矩陣規律、唯一正解與重複題目。');
  process.exitCode = 1;
}
