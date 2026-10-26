import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Clock3, Lightbulb, RotateCcw, Sparkles, Target, Trophy } from 'lucide-react';
import { CellRenderer } from './CellRenderer';
import { attributeLabels } from '../lib/matrix';
import { formatTime, ROUND_LENGTH } from '../lib/game';
import { routes } from '../lib/routes';
import type { GameState } from '../lib/game';
import type { GeometryUnit } from '../types/matrix';

export function ResultsPage({ state, onRestart, onHome }: { state: GameState; onRestart: () => void; onHome: () => void }) {
  const correct = state.answers.filter((answer) => answer.correct).length;
  const attributes = Object.keys(attributeLabels) as (keyof GeometryUnit)[];
  return <section className="results-section"><div className="result-hero"><span className="trophy-circle"><Trophy size={39} strokeWidth={1.5} /></span><span className="section-kicker">ADVENTURE COMPLETED</span><h1>又完成了一次新發現！</h1><p>你願意觀察、思考、再試一次，這就是進步。</p></div><div className="result-stats"><div><Target size={20} /><strong>{correct}<small> / {ROUND_LENGTH}</small></strong><span>個正確發現</span></div><div><Clock3 size={20} /><strong>{formatTime(state.elapsedMs)}</strong><span>專心思考的時間</span></div><div><Sparkles size={20} /><strong>{Math.round(correct / ROUND_LENGTH * 100)}<small>%</small></strong><span>本次答對比例</span></div></div><div className="result-actions"><button className="secondary-button" onClick={onHome}><ArrowLeft size={17} />回到基地</button><button className="primary-button" onClick={onRestart}>再探險一次<RotateCcw size={17} /></button></div><section className="insights-panel"><h2>這次練習了哪些觀察力？</h2><div className="insight-grid">{attributes.map((attribute) => {
    const attempts = state.answers.filter((answer) => answer.question.rules.some((rule) => rule.attribute === attribute));
    const successes = attempts.filter((answer) => answer.correct).length;
    return <div key={attribute}><span>{attributeLabels[attribute]}</span><strong>{attempts.length ? `${successes} / ${attempts.length}` : '下次探索'}</strong><div className="insight-track"><i style={{ width: `${attempts.length ? successes / attempts.length * 100 : 0}%` }} /></div></div>;
  })}</div><p>一題可能練習多種規律；這是本次練習紀錄，不代表能力排名。</p></section><section className="review-section"><h2>把小祕密，再看一次</h2>{state.answers.map((attempt, index) => {
    const answer = attempt.question.options.find((option) => option.id === attempt.question.correctOptionId)!;
    const chosen = attempt.question.options.find((option) => option.id === attempt.selectedOptionId)!;
    return <details className="review-item" key={attempt.question.id}><summary><span className={attempt.correct ? 'review-correct' : 'review-learning'}>{attempt.correct ? <CheckCircle2 size={19} /> : <Lightbulb size={19} />}</span><strong>第 {index + 1} 題</strong><span>{routes[attempt.question.difficulty].label} · {attempt.correct ? '發現了規律' : '再看一次規律'}</span><ChevronRight size={16} /></summary><div className="review-detail"><div className="review-shapes"><div><CellRenderer cell={chosen.cell} /><small>你的選擇</small></div><ArrowRight size={18} /><div><CellRenderer cell={answer.cell} /><small>正確圖形</small></div></div><p>{attempt.question.explanation}</p></div></details>;
  })}</section></section>;
}
