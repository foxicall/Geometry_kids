import { useEffect, useReducer, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Undo2,
} from 'lucide-react';
import type { IMOConcept, MiniGameProps } from '../types/game';
import { createSession, readCompleted, sessionReducer, writeCompleted } from './engine';
import { getLevel, levels } from './levels';
import { buttonClass, panelClass } from './shared';
import { PlaceValueGame } from './PlaceValueGame';
import { RomanGame } from './RomanGame';
import { RoundingGame } from './RoundingGame';
import { ReverseGame } from './ReverseGame';
import { UnitaryGame } from './UnitaryGame';
import { FractionGame } from './FractionGame';
import { ComparisonGame } from './ComparisonGame';
import { MetricGame } from './MetricGame';
import { PerimeterGame } from './PerimeterGame';
import { SymmetryGame } from './SymmetryGame';
import { PictographGame } from './PictographGame';
import { MatrixCipherGame } from './MatrixCipherGame';
import { CompassGame } from './CompassGame';
import './imo.css';
const components: Record<IMOConcept, ComponentType<MiniGameProps>> = {
  place: PlaceValueGame,
  roman: RomanGame,
  rounding: RoundingGame,
  reverse: ReverseGame,
  unitary: UnitaryGame,
  fraction: FractionGame,
  compare: ComparisonGame,
  metric: MetricGame,
  perimeter: PerimeterGame,
  symmetry: SymmetryGame,
  pictograph: PictographGame,
  matrix: MatrixCipherGame,
  compass: CompassGame,
};
export function IMOGame({ onMode }: { onMode: (mode: 'reasoning' | 'solid' | 'matrix') => void }) {
  const [session, dispatch] = useReducer(sessionReducer, undefined, () => createSession());
  const [inLevel, setInLevel] = useState(false),
    [revision, setRevision] = useState(0);
  const [completed, setCompleted] = useState<string[]>(() => {
    try {
      return readCompleted(window.localStorage);
    } catch {
      return [];
    }
  });
  const [storageWarning, setStorageWarning] = useState(false),
    heading = useRef<HTMLHeadingElement>(null);
  const level = getLevel(session.levelId),
    index = levels.findIndex((l) => l.id === level.id),
    MiniGame = components[level.concept];
  const disabled = session.status !== 'playing';
  const activeHints = session.mode === 'playground' ? level.playgroundHints : level.hints;
  useEffect(() => {
    heading.current?.focus();
  }, [inLevel, session.levelId]);
  useEffect(() => {
    if (session.status !== 'won' || completed.includes(session.levelId)) return;
    const next = [...completed, session.levelId];
    setCompleted(next);
    try {
      if (!writeCompleted(window.localStorage, next)) setStorageWarning(true);
    } catch {
      setStorageWarning(true);
    }
  }, [session.status, session.levelId, completed]);
  const openLevel = (id: string) => {
    dispatch({ type: 'level', id });
    setRevision((r) => r + 1);
    setInLevel(true);
    window.scrollTo({ top: 0 });
  };
  return (
    <main className="imo-app mx-auto min-h-screen max-w-7xl px-4 py-6 text-slate-800 sm:px-8 sm:py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <button
          className="flex min-h-11 items-center gap-3 text-left"
          onClick={() => setInLevel(false)}
          aria-label="回到 IMO 選關"
        >
          <span className="rounded-2xl bg-teal-800 p-3 text-white">
            <Compass size={24} />
          </span>
          <span className="text-lg font-bold">
            數學思考研究所
            <small className="mt-1 block text-xs font-normal tracking-wide text-slate-500">
              動手試試 · 一步一步想
            </small>
          </span>
        </button>
        <nav aria-label="其他遊戲" className="flex flex-wrap gap-2">
          {(['reasoning', 'solid', 'matrix'] as const).map((mode, i) => (
            <button className={buttonClass} key={mode} onClick={() => onMode(mode)}>
              {['幾何推理', '立體觀察', '圖形矩陣'][i]}
            </button>
          ))}
        </nav>
      </header>
      {storageWarning && (
        <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          瀏覽器無法儲存；本次仍可遊玩，完成紀錄只保留到關閉頁面。
        </p>
      )}
      {!inLevel ? (
        <>
          <section className="mb-8 grid items-center gap-6 rounded-3xl bg-teal-950 p-6 text-white sm:p-10 md:grid-cols-[1fr_240px]">
            <div>
              <p className="mb-3 text-sm tracking-widest text-teal-200">IMO 概念互動遊戲</p>
              <h1
                ref={heading}
                tabIndex={-1}
                className="text-3xl font-bold leading-snug sm:text-4xl"
              >
                把「為什麼」，
                <br />
                變成看得見的發現。
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-teal-100">
                排一排、分一分、轉個方向。從國小基礎出發，用 13 個小實驗練習數學思考。
              </p>
              <p className="mt-4 text-sm text-teal-200">
                先自由探索，再接受步數挑戰；卡住可以復原，也可以看提示。
              </p>
            </div>
            <svg
              viewBox="0 0 240 200"
              className="mx-auto hidden w-full max-w-60 md:block"
              aria-hidden="true"
            >
              <rect
                x={14}
                y={20}
                width={90}
                height={90}
                rx={18}
                fill="#a9d7c5"
                transform="rotate(-8 59 65)"
              />
              <path d="M55 33V97M25 65H89" stroke="#205e50" strokeWidth={2} strokeDasharray="5 4" />
              <circle cx={171} cy={63} r={43} fill="#f0cf8e" />
              <path d="M171 63V20A43 43 0 0 1 214 63Z" fill="#c29145" />
              <path d="M130 115 205 175H55Z" fill="#9db8d3" />
              <text x={122} y={163} textAnchor="middle" fill="#173e48" fontSize={31}>
                ?
              </text>
            </svg>
          </section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">今天想研究什麼？</h2>
            <p className="text-sm text-teal-800" data-testid="completion-count">
              已完成 {completed.length} / {levels.length} 關
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {levels.map((item, i) => (
              <button
                key={item.id}
                className="imo-level-card group rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-teal-500 hover:bg-teal-50"
                onClick={() => openLevel(item.id)}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="rounded-lg bg-teal-50 px-3 py-1 text-sm font-bold text-teal-800">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {completed.includes(item.id) ? (
                    <span className="flex items-center gap-1 text-xs text-teal-800">
                      <Check size={16} />
                      已完成
                    </span>
                  ) : (
                    <ArrowRight size={18} className="text-slate-400 group-hover:text-teal-700" />
                  )}
                </div>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{item.subtitle}</p>
              </button>
            ))}
          </div>
          <p className="mt-8 text-sm leading-relaxed text-slate-500">
            依專案 SOF
            小學與初階數學概念文件製作的練習，並非官方競賽試題或能力鑑定。完成紀錄只存於這個瀏覽器。
          </p>
        </>
      ) : (
        <>
          <button
            className="mb-5 flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-800"
            onClick={() => setInLevel(false)}
          >
            <ArrowLeft size={17} />
            返回選關
          </button>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm text-teal-700">
                研究 {String(index + 1).padStart(2, '0')} / 13
              </p>
              <h1 ref={heading} tabIndex={-1} className="text-2xl font-bold sm:text-3xl">
                {level.title}
              </h1>
              <p className="mt-2 text-sm text-slate-500">{level.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="遊戲模式">
              {(['playground', 'challenge'] as const).map((mode, i) => (
                <button
                  key={mode}
                  className={buttonClass}
                  aria-pressed={session.mode === mode}
                  onClick={() => {
                    dispatch({ type: 'mode', mode });
                    setRevision((r) => r + 1);
                  }}
                >
                  {['探索模式 Playground', '挑戰模式 Challenge'][i]}
                </button>
              ))}
            </div>
          </div>
          <p className="mb-5 text-xs text-slate-500">
            切換模式會重設本關盤面、步數與提示；已完成紀錄保留。
          </p>
          <section className="mb-5 rounded-2xl border border-teal-200 bg-teal-50 p-5">
            <h2 className="mb-2 font-bold text-teal-900">
              {session.mode === 'challenge' ? '這次的任務' : '自由實驗時間'}
            </h2>
            <p className="text-sm leading-relaxed">
              {session.mode === 'challenge'
                ? level.goal
                : '自由調整盤面、觀察結果，不限步數，也不判定輸贏。可以重試、復原，或切到挑戰模式試試任務。'}
            </p>
            <p className="mt-3 text-sm font-semibold text-teal-900" data-testid="move-count">
              {session.mode === 'challenge'
                ? `已用 ${session.moves} / ${level.stepLimit} 步`
                : `已操作 ${session.moves} 次 · 不限步數`}
            </p>
            {session.mode === 'challenge' && (
              <progress
                className="mt-3 h-2 w-full accent-teal-700"
                aria-label="已用步數"
                value={session.moves}
                max={level.stepLimit}
              />
            )}
          </section>
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
            <section className={`${panelClass} min-w-0`} aria-label="互動盤面">
              <MiniGame
                key={`${level.id}-${session.mode}-${revision}`}
                board={session.board}
                mode={session.mode}
                disabled={disabled}
                hint={session.hintIndex}
                onAction={(action) => dispatch({ type: 'act', action })}
              />
            </section>
            <aside className="min-w-0 space-y-4">
              <section className={panelClass}>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`${buttonClass} inline-flex items-center gap-2`}
                    disabled={!session.history.length}
                    onClick={() => {
                      dispatch({ type: 'undo' });
                      setRevision((r) => r + 1);
                    }}
                  >
                    <Undo2 size={17} />
                    復原 Undo
                  </button>
                  <button
                    className={`${buttonClass} inline-flex items-center gap-2`}
                    onClick={() => {
                      dispatch({ type: 'reset' });
                      setRevision((r) => r + 1);
                    }}
                  >
                    <RotateCcw size={17} />
                    重新開始
                  </button>
                </div>
                <div
                  aria-live="polite"
                  aria-atomic="true"
                  className="mt-4 text-sm leading-relaxed"
                  data-testid="game-feedback"
                >
                  {session.status === 'won' ? (
                    <div
                      key={session.moves}
                      className="imo-success rounded-xl bg-teal-50 p-4 text-teal-900"
                    >
                      <strong className="mb-2 flex items-center gap-2 text-lg">
                        <Sparkles size={20} />
                        挑戰完成！
                      </strong>
                      {session.validation.message}
                    </div>
                  ) : session.status === 'exhausted' ? (
                    <p className="rounded-xl bg-amber-50 p-3 text-amber-900">
                      步數用完了。可以復原、看提示，再繼續試；也能重新開始。
                    </p>
                  ) : (
                    <p>
                      {session.mode === 'playground' && session.validation.valid
                        ? '觀察圖形和下方數值，試試改動一個條件。哪些改變了？哪些保持一樣？'
                        : session.validation.message}
                    </p>
                  )}
                  {session.notice && <p className="mt-3 text-slate-600">{session.notice}</p>}
                </div>
                {session.status === 'won' && (
                  <button
                    className={`${buttonClass} mt-4 w-full`}
                    onClick={() =>
                      index + 1 < levels.length
                        ? openLevel(levels[index + 1].id)
                        : setInLevel(false)
                    }
                  >
                    {index + 1 < levels.length ? '前往下一關' : '回到選關看看成果'}
                  </button>
                )}
              </section>
              <section className={panelClass}>
                <h2 className="mb-3 flex items-center gap-2 font-bold">
                  <Lightbulb size={18} className="text-amber-600" />
                  一點點提示
                </h2>
                <button
                  className={`${buttonClass} w-full`}
                  disabled={session.hintIndex >= activeHints.length}
                  onClick={() => dispatch({ type: 'hint' })}
                >
                  看提示（{session.hintIndex}/{activeHints.length}）
                </button>
                <ol className="mt-3 list-inside list-decimal space-y-3 text-sm leading-relaxed">
                  {activeHints.slice(0, session.hintIndex).map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ol>
              </section>
              <section className={panelClass}>
                <h2 className="mb-3 font-bold">看見數學</h2>
                <p className="text-sm leading-relaxed">{level.principle}</p>
                <ul className="mt-3 space-y-3 border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-600">
                  {session.validation.facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
        </>
      )}
      <footer className="mt-10 border-t border-slate-200 pt-5 text-xs text-slate-500">
        不用搶快，理解比速度重要。所有圖形與規則都可離線使用。
      </footer>
    </main>
  );
}
