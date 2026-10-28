import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const titles = [
  '位值舞台劇',
  '羅馬密碼門',
  '過山車估算站',
  '時空倒帶機',
  '魔法藥水廠',
  '披薩約分工廠',
  '分數賽車場',
  '單位轉換工廠',
  '城堡圍欄師',
  '圖形對稱鏡',
  '節慶蠟燭天平',
  '神殿規律鎖',
  '航海羅盤迷宮',
];
const castleEdges = [
  'h:0:0',
  'h:0:1',
  'h:0:2',
  'v:0:0',
  'v:0:3',
  'h:1:1',
  'h:1:2',
  'v:1:0',
  'v:1:1',
  'v:2:0',
  'v:2:1',
  'v:3:0',
  'h:4:0',
  'h:4:1',
  'h:4:2',
  'h:4:3',
  'h:3:1',
  'h:3:2',
  'h:3:3',
  'v:3:4',
];
async function enter(page: Page, label: string, n: number) {
  await page.getByRole('spinbutton', { name: label, exact: true }).fill(String(n));
  await page.getByRole('button', { name: `設定${label}`, exact: true }).click();
}
async function open(page: Page, title: string) {
  await page.getByRole('button', { name: '回到 IMO 選關', exact: true }).click();
  await page.getByRole('button', { name: new RegExp(title) }).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
}
async function solve(page: Page, index: number) {
  switch (index) {
    case 0:
      for (const n of [4, 9, 2, 0, 7])
        await page.getByRole('button', { name: `放入數字 ${n}`, exact: true }).click();
      break;
    case 1:
      for (const s of 'CDLXV')
        await page.getByRole('button', { name: `加入 ${s}`, exact: true }).click();
      break;
    case 2:
      await page.getByRole('button', { name: '前往 38000', exact: true }).click();
      break;
    case 3:
      for (const op of ['+500', '÷4', '−12', '÷10'])
        await page.getByRole('button', { name: op, exact: true }).click();
      break;
    case 4:
      await enter(page, '單瓶毫升', 60);
      await enter(page, '調配瓶數', 12);
      break;
    case 5:
      await page.getByRole('button', { name: '合併切片', exact: true }).click();
      break;
    case 6:
      await page.getByRole('button', { name: 'LCM 通分', exact: true }).click();
      await page.getByRole('button', { name: '左邊比較大', exact: true }).click();
      break;
    case 7:
      await enter(page, '換算總量（公分）', 5000);
      await enter(page, '每人份量（公分）', 40);
      break;
    case 8:
      for (const edge of castleEdges)
        await page.locator(`[data-edge="${edge}"]`).locator('..').press('Enter');
      break;
    case 9:
      for (const angle of [0, 45, 90, 135]) {
        await page.getByRole('button', { name: `${angle}°`, exact: true }).click();
        await page.getByRole('button', { name: `沿 ${angle}° 對折`, exact: true }).click();
      }
      break;
    case 10:
      for (let i = 0; i < 5; i++)
        await page.getByRole('button', { name: '增加一個圖案', exact: true }).click();
      await page.getByRole('spinbutton', { name: '占比分子', exact: true }).fill('1');
      await page.getByRole('spinbutton', { name: '占比分母', exact: true }).fill('4');
      await page.getByRole('button', { name: '設定占比分數', exact: true }).click();
      break;
    case 11:
      await page.getByRole('button', { name: '第 1 運算 ×', exact: true }).click();
      await page.getByRole('button', { name: '第 2 運算 +', exact: true }).click();
      await enter(page, '未知數 x', 3);
      break;
    case 12:
      await page.getByRole('button', { name: '逆時針 1/8 圈', exact: true }).click();
      await page.getByRole('button', { name: '順時針 1/4 圈', exact: true }).click();
      break;
  }
}

for (const [index, title] of titles.entries())
  test(`IMO ${index + 1} ${title}：完成、復原、提示、重設、探索及無溢出`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await open(page, title);
    await expect(page.getByRole('button', { name: '復原 Undo', exact: true })).toBeDisabled();
    await solve(page, index);
    await expect(page.getByTestId('game-feedback')).toContainText('挑戰完成');
    await page.screenshot({
      path: info.outputPath(`imo-${index + 1}-completed.png`),
      fullPage: true,
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: '復原 Undo', exact: true }).click();
    await expect(page.getByTestId('game-feedback')).not.toContainText('挑戰完成');
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /^看提示/ }).click();
    await expect(page.getByRole('button', { name: '看提示（3/3）', exact: true })).toBeDisabled();
    await expect(page.locator('aside ol li')).toHaveCount(3);
    await page.getByRole('button', { name: '重新開始', exact: true }).click();
    await expect(page.getByTestId('move-count')).toContainText('已用 0 /');
    await expect(page.locator('aside ol li')).toHaveCount(0);
    await page.getByRole('button', { name: '探索模式 Playground', exact: true }).click();
    await solve(page, index);
    await expect(page.getByTestId('move-count')).toContainText('不限步數');
    await expect(page.getByTestId('game-feedback')).not.toContainText('挑戰完成');
    await page.setViewportSize({ width: 320, height: 740 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: '挑戰模式 Challenge', exact: true }).click();
    await expect(page.getByTestId('move-count')).toContainText('已用 0 /');
    await page.reload();
    await expect(page.getByTestId('completion-count')).toHaveText('已完成 1 / 13 關');
    expect(errors).toEqual([]);
  });

test('IMO 步數耗盡、Undo 救回、連點鎖定與舊紀錄保留', async ({ page }) => {
  await page.addInitScript(() => {
    for (const key of [
      'shape-explorers:sessions:v1',
      'geometry-kids:solid-records:v1',
      'geometry-kids:reasoning-records:v1',
    ])
      localStorage.setItem(key, '原紀錄');
  });
  await page.goto('/');
  await open(page, titles[1]);
  const add = page.getByRole('button', { name: '加入 M', exact: true });
  for (let i = 0; i < 8; i++) await add.click();
  await expect(page.getByTestId('game-feedback')).toContainText('步數用完');
  await expect(add).toBeDisabled();
  await page.getByRole('button', { name: '復原 Undo', exact: true }).click();
  await expect(add).toBeEnabled();
  await expect(page.getByTestId('move-count')).toContainText('已用 7 /');
  await page.getByRole('button', { name: '重新開始', exact: true }).click();
  await open(page, titles[2]);
  await page.getByRole('button', { name: '前往 38000', exact: true }).evaluate((el) => {
    (el as HTMLButtonElement).click();
    (el as HTMLButtonElement).click();
  });
  await expect(page.getByTestId('move-count')).toContainText('已用 1 /');
  await page.getByRole('button', { name: '重新開始', exact: true }).click();
  await page.reload();
  await expect(page.getByTestId('completion-count')).toHaveText('已完成 1 / 13 關');
  expect(
    await page.evaluate(() =>
      [
        'shape-explorers:sessions:v1',
        'geometry-kids:solid-records:v1',
        'geometry-kids:reasoning-records:v1',
      ].map((k) => localStorage.getItem(k)),
    ),
  ).toEqual(['原紀錄', '原紀錄', '原紀錄']);
});

test('IMO 探索修改參數、半圖案、鏡像與觸控塗色', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await open(page, titles[5]);
  await page.getByRole('button', { name: '探索模式 Playground', exact: true }).click();
  await enter(page, '總切片數', 8);
  const slice = page.getByRole('button', { name: '切片 1，已塗色', exact: true });
  if (info.project.name === 'mobile') await slice.tap();
  else await slice.press('Enter');
  await expect(page.getByTestId('board-readout')).toHaveText('7/8');
  await page.getByRole('button', { name: '復原 Undo', exact: true }).click();
  await expect(page.getByTestId('board-readout')).toHaveText('8/8');
  await open(page, titles[9]);
  await page.getByRole('button', { name: '圓', exact: true }).click();
  await page.getByRole('button', { name: '15°', exact: true }).click();
  await page.getByRole('button', { name: '沿 15° 對折', exact: true }).click();
  await expect(page.getByText(/有無限多條/)).toBeVisible();
  await expect(page.getByTestId('board-readout')).toHaveText('鏡像完全貼合');
  await open(page, titles[10]);
  await page.getByRole('button', { name: '增加半個圖案', exact: true }).click();
  await expect(page.getByTestId('board-readout')).toContainText('0.5 個圖案 = 3.5 枝');
  await open(page, titles[7]);
  await page.getByRole('button', { name: '閱讀時間', exact: true }).click();
  await enter(page, '換算總量（分鐘）', 60);
  await enter(page, '每人份量（分鐘）', 15);
  await expect(page.getByRole('group', { name: '1 小時平均分給 4 人' })).toContainText(
    '每人 15 分鐘',
  );
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /^看提示/ }).click();
  await expect(page.locator('aside ol')).toContainText('目前人數');
  await expect(page.locator('aside ol')).not.toContainText('5000');
  await open(page, titles[11]);
  await page.getByRole('button', { name: '第 1 運算 ÷', exact: true }).click();
  await page.getByRole('button', { name: '第 2 運算 +', exact: true }).click();
  await enter(page, '測試 C', 0);
  await expect(page.getByTestId('board-readout').last()).toContainText('除以 0');
});

test('IMO 離線單檔含 13 關與四種模式，儲存失敗仍可完成', async ({ page, context }) => {
  const requests: string[] = [],
    errors: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Denied');
      },
    }),
  );
  const html = await readFile('dist/geometry-kids.html', 'utf8');
  await page.route('**/*', (route) =>
    route.request().url() === 'http://127.0.0.1:5173/imo-offline.html'
      ? route.fulfill({ contentType: 'text/html', body: html })
      : route.abort(),
  );
  await page.goto('/imo-offline.html');
  await context.setOffline(true);
  await expect(page.locator('.imo-level-card')).toHaveCount(13);
  await open(page, titles[12]);
  await solve(page, 12);
  await expect(page.getByTestId('game-feedback')).toContainText('挑戰完成');
  await expect(page.getByRole('status')).toContainText('瀏覽器無法儲存');
  await page.getByRole('button', { name: '重新開始', exact: true }).click();
  await expect(page.getByTestId('move-count')).toContainText('已用 0 /');
  await page.getByRole('button', { name: '幾何推理', exact: true }).click();
  await expect(page.getByRole('button', { name: '開始 6 題推理' })).toBeVisible();
  await page.getByRole('button', { name: '回到 IMO 數學思考研究所', exact: true }).click();
  await page.getByRole('button', { name: '立體觀察', exact: true }).click();
  await expect(page.getByRole('button', { name: '開始觀察挑戰' })).toBeVisible();
  await page.getByRole('button', { name: '回到 IMO 數學思考研究所', exact: true }).click();
  await page.getByRole('button', { name: '圖形矩陣', exact: true }).click();
  await expect(page.getByRole('button', { name: '開始探險', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '回到 IMO 數學思考研究所', exact: true }).click();
  await expect(page.locator('.imo-level-card')).toHaveCount(13);
  expect(requests).toEqual(['http://127.0.0.1:5173/imo-offline.html']);
  expect(errors).toEqual([]);
});
