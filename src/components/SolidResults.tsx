import { ArrowRight, CheckCircle2, ChevronDown, Clock3, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { COUNT_FIELDS, COUNT_LABELS, solidExplanation, solidName } from '../lib/solids';
import { formatTime } from '../lib/game';
import type { SolidGameState } from '../lib/solidGame';

export function SolidResults({ state, onRestart, onRecords }: { state: SolidGameState; onRestart: () => void; onRecords: () => void }) {
  const correct = state.attempts.reduce((sum, attempt) => sum + COUNT_FIELDS.filter((field) => attempt.correct[field]).length, 0);
  const perfect = state.attempts.filter((attempt) => COUNT_FIELDS.every((field) => attempt.correct[field])).length;
  return <section className="solid-results">
    <div className="solid-result-hero"><span className="solid-trophy"><Trophy size={40} /></span><span className="solid-eyebrow">MISSION COMPLETE</span><h1>{state.nickname}，觀察任務完成！</h1><p>每次換個角度看，都會有新的發現。</p></div>
    <div className="solid-result-stats"><div><Trophy size={20} /><strong data-testid="final-solid-score">{state.score}<small> / 300</small></strong><span>本次挑戰得分</span></div><div><CheckCircle2 size={20} /><strong>{perfect}<small> / 10</small></strong><span>三項全對的關卡</span></div><div><Clock3 size={20} /><strong>{formatTime(state.elapsedMs)}</strong><span>專心觀察的時間</span></div></div>
    <div className="solid-result-actions"><button className="solid-button secondary" onClick={onRecords}>查看本機挑戰榜<ArrowRight size={17} /></button><button className="solid-button" onClick={onRestart}>再挑戰 10 關<RotateCcw size={17} /></button></div>
    <section className="solid-analysis"><h2><Sparkles size={20} />你的觀察力報告</h2><p>這次答對了 {correct} / 30 項，一起看看哪些線索已經熟悉。</p><div className="solid-analysis-grid">{COUNT_FIELDS.map((field) => { const count = state.attempts.filter((attempt) => attempt.correct[field]).length; return <div className={`metric-${field}`} key={field}><span>{COUNT_LABELS[field]}</span><strong>{count} / 10</strong><div><i style={{ width: `${count * 10}%` }} /></div></div>; })}</div></section>
    <section className="solid-review"><h2>把每個立體，再認識一次</h2>{state.attempts.map((attempt, index) => <details className="solid-review-row" key={attempt.question.id}><summary><span className="solid-review-number">{String(index + 1).padStart(2, '0')}</span><strong>{solidName(attempt.question)}</strong><span>{COUNT_FIELDS.filter((field) => attempt.correct[field]).length} / 3 項答對</span><ChevronDown size={17} /></summary><div className="solid-review-body"><div className="solid-review-counts">{COUNT_FIELDS.map((field) => <div key={field}><span>{COUNT_LABELS[field]}</span><strong className={attempt.correct[field] ? 'count-right' : 'count-wrong'}>{attempt.answer[field]}</strong>{!attempt.correct[field] && <small>正確：{attempt.expected[field]}</small>}</div>)}</div><p>{solidExplanation(attempt.question)}</p><p className="solid-euler-proof">{attempt.expected.vertices} ＋ {attempt.expected.faces} − {attempt.expected.edges} ＝ 2 ✓</p></div></details>)}</section>
  </section>;
}
