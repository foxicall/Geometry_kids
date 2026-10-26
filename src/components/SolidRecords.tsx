import { useState } from 'react';
import { ArrowRight, Trophy } from 'lucide-react';
import { formatTime } from '../lib/game';
import type { SolidRecord } from '../lib/solidGame';

export function SolidRecords({ records, onStart }: { records: SolidRecord[]; onStart: () => void }) {
  const [sort, setSort] = useState<'score' | 'recent'>('score');
  const sorted = [...records].sort((a, b) => sort === 'score' ? b.score - a.score || a.elapsedMs - b.elapsedMs : Date.parse(b.date) - Date.parse(a.date));
  return <section className="solid-records"><div className="solid-section-heading"><div><span className="solid-eyebrow">YOUR LITTLE ACHIEVEMENTS</span><h1>本機挑戰榜</h1><p>只記錄這個瀏覽器的練習，不會上傳暱稱或成績。</p></div><Trophy size={35} /></div><div className="records-sort" role="group" aria-label="紀錄排序"><button aria-pressed={sort === 'score'} onClick={() => setSort('score')}>依最高分</button><button aria-pressed={sort === 'recent'} onClick={() => setSort('recent')}>依最近挑戰</button></div>
    {sorted.length ? <div className="solid-record-table"><table><thead><tr><th>排名</th><th>建築師</th><th>得分</th><th>觀察時間</th><th>日期</th></tr></thead><tbody>{sorted.map((record, index) => <tr key={record.id}><td><span className={index < 3 ? 'top-rank' : ''}>{index + 1}</span></td><td>{record.nickname}</td><td><strong>{record.score}</strong></td><td>{formatTime(record.elapsedMs)}</td><td>{new Date(record.date).toLocaleDateString('zh-TW')}</td></tr>)}</tbody></table></div> : <div className="solid-empty"><span>✧</span><h2>你的第一份建築藍圖，等著完成。</h2><p>完成 10 關，就能在這裡看見自己的進步。</p></div>}
    <button className="solid-button" onClick={onStart}>開始新的挑戰<ArrowRight size={18} /></button></section>;
}
