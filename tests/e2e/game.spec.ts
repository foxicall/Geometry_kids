import { expect, test } from '@playwright/test';

test('缺少 randomUUID 的預覽環境仍能開始、作答與重新開始', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => { Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true }); });
  await page.goto('/');
  await page.getByRole('button', { name: '開始探險', exact: true }).click();
  await expect(page.getByRole('heading', { name: '找出缺少的那一塊' })).toBeVisible();
  await page.getByRole('button', { name: /^選項 A/ }).click();
  await page.getByRole('button', { name: '確認答案' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  await page.getByRole('button', { name: '重新開始', exact: true }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await expect(page.getByRole('button', { name: '確認答案' })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('八題完整作答、重複點選防護、結算與本機紀錄', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('每個圖形');
  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
  await page.getByRole('button', { name: '開始探險', exact: true }).click();
  await expect(page.getByRole('button', { name: '確認答案' })).toBeDisabled();
  let correct = 0;
  for (let index = 0; index < 8; index++) {
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(index));
    await page.getByRole('button', { name: /^選項 A/ }).click();
    const confirm = page.getByRole('button', { name: '確認答案' });
    // 同一事件迴圈重複點擊，確認 reducer 沒有重複累加。
    await confirm.evaluate((element) => { (element as HTMLButtonElement).click(); (element as HTMLButtonElement).click(); });
    await expect(page.getByRole('status')).toBeVisible();
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(index + 1));
    await expect(page.getByRole('button', { name: /^選項 A/ })).toBeDisabled();
    await expect(page.locator('.answer-card.correct')).toHaveCount(1);
    if (await page.locator('.answer-card.selected.correct').count()) correct++;
    if (index === 0) await page.screenshot({ path: testInfo.outputPath('feedback.png'), fullPage: true });
    await page.getByRole('button', { name: index === 7 ? '看看我的發現' : '下一個挑戰' }).click();
  }
  await expect(page.getByRole('heading', { name: '又完成了一次新發現！' })).toBeVisible();
  await expect(page.locator('.result-stats > div').first().locator('strong')).toHaveText(`${correct} / 8`);
  await expect(page.locator('.review-item')).toHaveCount(8);
  await page.locator('.review-item summary').first().click();
  await expect(page.locator('.review-detail').first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('results.png'), fullPage: true });
  await page.reload();
  await page.getByRole('button', { name: '我的發現', exact: true }).click();
  await expect(page.locator('.history-card')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('計時暫停、重新開始歸零、離開清除與 320px 版面', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: '開始探險', exact: true }).click();
  await page.clock.fastForward(5000);
  const timer = page.getByLabel('累計作答時間');
  await expect(timer).not.toHaveText('00:00');
  await page.getByRole('button', { name: /^選項 A/ }).click();
  await page.getByRole('button', { name: '確認答案' }).click();
  const paused = await timer.textContent();
  await page.clock.fastForward(10000);
  await expect(timer).toHaveText(paused!);
  await page.getByRole('button', { name: '重新開始', exact: true }).click();
  await expect(timer).toHaveText('00:00');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await expect(page.getByRole('button', { name: '確認答案' })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: '探險基地', exact: true }).click();
  await page.clock.fastForward(10000);
  await expect(timer).toHaveCount(0);
  await page.getByRole('button', { name: '開始探險', exact: true }).click();
  await expect(timer).toHaveText('00:00');
});

test('難度選擇、固定 3×3、提示與無法儲存時仍可遊玩', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } }); });
  await page.goto('/');
  await page.getByRole('button', { name: /祕境挑戰/ }).click();
  await page.getByRole('switch', { name: '自適應難度' }).click();
  await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('button', { name: '開始探險', exact: true }).click();
  await expect(page.getByRole('group', { name: '3 乘 3 圖形矩陣，右下角待填' })).toBeVisible();
  await expect(page.locator('.answer-card')).toHaveCount(6);
  await page.getByRole('button', { name: '給我一個小提示' }).click();
  await expect(page.locator('.hint-text')).toBeVisible();
  await page.getByRole('button', { name: /^選項 A/ }).click();
  await page.getByRole('button', { name: '確認答案' }).click();
  await page.getByRole('button', { name: '下一個挑戰' }).click();
  await expect(page.locator('.level-pill')).toContainText('挑戰');
});
