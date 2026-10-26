import { describe, expect, it } from 'vitest';
import { createQuestion } from '../src/lib/questions';
import { validateQuestion, visualKey } from '../src/lib/matrix';
import type { Difficulty } from '../src/types/matrix';

function seeded(seed: number) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

describe('原創規則題庫', () => {
  for (const level of ['easy', 'medium', 'hard'] as Difficulty[]) {
    it(`${level} 的 200 題皆具備唯一可見正解與完整矩陣`, () => {
      const random = seeded(6789);
      for (let index = 0; index < 200; index++) {
        const question = createQuestion(level, `${level}-${index}`, random);
        expect(validateQuestion(question)).toEqual(question);
        expect(question.grid.flat().filter((cell) => cell === null)).toHaveLength(1);
        expect(question.options.length).toBeGreaterThanOrEqual(5);
        expect(new Set(question.options.map((option) => visualKey(option.cell))).size).toBe(question.options.length);
      }
    });
  }
  it('拒絕錯誤正解、非法空格、錯誤尺寸與重複選項', () => {
    const question = createQuestion('medium', 'test', seeded(42));
    expect(() => validateQuestion({ ...question, correctOptionId: 'missing' })).toThrow('正確答案');
    expect(() => validateQuestion({ ...question, size: 2 })).toThrow('尺寸');
    const empty = structuredClone(question);
    empty.grid[0][1] = null;
    expect(() => validateQuestion(empty)).toThrow('規則');
    const duplicated = structuredClone(question);
    duplicated.options[1].cell = { ...duplicated.options[0].cell };
    expect(() => validateQuestion(duplicated)).toThrow('視覺');
  });
  it('將旋轉後相同的圓形與正方形視為同一答案', () => {
    for (const shape of ['circle', 'square'] as const) {
      for (const fill of ['solid', 'empty', 'striped'] as const) {
        expect(visualKey({ shape, fill, count: 2, rotation: 0 })).toBe(visualKey({ shape, fill, count: 2, rotation: 90 }));
      }
    }
    expect(visualKey({ shape: 'triangle', fill: 'solid', count: 1, rotation: 0 })).not.toBe(visualKey({ shape: 'triangle', fill: 'solid', count: 1, rotation: 90 }));
  });
  it('拒絕未產生變化的規則與不符合規律的已知畫格', () => {
    const question = createQuestion('easy', 'test', seeded(123));
    expect(() => validateQuestion({ ...question, rules: [{ attribute: 'count', direction: 'row', step: 3 }] })).toThrow('變化');
    const invalid = structuredClone(question);
    const cell = invalid.grid[0][1]!;
    cell.count = cell.count === 1 ? 2 : 1;
    expect(() => validateQuestion(invalid)).toThrow('規則');
  });
});
