import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { MatrixApp } from './MatrixApp';
import { SolidGame } from './components/SolidGame';
import { ReasoningGame } from './components/ReasoningGame';
import { IMOGame } from './games/IMOGame';
import './solid.css';

type AppMode = 'imo' | 'reasoning' | 'solid' | 'matrix';
export function App() {
  const [mode, setMode] = useState<AppMode>(() => {
    const requested = new URLSearchParams(window.location.search).get('mode');
    return requested === 'matrix' || requested === 'solid' || requested === 'reasoning'
      ? requested
      : 'imo';
  });
  // 保留既有模式的網址入口與本機儲存鍵，不因新增玩法搬移或清除紀錄。
  const changeMode = (next: AppMode) => {
    setMode(next);
    window.scrollTo({ top: 0 });
  };
  if (mode === 'imo') return <IMOGame onMode={changeMode} />;
  return (
    <div className="legacy-game" data-mode={mode}>
      <div className="sticky top-0 z-20 border-b border-teal-100 bg-teal-50 px-4 py-2">
        <button
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-900"
          onClick={() => changeMode('imo')}
        >
          <ArrowLeft size={16} />
          回到 IMO 數學思考研究所
        </button>
      </div>
      {mode === 'matrix' ? (
        <>
          <button className="back-to-solids" onClick={() => changeMode('solid')}>
            <ArrowLeft size={16} />
            回到立體觀察室
          </button>
          <MatrixApp />
        </>
      ) : mode === 'solid' ? (
        <SolidGame
          onMatrix={() => changeMode('matrix')}
          onReasoning={() => changeMode('reasoning')}
        />
      ) : (
        <ReasoningGame onSolid={() => changeMode('solid')} onMatrix={() => changeMode('matrix')} />
      )}
    </div>
  );
}
