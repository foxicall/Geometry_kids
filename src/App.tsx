import { useEffect, useReducer, useRef, useState } from 'react';
import { ArrowRight, BarChart3, Check, CheckCircle2, ChevronRight, Clock3, Compass, House, Leaf, Lightbulb, Map, RotateCcw, X } from 'lucide-react';
import { CellRenderer, cellLabel } from './components/CellRenderer';
import { MatrixBoard } from './components/MatrixBoard';
import { HomePage } from './components/HomePage';
import { ResultsPage } from './components/ResultsPage';
import { HistoryPage } from './components/HistoryPage';
import { attributeLabels } from './lib/matrix';
import { createQuestion } from './lib/questions';
import { elapsedTime, formatTime, gameReducer, initialGame, nextDifficulty, readHistory, ROUND_LENGTH, saveSession } from './lib/game';
import { routes } from './lib/routes';
import type { Difficulty } from './types/matrix';

type View = 'home' | 'game' | 'history';

export function App() {
  const [view, setView] = useState<View>('home');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [adaptive, setAdaptive] = useState(true);
  const [state, dispatch] = useReducer(gameReducer, initialGame);
  const [now, setNow] = useState(Date.now);
  const [hint, setHint] = useState(false);
  const [history, setHistory] = useState(readHistory);
  const main = useRef<HTMLElement>(null);
  const question = state.question;
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [state.phase, state.startedAt]);
  useEffect(() => {
    if (state.phase === 'complete') { saveSession(state); setHistory(readHistory()); }
  }, [state]);
  useEffect(() => {
    const heading = main.current?.querySelector('h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  }, [view, state.phase === 'complete']);

  function start() {
    const sessionId = crypto.randomUUID();
    const timestamp = Date.now();
    dispatch({ type: 'start', question: createQuestion(difficulty, `${sessionId}-1`), adaptive, now: timestamp, sessionId });
    setNow(timestamp); setHint(false); setView('game');
  }
  function home(nextView: View = 'home') { dispatch({ type: 'reset' }); setView(nextView); setHint(false); }
  function next() {
    const timestamp = Date.now();
    dispatch({ type: 'next', question: state.answers.length >= ROUND_LENGTH ? null : createQuestion(nextDifficulty(state), `${state.sessionId}-${state.answers.length + 1}`), now: timestamp });
    setNow(timestamp); setHint(false);
  }
  const currentNumber = Math.min(ROUND_LENGTH, state.answers.length + (state.phase === 'playing' ? 1 : 0));
  const correctOption = question?.options.find((option) => option.id === question.correctOptionId);
  const selectedOption = question?.options.find((option) => option.id === state.selectedId);
  const isCorrect = state.selectedId === question?.correctOptionId;

  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => home()} aria-label="形狀探險隊，回到基地"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><span>形狀探險隊<small>SHAPE EXPLORERS</small></span></button>
      <div className="sidebar-label">小小探險家的天地</div>
      <nav aria-label="主要導覽">
        <button className={view === 'home' ? 'nav-item active' : 'nav-item'} aria-current={view === 'home' ? 'page' : undefined} onClick={() => home()}><House size={19} />探險基地<ChevronRight size={15} /></button>
        <button className={view === 'game' ? 'nav-item active' : 'nav-item'} aria-current={view === 'game' ? 'page' : undefined} onClick={() => { if (view !== 'game') start(); }}><Compass size={19} />練習挑戰<ChevronRight size={15} /></button>
        <button className={view === 'history' ? 'nav-item active' : 'nav-item'} aria-current={view === 'history' ? 'page' : undefined} onClick={() => home('history')}><BarChart3 size={19} />我的發現<ChevronRight size={15} /></button>
      </nav>
      <div className="sidebar-note"><span className="note-icon"><Lightbulb size={25} /></span><strong>每一次思考，都是進步。</strong><p>不用急，慢慢看。<br />新的發現就在下一眼！</p><span className="note-doodle" aria-hidden="true">✧ · ✦</span></div>
      <div className="sidebar-footer"><Leaf size={15} />為好奇心，留一點空間</div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><Map size={17} /><span>探索</span><ChevronRight size={13} /><strong>{view === 'home' ? '探險基地' : view === 'history' ? '我的發現' : '練習挑戰'}</strong></div><span className="local-status"><i />本地規則題庫</span><div className="avatar" aria-label="小小探險家"><span>✦</span></div></header>
      <main ref={main} className={`main-content ${view === 'game' ? 'game-content' : ''}`}>
        {view === 'home' && <HomePage difficulty={difficulty} setDifficulty={setDifficulty} adaptive={adaptive} setAdaptive={setAdaptive} onStart={start} />}
        {view === 'game' && question && state.phase !== 'complete' && <>
          <div className="game-heading"><div><span className="section-kicker">ONE LITTLE DISCOVERY AT A TIME</span><h1>找出缺少的那一塊</h1><p>仔細看看，哪個圖形可以放進問號裡？</p></div><button className="text-button" onClick={start}><RotateCcw size={15} />重新開始</button></div>
          <div className="progress-panel"><span>第 <strong>{currentNumber}</strong> / {ROUND_LENGTH} 題</span><div className="progress-track" role="progressbar" aria-label="作答進度" aria-valuemin={0} aria-valuemax={ROUND_LENGTH} aria-valuenow={state.answers.length}><span style={{ width: `${state.answers.length / ROUND_LENGTH * 100}%` }} /></div><span className="timer" aria-label="累計作答時間"><Clock3 size={17} />{formatTime(elapsedTime(state, now))}</span></div>
          <section className="puzzle-panel"><div className="puzzle-side"><div className="puzzle-label"><span className={`level-pill ${routes[question.difficulty].color}`}>{routes[question.difficulty].label} · {question.size} × {question.size}</span><span>{state.adaptive ? '依你的步調調整' : '固定難度練習'}</span></div><MatrixBoard question={question} answer={state.phase === 'feedback' ? correctOption?.cell : undefined} /><button className="hint-button" onClick={() => setHint(!hint)} aria-expanded={hint}><Lightbulb size={16} />{hint ? '收起小提示' : '給我一個小提示'}</button>{hint && <p className="hint-text">{question.rules.map((rule) => `試著${rule.direction === 'row' ? '由左往右' : '由上往下'}觀察「${attributeLabels[rule.attribute]}」。`).join('')}</p>}</div>
            <div className="answers-side"><h2>哪一個是你的發現？</h2><p className="answer-instruction">選好後，再按下「確認答案」。</p><div className="answer-grid" role="group" aria-label="答案選項">{question.options.map((option, index) => {
              const selected = option.id === state.selectedId;
              const revealed = state.phase === 'feedback';
              const correct = revealed && option.id === question.correctOptionId;
              return <button key={option.id} className={`answer-card ${selected ? 'selected' : ''} ${correct ? 'correct' : ''} ${revealed && selected && !correct ? 'incorrect' : ''}`} disabled={revealed} aria-pressed={selected} aria-label={`選項 ${String.fromCharCode(65 + index)}，${cellLabel(option.cell)}`} onClick={() => dispatch({ type: 'select', id: option.id })}><span className="answer-letter">{String.fromCharCode(65 + index)}</span><CellRenderer cell={option.cell} decorative />{correct && <CheckCircle2 className="answer-check" size={19} />}{revealed && selected && !correct && <X className="answer-check" size={19} />}</button>;
            })}</div></div></section>
          {state.phase === 'feedback' ? <section className={`feedback-panel ${isCorrect ? 'success' : 'learning'}`} role="status"><div className="feedback-copy"><span className="feedback-icon">{isCorrect ? <CheckCircle2 size={25} /> : <Lightbulb size={25} />}</span><div><h2>{isCorrect ? '找到了！你的觀察很仔細。' : '差一點點，一起看看小祕密。'}</h2><p>{question.explanation}</p>{!isCorrect && <p className="answer-description">正確圖形：{correctOption && cellLabel(correctOption.cell)}</p>}</div></div><button className="primary-button" onClick={next}>{state.answers.length === ROUND_LENGTH ? '看看我的發現' : '下一個挑戰'}<ArrowRight size={18} /></button></section> : <div className="confirm-panel"><span aria-live="polite">{selectedOption ? `已選好 ${String.fromCharCode(65 + question.options.indexOf(selectedOption))}，準備揭曉了嗎？` : '不急，找到線索再選也可以。'}</span><button className="primary-button" disabled={!state.selectedId} onClick={() => dispatch({ type: 'confirm', now: Date.now() })}>確認答案<Check size={18} /></button></div>}
        </>}
        {view === 'game' && state.phase === 'complete' && <ResultsPage state={state} onRestart={start} onHome={() => home()} />}
        {view === 'history' && <HistoryPage history={history} onStart={start} />}
        <footer className="page-footer"><span><Leaf size={14} />讓思考，像遊戲一樣有趣。</span><small>原創邏輯練習 · 非標準化測驗或智力鑑定</small></footer>
      </main>
    </div>
  </div>;
}
