import type { ArithmeticOperator, SymmetryShape } from '../types/game';

export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
export const lcm = (a: number, b: number): number => (a / gcd(a, b)) * b;
export const wrap = (n: number, base: number): number => ((n % base) + base) % base;
export const integer = (n: number, min: number, max: number): boolean =>
  Number.isInteger(n) && n >= min && n <= max;
export const displayNumber = (n: number): string =>
  Number.isInteger(n) ? String(n) : Number(n.toFixed(5)).toString();
const romans: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];
export function toRoman(n: number): string {
  if (!integer(n, 1, 3999)) throw new Error('羅馬數字範圍為 1–3999');
  let result = '';
  for (const [value, symbol] of romans)
    while (n >= value) {
      result += symbol;
      n -= value;
    }
  return result;
}
/** 用標準寫法回查，拒絕 IL、DCVL、IIV 等看似可減、實際不合法的排列。 */
export function parseRoman(text: string): number | null {
  if (!text || !/^[IVXLCDM]+$/.test(text) || text.length > 15) return null;
  const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let sum = 0;
  for (let i = 0; i < text.length; i++)
    sum += values[text[i]] * (values[text[i]] < (values[text[i + 1]] ?? 0) ? -1 : 1);
  return integer(sum, 1, 3999) && toRoman(sum) === text ? sum : null;
}
export const roundTo = (n: number, precision: number): number =>
  Math.floor(n / precision + 0.5) * precision;
export function arithmetic(a: number, op: ArithmeticOperator, b: number): number | null {
  if (op === '÷' && b === 0) return null;
  const value = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b;
  return Number.isFinite(value) ? value : null;
}
export const reverseSteps = ['+500', '÷4', '−12', '÷10'];
export const reverseOptions: Record<string, [ArithmeticOperator, number]> = {
  '+500': ['+', 500],
  '−500': ['−', 500],
  '×4': ['×', 4],
  '÷4': ['÷', 4],
  '+12': ['+', 12],
  '−12': ['−', 12],
  '×10': ['×', 10],
  '÷10': ['÷', 10],
};
export const metricPresets = [
  { label: '絲帶', major: 50, unit: '公尺', ratio: 100, small: '公分', people: 125 },
  { label: '麵粉', major: 3, unit: '公斤', ratio: 1000, small: '公克', people: 12 },
  { label: '果汁', major: 2, unit: '公升', ratio: 1000, small: '毫升', people: 8 },
  { label: '閱讀時間', major: 1, unit: '小時', ratio: 60, small: '分鐘', people: 4 },
];
export const castleCells = [0, 1, 2, 4, 8, 12, 13, 14, 15];
export function gridEdges(cells: number[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const cell of new Set(cells)) {
    if (!integer(cell, 0, 15)) throw new Error('網格座標超出範圍');
    const r = Math.floor(cell / 4),
      c = cell % 4;
    for (const edge of [`h:${r}:${c}`, `h:${r + 1}:${c}`, `v:${r}:${c}`, `v:${r}:${c + 1}`])
      counts.set(edge, (counts.get(edge) ?? 0) + 1);
  }
  return counts;
}
export const boundaryEdges = (cells: number[]): string[] =>
  [...gridEdges(cells)].filter(([, count]) => count === 1).map(([edge]) => edge);
export function edgePoints(edge: string): [number, number, number, number] {
  const [axis, row, col] = edge.split(':'),
    r = Number(row),
    c = Number(col);
  return axis === 'h' ? [c, r, c + 1, r] : [c, r, c, r + 1];
}
export const shapePoints: Record<Exclude<SymmetryShape, 'circle'>, [number, number][]> = {
  square: [
    [-80, -80],
    [80, -80],
    [80, 80],
    [-80, 80],
  ],
  rectangle: [
    [-110, -65],
    [110, -65],
    [110, 65],
    [-110, 65],
  ],
  triangle: [
    [0, -100],
    [Math.sqrt(3) * 50, 50],
    [-Math.sqrt(3) * 50, 50],
  ],
  hexagon: [
    [-70, -60],
    [20, -85],
    [100, -20],
    [75, 70],
    [-25, 90],
    [-90, 30],
  ],
};
export function reflect(point: [number, number], angle: number): [number, number] {
  const t = (angle * Math.PI) / 180,
    dx = Math.cos(t),
    dy = -Math.sin(t),
    dot = point[0] * dx + point[1] * dy;
  return [2 * dot * dx - point[0], 2 * dot * dy - point[1]];
}
export function isSymmetry(shape: SymmetryShape, angle: number): boolean {
  if (shape === 'circle') return true;
  const points = shapePoints[shape];
  return points.every((p) => {
    const [x, y] = reflect(p, angle);
    return points.some(([a, b]) => Math.hypot(x - a, y - b) < 0.00001);
  });
}
export const axisCandidates = [0, 15, 30, 45, 90, 135, 150];
export const ports = ['圖書館', '市場', '公園', '博物館', '學校', '碼頭', '運動場', '郵局'];
export function bestPlaceNumber(): number {
  let best = 0;
  function visit(prefix: number[], rest: number[]) {
    if (!rest.length) {
      const n = Number(prefix.join(''));
      if (prefix[0] !== 0 && n < 50000 && n % 2 === 1) best = Math.max(best, n);
      return;
    }
    rest.forEach((digit, i) =>
      visit(
        [...prefix, digit],
        rest.filter((_, j) => j !== i),
      ),
    );
  }
  visit([], [2, 4, 0, 7, 9]);
  return best;
}
