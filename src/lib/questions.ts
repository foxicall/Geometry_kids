import { COUNTS, FILLS, SHAPES } from '../types/matrix';
import type { Difficulty, GeometryUnit, MatrixQuestion, MatrixRule } from '../types/matrix';
import { describeRules, expectedCell, validateQuestion, visualKey } from './matrix';

type Random = () => number;
const choose = <T,>(items: readonly T[], random: Random): T => items[Math.floor(random() * items.length)];

function shuffle<T>(items: T[], random: Random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function createQuestion(difficulty: Difficulty, id: string, random: Random = Math.random): MatrixQuestion {
  const direction = choose(['row', 'column'] as const, random);
  const attribute = choose(['shape', 'fill', 'count', 'rotation'] as const, random);
  const rules: MatrixRule[] = [{ attribute, direction, step: 1 }];
  if (difficulty !== 'easy') {
    rules.push({
      attribute: attribute === 'count' ? 'fill' : 'count',
      direction: direction === 'row' ? 'column' : 'row',
      step: 1,
    });
  }
  if (difficulty === 'hard') {
    const third = rules.some((rule) => rule.attribute === 'fill') ? 'shape' : 'fill';
    // 旋轉題固定使用有方向的圖形，避免圓形與正方形的旋轉歧義。
    rules.push({ attribute: third === 'shape' && attribute === 'rotation' ? 'rotation' : third, direction, step: 1 });
  }
  const anchor: GeometryUnit = {
    shape: attribute === 'rotation' ? choose(['triangle', 'star'] as const, random) : choose(SHAPES, random),
    rotation: 0,
    fill: choose(FILLS, random),
    count: choose(COUNTS, random),
  };
  const size = difficulty === 'easy' ? 2 : 3;
  const grid = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => row === size - 1 && column === size - 1 ? null : expectedCell(anchor, row, column, rules)),
  );
  const answer = expectedCell(anchor, size - 1, size - 1, rules);
  // 從有限集合抽取，沒有隨機重試迴圈，並以實際視覺內容去重。
  const candidates: GeometryUnit[] = [];
  for (const shape of SHAPES) for (const fill of FILLS) for (const count of COUNTS) {
    candidates.push({ shape, fill, count, rotation: answer.rotation });
  }
  const wrong = shuffle(candidates.filter((cell) => visualKey(cell) !== visualKey(answer)), random).slice(0, difficulty === 'hard' ? 5 : 4);
  const options = shuffle([answer, ...wrong], random).map((cell, index) => ({ id: `option-${index + 1}`, cell }));
  return validateQuestion({
    id, size, difficulty, grid, options, rules,
    correctOptionId: options.find((option) => visualKey(option.cell) === visualKey(answer))!.id,
    explanation: describeRules(rules), source: 'local',
  });
}
