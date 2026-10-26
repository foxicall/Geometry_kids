import { CellRenderer } from './components/CellRenderer';

export function App() {
  return <main className="mx-auto max-w-3xl p-12 text-center">
    <p className="text-sm font-semibold tracking-widest text-teal-700">SHAPE EXPLORERS</p>
    <h1 className="mt-4 text-4xl font-bold">形狀探險隊</h1>
    <p className="mt-4 text-slate-600">小小邏輯，大大發現。</p>
    <CellRenderer cell={{ shape: 'star', rotation: 0, fill: 'striped', count: 3 }} className="mx-auto mt-8 h-40 w-40 text-teal-700" />
  </main>;
}
