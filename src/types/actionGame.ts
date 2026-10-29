export interface Vector2 {
  x: number;
  y: number;
}
export interface Body {
  position: Vector2;
  velocity: Vector2;
  radius: number;
}
export interface Player extends Body {
  acceleration: number;
  friction: number;
  angle: number;
  cooldown: number;
}
export interface Projectile extends Body {
  id: number;
  bounces: number;
  age: number;
  trail: Vector2[];
}
export interface Obstacle extends Body {
  id: number;
  requiredBounces: 1 | 2;
  active: boolean;
  respawnIn: number;
  home: Vector2;
}
export interface Particle extends Body {
  id: number;
  life: number;
  maxLife: number;
  color: string;
  gravity: number;
}
export interface Ripple {
  position: Vector2;
  life: number;
  color: string;
}
export interface Reflection {
  point: Vector2;
  normal: Vector2;
  incoming: Vector2;
  outgoing: Vector2;
  angle: number;
  life: number;
}
export type ActionPhase = 'ready' | 'running' | 'paused' | 'finished';
export type ActionEvent = { type: 'hit' | 'miss' | 'bounce' | 'finish'; score?: number };
export interface GameState {
  phase: ActionPhase;
  player: Player;
  projectiles: Projectile[];
  obstacles: Obstacle[];
  particles: Particle[];
  ripples: Ripple[];
  reflection: Reflection | null;
  score: number;
  combo: number;
  maxCombo: number;
  hits: number;
  misses: number;
  shots: number;
  remaining: number;
  elapsed: number;
  accumulator: number;
  slowMotion: number;
  shake: number;
  nextId: number;
  message: string;
  reducedEffects: boolean;
}
export interface Controls {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}
export interface AimPoint extends Vector2 {
  bounces: number;
}
