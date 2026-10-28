import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReasoningDiagram } from '../src/components/ReasoningDiagram';
import { LEVELS, makeReasoningQuestion, makeReasoningRound, reasoningBank } from '../src/lib/reasoningQuestions';
import { initialReasoning, readReasoningRecords, reasoningReducer, saveReasoningRecord } from '../src/lib/reasoningGame';
import type { ReasoningState } from '../src/lib/reasoningGame';

const polygonArea = (points: number[][]) => Math.abs(points.reduce((sum, p, i) => { const next = points[(i + 1) % points.length]; return sum + p[0] * next[1] - next[0] * p[1]; }, 0)) / 2;
afterEach(() => vi.unstubAllGlobals());

describe('72 題原創幾何條件與答案', () => {
  it('題庫覆蓋三階六類，每類四組參數，沒有重複 ID', () => {
    expect(reasoningBank).toHaveLength(72); expect(new Set(reasoningBank.map((q) => q.id)).size).toBe(72);
    for (const level of LEVELS) {
      const round = makeReasoningRound(level.id, () => 0);
      expect(round).toHaveLength(6); expect(new Set(round.map((q) => q.topic)).size).toBe(6);
      expect(round.every((q) => q.level === level.id)).toBe(true);
    }
  });
  it.each(reasoningBank)('$id 的圖形條件足夠、答案唯一且可獨立驗算', (q) => {
    const d = q.diagram;
    let answer: number;
    switch (d.kind) {
      case 'angles':
        expect(d.left + d.right + d.top).toBe(180);
        expect(Math.min(d.left, d.right, d.top)).toBeGreaterThan(0);
        if (d.mode === 'isosceles') expect(d.left).toBe(d.right);
        answer = d.mode === 'sum' ? 180 - d.left - d.right : d.mode === 'isosceles' ? (180 - d.top) / 2 : (d.left + d.top) / 2;
        break;
      case 'height': {
        const leftArea = d.left * d.height / 2, rightArea = d.right * d.height / 2;
        // 使用座標行列式驗證：移動頂點，包括垂足在左三角形外時，兩塊面積都不變。
        for (const x of [0.1, 0.46, 0.9].map((fraction) => (d.left + d.right) * fraction)) {
          expect(polygonArea([[0, 0], [d.left, 0], [x, d.height]])).toBeCloseTo(leftArea);
          expect(polygonArea([[d.left, 0], [d.left + d.right, 0], [x, d.height]])).toBeCloseTo(rightArea);
        }
        answer = d.mode === 'area' ? leftArea : d.mode === 'ratio' ? leftArea * d.right / d.left : rightArea / leftArea * d.left;
        break;
      }
      case 'cut': {
        const { width: w, height: h, cutWidth: cw, cutHeight: ch } = d;
        expect(cw).toBeLessThan(w); expect(ch).toBeLessThan(h);
        const points = d.mode === 'corner' ? [[0, 0], [w - cw, 0], [w, ch], [w, h], [0, h]] : d.mode === 'notch' ? [[0, 0], [w - cw, 0], [w - cw, ch], [w, ch], [w, h], [0, h]] : [[0, 0], [w - cw, 0], [w, h], [0, h]];
        answer = polygonArea(points);
        break;
      }
      case 'similar': {
        const height = 2 * d.area / d.side;
        const largeArea = polygonArea([[0, 0], [d.side * d.scale, 0], [0, height * d.scale]]);
        answer = d.mode === 'area' ? largeArea : d.side * Math.sqrt(largeArea / d.area);
        expect(d.scale).toBeGreaterThan(1); break;
      }
      case 'squares': {
        const hypotenuseArea = polygonArea([[d.a, 0], [0, -d.b], [d.b, -d.b - d.a], [d.a + d.b, -d.a]]);
        expect(hypotenuseArea).toBe(d.c * d.c); expect(Math.hypot(d.a, d.b)).toBe(d.c);
        answer = d.mode === 'area' ? hypotenuseArea : d.mode === 'hypotenuse' ? Math.sqrt(hypotenuseArea) : Math.sqrt(d.c * d.c - d.a * d.a);
        break;
      }
      case 'path':
        expect(d.split).toBeGreaterThan(0); expect(d.split).toBeLessThan(d.height);
        answer = d.mode === 'road' ? d.width + d.height : Math.hypot(d.width, d.height);
        if (d.mode === 'unfold') expect(q.prompt).toContain('只能');
    }
    expect(q.answer).toBe(answer); expect(Number.isInteger(q.answer)).toBe(true); expect(q.answer).toBeGreaterThan(0);
    expect(q.options).toHaveLength(4); expect(new Set(q.options).size).toBe(4); expect(q.options.filter((x) => x === answer)).toHaveLength(1);
    expect(q.options.every((x) => Number.isInteger(x) && x > 0)).toBe(true);
    expect(q.hints).toHaveLength(3); expect(q.steps).toHaveLength(3);
    expect(q.hints.every(Boolean) && q.steps.every((s) => s.title && s.text && s.calculation)).toBe(true);
    const html = renderToStaticMarkup(<ReasoningDiagram question={q} revealed />);
    expect(html).not.toMatch(/NaN|Infinity|<image|<img|<iframe/);
    expect(html).toContain('role="img"'); expect(html).toContain(q.title);
  });
  it('三階的已知例子各有可核對的確切答案', () => {
    expect(makeReasoningRound('warmup', () => 0).map((q) => q.answer)).toEqual([80, 8, 88, 6, 25, 7]);
    expect(makeReasoningRound('bridge', () => 0).map((q) => q.answer)).toEqual([50, 16, 80, 24, 5, 5]);
    expect(makeReasoningRound('challenge', () => 0).map((q) => q.answer)).toEqual([40, 8, 80, 6, 4, 5]);
    expect(() => makeReasoningQuestion('angles', 'challenge', 4)).toThrow();
  });
});

function start(): ReasoningState { return reasoningReducer(initialReasoning, { type: 'start', questions: makeReasoningRound('challenge', () => 0), now: 1000, id: 'round-1' }); }
function finish(): ReasoningState {
  let state = start();
  for (let i = 0; i < 6; i++) {
    state = reasoningReducer(state, { type: 'select', value: state.questions[i].answer });
    state = reasoningReducer(state, { type: 'submit', now: state.startedAt + 3000 });
    state = reasoningReducer(state, { type: 'next', now: state.startedAt + 18000 });
  }
  return state;
}
describe('提示、分步解答、計時與獨立紀錄', () => {
  it('未選答案不能提交；提示有上限，重複提交／換題不會跳關', () => {
    let state = start();
    expect(reasoningReducer(state, { type: 'submit', now: 2000 })).toBe(state);
    expect(reasoningReducer(state, { type: 'select', value: 9999 })).toBe(state);
    for (let i = 0; i < 8; i++) state = reasoningReducer(state, { type: 'hint' });
    expect(state.hints).toBe(3);
    state = reasoningReducer(state, { type: 'select', value: state.questions[0].answer });
    state = reasoningReducer(state, { type: 'submit', now: 6000 });
    expect(state.attempts).toHaveLength(1); expect(state.attempts[0].correct).toBe(true); expect(state.elapsedMs).toBe(5000);
    expect(reasoningReducer(state, { type: 'submit', now: 8000 })).toBe(state);
    expect(reasoningReducer(state, { type: 'select', value: state.questions[0].options[0] })).toBe(state);
    for (let i = 0; i < 7; i++) state = reasoningReducer(state, { type: 'step' });
    expect(state.steps).toBe(3);
    state = reasoningReducer(state, { type: 'next', now: 20000 });
    expect(state).toMatchObject({ hints: 0, steps: 1, selected: null, elapsedMs: 5000, index: 1 });
    expect(reasoningReducer(state, { type: 'next', now: 22000 })).toBe(state);
  });
  it('完成六類觀念且排除閱讀時間，重新開始全部歸零', () => {
    const state = finish();
    expect(state.phase).toBe('complete'); expect(state.elapsedMs).toBe(18000); expect(state.attempts.every((a) => a.correct)).toBe(true);
    expect(reasoningReducer(state, { type: 'reset' })).toEqual(initialReasoning);
  });
  it('保留原有兩種模式的紀錄，防止重複寫入同一回合', () => {
    const memory = new Map([['geometry-kids:solid-records:v1', 'keep-solid'], ['shape-explorers:sessions:v1', 'keep-matrix']]);
    vi.stubGlobal('localStorage', { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) });
    expect(saveReasoningRecord(finish())).toBe(true); expect(saveReasoningRecord(finish())).toBe(true);
    expect(readReasoningRecords()).toHaveLength(1); expect(memory.get('geometry-kids:solid-records:v1')).toBe('keep-solid'); expect(memory.get('shape-explorers:sessions:v1')).toBe('keep-matrix');
  });
  it('毀損、無法讀取或寫入的紀錄不阻擋結算', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{bad', setItem: () => { throw new Error('quota'); } });
    expect(readReasoningRecords()).toEqual([]); expect(saveReasoningRecord(finish())).toBe(false);
    vi.stubGlobal('localStorage', { getItem: () => '[null,{"id":"x","date":{},"correct":0}]' });
    expect(readReasoningRecords()).toEqual([]);
  });
});
