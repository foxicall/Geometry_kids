import { COUNTS, FILLS, ROTATIONS, SHAPES } from '../types/matrix';
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
    rules.push({ attribute: third, direction, step: 1 });
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
  const candidates = new Map<string, GeometryUnit>();
  for (const shape of SHAPES) for (const fill of FILLS) for (const count of COUNTS) for (const rotation of ROTATIONS) {
    const cell = { shape, fill, count, rotation };
    if (visualKey(cell) !== visualKey(answer) && !candidates.has(visualKey(cell))) candidates.set(visualKey(cell), cell);
  }
  const attributes = ['shape', 'fill', 'count', 'rotation'] as const;
  const close = shuffle([...candidates.values()].filter((cell) => attributes.filter((key) => cell[key] !== answer[key]).length === 1), random);
  // 每種受測屬性至少有一個近似干擾項，旋轉題不能僅靠數量或填色排除。
  const wrong: GeometryUnit[] = [];
  for (const rule of rules) {
    const candidate = close.find((cell) => cell[rule.attribute] !== answer[rule.attribute]);
    if (candidate && !wrong.some((cell) => visualKey(cell) === visualKey(candidate))) wrong.push(candidate);
  }
  const distractorCount = difficulty === 'hard' ? 5 : 4;
  for (const candidate of [...close, ...shuffle([...candidates.values()], random)]) {
    if (wrong.length === distractorCount) break;
    if (!wrong.some((cell) => visualKey(cell) === visualKey(candidate))) wrong.push(candidate);
  }
  const options = shuffle([answer, ...wrong], random).map((cell, index) => ({ id: `option-${index + 1}`, cell }));
  return validateQuestion({
    id, size, difficulty, grid, options, rules,
    correctOptionId: options.find((option) => visualKey(option.cell) === visualKey(answer))!.id,
    explanation: describeRules(rules), source: 'local',
  });
}
