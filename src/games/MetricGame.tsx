import type { MiniGameProps } from '../types/game';
import { metricPresets } from './math';
import { buttonClass, Canvas, NumberEntry } from './shared';
export function MetricGame({ board, mode, disabled, onAction }: MiniGameProps) {
  if (board.kind !== 'metric') return null;
  const p = metricPresets[board.preset],
    converted = board.converted === p.major * p.ratio;
  return (
    <>
      {mode === 'playground' && (
        <div className="flex flex-wrap gap-2">
          {metricPresets.map((preset, value) => (
            <button
              className={buttonClass}
              key={value}
              aria-pressed={value === board.preset}
              onClick={() => onAction({ type: 'metric-preset', value })}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
      <Canvas label={`${p.major} ${p.unit}平均分給 ${p.people} 人`}>
        <rect x={30} y={35} width={160} height={80} rx={15} fill="#e7d7b6" />
        <text x={110} y={68} textAnchor="middle" fontSize={17}>
          {p.label}
        </text>
        <text x={110} y={97} textAnchor="middle" fontSize={21}>
          {p.major} {p.unit}
        </text>
        <path d="M200 75H240m-10-10 10 10-10 10" fill="none" stroke="#0f766e" strokeWidth={3} />
        <rect
          x={250}
          y={35}
          width={160}
          height={80}
          rx={15}
          fill={converted ? '#d5f3ed' : '#e2e8f0'}
        />
        <text x={330} y={80} textAnchor="middle" fontSize={21}>
          {board.converted ?? '？'} {p.small}
        </text>
        <path d="M220 130v25m-10-10 10 10 10-10" fill="none" stroke="#0f766e" strokeWidth={3} />
        <text x={220} y={192} textAnchor="middle" fontSize={20}>
          平均分給 {p.people} 人
        </text>
        <text x={220} y={235} textAnchor="middle" fontSize={24}>
          每人 {board.portion ?? '？'} {p.small}
        </text>
      </Canvas>
      <NumberEntry
        label={`換算總量（${p.small}）`}
        value={board.converted}
        disabled={disabled}
        onCommit={(value) => onAction({ type: 'convert', value })}
      />
      <NumberEntry
        label={`每人份量（${p.small}）`}
        value={board.portion}
        disabled={disabled}
        onCommit={(value) => onAction({ type: 'portion', value })}
      />
    </>
  );
}
