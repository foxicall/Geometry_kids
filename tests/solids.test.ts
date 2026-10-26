import { describe, expect, it } from 'vitest';
import { buildSolid, makeSolidRound, rotatePoint, solidCounts } from '../src/lib/solids';
import { initialSolidGame, parseSolidInputs, saveSolidRecord, solidGameReducer, solidRecords } from '../src/lib/solidGame';
import type { SolidGameState } from '../src/lib/solidGame';
import type { PolygonSides, SolidSpec } from '../src/types/solid';

const specs: SolidSpec[] = (['prism', 'pyramid'] as const).flatMap((kind) => [3, 4, 5, 6, 7, 8].map((sides) => ({ kind, sides: sides as PolygonSides })));
describe('原創封閉立體模型', () => {
  it.each(specs)('$sides 邊 $kind 的數量、面方向、封閉性與投影', (spec) => {
    const { sides: n, kind } = spec;
    const expected = kind === 'prism' ? { vertices: 2 * n, edges: 3 * n, faces: n + 2 } : { vertices: n + 1, edges: 2 * n, faces: n + 1 };
    expect(solidCounts(spec)).toEqual(expected);
    expect(expected.vertices + expected.faces - expected.edges).toBe(2);
    const mesh = buildSolid(spec);
    expect(new Set(mesh.vertices.map((p) => JSON.stringify(p))).size).toBe(expected.vertices);
    const incidence = new Map<string, number>();
    for (const face of mesh.faces) {
      const [a, b, c] = face.map((i) => mesh.vertices[i]);
      const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
      const ac = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
      const normal = { x: ab.y * ac.z - ab.z * ac.y, y: ab.z * ac.x - ab.x * ac.z, z: ab.x * ac.y - ab.y * ac.x };
      // 原點在內部；外向法線讓隱藏邊的判定有一致方向。
      expect(normal.x * a.x + normal.y * a.y + normal.z * a.z).toBeGreaterThan(0);
      for (const i of face) {
        const p = mesh.vertices[i];
        expect(normal.x * (p.x - a.x) + normal.y * (p.y - a.y) + normal.z * (p.z - a.z)).toBeCloseTo(0, 5);
      }
      for (let i = 0; i < face.length; i++) {
        const edge = [face[i], face[(i + 1) % face.length]].sort((x, y) => x - y).join(':');
        incidence.set(edge, (incidence.get(edge) || 0) + 1);
      }
    }
    expect([...incidence.values()].every((count) => count === 2)).toBe(true);
    expect(mesh.edges.map((edge) => edge.join(':')).sort()).toEqual([...incidence.keys()].sort());
    for (const yaw of [0, 0.3, Math.PI / 2, Math.PI, 5.3]) for (const pitch of [-1.2, -0.3, 0, 1.2]) {
      for (const p of mesh.vertices) {
        const rotated = rotatePoint(p, yaw, pitch);
        expect(Math.hypot(rotated.x, rotated.y, rotated.z)).toBeCloseTo(Math.hypot(p.x, p.y, p.z), 8);
        expect(Number.isFinite(rotated.x + rotated.y + rotated.z)).toBe(true);
      }
    }
  });
  it('每輪十題不重複，包含角柱與角錐', () => {
    for (let index = 0; index < 30; index++) {
      const round = makeSolidRound();
      expect(round).toHaveLength(10);
      expect(new Set(round.map((q) => `${q.kind}-${q.sides}`)).size).toBe(10);
      expect(new Set(round.map((q) => q.kind)).size).toBe(2);
    }
  });
});

function start(now = 1000): SolidGameState { return solidGameReducer(initialSolidGame, { type: 'start', now, sessionId: 'test', nickname: '小星', questions: makeSolidRound(() => 0.5) }); }
function fill(state: SolidGameState, values: number[]): SolidGameState {
  for (const [index, field] of (['vertices', 'edges', 'faces'] as const).entries()) state = solidGameReducer(state, { type: 'input', field, value: String(values[index]) });
  return state;
}
describe('立體挑戰作答與紀錄', () => {
  it.each(['', '-1', '1.5', '1e1', 'NaN', '100', ' 8'])('拒絕無效數值 %s，不提前計分', (value) => {
    expect(parseSolidInputs({ vertices: value, edges: '9', faces: '5' })).toBeNull();
    let state = fill(start(), [6, 9, 5]);
    state = solidGameReducer(state, { type: 'input', field: 'vertices', value });
    state = solidGameReducer(state, { type: 'submit', now: 5000 });
    expect(state.phase).toBe('playing'); expect(state.attempts).toHaveLength(0); expect(state.score).toBe(0); expect(state.error).not.toBe('');
  });
  it('每項 +10 / −5、總分不為負、鎖定提交與換關', () => {
    let state = solidGameReducer(fill(start(), [0, 0, 0]), { type: 'submit', now: 6000 });
    expect(state.score).toBe(0); expect(state.attempts[0].points).toBe(-15); expect(state.elapsedMs).toBe(5000);
    expect(solidGameReducer(state, { type: 'submit', now: 8000 })).toBe(state);
    expect(solidGameReducer(state, { type: 'input', field: 'vertices', value: '99' })).toBe(state);
    state = solidGameReducer(state, { type: 'next', now: 10000 });
    expect(solidGameReducer(state, { type: 'next', now: 11000 })).toBe(state);
    const correct = solidCounts(state.questions[state.index]);
    state = solidGameReducer(fill(state, [correct.vertices, correct.edges, 0]), { type: 'submit', now: 12000 });
    expect(state.score).toBe(15); expect(state.elapsedMs).toBe(7000);
  });
  it('完成十關為 300 分，閱讀解說不計時，重啟歸零', () => {
    let state = start();
    for (let index = 0; index < 10; index++) {
      const { vertices, edges, faces } = solidCounts(state.questions[index]);
      state = solidGameReducer(fill(state, [vertices, edges, faces]), { type: 'submit', now: state.startedAt + 2000 });
      state = solidGameReducer(state, { type: 'next', now: state.startedAt + 15000 });
    }
    expect(state.phase).toBe('complete'); expect(state.score).toBe(300); expect(state.elapsedMs).toBe(20000);
    expect(solidGameReducer(state, { type: 'submit', now: 999999 })).toBe(state);
    expect(solidGameReducer(state, { type: 'reset' })).toEqual(initialSolidGame);
    expect(start(70000)).toMatchObject({ score: 0, elapsedMs: 0, inputs: { vertices: '', edges: '', faces: '' } });
  });
  it('無 localStorage 的環境仍可讀取與結算', () => {
    expect(solidRecords()).toEqual([]);
    expect(() => saveSolidRecord({ ...start(), phase: 'complete' })).not.toThrow();
  });
});
