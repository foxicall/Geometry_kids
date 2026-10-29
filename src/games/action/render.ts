import type { GameState, Vector2 } from '../../types/actionGame';
import { direction, length, WORLD } from './physics';
import { traceAim } from './engine';
const line = (ctx: CanvasRenderingContext2D, a: Vector2, b: Vector2) => {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
};
const circle = (ctx: CanvasRenderingContext2D, point: Vector2, r: number) => {
  ctx.beginPath();
  ctx.arc(point.x, point.y, r, 0, Math.PI * 2);
};
/** 繪圖只讀取狀態；不在 render 改速度、計分或消耗時間。 */
export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, guide: boolean) {
  ctx.save();
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);
  ctx.fillStyle = '#0c1930';
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  if (state.shake > 0 && !state.reducedEffects)
    ctx.translate(Math.sin(state.elapsed * 130) * 3, Math.cos(state.elapsed * 113) * 2);
  ctx.strokeStyle = '#1d2c44';
  ctx.lineWidth = 1;
  for (let x = 50; x < 800; x += 50) line(ctx, { x, y: 30 }, { x, y: 578 });
  for (let y = 50; y < 600; y += 50) line(ctx, { x: 22, y }, { x: 778, y });
  ctx.fillStyle = '#142d40';
  ctx.fillRect(22, 420, 756, 158);
  ctx.strokeStyle = '#f1c675';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(22, 578);
  ctx.lineTo(22, 30);
  ctx.lineTo(778, 30);
  ctx.lineTo(778, 578);
  ctx.stroke();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = '#b56d87';
  ctx.lineWidth = 2;
  line(ctx, { x: 22, y: 578 }, { x: 778, y: 578 });
  ctx.setLineDash([]);
  ctx.font = '16px system-ui';
  ctx.fillStyle = '#9ab5c6';
  ctx.textAlign = 'center';
  ctx.fillText('移動發射台 · WASD / 方向鍵', 400, 568);
  if (guide && state.phase !== 'finished') {
    const points = traceAim(state.player.position, state.player.angle);
    ctx.setLineDash([6, 9]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#8eb3c166';
    for (let i = 1; i < points.length; i++) line(ctx, points[i - 1], points[i]);
    ctx.setLineDash([]);
    for (const p of points.slice(1)) {
      circle(ctx, p, 10);
      ctx.fillStyle = '#eed095';
      ctx.fill();
      ctx.fillStyle = '#17243b';
      ctx.font = 'bold 12px system-ui';
      ctx.fillText(String(p.bounces), p.x, p.y + 4);
    }
  }
  for (const obstacle of state.obstacles) {
    if (!obstacle.active) continue;
    const p = obstacle.position,
      color = obstacle.requiredBounces === 1 ? '#67e8f9' : '#c4b5fd';
    circle(ctx, p, obstacle.radius + 7);
    ctx.strokeStyle = `${color}44`;
    ctx.lineWidth = 1;
    ctx.stroke();
    circle(ctx, p, obstacle.radius);
    ctx.fillStyle = obstacle.requiredBounces === 1 ? '#123e53' : '#362c57';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'bold 32px system-ui';
    ctx.fillText(String(obstacle.requiredBounces), p.x, p.y + 9);
  }
  for (const ball of state.projectiles) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fde68a66';
    for (let i = 1; i < ball.trail.length; i++) line(ctx, ball.trail[i - 1], ball.trail[i]);
    circle(ctx, ball.position, ball.radius + 4);
    ctx.fillStyle = '#fde68a33';
    ctx.fill();
    circle(ctx, ball.position, ball.radius);
    ctx.fillStyle = '#fff1ac';
    ctx.fill();
    ctx.font = 'bold 13px system-ui';
    ctx.fillText(String(ball.bounces), ball.position.x + 14, ball.position.y - 12);
  }
  if (state.reflection && state.reflection.life > 0) {
    const r = state.reflection,
      p = r.point,
      incomingLength = length(r.incoming),
      outgoingLength = length(r.outgoing);
    ctx.globalAlpha = Math.min(1, r.life * 2);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#f4f3d6';
    ctx.lineWidth = 2;
    line(ctx, p, { x: p.x + r.normal.x * 75, y: p.y + r.normal.y * 75 });
    ctx.setLineDash([]);
    ctx.strokeStyle = '#67e8f9';
    line(ctx, p, {
      x: p.x - (r.incoming.x / incomingLength) * 65,
      y: p.y - (r.incoming.y / incomingLength) * 65,
    });
    ctx.strokeStyle = '#a7f3d0';
    line(ctx, p, {
      x: p.x + (r.outgoing.x / outgoingLength) * 65,
      y: p.y + (r.outgoing.y / outgoingLength) * 65,
    });
    ctx.globalAlpha = 1;
  }
  for (const particle of state.particles) {
    ctx.globalAlpha = particle.life / particle.maxLife;
    ctx.fillStyle = particle.color;
    ctx.save();
    ctx.translate(particle.position.x, particle.position.y);
    ctx.rotate(particle.life * 6);
    ctx.fillRect(-particle.radius, -particle.radius, particle.radius * 2, particle.radius * 2);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  for (const ripple of state.ripples) {
    ctx.globalAlpha = ripple.life / 0.45;
    circle(ctx, ripple.position, 15 + (1 - ripple.life / 0.45) * 55);
    ctx.strokeStyle = ripple.color;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const p = state.player.position,
    d = direction(state.player.angle);
  circle(ctx, p, 24);
  ctx.fillStyle = '#173c48';
  ctx.fill();
  ctx.strokeStyle = '#75e2c8';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = '#9af3da';
  ctx.lineWidth = 12;
  line(ctx, p, { x: p.x + d.x * 36, y: p.y + d.y * 36 });
  circle(ctx, p, 12);
  ctx.fillStyle = '#e2fff5';
  ctx.fill();
  ctx.restore();
}
