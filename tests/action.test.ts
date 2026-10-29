import { describe, expect, it } from 'vitest';
import type { ActionEvent, GameState, Projectile } from '../src/types/actionGame';
import {
  ACTION_BEST_KEY,
  advanceFrame,
  createActionGame,
  emptyControls,
  fire,
  MAX_PARTICLES,
  multiplier,
  pauseActionGame,
  readBest,
  saveBest,
  startActionGame,
  STEP,
  traceAim,
  updatePhysics,
} from '../src/games/action/engine';
import {
  firstWall,
  length,
  reflectVelocity,
  sweepCircle,
  WORLD,
} from '../src/games/action/physics';
import { renderGame } from '../src/games/action/render';
const ball = (overrides: Partial<Projectile> = {}): Projectile => ({
  id: 100,
  position: { x: 100, y: 150 },
  velocity: { x: 60000, y: 0 },
  radius: 7,
  bounces: 1,
  age: 0,
  trail: [],
  ...overrides,
});
function fixture(): GameState {
  const s = createActionGame();
  startActionGame(s);
  s.obstacles = [
    {
      id: 1,
      position: { x: 400, y: 150 },
      home: { x: 400, y: 150 },
      velocity: { x: 0, y: 0 },
      radius: 25,
      requiredBounces: 1,
      active: true,
      respawnIn: 0,
    },
  ];
  s.projectiles = [ball()];
  return s;
}
const run = (s: GameState, seconds: number) => {
  const events: ActionEvent[] = [];
  for (let i = 0; i < Math.round(seconds / STEP); i++)
    events.push(...advanceFrame(s, STEP, emptyControls()));
  return events;
};

describe('鏡射數學與連續碰撞', () => {
  it('對鏡面法線反射保持速率、入反射角相等，兩次反射還原', () => {
    expect(reflectVelocity({ x: 180, y: -240 }, { x: 0, y: 1 })).toEqual({ x: 180, y: 240 });
    const tilted = reflectVelocity({ x: 3, y: 4 }, { x: 1, y: 1 });
    expect(tilted.x).toBeCloseTo(-4);
    expect(tilted.y).toBeCloseTo(-3);
    for (let angle = 0; angle < 360; angle += 7) {
      const v = { x: Math.cos(angle) * 650, y: Math.sin(angle) * 650 },
        n = { x: 0.6, y: 0.8 },
        reflected = reflectVelocity(v, n),
        twice = reflectVelocity(reflected, n);
      expect(length(reflected)).toBeCloseTo(650);
      expect(twice.x).toBeCloseTo(v.x);
      expect(twice.y).toBeCloseTo(v.y);
      expect(Math.abs(v.x * n.x + v.y * n.y)).toBeCloseTo(
        Math.abs(reflected.x * n.x + reflected.y * n.y),
      );
    }
  });
  it('線段掃掠捕捉高速穿越、切線與初始重疊，拒絕後方與零速分離', () => {
    expect(sweepCircle({ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 50, y: 0 }, 1)).toBeCloseTo(0.049);
    expect(sweepCircle({ x: 0, y: 1 }, { x: 100, y: 0 }, { x: 50, y: 0 }, 1)).toBeCloseTo(0.5);
    expect(sweepCircle({ x: 50, y: 0 }, { x: 0, y: 0 }, { x: 50, y: 0 }, 1)).toBe(0);
    expect(sweepCircle({ x: 0, y: 0 }, { x: -100, y: 0 }, { x: 50, y: 0 }, 1)).toBeNull();
    expect(sweepCircle({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 50, y: 0 }, 1)).toBeNull();
  });
  it('找到最早牆面，底部是出口而非鏡子', () => {
    expect(firstWall({ x: 400, y: 520 }, { x: -1000, y: 0 }, 7)).toMatchObject({
      fraction: 0.371,
      normal: { x: 1, y: 0 },
      bottom: false,
    });
    expect(firstWall({ x: 400, y: 520 }, { x: 0, y: 100 }, 7)).toMatchObject({
      fraction: 0.51,
      bottom: true,
    });
  });
  it('同幀接觸鏡角不黏牆、不穿出邊界，兩面各反射一次', () => {
    const s = createActionGame();
    s.obstacles = [];
    s.projectiles = [
      ball({ position: { x: 35, y: 43 }, velocity: { x: -600, y: -600 }, bounces: 0 }),
    ];
    const events: ActionEvent[] = [];
    updatePhysics(s, STEP, emptyControls(), events);
    expect(s.projectiles[0].bounces).toBe(2);
    expect(s.projectiles[0].velocity).toEqual({ x: 600, y: 600 });
    expect(s.projectiles[0].position.x).toBeGreaterThanOrEqual(WORLD.left + 7);
    expect(s.projectiles[0].position.y).toBeGreaterThanOrEqual(WORLD.top + 7);
    expect(events.filter((e) => e.type === 'bounce')).toHaveLength(2);
  });
  it('高速球先命中目標而不跳過，消耗後不會再次計分', () => {
    const s = fixture(),
      events = advanceFrame(s, STEP, emptyControls());
    expect(events.filter((e) => e.type === 'hit')).toHaveLength(1);
    expect(s.score).toBe(100);
    expect(s.projectiles).toHaveLength(0);
    expect(s.obstacles[0].active).toBe(false);
    run(s, 2);
    expect(s.score).toBe(100);
    expect(s.obstacles[0].active).toBe(true);
  });
  it('移動目標穿越球的位置仍能碰撞', () => {
    const s = fixture();
    s.projectiles = [ball({ position: { x: 400, y: 150 }, velocity: { x: 0, y: 0 } })];
    s.obstacles[0].position.x = 350;
    s.obstacles[0].home.x = 350;
    s.obstacles[0].velocity.x = 6000;
    advanceFrame(s, STEP, emptyControls());
    expect(s.hits).toBe(1);
  });
  it('瞄準線遵守同一反射法則，並且不改變輸入位置', () => {
    const p = { x: 400, y: 520 },
      points = traceAim(p, 144);
    expect(p).toEqual({ x: 400, y: 520 });
    expect(points.length).toBeGreaterThan(2);
    expect(points[1].x).toBeCloseTo(29);
    expect(points[1].bounces).toBe(1);
    const incoming = { x: points[1].x - p.x, y: points[1].y - p.y },
      outgoing = { x: points[2].x - points[1].x, y: points[2].y - points[1].y };
    expect(Math.abs(incoming.y / incoming.x)).toBeCloseTo(Math.abs(outgoing.y / outgoing.x));
  });
});

describe('動作計分、節奏與邊界', () => {
  it('預設角度有可玩的反射命中路線；直接向上射擊則失誤', () => {
    const s = createActionGame(true);
    startActionGame(s);
    fire(s);
    run(s, 2);
    expect(s.hits).toBe(1);
    expect(s.score).toBe(100);
    const direct = createActionGame(true);
    direct.player.angle = 90;
    startActionGame(direct);
    fire(direct);
    run(direct, 2);
    expect(direct.hits).toBe(0);
    expect(direct.misses).toBe(1);
    expect(direct.message).toContain('反射 0 次');
  });
  it('反射次數不足或過多都不能得分，雙球撞同一目標只得一次', () => {
    for (const count of [0, 2, 3]) {
      const s = fixture();
      s.projectiles[0].bounces = count;
      advanceFrame(s, STEP, emptyControls());
      expect(s.score).toBe(0);
      expect(s.misses).toBe(1);
    }
    const s = fixture();
    s.projectiles.push(ball({ id: 101 }));
    advanceFrame(s, STEP, emptyControls());
    expect(s.hits).toBe(1);
    expect(s.score).toBe(100);
  });
  it('連擊分數有上限、失誤重置倍率，粒子總數有界', () => {
    const s = fixture();
    for (let i = 0; i < 7; i++) {
      s.projectiles = [ball({ id: 100 + i })];
      s.obstacles[0].active = true;
      updatePhysics(s, STEP, emptyControls(), []);
    }
    expect(s.combo).toBe(7);
    expect(s.maxCombo).toBe(7);
    expect(s.score).toBe(1200);
    expect(multiplier(100)).toBe(5);
    expect(s.particles.length).toBeLessThanOrEqual(MAX_PARTICLES);
    s.obstacles[0].active = true;
    s.projectiles = [ball({ bounces: 0 })];
    updatePhysics(s, STEP, emptyControls(), []);
    expect(s.combo).toBe(0);
    expect(s.maxCombo).toBe(7);
    expect(s.score).toBe(1200);
    expect(s.slowMotion).toBeGreaterThan(0);
  });
  it('冷卻與同時三球限制阻擋連點；未開始、暫停、結束無法發射', () => {
    const s = createActionGame();
    expect(fire(s)).toBe(false);
    startActionGame(s);
    expect(fire(s)).toBe(true);
    expect(fire(s)).toBe(false);
    s.player.cooldown = 0;
    expect(fire(s)).toBe(true);
    s.player.cooldown = 0;
    expect(fire(s)).toBe(true);
    s.player.cooldown = 0;
    expect(fire(s)).toBe(false);
    expect(s.shots).toBe(3);
    pauseActionGame(s);
    expect(fire(s)).toBe(false);
    s.phase = 'finished';
    expect(fire(s)).toBe(false);
  });
  it('底部出口、超時和過多反射只各記一次失誤', () => {
    const s = createActionGame(true);
    startActionGame(s);
    s.obstacles = [];
    s.projectiles = [
      ball({ position: { x: 400, y: 570 }, velocity: { x: 0, y: 650 } }),
      ball({ id: 101, age: 6.1, velocity: { x: 0, y: 0 } }),
      ball({ id: 102, bounces: 6, position: { x: 30, y: 300 }, velocity: { x: -650, y: 0 } }),
    ];
    advanceFrame(s, STEP, emptyControls());
    expect(s.misses).toBe(3);
    run(s, 2);
    expect(s.misses).toBe(3);
  });
  it('玩家受加速度、摩擦與邊界反彈；粒子有重力及地板反彈', () => {
    const s = createActionGame();
    startActionGame(s);
    const input = { ...emptyControls(), right: true };
    for (let i = 0; i < 180; i++) advanceFrame(s, STEP, input);
    expect(s.player.position.x).toBeLessThanOrEqual(755);
    expect(s.player.position.x).toBeGreaterThan(700);
    const speed = Math.abs(s.player.velocity.x);
    run(s, 1);
    expect(Math.abs(s.player.velocity.x)).toBeLessThan(speed);
    s.particles = [
      {
        id: 1,
        position: { x: 200, y: 576 },
        velocity: { x: 100, y: 100 },
        radius: 2,
        life: 1,
        maxLife: 1,
        color: '#fff',
        gravity: 220,
      },
    ];
    updatePhysics(s, STEP, emptyControls(), []);
    expect(s.particles[0].velocity.y).toBeLessThan(0);
    expect(s.particles[0].velocity.x).toBeLessThan(100);
    expect(s.particles[0].position.y).toBe(576);
  });
  it('30、60、120Hz 繪圖節奏產生相同的固定 60Hz 物理結果', () => {
    const states = [30, 60, 120].map((fps) => {
      const s = createActionGame();
      startActionGame(s);
      for (let i = 0; i < fps; i++) advanceFrame(s, 1 / fps, { ...emptyControls(), right: true });
      return s;
    });
    for (const s of states) {
      expect(s.remaining).toBeCloseTo(59);
      expect(s.player.position.x).toBeCloseTo(states[0].player.position.x);
      expect(s.obstacles[0].position.x).toBeCloseTo(states[0].obstacles[0].position.x);
    }
  });
  it('慢動作與卡頓不延長倒數；大時間跳躍不觸發無限補幀', () => {
    const s = createActionGame();
    startActionGame(s);
    s.slowMotion = 1;
    advanceFrame(s, 0.1, emptyControls());
    expect(s.remaining).toBeCloseTo(59.9);
    advanceFrame(s, 20, { ...emptyControls(), right: true });
    expect(s.remaining).toBeCloseTo(39.9);
    expect(s.player.position.x).toBeLessThan(450);
    const events = advanceFrame(s, 100, emptyControls());
    expect(s.remaining).toBe(0);
    expect(s.phase).toBe('finished');
    expect(events.filter((e) => e.type === 'finish')).toHaveLength(1);
    expect(s.projectiles).toEqual([]);
    expect(advanceFrame(s, 100, emptyControls())).toEqual([]);
  });
  it('暫停保留盤面及時間，重新建立遊戲清空全部暫態', () => {
    const s = fixture();
    pauseActionGame(s);
    const frozen = structuredClone(s);
    advanceFrame(s, 10, emptyControls());
    expect(s).toEqual(frozen);
    startActionGame(s);
    advanceFrame(s, STEP, emptyControls());
    expect(s.hits).toBe(1);
    const fresh = createActionGame();
    expect(fresh.score).toBe(0);
    expect(fresh.remaining).toBe(60);
    expect(fresh.projectiles).toEqual([]);
    expect(fresh.particles).toEqual([]);
    expect(fresh.phase).toBe('ready');
  });
  it('減少特效會保留數學與得分，取消粒子及震動；render 不改變狀態', () => {
    const s = fixture();
    s.reducedEffects = true;
    advanceFrame(s, STEP, emptyControls());
    expect(s.score).toBe(100);
    expect(s.particles).toEqual([]);
    expect(s.shake).toBe(0);
    const before = structuredClone(s),
      ctx = new Proxy({}, { get: () => () => {}, set: () => true }) as CanvasRenderingContext2D;
    renderGame(ctx, s, true);
    expect(s).toEqual(before);
  });
  it('拒絕 NaN、Infinity、負時間，不讓狀態受污染', () => {
    const s = fixture(),
      copy = structuredClone(s);
    for (const dt of [NaN, Infinity, -1, 0])
      expect(advanceFrame(s, dt, emptyControls())).toEqual([]);
    expect(s).toEqual(copy);
  });
});

describe('本機最高分', () => {
  it('只使用新儲存鍵並保留其他紀錄', () => {
    const data = new Map([['geometry-kids:imo-completed:v1', '["imo-place"]']]),
      storage = {
        getItem: (k: string) => data.get(k) ?? null,
        setItem: (k: string, v: string) => {
          data.set(k, v);
        },
      };
    expect(readBest(storage)).toBe(0);
    expect(saveBest(storage, 1200)).toBe(true);
    expect(data.get(ACTION_BEST_KEY)).toBe('1200');
    expect(readBest(storage)).toBe(1200);
    expect(data.get('geometry-kids:imo-completed:v1')).toBe('["imo-place"]');
  });
  it('拒絕讀取、配額不足及壞資料皆安全處理', () => {
    expect(
      readBest({
        getItem: () => {
          throw new Error('Denied');
        },
      }),
    ).toBe(0);
    expect(
      saveBest(
        {
          setItem: () => {
            throw new Error('Quota');
          },
        },
        100,
      ),
    ).toBe(false);
    for (const invalid of ['NaN', 'Infinity', '-1', '{}', '1.5', '999999999999'])
      expect(readBest({ getItem: () => invalid })).toBe(0);
    expect(
      saveBest(
        {
          setItem: () => {
            throw new Error('Should not write');
          },
        },
        -1,
      ),
    ).toBe(false);
  });
});
