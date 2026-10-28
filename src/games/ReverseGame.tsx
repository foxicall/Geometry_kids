import type { MiniGameProps } from '../types/game';
import { displayNumber, reverseOptions } from './math';
import { buttonClass, Canvas, Readout } from './shared';
export function ReverseGame({ board, disabled, onAction }: MiniGameProps) {
  if (board.kind !== 'reverse') return null;
  return (
    <>
      <p className="text-sm">正向機器：原數 → ×10 → +12 → ×4 → −500 → 348</p>
      <Canvas label="倒帶運算機" viewBox="0 0 440 180">
        {['×10', '+12', '×4', '−500'].map((op, i) => (
          <g key={op}>
            <circle
              cx={65 + i * 103}
              cy={78}
              r={40}
              fill={i >= 4 - board.operations.length ? '#d5f3ed' : '#e2e8f0'}
              stroke="#94a3b8"
              strokeWidth={4}
              strokeDasharray="8 4"
            />
            <text x={65 + i * 103} y={85} textAnchor="middle" fontSize={22}>
              {op}
            </text>
          </g>
        ))}
        <text x={220} y={153} textAnchor="middle" fontSize={18}>
          倒帶從右邊開始 ←
        </text>
      </Canvas>
      <Readout>目前數值：{displayNumber(board.current)}</Readout>
      <p className="mb-4 break-words text-sm">
        倒帶紀錄：348 {board.operations.map((op) => `→ ${op}`).join(' ') || '（尚未操作）'}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.keys(reverseOptions).map((operation) => (
          <button
            className={buttonClass}
            key={operation}
            disabled={disabled}
            onClick={() => onAction({ type: 'reverse', operation })}
          >
            {operation}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        探索可試不同順序；非整數最多顯示五位小數，範圍限制在正負一百萬內。
      </p>
    </>
  );
}
