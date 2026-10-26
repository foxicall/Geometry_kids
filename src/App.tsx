import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { MatrixApp } from './MatrixApp';
import { SolidGame } from './components/SolidGame';
import './solid.css';

export function App() {
  const [mode, setMode] = useState<'solid' | 'matrix'>(() => new URLSearchParams(window.location.search).get('mode') === 'matrix' ? 'matrix' : 'solid');
  if (mode === 'matrix') return <><button className="back-to-solids" onClick={() => setMode('solid')}><ArrowLeft size={16} />回到立體觀察室</button><MatrixApp /></>;
  return <SolidGame onMatrix={() => setMode('matrix')} />;
}
