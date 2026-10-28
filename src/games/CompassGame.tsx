import type { MiniGameProps } from '../types/game';
import { ports, wrap } from './math';
import { buttonClass, Canvas, Readout } from './shared';
export function CompassGame({ board, mode, disabled, onAction }: MiniGameProps) {
  if (board.kind !== 'compass') return null;
  const ticks = board.start + board.turns.reduce((a, b) => a + b, 0),
    heading = wrap(ticks, 8);
  return (
    <>
      {mode === 'playground' && (
        <label className="block text-sm">
          起始港口（更換後轉向紀錄重設）
          <select
            className="ml-2 min-h-11 rounded-xl border border-slate-300 px-3"
            aria-label="起始港口"
            value={board.start}
            onChange={(e) => onAction({ type: 'start-direction', value: Number(e.target.value) })}
          >
            {ports.map((port, i) => (
              <option key={port} value={i}>
                {port}
              </option>
            ))}
          </select>
        </label>
      )}
      <Canvas label={`船頭面向${ports[heading]}`} viewBox="0 0 440 360">
        <circle cx={220} cy={180} r={120} fill="#e5f0f3" stroke="#bdd6de" strokeWidth={2} />
        {ports.map((port, i) => {
          const angle = (i * Math.PI) / 4 - Math.PI / 2,
            x = 220 + Math.cos(angle) * 145,
            y = 180 + Math.sin(angle) * 145;
          return (
            <g key={port}>
              <path
                d={`M220 180L${220 + Math.cos(angle) * 120} ${180 + Math.sin(angle) * 120}`}
                stroke="#bdd6de"
                strokeDasharray="4 5"
              />
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                fontSize={18}
                fontWeight={i === heading ? 'bold' : 'normal'}
                fill={i === heading ? '#0f766e' : '#475569'}
              >
                {port}
              </text>
            </g>
          );
        })}
        <g transform={`translate(220,180) rotate(${ticks * 45})`}>
          <path d="M0 -75 27 40Q0 60-27 40Z" fill="#0f766e" stroke="#fff" strokeWidth={3} />
          <path d="M0-50V35M0-38 20 22H0" fill="#f9dda0" stroke="#f9dda0" strokeWidth={2} />
        </g>
      </Canvas>
      <Readout>目前面向：{ports[heading]}</Readout>
      <div className="grid grid-cols-2 gap-2">
        {[-1, 1, -2, 2, -4, 4].map((value) => (
          <button
            key={value}
            className={buttonClass}
            disabled={disabled}
            onClick={() => onAction({ type: 'turn', value })}
          >
            {value < 0 ? '逆時針' : '順時針'}{' '}
            {Math.abs(value) === 1 ? '1/8' : Math.abs(value) === 2 ? '1/4' : '1/2'} 圈
          </button>
        ))}
      </div>
      <p className="mt-3 break-words text-sm">
        轉向紀錄：{board.turns.map((t) => `${t > 0 ? '+' : ''}${t * 45}°`).join('，') || '尚未轉向'}
      </p>
    </>
  );
}
