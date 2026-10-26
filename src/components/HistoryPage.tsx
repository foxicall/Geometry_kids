import { ArrowRight, Clock3, Compass, Trophy } from 'lucide-react';
import { formatTime } from '../lib/game';
import type { SessionSummary } from '../lib/game';

export function HistoryPage({ history, onStart }: { history: SessionSummary[]; onStart: () => void }) {
  return <section className="history-section"><span className="section-kicker">LITTLE STEPS, BIG DISCOVERIES</span><h1>我的發現</h1><p className="subtle">每一次練習，都為好奇心留下足跡。紀錄只保存在這個瀏覽器。</p>{history.length ? <div className="history-list">{history.map((session) => <article className="history-card" key={session.id}><span className="history-icon"><Trophy size={22} /></span><div><h2>完成一趟圖形探險</h2><p>{new Date(session.date).toLocaleDateString('zh-TW')}</p></div><strong>{session.correct} / {session.total}<small>個正確發現</small></strong><span className="timer"><Clock3 size={16} />{formatTime(session.elapsedMs)}</span></article>)}</div> : <div className="empty-state"><Compass size={44} strokeWidth={1.4} /><h2>第一個發現，等著你！</h2><p>完成一趟探險後，就能在這裡看到練習紀錄。</p><button className="primary-button" onClick={onStart}>開始第一趟探險<ArrowRight size={18} /></button></div>}</section>;
}
