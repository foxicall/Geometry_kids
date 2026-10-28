import { useEffect, useReducer, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Box, CheckCircle2, ChevronDown, Clock3, Compass, Grid2X2, Lightbulb, RotateCcw, Sparkles } from 'lucide-react';
import { LEVELS, REASONING_TOPICS, TOPIC_NAMES, makeReasoningQuestion, makeReasoningRound } from '../lib/reasoningQuestions';
import { initialReasoning, readReasoningRecords, reasoningReducer, saveReasoningRecord } from '../lib/reasoningGame';
import { createSessionId, formatTime } from '../lib/game';
import type { ReasoningLevel, ReasoningQuestion } from '../types/reasoning';
import { ReasoningDiagram } from './ReasoningDiagram';
import '../reasoning.css';

function Explanation({ question, count }: { question: ReasoningQuestion; count: number }) {
  return <ol className="reasoning-steps">{question.steps.slice(0, count).map((step, i) => <li key={step.title}><span>{i + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p><strong>{step.calculation}</strong></div></li>)}</ol>;
}

export function ReasoningGame({ onSolid, onMatrix }: { onSolid: () => void; onMatrix: () => void }) {
  const [level, setLevel] = useState<ReasoningLevel>('warmup');
  const [state, dispatch] = useReducer(reasoningReducer, initialReasoning);
  const [now, setNow] = useState(Date.now), [saved, setSaved] = useState(true);
  const [records, setRecords] = useState(readReasoningRecords), [example, setExample] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const active = state.phase === 'playing' || state.phase === 'feedback';
  const question = state.questions[state.index], attempt = state.attempts.at(-1);
  const currentLevel = LEVELS.find((l) => l.id === level)!;
  const elapsed = state.elapsedMs + (state.phase === 'playing' ? Math.max(0, now - state.startedAt) : 0);
  const sample = makeReasoningQuestion('height', 'warmup', 0);

  useEffect(() => {
    if (state.phase !== 'playing') return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [state.phase]);
  useEffect(() => {
    if (state.phase === 'complete') { setSaved(saveReasoningRecord(state)); setRecords(readReasoningRecords()); }
  }, [state]);
  useEffect(() => { if (active || state.phase === 'complete') heading.current?.focus(); }, [state.index, state.phase, active]);
  function start(nextLevel = level) { const time = Date.now(); setLevel(nextLevel); setNow(time); setExample(false); dispatch({ type: 'start', questions: makeReasoningRound(nextLevel), now: time, id: createSessionId() }); }
  function next() { const time = Date.now(); setNow(time); dispatch({ type: 'next', now: time }); }

  return <div className="reasoning-app">
    <header className="reasoning-header"><button className="reasoning-brand" onClick={() => dispatch({ type: 'reset' })}><Box size={25} /><span>幾何小建築師<small>用看得懂的方法，想深一點</small></span></button><nav aria-label="遊戲模式"><button aria-current="page" onClick={() => dispatch({ type: 'reset' })}><Compass size={16} />幾何推理</button><button onClick={onSolid}><Box size={16} />立體觀察室</button><button onClick={onMatrix}><Grid2X2 size={16} />圖形規律練習</button></nav></header>
    <main className="reasoning-main">
      {state.phase === 'intro' && <>
        <section className="reasoning-hero"><div><span className="reasoning-kicker"><Sparkles size={16} />從國小的直覺，走向國中的推理</span><h1>幾何難題，<br />我們一起拆小步。</h1><p>先動一動圖形，再找出線索。<br />不用急著背公式，每個「為什麼」都有圖解陪你。</p><div className="reasoning-badges"><span>6 類觀念</span><span>72 題原創變化</span><span>離線也能玩</span></div></div><div className="reasoning-hero-figure"><ReasoningDiagram question={sample} /><span className="reasoning-demo-caption">試著移動頂點：面積真的沒變嗎？</span></div></section>
        <section className="reasoning-levels" aria-label="選擇推理程度"><div className="reasoning-section-title"><h2>從適合你的那一階開始</h2><span>每輪 6 題 · 沒有倒數壓力</span></div><div className="reasoning-level-grid">{LEVELS.map((l, i) => <button key={l.id} aria-pressed={level === l.id} onClick={() => setLevel(l.id)}><span className="reasoning-level-number">0{i + 1}</span><h3>{l.name}</h3><p>{l.description}</p><small>{l.prerequisite}</small>{level === l.id && <CheckCircle2 size={18} />}</button>)}</div><div className="reasoning-start-row"><div><strong>{currentLevel.name}</strong><p>提示隨時可看，不扣分。可以先看示範，再自己試一次。</p></div><button className="reasoning-secondary" onClick={() => setExample(!example)} aria-expanded={example}><BookOpen size={17} />{example ? '收起示範' : '先看一題示範'}</button><button className="reasoning-primary" onClick={() => start()}>開始 6 題推理<ArrowRight size={18} /></button></div></section>
        {example && <section className="reasoning-example"><h2>示範：{sample.title}</h2><p>左底 4 公分，高 4 公分，先看三角形是長方形的一半。</p><Explanation question={sample} count={3} /></section>}
        <section className="reasoning-topics"><h2>這次會發現什麼？</h2><div>{REASONING_TOPICS.map((topic, i) => <span key={topic}><small>0{i + 1}</small>{TOPIC_NAMES[topic]}</span>)}</div><p>新名詞會用白話解釋；需要平方時，先從「同一個數乘自己」開始。</p></section>
        <details className="reasoning-history"><summary>本機推理紀錄（{records.length}）<ChevronDown size={16} /></summary>{records.length ? records.map((r) => <div key={r.id}><span>{LEVELS.find((l) => l.id === r.level)?.name}</span><strong>{r.correct} / 6 題</strong><span>提示 {r.hints} 次</span><span>{formatTime(r.elapsedMs)}</span></div>) : <p>完成一輪後，紀錄會留在這個瀏覽器，不會上傳。</p>}</details>
      </>}
      {active && question && <>
        <div className="reasoning-session"><span>{currentLevel.name} <b>第 {state.index + 1} / 6 題</b></span><span><Clock3 size={16} /><time aria-label="推理作答時間">{formatTime(elapsed)}</time></span><button onClick={() => start()} aria-label="重新開始推理"><RotateCcw size={16} />重新開始</button></div>
        <div className="reasoning-progress" role="progressbar" aria-label="推理挑戰進度" aria-valuemin={0} aria-valuemax={6} aria-valuenow={state.attempts.length}>{REASONING_TOPICS.map((topic, i) => <i key={topic} className={i < state.attempts.length ? 'done' : i === state.index ? 'current' : ''} />)}</div>
        <div className="reasoning-question-heading"><span className="reasoning-kicker">{TOPIC_NAMES[question.topic]}</span><h1 ref={heading} tabIndex={-1}>{question.title}</h1><p>{question.prompt}</p></div>
        <div className="reasoning-workspace"><section className="reasoning-picture-card"><ReasoningDiagram key={question.id} question={question} revealed={state.phase === 'feedback'} /><div className="reasoning-given"><h2>已知的線索</h2><ul>{question.given.map((given) => <li key={given}>{given}</li>)}</ul><small>依標示條件推理，不用量螢幕上的長度或角度。</small></div></section>
          <section className="reasoning-answer-card"><div className="reasoning-prerequisite"><BookOpen size={18} /><div><h2>先知道這件事</h2><p>{question.prerequisite}</p></div></div><h2>你發現的答案是？</h2><div className="reasoning-options" role="group" aria-label="推理答案選項">{question.options.map((value, i) => <button key={value} disabled={state.phase !== 'playing'} aria-pressed={state.selected === value} className={`${state.selected === value ? 'selected' : ''} ${state.phase === 'feedback' && value === question.answer ? 'correct' : ''} ${state.phase === 'feedback' && state.selected === value && value !== question.answer ? 'incorrect' : ''}`} onClick={() => dispatch({ type: 'select', value })}><span>{String.fromCharCode(65 + i)}</span><strong>{value}<small>{question.unit}</small></strong>{state.phase === 'feedback' && value === question.answer && <CheckCircle2 size={18} />}</button>)}</div>
            {state.phase === 'playing' ? <><button className="reasoning-primary wide" disabled={state.selected === null} onClick={() => dispatch({ type: 'submit', now: Date.now() })}>確認我的推理<CheckCircle2 size={18} /></button><div className="reasoning-hints">{question.hints.slice(0, state.hints).map((hint, i) => <p key={hint}><b>提示 {i + 1}</b>{hint}</p>)}<button className="reasoning-hint-button" disabled={state.hints === question.hints.length} onClick={() => dispatch({ type: 'hint' })}><Lightbulb size={17} />{state.hints === 0 ? '給我第一個提示' : state.hints === question.hints.length ? '提示都在這裡了' : '再給我一個提示'}<small>{state.hints} / 3</small></button><small>看提示不扣分，理解比猜對更重要。</small></div></> : <div className="reasoning-feedback" role="status"><strong>{attempt?.correct ? '找到了！一起確認你的想法。' : '再看一個線索，你就更接近了。'}</strong><p>正確答案：{question.answer} {question.unit}</p><p>{question.concept}</p></div>}
          </section></div>
        {state.phase === 'feedback' && <section className="reasoning-explanation"><div className="reasoning-section-title"><h2><Lightbulb size={20} />把解法拆成小步驟</h2><span>{state.steps} / {question.steps.length} 步</span></div><Explanation question={question} count={state.steps} /><div className="reasoning-step-actions">{state.steps < question.steps.length && <button className="reasoning-secondary" onClick={() => dispatch({ type: 'step' })}>看下一步<ChevronDown size={16} /></button>}<button className="reasoning-primary" onClick={next}>{state.index === 5 ? '看看這次的收穫' : '下一道推理題'}<ArrowRight size={18} /></button></div></section>}
      </>}
      {state.phase === 'complete' && <section className="reasoning-results"><span className="reasoning-result-icon"><Sparkles size={36} /></span><span className="reasoning-kicker">每一步理解，都是一次進步</span><h1 ref={heading} tabIndex={-1}>你完成了一趟幾何推理！</h1><div className="reasoning-result-stats"><div><strong data-testid="reasoning-correct">{state.attempts.filter((a) => a.correct).length} / 6</strong><span>這次答對</span></div><div><strong>{state.attempts.reduce((s, a) => s + a.hints, 0)} 次</strong><span>使用提示 · 不扣分</span></div><div><strong>{formatTime(state.elapsedMs)}</strong><span>專心思考的時間</span></div></div><p>{saved ? '紀錄已留在本機。一起看看哪些觀念可以再練一次。' : '瀏覽器無法儲存紀錄，但這次的解答仍在下方。'}</p><div className="reasoning-result-actions"><button className="reasoning-secondary" onClick={() => dispatch({ type: 'reset' })}>回到程度選擇</button><button className="reasoning-primary" onClick={() => start()}>同程度換題再試<RotateCcw size={17} /></button></div><div className="reasoning-review">{state.attempts.map((a, i) => <details key={a.question.id}><summary><span>{i + 1}</span><div><strong>{TOPIC_NAMES[a.question.topic]}</strong><small>{a.correct ? '已找到答案' : '再練一次會更熟悉'} · 提示 {a.hints} 次</small></div><ChevronDown size={17} /></summary><p>{a.question.prompt}</p><p>你的答案：{a.selected} {a.question.unit}；正確答案：{a.question.answer} {a.question.unit}</p><ReasoningDiagram question={a.question} revealed /><Explanation question={a.question} count={3} /></details>)}</div></section>}
    </main><footer className="reasoning-footer">原創幾何練習 · 不需要帳號 · 三種模式的紀錄各自保留在本機</footer>
  </div>;
}
