import type { Vector2 } from '../../types/actionGame';
export const WORLD = { width: 800, height: 600, left: 22, right: 778, top: 30, bottom: 578 };
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
export const dot = (a: Vector2, b: Vector2) => a.x * b.x + a.y * b.y;
export const length = (v: Vector2) => Math.hypot(v.x, v.y);
export const direction = (angle: number): Vector2 => ({
  x: Math.cos((angle * Math.PI) / 180),
  y: -Math.sin((angle * Math.PI) / 180),
});
/** 對單位法線鏡射：切向速度不變，法向速度反號；保持速率與入射／反射角。 */
export function reflectVelocity(v: Vector2, normal: Vector2): Vector2 {
  const size = length(normal);
  if (!size) return { ...v };
  const n = { x: normal.x / size, y: normal.y / size },
    projection = dot(v, n);
  return { x: v.x - 2 * projection * n.x, y: v.y - 2 * projection * n.y };
}
/** 線段與擴張圓的連續碰撞；返回 0–1 的最早接觸比例，避免高速穿透。 */
export function sweepCircle(
  start: Vector2,
  delta: Vector2,
  center: Vector2,
  radius: number,
): number | null {
  const offset = { x: start.x - center.x, y: start.y - center.y };
  const c = dot(offset, offset) - radius * radius;
  if (c <= 0) return 0;
  const a = dot(delta, delta);
  if (a < 1e-12) return null;
  const b = 2 * dot(offset, delta),
    discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}
export interface WallHit {
  fraction: number;
  normal: Vector2;
  bottom: boolean;
}
export function firstWall(start: Vector2, delta: Vector2, radius: number): WallHit | null {
  const candidates: WallHit[] = [];
  const add = (fraction: number, normal: Vector2, bottom = false) => {
    if (fraction >= -1e-9 && fraction <= 1)
      candidates.push({ fraction: Math.max(0, fraction), normal, bottom });
  };
  if (delta.x < -1e-9) add((WORLD.left + radius - start.x) / delta.x, { x: 1, y: 0 });
  if (delta.x > 1e-9) add((WORLD.right - radius - start.x) / delta.x, { x: -1, y: 0 });
  if (delta.y < -1e-9) add((WORLD.top + radius - start.y) / delta.y, { x: 0, y: 1 });
  if (delta.y > 1e-9) add((WORLD.bottom - radius - start.y) / delta.y, { x: 0, y: -1 }, true);
  candidates.sort((a, b) => a.fraction - b.fraction);
  return candidates[0] ?? null;
}
