import { ArrowRight, Check, Clock3, ShieldCheck, Sparkles } from 'lucide-react';
import { ExplorerArt } from './ExplorerArt';
import { routes } from '../lib/routes';
import { ROUND_LENGTH } from '../lib/game';
import type { Difficulty } from '../types/matrix';

export function HomePage({ difficulty, setDifficulty, adaptive, setAdaptive, onStart }: {
  difficulty: Difficulty; setDifficulty: (value: Difficulty) => void;
  adaptive: boolean; setAdaptive: (value: boolean) => void; onStart: () => void;
}) {
  return <>
    <section className="hero">
      <div className="hero-copy"><span className="eyebrow"><span />HELLO, LITTLE EXPLORER</span><h1>每個圖形，<br />都藏著<span>小祕密。</span><svg viewBox="0 0 210 12" aria-hidden="true"><path d="M3 8 Q95 -2 205 6" /></svg></h1><p>轉一轉、數一數、找一找。<br />和形狀探險隊一起，把好奇心變成新發現。</p><div className="hero-tags"><span><ShieldCheck size={15} />原創圖形練習</span><span><Clock3 size={15} />沒有時間壓力</span></div></div>
      <ExplorerArt />
    </section>
    <section className="routes-section" aria-labelledby="routes-title"><div className="section-title"><div><span className="section-kicker">YOUR NEXT ADVENTURE</span><h2 id="routes-title">今天，想去哪裡探險？</h2></div><span className="subtle">選一條喜歡的路線就出發</span></div>
      <div className="route-grid">{(Object.keys(routes) as Difficulty[]).map((level) => { const route = routes[level]; const Icon = route.icon; return <button key={level} className={`route-card ${route.color} ${difficulty === level ? 'selected' : ''}`} onClick={() => setDifficulty(level)} aria-pressed={difficulty === level}>
        <div className="route-top"><span className="route-icon"><Icon size={27} strokeWidth={1.6} /></span><span className="route-level">{route.label}</span></div><h3>{route.title}</h3><p>{route.description}</p><div className="route-bottom"><span><span className="mini-grid" aria-hidden="true">▦</span>{route.size} 矩陣</span><span className="selection-dot">{difficulty === level && <Check size={13} />}</span></div>
      </button>; })}</div>
    </section>
    <section className="launch-panel"><div className="launch-info"><div className="launch-heading"><Sparkles size={18} /><strong>跟著你的步調，一起進步</strong><button role="switch" aria-checked={adaptive} aria-label="自適應難度" className={`switch ${adaptive ? 'on' : ''}`} onClick={() => setAdaptive(!adaptive)}><span /></button></div><p>{adaptive ? '依照作答調整下一題難度，每一步都剛剛好。' : '固定練習所選難度，慢慢熟悉圖形的規律。'}</p></div><button className="primary-button launch-button" onClick={onStart}>開始探險<ArrowRight size={19} /></button><span className="round-caption">一趟 {ROUND_LENGTH} 題 · 隨時可以重新開始</span></section>
    <section className="how-section" aria-label="三個探險小步驟"><div><span className="step-number">01</span><p><strong>仔細觀察</strong><span>找找圖形哪裡不一樣</span></p></div><i /><div><span className="step-number">02</span><p><strong>發現規律</strong><span>想想橫列與直欄的線索</span></p></div><i /><div><span className="step-number">03</span><p><strong>選出答案</strong><span>把缺少的那一塊補起來</span></p></div></section>
  </>;
}
