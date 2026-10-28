import type { MiniGameProps } from '../types/game';
import { buttonClass, Canvas, NumberEntry, Range, Readout } from './shared';
export function RoundingGame({ board, mode, disabled, onAction }: MiniGameProps) {
  if (board.kind !== 'rounding') return null;
  const low = Math.floor(board.number / board.precision) * board.precision,
    position = (board.number - low) / board.precision,
    x = 50 + position * 340;
  return (
    <>
      {mode === 'playground' && (
        <>
          <NumberEntry
            label="小車數值"
            value={board.number}
            max={99999}
            disabled={disabled}
            onCommit={(value) => onAction({ type: 'round-number', value })}
          />
          <Range
            label="估算位階（1 十、2 百、3 千）"
            value={Math.log10(board.precision)}
            min={1}
            max={3}
            onChange={(n) => onAction({ type: 'round-precision', value: 10 ** n })}
          />
        </>
      )}
      <Canvas label={`${board.number} 在 ${low} 與 ${low + board.precision} 的數線上`}>
        <path d="M50 170Q220 -40 390 170" stroke="#b8d7cb" strokeWidth={8} fill="none" />
        <path d="M50 210H390M220 70V220" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" />
        <text x={220} y={42} textAnchor="middle" fontSize={18}>
          中點 {low + board.precision / 2}
        </text>
        <g transform={`translate(${x}, 185)`}>
          <rect x={-20} y={-20} width={40} height={22} rx={7} fill="#0f766e" />
          <circle cx={-12} cy={5} r={6} fill="#334155" />
          <circle cx={12} cy={5} r={6} fill="#334155" />
          <text y={-30} textAnchor="middle" fontSize={18} fontWeight="bold">
            {board.number}
          </text>
        </g>
        <text x={50} y={246} textAnchor="middle" fontSize={16}>
          {low}
        </text>
        <text x={390} y={246} textAnchor="middle" fontSize={16}>
          {low + board.precision}
        </text>
      </Canvas>
      <div className="grid grid-cols-2 gap-3">
        {[low, low + board.precision].map((value) => (
          <button
            key={value}
            className={buttonClass}
            disabled={disabled}
            onClick={() => onAction({ type: 'round-choice', value })}
          >
            前往 {value}
          </button>
        ))}
      </div>
      <Readout>
        小車 {board.number} → {board.choice ?? '選擇月台'}
      </Readout>
    </>
  );
}
