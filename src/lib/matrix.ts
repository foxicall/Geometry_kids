import { z } from 'zod';
import { COUNTS, FILLS, ROTATIONS, SHAPES } from '../types/matrix';
import type { GeometryUnit, MatrixQuestion, MatrixRule } from '../types/matrix';

export const cellSchema = z.object({
  shape: z.enum(SHAPES),
  rotation: z.union(ROTATIONS.map((value) => z.literal(value))),
  fill: z.enum(FILLS),
  count: z.union(COUNTS.map((value) => z.literal(value))),
}).strict();

/** 結構 schema 供本地驗證及 Gemini structured output 共用。 */
export const questionSchema = z.object({
  id: z.string().min(1).max(100),
  size: z.union([z.literal(2), z.literal(3)]),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  grid: z.array(z.array(cellSchema.nullable()).min(2).max(3)).min(2).max(3),
  options: z.array(z.object({ id: z.string().min(1).max(40), cell: cellSchema }).strict()).min(5).max(7),
  correctOptionId: z.string().min(1).max(40),
  rules: z.array(z.object({
    attribute: z.enum(['shape', 'rotation', 'fill', 'count']),
    direction: z.enum(['row', 'column']),
    step: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  }).strict()).min(1).max(3),
  explanation: z.string().trim().min(1).max(600),
  source: z.enum(['local', 'gemini']),
}).strict();

const cycles = { shape: SHAPES, rotation: ROTATIONS, fill: FILLS, count: COUNTS };

/** 圓形與正方形旋轉 90 度不產生可辨識的新答案，填充方向固定於畫格。 */
export function visualKey(cell: GeometryUnit): string {
  const rotation = cell.shape === 'circle' || cell.shape === 'square' ? 0 : cell.rotation;
  return `${cell.shape}:${rotation}:${cell.fill}:${cell.count}`;
}

export function expectedCell(anchor: GeometryUnit, row: number, column: number, rules: MatrixRule[]): GeometryUnit {
  const result = { ...anchor };
  for (const rule of rules) {
    const values = cycles[rule.attribute] as readonly (string | number)[];
    const offset = rule.direction === 'row' ? column : row;
    const index = values.indexOf(result[rule.attribute]);
    Object.assign(result, { [rule.attribute]: values[(index + rule.step * offset) % values.length] });
  }
  return result;
}

/** 語意驗證不相信模型自稱的正解；逐格重新推導並排除視覺重複選項。 */
export function validateQuestion(input: unknown): MatrixQuestion {
  const question = questionSchema.parse(input) as MatrixQuestion;
  const { size, grid, options, rules } = question;
  if (grid.length !== size || grid.some((row) => row.length !== size)) throw new Error('矩陣尺寸不一致');
  const anchor = grid[0][0];
  if (!anchor) throw new Error('左上角不可為空');
  const ruleKeys = rules.map((rule) => `${rule.attribute}:${rule.direction}`);
  if (new Set(ruleKeys).size !== rules.length) throw new Error('規則不可重複');
  if (rules.some((rule) => rule.step % cycles[rule.attribute].length === 0)) throw new Error('規則必須產生變化');
  const usesRotation = rules.some((rule) => rule.attribute === 'rotation');
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const expected = expectedCell(anchor, row, column, rules);
      if (usesRotation && (expected.shape === 'circle' || expected.shape === 'square')) throw new Error('旋轉規則需使用可辨識方向的圖形');
      const actual = grid[row][column];
      if (row === size - 1 && column === size - 1) {
        if (actual !== null) throw new Error('右下角必須為空');
      } else if (!actual || visualKey(actual) !== visualKey(expected)) {
        throw new Error('矩陣內容不符合宣告規則');
      }
    }
  }
  if (new Set(options.map((option) => option.id)).size !== options.length) throw new Error('選項編號重複');
  if (new Set(options.map((option) => visualKey(option.cell))).size !== options.length) throw new Error('選項的視覺內容重複');
  const expected = expectedCell(anchor, size - 1, size - 1, rules);
  const matches = options.filter((option) => visualKey(option.cell) === visualKey(expected));
  if (matches.length !== 1 || matches[0].id !== question.correctOptionId) throw new Error('正確答案不符合規則');
  return question;
}

export const attributeLabels: Record<keyof GeometryUnit, string> = {
  shape: '圖形變化', rotation: '方向旋轉', fill: '填色規律', count: '數量變化',
};

export function describeRules(rules: MatrixRule[]): string {
  return rules.map((rule) => {
    const direction = rule.direction === 'row' ? '由左往右' : '由上往下';
    const details = {
      shape: `依「圓形 → 正方形 → 三角形 → 星形」每次往後 ${rule.step} 格`,
      rotation: `每次順時針轉 ${rule.step * 90} 度`,
      fill: `依「實心 → 空心 → 斜線」每次往後 ${rule.step} 格`,
      count: `依「1 → 2 → 3」每次往後 ${rule.step} 格`,
    };
    return `${direction}看，${details[rule.attribute]}，到最後就從頭開始。`;
  }).join('');
}
