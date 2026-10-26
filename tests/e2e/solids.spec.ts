import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// 從畫面上的圖形名稱獨立推算，避免把程式內的答案函式當成測試答案。
async function fillCorrect(page: Page) {
  const name = await page.getByTestId('solid-name').textContent();
  const n = '三四五六七八'.indexOf(name![0]) + 3;
  expect(n).toBeGreaterThanOrEqual(3); expect(n).toBeLessThanOrEqual(8);
  const values = name!.includes('柱') ? [2 * n, 3 * n, n + 2] : [n + 1, 2 * n, n + 1];
  for (const [index, label] of ['頂點數量', '邊數量', '面數量'].entries()) await page.getByRole('spinbutton', { name: label, exact: true }).fill(String(values[index]));
}
async function completeRound(page: Page) {
  for (let index = 0; index < 10; index++) {
    await fillCorrect(page);
    await page.getByRole('button', { name: '確認我的發現' }).evaluate((el) => { (el as HTMLButtonElement).click(); (el as HTMLButtonElement).click(); });
    await expect(page.getByRole('progressbar', { name: '立體挑戰進度' })).toHaveAttribute('aria-valuenow', String(index + 1));
    await expect(page.getByTestId('solid-score')).toHaveText(`${(index + 1) * 30} / 300`);
    await expect(page.getByRole('spinbutton', { name: '頂點數量', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: index === 9 ? '查看挑戰成果' : '下一張藍圖' }).evaluate((el) => { (el as HTMLButtonElement).click(); (el as HTMLButtonElement).click(); });
  }
  await expect(page.getByTestId('final-solid-score')).toHaveText('300 / 300');
  await expect(page.locator('.solid-review-row')).toHaveCount(10);
}

test('立體十關完整作答、鎖定連點、結算與本機挑戰榜', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('轉個角度');
  await page.screenshot({ path: testInfo.outputPath('solid-home.png'), fullPage: true });
  await page.getByLabel('你的小小建築師暱稱', { exact: false }).fill('小星');
  await page.getByRole('button', { name: '開始觀察挑戰' }).click();
  await page.screenshot({ path: testInfo.outputPath('solid-playing.png'), fullPage: true });
  await completeRound(page);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('小星');
  await page.locator('.solid-review-row summary').first().click();
  await expect(page.locator('.solid-review-body').first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('solid-results.png'), fullPage: true });
  await page.getByRole('button', { name: '查看本機挑戰榜' }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('小星');
  await page.reload();
  await page.getByRole('button', { name: '練習紀錄' }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: '開始新的挑戰' }).click();
  await expect(page.getByTestId('solid-score')).toHaveText('0 / 300');
  expect(errors).toEqual([]);
});

test('立體旋轉、鍵盤與拖曳、頂點標記、減少動畫與 320px 版面', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const geometry = page.getByTestId('solid-geometry');
  const model = page.getByRole('img', { name: /立體模型/ });
  const hintIcon = (await page.locator('.scene-caption svg').boundingBox())!;
  expect(hintIcon.width).toBeLessThanOrEqual(16);
  expect(hintIcon.height).toBeLessThanOrEqual(16);
  await expect(page.getByRole('button', { name: '繼續旋轉' })).toBeVisible();
  const initial = await geometry.getAttribute('data-yaw');
  await model.press('ArrowRight');
  await expect(geometry).not.toHaveAttribute('data-yaw', initial!);
  const afterKey = await geometry.getAttribute('data-yaw');
  const box = (await model.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 20); await page.mouse.up();
  await expect(geometry).not.toHaveAttribute('data-yaw', afterKey!);
  await expect(geometry.locator('circle')).toHaveCount(20);
  await expect(geometry.locator('line[stroke-dasharray]')).not.toHaveCount(0);
  await page.getByRole('button', { name: '標出頂點' }).click();
  await expect(geometry.locator('circle')).toHaveCount(0);
  await page.getByRole('button', { name: '繼續旋轉' }).click();
  await expect(page.getByRole('button', { name: '暫停旋轉' })).toBeVisible();
  await page.getByRole('button', { name: '暫停旋轉' }).click();
  await page.getByRole('button', { name: '重設視角' }).click();
  await expect(geometry).toHaveAttribute('data-yaw', initial!);
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '開始觀察挑戰' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('立體空白驗證、錯答計分、提示、計時暫停與重啟', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: '開始觀察挑戰' }).click();
  await page.getByRole('button', { name: '確認我的發現' }).click();
  await expect(page.getByRole('alert')).toContainText('整數');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await page.getByRole('button', { name: '給我一個小提示' }).click();
  await expect(page.locator('.solid-hint')).toBeVisible();
  await page.clock.fastForward(5000);
  const timer = page.getByLabel('立體觀察時間');
  await expect(timer).not.toHaveText('00:00');
  for (const label of ['頂點數量', '邊數量', '面數量']) await page.getByRole('spinbutton', { name: label, exact: true }).fill('0');
  await page.getByRole('button', { name: '確認我的發現' }).click();
  await expect(page.getByTestId('solid-score')).toHaveText('0 / 300');
  await expect(page.getByRole('status')).toContainText('−15');
  const paused = await timer.textContent();
  await page.clock.fastForward(10000); await expect(timer).toHaveText(paused!);
  await page.getByRole('button', { name: '重新開始立體挑戰' }).click();
  await expect(timer).toHaveText('00:00');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await expect(page.getByRole('spinbutton', { name: '頂點數量', exact: true })).toHaveValue('');
  await page.getByRole('button', { name: '圖形規律練習' }).click();
  await page.clock.fastForward(10000);
  await expect(timer).toHaveCount(0);
  await page.getByRole('button', { name: '回到立體觀察室' }).click();
  await expect(timer).toHaveText('00:00');
});

test('無法讀寫儲存及 randomUUID 不影響立體結算與重新開始', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } });
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
  });
  await page.goto('/');
  await page.getByRole('button', { name: '開始觀察挑戰' }).click();
  await completeRound(page);
  await page.getByRole('button', { name: '查看本機挑戰榜' }).click();
  await expect(page.locator('.solid-empty')).toBeVisible();
  await page.getByRole('button', { name: '開始新的挑戰' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  expect(errors).toEqual([]);
});

test('離線單檔含新版十關與矩陣模式，沒有外部資源請求', async ({ page, context }) => {
  const html = await readFile('dist/geometry-kids.html', 'utf8');
  const errors: string[] = [], requests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  // 只供應這個單一 HTML；任何其他網址都不會被測試伺服器補齊。
  await page.route('**/*', (route) => route.request().url() === 'http://127.0.0.1:5173/offline-game.html' ? route.fulfill({ contentType: 'text/html', body: html }) : route.abort());
  await page.goto('/offline-game.html');
  await context.setOffline(true);
  await page.getByRole('button', { name: '開始觀察挑戰' }).click();
  await completeRound(page);
  await page.getByRole('button', { name: '再挑戰 10 關' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await page.getByRole('button', { name: '圖形規律練習' }).click();
  await page.getByRole('button', { name: '開始探險', exact: true }).click();
  for (let index = 0; index < 8; index++) {
    await page.getByRole('button', { name: /^選項 A/ }).click();
    await page.getByRole('button', { name: '確認答案' }).click();
    await page.getByRole('button', { name: index === 7 ? '看看我的發現' : '下一個挑戰' }).click();
  }
  await expect(page.getByRole('heading', { name: '又完成了一次新發現！' })).toBeVisible();
  expect(requests).toEqual(['http://127.0.0.1:5173/offline-game.html']);
  expect(errors).toEqual([]);
});
