import { useEffect, useReducer, useRef, useState } from 'react';
import { ArrowRight, Box, CheckCircle2, ChevronRight, Clock3, Compass, Grid2X2, Lightbulb, Minus, Plus, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { SolidViewer } from './SolidViewer';
import { SolidResults } from './SolidResults';
import { SolidRecords } from './SolidRecords';
import { createSessionId, formatTime } from '../lib/game';
import { COUNT_FIELDS, COUNT_LABELS, makeSolidRound, solidExplanation, solidName } from '../lib/solids';
import { initialSolidGame, saveSolidRecord, solidGameReducer, solidRecords } from '../lib/solidGame';
import type { CountField, SolidQuestion } from '../types/solid';

const preview: SolidQuestion = { id: 'preview', kind: 'prism', sides: 5 };
const letters = { vertices: 'V', edges: 'E', faces: 'F' };
const definitions = { vertices: '邊與邊相遇的角落', edges: '兩個面相接的線段', faces: '圍成立體的平面' };

export function SolidGame({ onMatrix }: { onMatrix: () => void }) {
  const [state, dispatch] = useReducer(solidGameReducer, initialSolidGame);
  const [nickname, setNickname] = useState('');
  const [now, setNow] = useState(Date.now);
  const [hint, setHint] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [records, setRecords] = useState(solidRecords);
  const main = useRef<HTMLElement>(null);
  const active = state.phase === 'playing' || state.phase === 'feedback';
  const question = state.questions[state.index] || preview;
  const elapsed = state.elapsedMs + (state.phase === 'playing' ? Math.max(0, now - state.startedAt) : 0);
  const last = state.phase === 'feedback' ? state.attempts.at(-1) : undefined;
  const allCorrect = last && COUNT_FIELDS.every((field) => last.correct[field]);

  // 計時只累計作答階段；解說、結算與離開模式時都會清除計時器。
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [state.phase]);
  useEffect(() => {
    if (state.phase === 'complete') { saveSolidRecord(state); setRecords(solidRecords()); }
  }, [state]);
  useEffect(() => {
    if (showRecords || state.phase === 'complete') main.current?.focus();
  }, [showRecords, state.phase]);

  function start() {
    const time = Date.now();
    dispatch({ type: 'start', questions: makeSolidRound(), now: time, sessionId: createSessionId(), nickname });
    setNow(time); setHint(false); setShowRecords(false);
  }
  function next() { const time = Date.now(); setNow(time); setHint(false); dispatch({ type: 'next', now: time }); }
  function home() { dispatch({ type: 'reset' }); setShowRecords(false); setHint(false); }
  function adjust(field: CountField, amount: number) {
    const current = Number(state.inputs[field]);
    dispatch({ type: 'input', field, value: String(Math.max(0, Math.min(99, (Number.isFinite(current) ? current : 0) + amount))) });
  }

  return <div className="solid-app">
    <header className="solid-header"><div className="solid-header-inner">
      <button className="solid-brand" onClick={home} aria-label="幾何小建築師首頁"><span><Box size={25} /></span><div><strong>幾何小建築師</strong><small>THE LITTLE GEOMETRY LAB</small></div></button>
      <nav aria-label="遊戲模式"><button className="selected" onClick={home}><Compass size={17} />立體觀察室</button><button onClick={onMatrix}><Grid2X2 size={17} />圖形規律練習</button></nav>
      <button className="solid-record-link" aria-label="練習紀錄" disabled={active} onClick={() => { setRecords(solidRecords()); setShowRecords(true); }}><Trophy size={17} /><span>練習紀錄</span></button>
    </div></header>
    <main className="solid-main" ref={main} tabIndex={-1}>
      {showRecords ? <SolidRecords records={records} onStart={start} /> : state.phase === 'complete' ? <SolidResults state={state} onRestart={start} onRecords={() => setShowRecords(true)} /> : <>
        <section className="solid-welcome"><div><span className="solid-eyebrow"><Sparkles size={14} />小小觀察家，大大的發現</span><h1>轉個角度，看見立體的祕密<span>。</span></h1><p>轉一轉、數一數，讓每個角落都成為你的新發現。</p></div><div className="welcome-badge"><Box size={28} /><span>觀察 × 思考<br /><strong>一起動動腦</strong></span></div></section>
        <div className="solid-breadcrumb"><span>幾何實驗室<ChevronRight size={13} /><strong>頂點・邊・面</strong></span><span className="offline-pill"><i />離線也能玩</span></div>
        <div className="solid-lab-grid">
          <section className="solid-model-card" aria-label="立體觀察區"><div className="solid-card-heading"><h2><Box size={18} />立體觀察室</h2><span data-testid="solid-name">{solidName(question)}{!active && <small>示範模型</small>}</span></div>
            <SolidViewer key={`${state.sessionId}-${question.id}`} solid={question} />
            <div className="solid-legend"><span><i className="legend-point" />頂點是角落</span><span><i className="legend-edge" />邊是線段</span><span><i className="legend-face" />面是平面</span></div>
          </section>
          <section className="solid-task-card">
            {!active ? <div className="solid-intro"><span className="solid-eyebrow">YOUR FIRST BLUEPRINT</span><h2>準備好成為<br />小小建築師了嗎？</h2><p>用你的觀察力，解開立體圖形的小祕密。</p><ol><li><span>1</span><div><strong>轉動模型，仔細觀察</strong><small>拖曳或暫停，換個角度看看。</small></div></li><li><span>2</span><div><strong>數一數頂點、邊與面</strong><small>別忘了藏在背後的部分喔！</small></div></li><li><span>3</span><div><strong>完成 10 張建築藍圖</strong><small>認識角柱與角錐，累積新發現。</small></div></li></ol><label className="nickname-label" htmlFor="architect-name">你的小小建築師暱稱 <small>（可不填）</small></label><input id="architect-name" className="nickname-input" maxLength={20} value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="小小建築師" autoComplete="off" /><button className="solid-button" onClick={start}>開始觀察挑戰<ArrowRight size={18} /></button><p className="solid-scoring">每項答對 +10 分，答錯 −5 分；總分最低 0 分。</p></div> : <>
              <div className="solid-task-top"><span>建築藍圖 <strong>{String(state.index + 1).padStart(2, '0')}</strong> / 10</span><button aria-label="重新開始立體挑戰" onClick={start}><RotateCcw size={16} /></button></div><h2>這個立體，有幾個…？</h2><p className="solid-task-subtitle">仔細看，也數數背面的部分。</p>
              <form noValidate onSubmit={(event) => { event.preventDefault(); dispatch({ type: 'submit', now: Date.now() }); }}>
                <div className="solid-count-fields">{COUNT_FIELDS.map((field) => <div key={field} className={`solid-count-input metric-${field} ${last ? last.correct[field] ? 'field-correct' : 'field-wrong' : ''}`}><label htmlFor={`count-${field}`}><span className="count-symbol">{letters[field]}</span><span><strong>{COUNT_LABELS[field]}</strong><small>{last ? last.correct[field] ? '答對了！' : `正確是 ${last.expected[field]} 個` : definitions[field]}</small></span></label><div className="count-stepper"><button type="button" disabled={state.phase !== 'playing'} onClick={() => adjust(field, -1)} aria-label={`減少${COUNT_LABELS[field]}數量`}><Minus size={13} /></button><input id={`count-${field}`} aria-label={`${COUNT_LABELS[field]}數量`} type="number" inputMode="numeric" min={0} max={99} step={1} placeholder="?" value={state.inputs[field]} disabled={state.phase !== 'playing'} onChange={(event) => dispatch({ type: 'input', field, value: event.target.value })} /><button type="button" disabled={state.phase !== 'playing'} onClick={() => adjust(field, 1)} aria-label={`增加${COUNT_LABELS[field]}數量`}><Plus size={13} /></button></div></div>)}</div>
                {state.error && <p className="solid-form-error" role="alert">{state.error}</p>}
                {state.phase === 'playing' && <button type="submit" className="solid-button">確認我的發現<CheckCircle2 size={18} /></button>}
              </form>
              {last && <div className={`solid-feedback ${allCorrect ? 'perfect' : ''}`} role="status"><strong>{allCorrect ? '觀察得好仔細，三項全對！' : '又學會一個立體的新線索！'}</strong><p>本關 {last.points >= 0 ? '+' : '−'}{Math.abs(last.points)} 分 · 總分最低 0 分</p><button className="solid-button" onClick={next}>{state.index === 9 ? '查看挑戰成果' : '下一張藍圖'}<ArrowRight size={18} /></button></div>}
              {state.phase === 'playing' && <><button className="solid-hint-toggle" aria-expanded={hint} onClick={() => setHint(!hint)}><Lightbulb size={15} />{hint ? '收起小提示' : '給我一個小提示'}</button>{hint && <p className="solid-hint">{question.kind === 'prism' ? '先數一個底面的頂點，再找另一個底面。邊可以分成上、下兩圈和中間連接的線段。' : '先找底面的頂點，再找最上方的尖頂。邊可以分成底面一圈和通往尖頂的線段。'}底面也算是一個面喔！</p>}</>}
            </>}
          </section>
        </div>
        <section className="solid-session-strip" aria-label="挑戰狀態"><div className="solid-score"><span className="strip-icon"><Trophy size={20} /></span><div><small>累積得分</small><strong data-testid="solid-score">{state.score}<span> / 300</span></strong></div></div><div className="solid-progress"><div><span>我的建築進度</span><strong>{state.attempts.length} / 10</strong></div><div className="solid-progress-track" role="progressbar" aria-label="立體挑戰進度" aria-valuemin={0} aria-valuemax={10} aria-valuenow={state.attempts.length}>{Array.from({ length: 10 }, (_, index) => <i key={index} className={index < state.attempts.length ? 'done' : ''} />)}</div></div><div className="solid-time"><Clock3 size={19} /><div><small>觀察時間</small><strong aria-label="立體觀察時間">{formatTime(elapsed)}</strong></div></div></section>
        {last && <section className="solid-explanation"><Lightbulb size={22} /><div><h2>一起整理剛剛的發現</h2><p>{solidExplanation(question)}</p><strong>{last.expected.vertices} ＋ {last.expected.faces} − {last.expected.edges} ＝ 2 ✓</strong></div></section>}
        <section className="solid-discovery"><div className="discovery-copy"><span className="discovery-icon"><Lightbulb size={23} /></span><div><h2>小建築師的祕密公式</h2><p>這裡的角柱與角錐，都藏著同一個小規律！</p></div></div><div className="euler-formula"><span><b>V</b><small>頂點</small></span><em>＋</em><span><b>F</b><small>面</small></span><em>−</em><span><b>E</b><small>邊</small></span><em>＝</em><strong>2</strong></div></section>
      </>}
    </main><footer className="solid-footer"><Box size={14} /><span>幾何小建築師 · 用好奇心探索形狀的世界</span><small>原創練習 · 紀錄僅存於本機</small></footer>
  </div>;
}
