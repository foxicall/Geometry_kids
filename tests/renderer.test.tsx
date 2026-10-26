import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CellRenderer } from '../src/components/CellRenderer';

describe('SVG 畫格', () => {
  it('三個圖形各自旋轉，斜線反向補償，且無圖片資源', () => {
    const html = renderToStaticMarkup(createElement(CellRenderer, { cell: { shape: 'triangle', rotation: 90, fill: 'striped', count: 3 } }));
    expect(html.match(/<g /g)).toHaveLength(3);
    expect(html).toContain('rotate(90)');
    expect(html).toContain('patternTransform="rotate(-90)"');
    expect(html).toContain('3 個斜線三角形');
    expect(html).not.toMatch(/<image|<img|https?:/);
  });
  it('同頁多個畫格有獨立的填充 pattern ID', () => {
    const cell = { shape: 'star' as const, rotation: 0 as const, fill: 'striped' as const, count: 1 as const };
    const html = renderToStaticMarkup(createElement('div', {}, createElement(CellRenderer, { cell }), createElement(CellRenderer, { cell })));
    const ids = [...html.matchAll(/<pattern id="([^"]+)"/g)].map((match) => match[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });
});
