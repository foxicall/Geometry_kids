import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const examples = [
  { name: '圖解暖身', answers: [80, 8, 88, 6, 25, 7] },
  { name: '搭橋練習', answers: [50, 16, 80, 24, 5, 5] },
  { name: '國中挑戰', answers: [40, 8, 80, 6, 4, 5] },
];
async function answer(page: Page, value: number) {
  await page.locator('.reasoning-options button').filter({ hasText: new RegExp(`^[A-D]\\s*${value}\\s*(度|公分|平方公分)$`) }).click();
  await page.getByRole('button', { name: '確認我的推理' }).evaluate((el) => { (el as HTMLButtonElement).click(); (el as HTMLButtonElement).click(); });
}
async function round(page: Page, answers: number[]) {
  for (const [index, value] of answers.entries()) {
    await expect(page.getByRole('button', { name: '確認我的推理' })).toBeDisabled();
    await answer(page, value);
    await expect(page.getByRole('progressbar', { name: '推理挑戰進度' })).toHaveAttribute('aria-valuenow', String(index + 1));
    await expect(page.locator('.reasoning-options .correct')).toHaveCount(1);
    await expect(page.locator('.reasoning-options button').first()).toBeDisabled();
    await expect(page.locator('.reasoning-steps li')).toHaveCount(1);
    await page.getByRole('button', { name: '看下一步', exact: true }).click();
    await page.getByRole('button', { name: '看下一步', exact: true }).click();
    await expect(page.locator('.reasoning-steps li')).toHaveCount(3);
    await page.getByRole('button', { name: index === 5 ? '看看這次的收穫' : '下一道推理題' }).evaluate((el) => { (el as HTMLButtonElement).click(); (el as HTMLButtonElement).click(); });
  }
  await expect(page.getByTestId('reasoning-correct')).toHaveText('6 / 6');
}

for (const example of examples) test(`推理 ${example.name}：六類完整作答、分步解答及紀錄`, async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/?mode=reasoning');
  await page.screenshot({ path: info.outputPath('reasoning-home.png'), fullPage: true });
  await page.getByRole('button', { name: new RegExp(example.name) }).click();
  await page.getByRole('button', { name: '開始 6 題推理' }).click();
  await page.screenshot({ path: info.outputPath('reasoning-playing.png'), fullPage: true });
  await round(page, example.answers);
  await page.screenshot({ path: info.outputPath('reasoning-results.png'), fullPage: true });
  await expect(page.locator('.reasoning-review details')).toHaveCount(6);
  await page.locator('.reasoning-review summary').first().click();
  await expect(page.locator('.reasoning-review details').first().getByRole('img')).toBeVisible();
  await page.reload();
  await page.locator('.reasoning-history summary').click();
  await expect(page.locator('.reasoning-history>div')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('推理提示、錯答回饋、頂點操作、計時清除與手機窄版', async ({ page }, info) => {
  await page.clock.install(); await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/?mode=reasoning'); await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '先看一題示範' }).click();
  await expect(page.locator('.reasoning-example .reasoning-steps li')).toHaveCount(3);
  await page.getByRole('button', { name: '開始 6 題推理' }).click();
  await page.clock.fastForward(5000);
  const timer = page.getByLabel('推理作答時間'); await expect(timer).not.toHaveText('00:00');
  await page.getByRole('button', { name: '給我第一個提示' }).click();
  await page.getByRole('button', { name: '再給我一個提示' }).click();
  await page.getByRole('button', { name: '再給我一個提示' }).click();
  await expect(page.locator('.reasoning-hints>p')).toHaveCount(3);
  await answer(page, 82);
  await expect(page.getByRole('status')).toContainText('正確答案：80 度');
  const paused = await timer.textContent(); await page.clock.fastForward(10000); await expect(timer).toHaveText(paused!);
  await page.getByRole('button', { name: '下一道推理題' }).click();
  await expect(page.locator('.reasoning-hints>p')).toHaveCount(0);
  const before = await page.locator('.reasoning-canvas>svg polygon').first().getAttribute('points');
  await page.getByRole('slider', { name: '移動頂點 C' }).fill('90');
  await expect(page.locator('.reasoning-canvas>svg polygon').first()).not.toHaveAttribute('points', before!);
  await page.getByRole('button', { name: '顯示輔助線索' }).click();
  await expect(page.getByTestId('height-helper')).toBeVisible();
  await page.getByRole('button', { name: '放大圖形', exact: true }).click();
  await expect(page.getByLabel('放大的幾何圖，可左右捲動')).toBeVisible();
  expect(await page.locator('.reasoning-canvas').evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '還原大小', exact: true }).click();
  await page.screenshot({ path: info.outputPath('reasoning-320.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: '重新開始推理' }).click();
  await expect(timer).toHaveText('00:00'); await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await page.getByRole('button', { name: '立體觀察室', exact: true }).click();
  await page.clock.fastForward(10000); await expect(timer).toHaveCount(0);
  await page.getByRole('button', { name: '幾何推理', exact: true }).click();
  await page.getByRole('button', { name: '開始 6 題推理' }).click(); await expect(timer).toHaveText('00:00');
});

test('推理離線單檔、儲存讀寫失敗與三種模式入口', async ({ page, context }) => {
  const requests: string[] = [], errors: string[] = [];
  page.on('request', (request) => requests.push(request.url())); page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => { Math.random = () => 0; Object.defineProperty(window, 'localStorage', { get() { throw new Error('Unavailable'); } }); });
  const html = await readFile('dist/geometry-kids.html', 'utf8');
  await page.route('**/*', (route) => route.request().url() === 'http://127.0.0.1:5173/reasoning-offline.html' ? route.fulfill({ contentType: 'text/html', body: html }) : route.abort());
  await page.goto('/reasoning-offline.html'); await context.setOffline(true);
  await page.getByRole('button', { name: '幾何推理', exact: true }).click();
  await page.getByRole('button', { name: /國中挑戰/ }).click(); await page.getByRole('button', { name: '開始 6 題推理' }).click();
  await round(page, examples[2].answers);
  await expect(page.getByText('瀏覽器無法儲存紀錄，但這次的解答仍在下方。')).toBeVisible();
  await page.getByRole('button', { name: '同程度換題再試' }).click(); await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await page.getByRole('button', { name: '立體觀察室', exact: true }).click(); await page.getByRole('button', { name: '開始觀察挑戰' }).click();
  await expect(page.getByTestId('solid-score')).toHaveText('0 / 300');
  await page.getByRole('button', { name: '圖形規律練習' }).click(); await page.getByRole('button', { name: '開始探險', exact: true }).click();
  await expect(page.getByRole('button', { name: '確認答案' })).toBeDisabled();
  expect(requests).toEqual(['http://127.0.0.1:5173/reasoning-offline.html']); expect(errors).toEqual([]);
});
