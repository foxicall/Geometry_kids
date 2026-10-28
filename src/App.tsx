import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { MatrixApp } from './MatrixApp';
import { SolidGame } from './components/SolidGame';
import { ReasoningGame } from './components/ReasoningGame';
import './solid.css';

export function App() {
  const [mode, setMode] = useState<'reasoning' | 'solid' | 'matrix'>(() => {
    const requested = new URLSearchParams(window.location.search).get('mode');
    return requested === 'matrix' || requested === 'solid' ? requested : 'reasoning';
  });
  if (mode === 'matrix') return <><button className="back-to-solids" onClick={() => setMode('solid')}><ArrowLeft size={16} />回到立體觀察室</button><MatrixApp /></>;
  if (mode === 'solid') return <SolidGame onMatrix={() => setMode('matrix')} onReasoning={() => setMode('reasoning')} />;
  return <ReasoningGame onSolid={() => setMode('solid')} onMatrix={() => setMode('matrix')} />;
}
