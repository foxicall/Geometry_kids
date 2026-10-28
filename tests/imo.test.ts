import { describe, expect, it } from 'vitest';
import type { ArithmeticOperator, GameAction, GameBoard } from '../src/types/game';
import {
  COMPLETED_KEY,
  createSession,
  readCompleted,
  sessionReducer,
  transition,
  writeCompleted,
} from '../src/games/engine';
import { getLevel, levels, matrixValue, validateBoard } from '../src/games/levels';
import {
  bestPlaceNumber,
  boundaryEdges,
  castleCells,
  gcd,
  isSymmetry,
  lcm,
  parseRoman,
  reflect,
  roundTo,
  toRoman,
  wrap,
} from '../src/games/math';

// 解題路徑採人工推導答案；城堡邊另列固定座標，避免用被測的邊界函式產生答案。
const castleBoundary = [
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
const witnesses: Record<string, GameAction[]> = {
  place: [4, 9, 2, 0, 7].map((digit, slot) => ({ type: 'place', digit, slot })),
  roman: [...'CDLXV'].map((symbol) => ({ type: 'roman', symbol })),
  rounding: [{ type: 'round-choice', value: 38000 }],
  reverse: ['+500', '÷4', '−12', '÷10'].map((operation) => ({ type: 'reverse', operation })),
  unitary: [
    { type: 'unit', value: 60 },
    { type: 'quantity', value: 12 },
  ],
  fraction: [{ type: 'divide-fraction', value: 4 }],
  compare: [{ type: 'normalize' }, { type: 'compare-choice', value: 'left' }],
  metric: [
    { type: 'convert', value: 5000 },
    { type: 'portion', value: 40 },
  ],
  perimeter: castleBoundary.map((edge) => ({ type: 'fence', edge })),
  symmetry: [0, 45, 90, 135].map((angle) => ({ type: 'fold', angle })),
  pictograph: [1, 2, 3, 4, 5]
    .map((value) => ({ type: 'icons', value }) as GameAction)
    .concat({ type: 'share', numerator: 1, denominator: 4 }),
  matrix: [
    { type: 'operator', slot: 'first', value: '×' },
    { type: 'operator', slot: 'second', value: '+' },
    { type: 'unknown', value: 3 },
  ],
  compass: [
    { type: 'turn', value: -1 },
    { type: 'turn', value: 2 },
  ],
};
const act = (state: ReturnType<typeof createSession>, action: GameAction) =>
  sessionReducer(state, { type: 'act', action });

describe('13 關可解性、步數及復原', () => {
  it('概念與關卡 ID 各自唯一，三階提示完整', () => {
    expect(levels).toHaveLength(13);
    expect(new Set(levels.map((l) => l.id)).size).toBe(13);
    expect(new Set(levels.map((l) => l.concept)).size).toBe(13);
    for (const level of levels) {
      expect(level.hints).toHaveLength(3);
      expect(level.playgroundHints).toHaveLength(3);
      expect(level.playgroundHints).not.toEqual(level.hints);
      expect(level.validate(level.initialBoard).solved).toBe(false);
    }
  });
  for (const level of levels) {
    it(`${level.title}：預算內完成、成功後拒絕連點、Undo 完整回復`, () => {
      let state = createSession(level.id);
      const states = [state];
      for (const action of witnesses[level.concept]) {
        state = act(state, action);
        states.push(state);
      }
      expect(state.status).toBe('won');
      expect(state.moves).toBeLessThanOrEqual(level.stepLimit);
      expect(act(state, witnesses[level.concept][0])).toBe(state);
      for (let i = states.length - 2; i >= 0; i--) {
        state = sessionReducer(state, { type: 'undo' });
        expect(state.board).toEqual(states[i].board);
        expect(state.moves).toBe(i);
        expect(state.status).toBe('playing');
      }
      expect(state.board).toEqual(level.initialBoard);
    });
    it(`${level.title}：探索達成目標仍可操作、重設與切換模式清除暫態`, () => {
      let state = createSession(level.id, 'playground');
      for (const action of witnesses[level.concept]) state = act(state, action);
      expect(state.validation.solved).toBe(true);
      expect(state.status).toBe('playing');
      for (let i = 0; i < 5; i++) state = sessionReducer(state, { type: 'hint' });
      expect(state.hintIndex).toBe(3);
      const reset = sessionReducer(state, { type: 'reset' });
      expect(reset.board).toEqual(level.initialBoard);
      expect(reset.hintIndex).toBe(0);
      expect(reset.moves).toBe(0);
      expect(reset.history).toEqual([]);
      const switched = sessionReducer(state, { type: 'mode', mode: 'challenge' });
      expect(switched.board).toEqual(level.initialBoard);
      expect(switched.mode).toBe('challenge');
      expect(switched.moves).toBe(0);
      expect(switched.hintIndex).toBe(0);
    });
  }
  it('用完步數停住；Undo 可救回；提示不扣步數', () => {
    let s = createSession('imo-rounding');
    for (const value of [37000, 39000, 37000]) s = act(s, { type: 'round-choice', value });
    expect(s.status).toBe('exhausted');
    expect(act(s, { type: 'round-choice', value: 38000 })).toBe(s);
    const hinted = sessionReducer(s, { type: 'hint' });
    expect(hinted.moves).toBe(3);
    s = sessionReducer(hinted, { type: 'undo' });
    expect(s.status).toBe('playing');
    expect(act(s, { type: 'round-choice', value: 38000 }).status).toBe('won');
  });
  it('無效輸入、相同值與重複圍欄不扣步數，切關不帶入舊盤面', () => {
    let s = createSession('imo-unitary');
    s = act(s, { type: 'quantity', value: 1 });
    s = act(s, { type: 'unit', value: NaN });
    expect(s.moves).toBe(0);
    let castle = createSession('imo-perimeter');
    castle = act(castle, { type: 'fence', edge: castleBoundary[0] });
    castle = act(castle, { type: 'fence', edge: castleBoundary[0] });
    expect(castle.moves).toBe(1);
    const next = sessionReducer(castle, { type: 'level', id: 'imo-compass' });
    expect(next.board).toEqual(getLevel('imo-compass').initialBoard);
    expect(next.moves).toBe(0);
  });
});

describe('獨立數學規則與邊界', () => {
  it('最大奇數與五位數、卡片唯一性', () => {
    expect(bestPlaceNumber()).toBe(49207);
    for (const slots of [
      [0, 9, 4, 2, 7],
      [4, 9, 7, 0, 2],
      [4, 9, 9, 0, 7],
      [7, 9, 4, 0, 2],
    ])
      expect(validateBoard({ kind: 'place', slots }).solved).toBe(false);
  });
  it('羅馬數字合法全範圍與非法減法', () => {
    expect(parseRoman('CDLXV')).toBe(465);
    expect(parseRoman('CMXLIV')).toBe(944);
    for (let n = 1; n <= 3999; n++) expect(parseRoman(toRoman(n))).toBe(n);
    for (const illegal of ['', 'IL', 'IIV', 'DCVL', 'XXXX', 'VV', 'MMMM', 'IC', 'MCMC', 'XIY'])
      expect(parseRoman(illegal)).toBeNull();
    expect(() => toRoman(0)).toThrow();
    expect(() => toRoman(4000)).toThrow();
  });
  it.each([
    [37499, 1000, 37000],
    [37500, 1000, 38000],
    [37589, 1000, 38000],
    [999, 10, 1000],
    [0, 100, 0],
    [99999, 1000, 100000],
  ])('四捨五入 %i 到 %i 得 %i', (n, p, answer) => expect(roundTo(n, p)).toBe(answer));
  it('逆推不接受只碰巧到原數；原規格 337 對應小數', () => {
    expect(((337 + 500) / 4 - 12) / 10).toBe(19.725);
    expect(validateBoard({ kind: 'reverse', current: 20, operations: ['−500'] }).solved).toBe(
      false,
    );
    expect((20 * 10 + 12) * 4 - 500).toBe(348);
  });
  it('藥水必須先得到正確單瓶量與瓶數，不能只湊總量', () => {
    expect(
      validateBoard({ kind: 'unitary', count: 7, total: 420, wanted: 12, unit: 120, quantity: 6 })
        .solved,
    ).toBe(false);
    expect(
      validateBoard({ kind: 'unitary', count: 7, total: 420, wanted: 12, unit: 60, quantity: 12 })
        .solved,
    ).toBe(true);
  });
  it('分次約分也合法，零分子能約成 0/1；塗色改動不能假通關', () => {
    let s = createSession('imo-fraction');
    s = act(s, { type: 'divide-fraction', value: 2 });
    expect(s.status).toBe('playing');
    expect(act(s, { type: 'divide-fraction', value: 2 }).status).toBe('won');
    const initial = getLevel('imo-fraction').initialBoard;
    expect(transition(initial, { type: 'divide-fraction', value: 3 }, 'challenge')).toBe(initial);
    expect(validateBoard({ kind: 'fraction', slices: [true, false] }).solved).toBe(false);
    expect(
      transition(
        { kind: 'fraction', slices: [false, false, false, false] },
        { type: 'divide-fraction', value: 4 },
        'playground',
      ),
    ).toEqual({ kind: 'fraction', slices: [false] });
    expect(gcd(12, 32)).toBe(4);
    expect(gcd(0, 4)).toBe(4);
  });
  it('通分不改變分量，大小與相等都正確，分母不能為零', () => {
    expect(lcm(8, 7)).toBe(56);
    expect(lcm(6, 8)).toBe(24);
    const b: GameBoard = {
      kind: 'compare',
      a: 1,
      b: 2,
      c: 2,
      d: 4,
      normalized: true,
      choice: 'equal',
    };
    expect(validateBoard(b).solved).toBe(true);
    expect(validateBoard({ ...b, choice: 'left' }).solved).toBe(false);
    expect(transition(b, { type: 'compare-value', field: 'd', value: 0 }, 'playground')).toBe(b);
    expect(validateBoard({ ...b, a: 0, c: 2, choice: 'right' }).solved).toBe(true);
  });
  it('四種度量衡換算與份量必須都正確', () => {
    [
      [5000, 40],
      [3000, 250],
      [2000, 250],
      [60, 15],
    ].forEach(([converted, portion], preset) => {
      expect(validateBoard({ kind: 'metric', preset, converted, portion }).solved).toBe(true);
      expect(
        validateBoard({ kind: 'metric', preset, converted: converted / 10, portion }).solved,
      ).toBe(false);
    });
  });
  it('城堡包含凹邊、不含共用邊；空洞、分離及空盤邊界', () => {
    expect(boundaryEdges(castleCells).sort()).toEqual([...castleBoundary].sort());
    expect(boundaryEdges([0])).toHaveLength(4);
    expect(boundaryEdges([0, 1])).toHaveLength(6);
    expect(boundaryEdges([0, 15])).toHaveLength(8);
    expect(boundaryEdges([])).toEqual([]);
    expect(boundaryEdges([0, 1, 2, 4, 6, 8, 9, 10])).toHaveLength(16);
    expect(
      validateBoard({
        kind: 'perimeter',
        cells: castleCells,
        fences: [...castleBoundary, 'h:1:0'],
        side: 3,
      }).solved,
    ).toBe(false);
    expect(validateBoard({ kind: 'perimeter', cells: [], fences: [], side: 3 }).solved).toBe(false);
  });
  it('實際反射驗證：正方形 4、矩形 2、正三角形 3、不等邊六角形 0、圓無限', () => {
    const angles = Array.from({ length: 180 }, (_, i) => i);
    expect(angles.filter((a) => isSymmetry('square', a))).toEqual([0, 45, 90, 135]);
    expect(angles.filter((a) => isSymmetry('rectangle', a))).toEqual([0, 90]);
    expect(angles.filter((a) => isSymmetry('triangle', a))).toEqual([30, 90, 150]);
    expect(angles.filter((a) => isSymmetry('hexagon', a))).toEqual([]);
    expect(isSymmetry('circle', 12.345)).toBe(true);
    expect(reflect([12, 7], 0)).toEqual([12, -7]);
    const twice = reflect(reflect([7, 12], 37), 37);
    expect(twice[0]).toBeCloseTo(7);
    expect(twice[1]).toBeCloseTo(12);
  });
  it('圖示總量、半圖案與最簡占比', () => {
    const b: GameBoard = { kind: 'pictograph', scale: 7, icons: 5, shareN: 1, shareD: 4 };
    expect(validateBoard(b).solved).toBe(true);
    expect(validateBoard({ ...b, shareN: 49, shareD: 196 }).solved).toBe(false);
    expect(transition(b, { type: 'icons', value: 4.5 }, 'playground')).toMatchObject({
      icons: 4.5,
    });
    expect(transition(b, { type: 'icons', value: 4.5 }, 'challenge')).toBe(b);
    expect((7 + 5 + 7 + 4 + 5) * 7).toBe(196);
  });
  it('限定運算文法的 16 種組合僅 ×,+ 通過兩範例；第三組 x=3', () => {
    const matches: string[] = [],
      ops: ArithmeticOperator[] = ['+', '−', '×', '÷'];
    for (const first of ops)
      for (const second of ops) {
        const b: Extract<GameBoard, { kind: 'matrix' }> = {
          kind: 'matrix',
          first,
          second,
          unknown: null,
          probe: [8, 3, 4],
        };
        if (matrixValue(b, 8, 3, 4) === 20 && matrixValue(b, 9, 5, 5) === 34)
          matches.push(`${first}${second}`);
      }
    expect(matches).toEqual(['×+']);
    const b: Extract<GameBoard, { kind: 'matrix' }> = {
      kind: 'matrix',
      first: '×',
      second: '+',
      unknown: 2,
      probe: [8, 3, 4],
    };
    expect(validateBoard(b).solved).toBe(false);
    expect(validateBoard({ ...b, unknown: 3 }).solved).toBe(true);
    expect(matrixValue({ ...b, first: '÷' }, 8, 3, 0)).toBeNull();
  });
  it('羅盤處理負角度、繞圈與指定的轉向順序', () => {
    expect(wrap(-1, 8)).toBe(7);
    expect(wrap(-17, 8)).toBe(7);
    expect(wrap(25, 8)).toBe(1);
    expect(validateBoard({ kind: 'compass', start: 0, turns: [-1, 2] }).solved).toBe(true);
    for (const turns of [[1], [2, -1], [-1, 2, 8]])
      expect(validateBoard({ kind: 'compass', start: 0, turns }).solved).toBe(false);
  });
  it.each([
    ['rounding', { type: 'round-number', value: 500 }],
    ['unitary', { type: 'unitary-count', value: 5 }],
    ['fraction', { type: 'denominator', value: 8 }],
    ['compare', { type: 'compare-value', field: 'a', value: 4 }],
    ['metric', { type: 'metric-preset', value: 2 }],
    ['perimeter', { type: 'cell', index: 15 }],
    ['symmetry', { type: 'shape', value: 'circle' }],
    ['pictograph', { type: 'scale', value: 4 }],
    ['matrix', { type: 'probe', index: 0, value: 10 }],
    ['compass', { type: 'start-direction', value: 2 }],
  ] as [string, GameAction][])('%s 挑戰參數固定、探索可以修改', (concept, action) => {
    const b = getLevel(`imo-${concept}`).initialBoard;
    expect(transition(b, action, 'challenge')).toBe(b);
    expect(transition(b, action, 'playground')).not.toEqual(b);
  });
});

describe('獨立完成紀錄與儲存失敗', () => {
  it('只讀取已知 ID，不讀取或清空其他遊戲紀錄', () => {
    const data = new Map([
      ['old-record', '保留'],
      [COMPLETED_KEY, '["imo-place","nope",3,"imo-place"]'],
    ]);
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        data.set(k, v);
      },
    };
    expect(readCompleted(storage)).toEqual(['imo-place']);
    expect(writeCompleted(storage, ['imo-roman'])).toBe(true);
    expect(data.get('old-record')).toBe('保留');
  });
  it('壞資料、拒絕讀取與配額已滿都不拋出錯誤', () => {
    expect(readCompleted({ getItem: () => '{' })).toEqual([]);
    expect(readCompleted({ getItem: () => '{"unexpected":true}' })).toEqual([]);
    expect(
      readCompleted({
        getItem: () => {
          throw new Error('Denied');
        },
      }),
    ).toEqual([]);
    expect(
      writeCompleted(
        {
          setItem: () => {
            throw new Error('Quota');
          },
        },
        ['imo-place'],
      ),
    ).toBe(false);
  });
});
