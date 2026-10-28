import type { MiniGameProps } from '../types/game';
import { Canvas, NumberEntry, Range, Readout } from './shared';
export function UnitaryGame({ board, mode, disabled, onAction }: MiniGameProps) {
  if (board.kind !== 'unitary') return null;
  return (
    <>
      <p>
        {board.count} 瓶共 {board.total} 毫升，客人需要 {board.wanted} 瓶。
      </p>
      {mode === 'playground' && (
        <Range
          label="已知瓶數（每瓶容量固定）"
          value={board.count}
          min={1}
          max={12}
          onChange={(value) => onAction({ type: 'unitary-count', value })}
        />
      )}
      <Canvas label={`已調配 ${board.quantity} 瓶`} viewBox="0 0 440 230">
        {Array.from({ length: board.quantity }, (_, i) => (
          <g
            key={i}
            transform={`translate(${15 + (i % 10) * 42}, ${18 + Math.floor(i / 10) * 105})`}
          >
            <path
              d="M12 0H26V20L34 30V82Q19 90 4 82V30L12 20Z"
              fill="#fff"
              stroke="#64748b"
              strokeWidth={2}
            />
            <rect
              x={7}
              y={83 - (Math.min(board.unit ?? 0, 120) / 120) * 50}
              width={24}
              height={(Math.min(board.unit ?? 0, 120) / 120) * 50}
              rx={4}
              fill="#4db6a2"
            />
            <text x={19} y={101} textAnchor="middle" fontSize={12}>
              {i + 1}
            </text>
          </g>
        ))}
      </Canvas>
      <NumberEntry
        label="單瓶毫升"
        value={board.unit}
        max={1000}
        disabled={disabled}
        onCommit={(value) => onAction({ type: 'unit', value })}
      />
      <NumberEntry
        label="調配瓶數"
        value={board.quantity}
        min={1}
        max={20}
        disabled={disabled}
        onCommit={(value) => onAction({ type: 'quantity', value })}
      />
      <Readout>
        {board.unit ?? '？'} × {board.quantity} ={' '}
        {board.unit === null ? '？' : board.unit * board.quantity} 毫升
      </Readout>
      <p className="text-xs text-slate-500">
        瓶內液面僅為示意，超過 120 毫升以滿瓶顯示；正確容量以數字為準。
      </p>
    </>
  );
}
