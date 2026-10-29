import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Crosshair,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { Controls, GameState, Vector2 } from '../types/actionGame';
import {
  advanceFrame,
  createActionGame,
  emptyControls,
  fire,
  multiplier,
  pauseActionGame,
  readBest,
  saveBest,
  startActionGame,
} from './action/engine';
import { clamp } from './action/physics';
import { renderGame } from './action/render';
import { ActionAudio } from './action/audio';
import './action/action.css';
const snapshot = (s: GameState) => ({
  phase: s.phase,
  score: s.score,
  combo: s.combo,
  maxCombo: s.maxCombo,
  hits: s.hits,
  misses: s.misses,
  shots: s.shots,
  remaining: s.remaining,
  angle: s.player.angle,
  message: s.message,
  balls: s.projectiles.length,
  x: s.player.position.x,
  y: s.player.position.y,
  reflection: s.reflection?.angle ?? null,
});
export function ActionMathGame({ onBack }: { onBack: () => void }) {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [sound, setSound] = useState(true),
    [guide, setGuide] = useState(true),
    [storageWarning, setStorageWarning] = useState(false);
  const [best, setBest] = useState(() => {
    try {
      return readBest(window.localStorage);
    } catch {
      return 0;
    }
  });
  const bestRef = useRef(best),
    state = useRef<GameState>(createActionGame(reduced)),
    controls = useRef<Controls>(emptyControls());
  const [hud, setHud] = useState(() => snapshot(state.current));
  const canvas = useRef<HTMLCanvasElement>(null),
    context = useRef<CanvasRenderingContext2D | null>(null),
    audio = useRef<ActionAudio | null>(null);
  const lastTime = useRef<number | null>(null),
    lastHud = useRef(0),
    guideRef = useRef(guide),
    drag = useRef<{ id: number; start: Vector2 } | null>(null);
  const [canvasError, setCanvasError] = useState(false);
  const draw = useCallback(() => {
    if (context.current) renderGame(context.current, state.current, guideRef.current);
  }, []);
  const sync = useCallback(() => {
    setHud(snapshot(state.current));
    draw();
  }, [draw]);
  const pause = useCallback(() => {
    pauseActionGame(state.current);
    controls.current = emptyControls();
    drag.current = null;
    lastTime.current = null;
    sync();
  }, [sync]);
  const shoot = useCallback(() => {
    audio.current?.unlock();
    if (fire(state.current)) audio.current?.play('shoot');
    sync();
  }, [sync]);
  const launch = (restart = false) => {
    audio.current?.unlock();
    if (restart || state.current.phase === 'finished') state.current = createActionGame(reduced);
    state.current.reducedEffects = reduced;
    startActionGame(state.current);
    controls.current = emptyControls();
    drag.current = null;
    lastTime.current = null;
    sync();
    canvas.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const ctx = element.getContext('2d');
    if (!ctx) {
      setCanvasError(true);
      return;
    }
    context.current = ctx;
    audio.current = new ActionAudio();
    const resize = () => {
      const rect = element.getBoundingClientRect(),
        ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (rect.width <= 0) return;
      element.width = Math.round(rect.width * ratio);
      element.height = Math.round(rect.height * ratio);
      ctx.setTransform(element.width / 800, 0, 0, element.height / 600, 0, 0);
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const hidden = () => {
      if (document.hidden) pause();
    };
    const blur = () => {
      if (state.current.phase === 'running') pause();
    };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('blur', blur);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('blur', blur);
      audio.current?.dispose();
      audio.current = null;
      context.current = null;
      controls.current = emptyControls();
      drag.current = null;
    };
  }, [draw, pause]);
  useEffect(() => {
    guideRef.current = guide;
    draw();
  }, [guide, draw]);
  useEffect(() => {
    state.current.reducedEffects = reduced;
    if (reduced) {
      state.current.particles = [];
      state.current.shake = 0;
      state.current.slowMotion = 0;
    }
    draw();
  }, [reduced, draw]);
  useEffect(() => {
    if (audio.current) audio.current.enabled = sound;
  }, [sound]);
  useEffect(() => {
    if (hud.phase !== 'running') return;
    let frame = 0,
      disposed = false;
    const tick = (now: number) => {
      if (disposed || state.current.phase !== 'running') return;
      const dt = lastTime.current === null ? 0 : (now - lastTime.current) / 1000;
      lastTime.current = now;
      const events = advanceFrame(state.current, dt, controls.current);
      for (const event of events)
        if (event.type === 'hit' || event.type === 'miss') audio.current?.play(event.type);
      if (state.current.score > bestRef.current) {
        bestRef.current = state.current.score;
        setBest(bestRef.current);
        try {
          if (!saveBest(window.localStorage, bestRef.current)) setStorageWarning(true);
        } catch {
          setStorageWarning(true);
        }
      }
      draw();
      // React 儀表以 10Hz 更新；物理與 Canvas 不等待 React render。
      if (now - lastHud.current >= 100 || events.some((e) => e.type !== 'bounce')) {
        setHud(snapshot(state.current));
        lastHud.current = now;
      }
      if (state.current.phase === 'running') frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      lastTime.current = null;
    };
  }, [hud.phase, draw]);
  const point = (event: ReactPointerEvent<HTMLCanvasElement>): Vector2 => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 800,
      y: ((event.clientY - rect.top) / rect.height) * 600,
    };
  };
  const aim = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drag.current || event.pointerId !== drag.current.id) return;
    const p = point(event),
      dx = drag.current.start.x - p.x,
      dy = drag.current.start.y - p.y;
    if (dy < -5) {
      state.current.player.angle = clamp((Math.atan2(-dy, dx) * 180) / Math.PI, 10, 170);
      sync();
    }
  };
  const moveButton = (
    key: keyof Controls,
    down: boolean,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (down) {
      if (state.current.phase !== 'running') return;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    controls.current[key] = down;
  };
  const keyMap: Record<string, keyof Controls> = {
    ArrowLeft: 'left',
    a: 'left',
    ArrowRight: 'right',
    d: 'right',
    ArrowUp: 'up',
    w: 'up',
    ArrowDown: 'down',
    s: 'down',
  };
  return (
    <main className="action-shell">
      <header className="action-header">
        <button className="action-text-button" onClick={onBack}>
          <ArrowLeft size={18} />
          回到數學研究所
        </button>
        <span className="action-wordmark">
          <Crosshair size={20} /> REFLECTION LAB
        </span>
        <span className="action-best">
          本機最高分 <strong data-testid="action-best">{best}</strong>
        </span>
      </header>
      <section className="action-intro">
        <div>
          <p className="action-eyebrow">幾何動作實驗 01 · 鏡射對稱</p>
          <h1>鏡面彈射實驗室</h1>
          <p>角度對了，反射就成了你的助攻。</p>
        </div>
        <div className="action-settings">
          <button
            className="action-control"
            aria-pressed={guide}
            onClick={() => setGuide((g) => !g)}
          >
            瞄準線：{guide ? '開' : '關'}
          </button>
          <button
            className="action-control"
            aria-pressed={sound}
            onClick={() => {
              audio.current?.unlock();
              setSound((s) => !s);
            }}
          >
            {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}音效：{sound ? '開' : '關'}
          </button>
          <button
            className="action-control"
            aria-pressed={reduced}
            onClick={() => setReduced((r) => !r)}
          >
            減少特效：{reduced ? '開' : '關'}
          </button>
        </div>
      </section>
      {storageWarning && (
        <p className="action-warning" role="status">
          瀏覽器無法儲存最高分；本次仍可正常遊玩。
        </p>
      )}
      <section className="action-hud" aria-label="動作遊戲儀表">
        <div>
          <span>得分</span>
          <strong data-testid="action-score">{hud.score}</strong>
        </div>
        <div>
          <span>連續命中</span>
          <strong data-testid="action-combo">
            {hud.combo} <small>×{multiplier(hud.combo)}</small>
          </strong>
        </div>
        <div>
          <span>剩餘秒數</span>
          <strong
            data-testid="action-time"
            className={hud.remaining <= 10 ? 'action-time-low' : ''}
          >
            {hud.remaining.toFixed(1)}
          </strong>
        </div>
        <div>
          <span>命中 / 發射</span>
          <strong>
            {hud.hits} / {hud.shots}
          </strong>
        </div>
      </section>
      <div className="action-layout">
        <section className="action-stage">
          <div className="action-side-buttons">
            <button className="action-control" disabled={hud.phase !== 'running'} onClick={pause}>
              <Pause size={17} />
              暫停
            </button>
            <button className="action-control" disabled={canvasError} onClick={() => launch(true)}>
              <RotateCcw size={17} />
              即時重試
            </button>
          </div>
          <div
            className="action-board"
            data-testid="action-state"
            data-phase={hud.phase}
            data-projectiles={hud.balls}
            data-player-x={hud.x.toFixed(2)}
            data-player-y={hud.y.toFixed(2)}
          >
            <canvas
              ref={canvas}
              width={800}
              height={600}
              tabIndex={0}
              role="img"
              aria-label="鏡面彈射畫布：向下拖曳拉弓，放開發射；方向鍵或 WASD 移動，空白鍵發射，Escape 暫停"
              aria-describedby="action-controls-help"
              onKeyDown={(e) => {
                const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
                if (keyMap[key]) {
                  e.preventDefault();
                  if (state.current.phase === 'running') controls.current[keyMap[key]] = true;
                } else if (e.code === 'Space') {
                  e.preventDefault();
                  if (!e.repeat) shoot();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  pause();
                }
              }}
              onKeyUp={(e) => {
                const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
                if (keyMap[key]) {
                  e.preventDefault();
                  controls.current[keyMap[key]] = false;
                }
              }}
              onBlur={() => {
                controls.current = emptyControls();
                drag.current = null;
              }}
              onPointerDown={(e) => {
                if (state.current.phase !== 'running' || !e.isPrimary || e.button !== 0) return;
                audio.current?.unlock();
                e.currentTarget.focus({ preventScroll: true });
                e.currentTarget.setPointerCapture(e.pointerId);
                drag.current = { id: e.pointerId, start: point(e) };
              }}
              onPointerMove={aim}
              onPointerUp={(e) => {
                if (!drag.current || drag.current.id !== e.pointerId) return;
                aim(e);
                const from = drag.current.start,
                  end = point(e);
                drag.current = null;
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  e.currentTarget.releasePointerCapture(e.pointerId);
                if (Math.hypot(from.x - end.x, from.y - end.y) < 10 || end.y - from.y > 5) shoot();
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
              onLostPointerCapture={() => {
                drag.current = null;
              }}
            >
              此遊戲需要支援 Canvas 的瀏覽器。
            </canvas>
            {(hud.phase !== 'running' || canvasError) && (
              <div className="action-overlay">
                <div className="action-overlay-card">
                  {canvasError ? (
                    <>
                      <h2>目前瀏覽器無法啟用畫布</h2>
                      <p>請改用支援 Canvas 2D 的瀏覽器開啟。</p>
                    </>
                  ) : hud.phase === 'ready' ? (
                    <>
                      <span className="action-badge">
                        <Sparkles size={16} />
                        60 秒反射挑戰
                      </span>
                      <h2>一面鏡子，無限個角度。</h2>
                      <p>
                        先撞金色鏡面，再擊中圓形目標。
                        <br />
                        目標數字 1 或 2，就是需要的反射次數。
                      </p>
                      <button className="action-primary" onClick={() => launch()}>
                        <Play size={19} />
                        開始 60 秒挑戰
                      </button>
                    </>
                  ) : hud.phase === 'paused' ? (
                    <>
                      <h2>休息一下，時間停住了</h2>
                      <p>按繼續後，從同一個位置接著玩。</p>
                      <button className="action-primary" onClick={() => launch()}>
                        <Play size={19} />
                        繼續挑戰
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="action-badge">挑戰完成</span>
                      <h2>{hud.score} 分</h2>
                      <p>
                        命中 {hud.hits} 次 · 最高連擊 {hud.maxCombo}
                        <br />
                        {hud.hits
                          ? '再試一次，找到更漂亮的反射路線。'
                          : '先開瞄準線，讓小球碰過一次鏡面再找數字 1。'}
                      </p>
                      <button className="action-primary" onClick={() => launch(true)}>
                        <RotateCcw size={19} />
                        再挑戰一次
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="action-feedback" role="status" data-testid="action-feedback">
            {hud.message}
          </div>
          <div className="action-aim-control">
            <label htmlFor="action-angle">
              發射角度 <strong>{Math.round(hud.angle)}°</strong>
              <small>90° 向上 · 向左瞄準可增加角度</small>
            </label>
            <input
              id="action-angle"
              aria-label="發射角度"
              type="range"
              min={10}
              max={170}
              step={1}
              value={Math.round(hud.angle)}
              disabled={hud.phase === 'finished'}
              onChange={(e) => {
                state.current.player.angle = Number(e.target.value);
                sync();
              }}
            />
            <button className="action-primary" disabled={hud.phase !== 'running'} onClick={shoot}>
              <Crosshair size={19} />
              發射
            </button>
          </div>
        </section>
        <aside className="action-side">
          <section className="action-card">
            <p className="action-eyebrow">動手操作</p>
            <h2>先瞄準，再出手</h2>
            <p id="action-controls-help">
              在畫布上向下拖曳拉弓，放開發射。也能用角度滑桿與「發射」按鈕。方向鍵／WASD
              移動發射台，空白鍵發射。虛線預覽鏡面路線，碰到移動目標時小球會提前停下。
            </p>
            <div className="action-direction-pad">
              {(['up', 'left', 'down', 'right'] as const).map((key, i) => {
                const Icon = [ArrowUp, ArrowLeft, ArrowDown, ArrowRight][i];
                return (
                  <button
                    className={`action-control action-move-${key}`}
                    key={key}
                    aria-label={['向上移動', '向左移動', '向下移動', '向右移動'][i]}
                    disabled={hud.phase !== 'running'}
                    onPointerDown={(e) => moveButton(key, true, e)}
                    onPointerUp={(e) => moveButton(key, false, e)}
                    onPointerCancel={(e) => moveButton(key, false, e)}
                    onLostPointerCapture={() => {
                      controls.current[key] = false;
                    }}
                  >
                    <Icon size={22} />
                  </button>
                );
              })}
            </div>
          </section>
          <section className="action-card action-theorem">
            <p className="action-eyebrow">看見數學</p>
            <h2>入射角＝反射角</h2>
            <svg
              viewBox="0 0 260 135"
              role="img"
              aria-label="小球碰到水平鏡面，入射與反射的角度相等，角度從法線量起"
            >
              <path d="M15 110H245" stroke="#e5b76a" strokeWidth={5} />
              <path d="M130 110V10" stroke="#8ba8bd" strokeWidth={2} strokeDasharray="5 5" />
              <path d="M35 25 130 110 225 25" fill="none" stroke="#69e4db" strokeWidth={3} />
              <text x={83} y={73} fill="#d4ecf3" fontSize={18}>
                θ
              </text>
              <text x={159} y={73} fill="#d4ecf3" fontSize={18}>
                θ
              </text>
              <text x={139} y={20} fill="#97b5c8" fontSize={13}>
                法線
              </text>
            </svg>
            <p>
              角度從垂直鏡面的「法線」量起。撞上鏡面時，沿鏡面的方向不變，朝向鏡面的方向會反過來。
            </p>
            <strong className="action-reflection" data-testid="action-reflection">
              {hud.reflection === null
                ? '碰到鏡面後，這裡會顯示相等的角度。'
                : `入射 ${hud.reflection.toFixed(1)}° ＝反射 ${hud.reflection.toFixed(1)}°`}
            </strong>
          </section>
          <section className="action-card">
            <h2>連擊小祕訣</h2>
            <p>
              每次正確命中得 100 分。連續命中每增加 3 次，下一次加一級倍率，最高
              ×5。直接撞到目標、反射次數不符或小球落底，連擊會歸零。
            </p>
            <p className="action-small">切到背景自動暫停。最高分只存在這個瀏覽器。</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
