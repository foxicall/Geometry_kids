import type {
  ActionEvent,
  AimPoint,
  Controls,
  GameState,
  Projectile,
  Vector2,
} from '../../types/actionGame';
import {
  clamp,
  direction,
  dot,
  firstWall,
  length,
  reflectVelocity,
  sweepCircle,
  WORLD,
} from './physics';
export const STEP = 1 / 60;
export const ROUND_SECONDS = 60;
export const SPEED = 650;
export const MAX_PARTICLES = 120;
export const emptyControls = (): Controls => ({
  left: false,
  right: false,
  up: false,
  down: false,
});
export const multiplier = (combo: number) =>
  Math.min(5, 1 + Math.floor(Math.max(0, combo - 1) / 3));
export function createActionGame(reducedEffects = false): GameState {
  return {
    phase: 'ready',
    player: {
      position: { x: 400, y: 520 },
      velocity: { x: 0, y: 0 },
      radius: 17,
      acceleration: 1800,
      friction: 8,
      angle: 144,
      cooldown: 0,
    },
    projectiles: [],
    obstacles: [
      { x: 180, y: 150, count: 1 },
      { x: 400, y: 210, count: 1 },
      { x: 620, y: 150, count: 1 },
      { x: 285, y: 82, count: 2 },
      { x: 515, y: 82, count: 2 },
    ].map((p, i) => ({
      id: i,
      position: { x: p.x, y: p.y },
      home: { x: p.x, y: p.y },
      velocity: { x: i % 2 ? 13 : -13, y: 0 },
      radius: 30,
      requiredBounces: p.count as 1 | 2,
      active: true,
      respawnIn: 0,
    })),
    particles: [],
    ripples: [],
    reflection: null,
    score: 0,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    shots: 0,
    remaining: ROUND_SECONDS,
    elapsed: 0,
    accumulator: 0,
    slowMotion: 0,
    shake: 0,
    nextId: 1,
    message: '先撞金色鏡面，再碰目標；目標上的數字是需要的反射次數。',
    reducedEffects,
  };
}
export function startActionGame(state: GameState) {
  if (state.phase === 'paused') state.message = '繼續挑戰！先碰鏡面，再找反射次數相同的目標。';
  if (state.phase === 'ready' || state.phase === 'paused') state.phase = 'running';
}
export function pauseActionGame(state: GameState) {
  if (state.phase !== 'running') return;
  state.phase = 'paused';
  state.accumulator = 0;
  state.player.velocity = { x: 0, y: 0 };
  state.message = '已暫停，時間與小球都停住了。';
}
export function fire(state: GameState): boolean {
  if (state.phase !== 'running' || state.player.cooldown > 0 || state.projectiles.length >= 3)
    return false;
  const d = direction(state.player.angle);
  state.projectiles.push({
    id: state.nextId++,
    position: { ...state.player.position },
    velocity: { x: d.x * SPEED, y: d.y * SPEED },
    radius: 7,
    bounces: 0,
    age: 0,
    trail: [],
  });
  state.player.cooldown = 0.22;
  state.shots++;
  return true;
}
function particles(state: GameState, p: Vector2, color: string) {
  if (state.reducedEffects) return;
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2,
      speed = 70 + (i % 4) * 35;
    state.particles.push({
      id: state.nextId++,
      position: { ...p },
      velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      radius: 2 + (i % 3),
      life: 0.7,
      maxLife: 0.7,
      color,
      gravity: 220,
    });
  }
  state.particles = state.particles.slice(-MAX_PARTICLES);
}
function miss(state: GameState, point: Vector2, reason: string, events: ActionEvent[]) {
  state.misses++;
  state.combo = 0;
  state.message = reason;
  // 慢動作只影響物理，實際倒數仍由 advanceFrame 的牆鐘時間更新。
  state.slowMotion = state.reducedEffects ? 0 : 0.32;
  state.ripples.push({ position: { ...point }, life: 0.45, color: '#fb7185' });
  state.ripples = state.ripples.slice(-5);
  events.push({ type: 'miss' });
}
/** 回傳 false 表示已消耗。每幀處理多次最早碰撞，碰角時兩條法線分別反射。 */
function updateProjectile(
  state: GameState,
  ball: Projectile,
  dt: number,
  events: ActionEvent[],
): boolean {
  ball.age += dt;
  ball.trail.push({ ...ball.position });
  ball.trail = ball.trail.slice(-12);
  let remaining = dt;
  for (let iteration = 0; iteration < 8 && remaining > 1e-8; iteration++) {
    const delta = { x: ball.velocity.x * remaining, y: ball.velocity.y * remaining };
    const wall = firstWall(ball.position, delta, ball.radius);
    let fraction = wall?.fraction ?? 1,
      target: GameState['obstacles'][number] | undefined;
    for (const obstacle of state.obstacles) {
      if (!obstacle.active) continue;
      // 相對位移會把移動目標也納入掃掠碰撞。
      const relative = {
        x: delta.x - obstacle.velocity.x * remaining,
        y: delta.y - obstacle.velocity.y * remaining,
      };
      const center = {
        x: obstacle.position.x + obstacle.velocity.x * (dt - remaining),
        y: obstacle.position.y + obstacle.velocity.y * (dt - remaining),
      };
      const contact = sweepCircle(ball.position, relative, center, ball.radius + obstacle.radius);
      if (contact !== null && (contact < fraction || (!wall && contact === fraction))) {
        fraction = contact;
        target = obstacle;
      }
    }
    ball.position.x += delta.x * fraction;
    ball.position.y += delta.y * fraction;
    if (target) {
      if (ball.bounces === target.requiredBounces) {
        target.active = false;
        target.respawnIn = 1.2;
        state.combo++;
        state.maxCombo = Math.max(state.maxCombo, state.combo);
        state.hits++;
        const score = 100 * multiplier(state.combo);
        state.score += score;
        state.message = `反射 ${ball.bounces} 次，命中！連擊 ${state.combo}，這球 +${score} 分。`;
        particles(state, ball.position, target.requiredBounces === 1 ? '#67e8f9' : '#c4b5fd');
        state.shake = state.reducedEffects ? 0 : 0.18;
        events.push({ type: 'hit', score });
      } else
        miss(
          state,
          ball.position,
          `這球反射 ${ball.bounces} 次，目標需要 ${target.requiredBounces} 次。換個角度再試！`,
          events,
        );
      return false;
    }
    if (!wall) break;
    if (wall.bottom) {
      miss(state, ball.position, '小球落到底部了。試著讓反射路線通過目標。', events);
      return false;
    }
    const incoming = { ...ball.velocity },
      outgoing = reflectVelocity(incoming, wall.normal);
    ball.velocity = outgoing;
    ball.bounces++;
    const angle =
      (Math.acos(clamp(Math.abs(dot(incoming, wall.normal)) / length(incoming), 0, 1)) * 180) /
      Math.PI;
    state.reflection = {
      point: { ...ball.position },
      normal: wall.normal,
      incoming,
      outgoing,
      angle,
      life: 1.5,
    };
    events.push({ type: 'bounce' });
    // 輕推離表面，避免浮點誤差造成同一面連續碰撞。
    ball.position.x += wall.normal.x * 1e-6;
    ball.position.y += wall.normal.y * 1e-6;
    remaining *= 1 - fraction;
    if (ball.bounces > 6) {
      miss(state, ball.position, '反射太多次了。可參考虛線瞄準，再試一球。', events);
      return false;
    }
  }
  if (ball.age > 6) {
    miss(state, ball.position, '這球沒有碰到目標，再換個角度。', events);
    return false;
  }
  return true;
}
export function updatePhysics(
  state: GameState,
  dt: number,
  controls: Controls,
  events: ActionEvent[],
) {
  const p = state.player,
    ax = Number(controls.right) - Number(controls.left),
    ay = Number(controls.down) - Number(controls.up);
  p.velocity.x += ax * p.acceleration * dt;
  p.velocity.y += ay * p.acceleration * dt;
  const drag = Math.exp(-p.friction * dt);
  p.velocity.x *= drag;
  p.velocity.y *= drag;
  p.position.x += p.velocity.x * dt;
  p.position.y += p.velocity.y * dt;
  for (const [axis, low, high] of [
    ['x', 45, 755],
    ['y', 435, 545],
  ] as const) {
    if (p.position[axis] < low || p.position[axis] > high) {
      p.position[axis] = clamp(p.position[axis], low, high);
      p.velocity[axis] *= -0.3;
    }
  }
  p.cooldown = Math.max(0, p.cooldown - dt);
  state.projectiles = state.projectiles.filter((ball) => updateProjectile(state, ball, dt, events));
  for (const obstacle of state.obstacles) {
    if (!obstacle.active) {
      obstacle.respawnIn -= dt;
      if (obstacle.respawnIn <= 0) obstacle.active = true;
    }
    obstacle.position.x += obstacle.velocity.x * dt;
    if (Math.abs(obstacle.position.x - obstacle.home.x) >= 32) {
      obstacle.position.x = clamp(obstacle.position.x, obstacle.home.x - 32, obstacle.home.x + 32);
      obstacle.velocity.x *= -1;
    }
  }
  for (const particle of state.particles) {
    particle.velocity.y += particle.gravity * dt;
    particle.velocity.x *= Math.exp(-1.4 * dt);
    particle.velocity.y *= Math.exp(-0.3 * dt);
    particle.position.x += particle.velocity.x * dt;
    particle.position.y += particle.velocity.y * dt;
    if (particle.position.y > WORLD.bottom - particle.radius) {
      particle.position.y = WORLD.bottom - particle.radius;
      particle.velocity.y *= -0.55;
    }
    particle.life -= dt;
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);
}
/** 固定 60Hz update 與繪圖分離；卡頓最多補 6 次物理，倒數仍扣實際前景時間。 */
export function advanceFrame(state: GameState, seconds: number, controls: Controls): ActionEvent[] {
  if (state.phase !== 'running' || !Number.isFinite(seconds) || seconds <= 0) return [];
  const events: ActionEvent[] = [],
    real = Math.min(seconds, state.remaining);
  state.remaining = Math.max(0, state.remaining - real);
  state.elapsed += real;
  state.shake = Math.max(0, state.shake - real);
  state.slowMotion = Math.max(0, state.slowMotion - real);
  state.ripples.forEach((r) => (r.life -= real));
  state.ripples = state.ripples.filter((r) => r.life > 0);
  if (state.reflection) {
    state.reflection.life -= real;
    if (state.reflection.life <= 0) state.reflection = null;
  }
  const scale = state.slowMotion > 0 ? 0.35 : 1;
  state.accumulator += Math.min(real, 0.1) * scale;
  let steps = 0;
  while (state.accumulator + 1e-9 >= STEP && steps < 6) {
    updatePhysics(state, STEP, controls, events);
    state.accumulator = Math.max(0, state.accumulator - STEP);
    steps++;
  }
  if (state.remaining <= 1e-8) {
    state.remaining = 0;
    state.phase = 'finished';
    state.projectiles = [];
    state.player.velocity = { x: 0, y: 0 };
    state.message = `時間到！命中 ${state.hits} 次，最高連擊 ${state.maxCombo}。`;
    events.push({ type: 'finish' });
  }
  return events;
}
/** 瞄準線只預測鏡面反射；移動目標仍需玩家判斷，不改變物理或目標答案。 */
export function traceAim(position: Vector2, angle: number, bounces = 2): AimPoint[] {
  const points: AimPoint[] = [{ ...position, bounces: 0 }];
  let p = { ...position },
    v = direction(angle);
  for (let i = 0; i <= bounces; i++) {
    const delta = { x: v.x * 3000, y: v.y * 3000 },
      wall = firstWall(p, delta, 7);
    if (!wall) break;
    p = { x: p.x + delta.x * wall.fraction, y: p.y + delta.y * wall.fraction };
    points.push({ ...p, bounces: i + (wall.bottom ? 0 : 1) });
    if (wall.bottom) break;
    v = reflectVelocity(v, wall.normal);
    p = { x: p.x + wall.normal.x * 1e-6, y: p.y + wall.normal.y * 1e-6 };
  }
  return points;
}
export const ACTION_BEST_KEY = 'geometry-kids:action-best:v1';
export function readBest(storage: Pick<Storage, 'getItem'>): number {
  try {
    const n = Number(storage.getItem(ACTION_BEST_KEY));
    return Number.isSafeInteger(n) && n >= 0 && n <= 10000000 ? n : 0;
  } catch {
    return 0;
  }
}
export function saveBest(storage: Pick<Storage, 'setItem'>, best: number): boolean {
  if (!Number.isSafeInteger(best) || best < 0 || best > 10000000) return false;
  try {
    storage.setItem(ACTION_BEST_KEY, String(best));
    return true;
  } catch {
    return false;
  }
}
