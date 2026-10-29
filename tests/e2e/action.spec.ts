import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function open(page: Page) {
  await page.clock.install();
  await page.goto('/?mode=action');
}
async function start(page: Page) {
  await page.getByRole('button', { name: '開始 60 秒挑戰', exact: true }).click();
  await page.clock.runFor(32);
}
async function hit(page: Page) {
  await page.getByRole('button', { name: '發射', exact: true }).evaluate((el) => {
    (el as HTMLButtonElement).click();
    (el as HTMLButtonElement).click();
  });
  await page.clock.runFor(1400);
  await expect(page.getByTestId('action-score')).toHaveText('100');
}

test('動作遊戲：反射命中、連點防護、最高分、暫停與即時重試', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page);
  await page.screenshot({ path: info.outputPath('action-ready.png'), fullPage: true });
  await start(page);
  await hit(page);
  await expect(page.getByTestId('action-combo')).toHaveText('1 ×1');
  await expect(page.getByTestId('action-best')).toHaveText('100');
  await expect(page.getByTestId('action-reflection')).toContainText('入射');
  await expect(page.getByTestId('action-feedback')).toContainText('反射 1 次，命中');
  await page.screenshot({ path: info.outputPath('action-hit.png'), fullPage: true });
  await page.getByRole('button', { name: '暫停', exact: true }).click();
  const paused = await page.getByTestId('action-time').textContent();
  await page.clock.fastForward(15000);
  await expect(page.getByTestId('action-time')).toHaveText(paused!);
  await expect(page.getByRole('button', { name: '發射', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '繼續挑戰', exact: true }).click();
  await expect(page.getByTestId('action-feedback')).not.toContainText('已暫停');
  await page.clock.runFor(1100);
  await expect(page.getByTestId('action-time')).not.toHaveText(paused!);
  await page.getByRole('button', { name: '即時重試', exact: true }).click();
  await expect(page.getByTestId('action-score')).toHaveText('0');
  await expect(page.getByTestId('action-time')).toHaveText('60.0');
  await expect(page.getByTestId('action-state')).toHaveAttribute('data-projectiles', '0');
  await page.reload();
  await expect(page.getByTestId('action-best')).toHaveText('100');
  expect(errors).toEqual([]);
});

test('動作遊戲：拖曳瞄準、鍵盤加速、手機觸控、錯誤回饋及 320px', async ({ page }, info) => {
  await open(page);
  await start(page);
  const canvas = page.getByRole('img', { name: /^鏡面彈射畫布/ });
  const initialX = await page.getByTestId('action-state').getAttribute('data-player-x');
  await canvas.focus();
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(350);
  await page.keyboard.up('ArrowRight');
  await page.clock.runFor(150);
  await expect(page.getByTestId('action-state')).not.toHaveAttribute('data-player-x', initialX!);
  await page.getByRole('button', { name: '即時重試', exact: true }).click();
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  if (info.project.name === 'desktop') {
    const x = box.x + box.width * 0.55,
      y = box.y + box.height * 0.55;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + box.width * 0.16, y + box.height * 0.1);
    await page.mouse.up();
  } else {
    // CDP 送出實際觸控流程，讓瀏覽器建立 pointer capture，含中途取消。
    const touch = await page.context().newCDPSession(page);
    const x = box.x + box.width * 0.5,
      y = box.y + box.height * 0.5;
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await expect(page.getByTestId('action-state')).toHaveAttribute('data-projectiles', '0');
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + box.width * 0.13, y: y + box.height * 0.12 }],
    });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touch.detach();
  }
  await expect(page.getByTestId('action-state')).toHaveAttribute('data-projectiles', '1');
  await page.getByRole('button', { name: '即時重試', exact: true }).click();
  await page.getByRole('slider', { name: '發射角度' }).fill('90');
  await page.getByRole('button', { name: '發射', exact: true }).click();
  await page.clock.runFor(1300);
  await expect(page.getByTestId('action-feedback')).toContainText('反射 0 次');
  await expect(page.getByTestId('action-score')).toHaveText('0');
  const beforePad = Number(await page.getByTestId('action-state').getAttribute('data-player-x'));
  const left = page.getByRole('button', { name: '向左移動', exact: true });
  await left.scrollIntoViewIfNeeded();
  const pad = (await left.boundingBox())!;
  await page.mouse.move(pad.x + pad.width / 2, pad.y + pad.height / 2);
  await page.mouse.down();
  await page.clock.runFor(400);
  await page.mouse.up();
  await page.clock.runFor(150);
  expect(Number(await page.getByTestId('action-state').getAttribute('data-player-x'))).toBeLessThan(
    beforePad,
  );
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const name of ['發射', '暫停', '即時重試', '向左移動']) {
    const target = (await page.getByRole('button', { name, exact: true }).boundingBox())!;
    expect(target.height).toBeGreaterThanOrEqual(44);
    expect(target.width).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({ path: info.outputPath('action-320.png'), fullPage: true });
});

test('動作遊戲：背景暫停、倒數結束、離開清除 rAF 與舊紀錄保留', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('geometry-kids:imo-completed:v1', '["imo-place"]');
  });
  await open(page);
  await page.evaluate(() => {
    const original = requestAnimationFrame.bind(window),
      cancel = cancelAnimationFrame.bind(window),
      pending = new Set<number>();
    Object.assign(window, { __actionPending: pending });
    window.requestAnimationFrame = (callback) => {
      const id = original((time) => {
        pending.delete(id);
        callback(time);
      });
      pending.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      pending.delete(id);
      cancel(id);
    };
  });
  await start(page);
  await page.clock.runFor(1000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByTestId('action-state')).toHaveAttribute('data-phase', 'paused');
  const remaining = await page.getByTestId('action-time').textContent();
  await page.clock.fastForward(10000);
  await expect(page.getByTestId('action-time')).toHaveText(remaining!);
  expect(
    await page.evaluate(
      () => (window as unknown as { __actionPending: Set<number> }).__actionPending.size,
    ),
  ).toBe(0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.getByRole('button', { name: '繼續挑戰', exact: true }).click();
  await expect(page.getByTestId('action-feedback')).not.toContainText('已暫停');
  await page.clock.runFor(32);
  await page.clock.fastForward(65000);
  await expect(page.getByTestId('action-state')).toHaveAttribute('data-phase', 'finished');
  await expect(page.getByTestId('action-time')).toHaveText('0.0');
  await expect(page.getByRole('button', { name: '發射', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '再挑戰一次', exact: true }).click();
  await expect(page.getByTestId('action-time')).toHaveText('60.0');
  await page.getByRole('button', { name: '回到數學研究所', exact: true }).click();
  await page.clock.runFor(1000);
  expect(
    await page.evaluate(
      () => (window as unknown as { __actionPending: Set<number> }).__actionPending.size,
    ),
  ).toBe(0);
  await expect(page.getByTestId('completion-count')).toHaveText('已完成 1 / 13 關');
  await page.getByRole('button', { name: '動作彈射', exact: true }).click();
  await expect(page.getByTestId('action-state')).toHaveAttribute('data-phase', 'ready');
  await expect(page.getByTestId('action-time')).toHaveText('60.0');
});

test('動作離線單檔：無 Web Audio／儲存時仍能玩、減少動態效果', async ({ page, context }) => {
  const errors: string[] = [],
    requests: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => requests.push(r.url()));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Denied');
      },
    });
    Object.defineProperty(window, 'AudioContext', { value: undefined });
  });
  const html = await readFile('dist/geometry-kids.html', 'utf8');
  await page.route('**/*', (route) =>
    route.request().url() === 'http://127.0.0.1:5173/action-offline.html'
      ? route.fulfill({ contentType: 'text/html', body: html })
      : route.abort(),
  );
  await page.goto('/action-offline.html');
  await context.setOffline(true);
  await page.getByRole('button', { name: '動作彈射', exact: true }).click();
  await expect(page.getByRole('button', { name: '減少特效：開', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await start(page);
  await hit(page);
  await expect(page.getByText('瀏覽器無法儲存最高分；本次仍可正常遊玩。')).toBeVisible();
  await page.getByRole('button', { name: '音效：開', exact: true }).click();
  await expect(page.getByRole('button', { name: '音效：關', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.getByRole('button', { name: '回到數學研究所', exact: true }).click();
  await expect(page.locator('.imo-level-card')).toHaveCount(13);
  expect(errors).toEqual([]);
  expect(requests).toEqual(['http://127.0.0.1:5173/action-offline.html']);
});
