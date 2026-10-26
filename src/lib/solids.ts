import type { CountField, Point3D, PolygonSides, SolidAnswer, SolidMesh, SolidQuestion, SolidSpec } from '../types/solid';

export const COUNT_FIELDS: CountField[] = ['vertices', 'edges', 'faces'];
export const COUNT_LABELS = { vertices: '頂點', edges: '邊', faces: '面' };
const numbers = { 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八' };
export function solidName(solid: SolidSpec): string { return `${numbers[solid.sides]}角${solid.kind === 'prism' ? '柱' : '錐'}`; }

/** 由底面頂點直接建構封閉凸多面體；面、邊、頂點與畫面使用同一份資料。 */
export function buildSolid(spec: SolidSpec): SolidMesh {
  const { kind, sides: n } = spec;
  if (!Number.isInteger(n) || n < 3 || n > 8 || !['prism', 'pyramid'].includes(kind)) throw new Error('不支援的立體');
  const radius = 105;
  const halfHeight = kind === 'prism' ? 83 : 105;
  const vertices: Point3D[] = Array.from({ length: n }, (_, index) => {
    const angle = index * Math.PI * 2 / n + Math.PI / 4;
    return { x: radius * Math.cos(angle), y: -halfHeight, z: radius * Math.sin(angle) };
  });
  const base = Array.from({ length: n }, (_, index) => index);
  const faces: number[][] = [[...base]];
  if (kind === 'prism') {
    vertices.push(...vertices.map((vertex) => ({ ...vertex, y: halfHeight })));
    faces.push(base.map((index) => index + n).reverse());
    for (let index = 0; index < n; index++) faces.push([index, index + n, (index + 1) % n + n, (index + 1) % n]);
  } else {
    vertices.push({ x: 0, y: halfHeight, z: 0 });
    for (let index = 0; index < n; index++) faces.push([index, n, (index + 1) % n]);
  }
  const edgeMap = new Map<string, [number, number]>();
  for (const face of faces) for (let index = 0; index < face.length; index++) {
    const first = face[index];
    const second = face[(index + 1) % face.length];
    const edge: [number, number] = first < second ? [first, second] : [second, first];
    edgeMap.set(edge.join(':'), edge);
  }
  return { vertices, edges: [...edgeMap.values()], faces };
}

export function solidCounts(spec: SolidSpec): SolidAnswer {
  const mesh = buildSolid(spec);
  return { vertices: mesh.vertices.length, edges: mesh.edges.length, faces: mesh.faces.length };
}

/** 使用正投影保留平行關係；畫面旋轉不改變任何幾何答案。 */
export function rotatePoint(point: Point3D, yaw: number, pitch: number): Point3D {
  const x = point.x * Math.cos(yaw) + point.z * Math.sin(yaw);
  const depth = -point.x * Math.sin(yaw) + point.z * Math.cos(yaw);
  return { x, y: point.y * Math.cos(pitch) - depth * Math.sin(pitch), z: point.y * Math.sin(pitch) + depth * Math.cos(pitch) };
}

export function makeSolidRound(random = Math.random): SolidQuestion[] {
  const questions: SolidQuestion[] = [];
  for (const kind of ['prism', 'pyramid'] as const) for (let sides = 3; sides <= 8; sides++) {
    questions.push({ id: `${kind}-${sides}`, kind, sides: sides as PolygonSides });
  }
  for (let index = questions.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [questions[index], questions[other]] = [questions[other], questions[index]];
  }
  return questions.slice(0, 10);
}

export function solidExplanation(spec: SolidSpec): string {
  const n = spec.sides;
  return spec.kind === 'prism'
    ? `上下兩個底面各有 ${n} 個頂點與 ${n} 條邊，再加上 ${n} 條連接邊；面有 2 個底面與 ${n} 個側面。V＝2×${n}，E＝3×${n}，F＝${n}＋2。`
    : `底面有 ${n} 個頂點，再加上 1 個尖頂；底面 ${n} 條邊與通往尖頂的 ${n} 條邊；面有 1 個底面與 ${n} 個三角形側面。V＝${n}＋1，E＝2×${n}，F＝${n}＋1。`;
}
