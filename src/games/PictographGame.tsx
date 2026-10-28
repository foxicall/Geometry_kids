import { useId, useState } from 'react';
import type { MiniGameProps } from '../types/game';
import { buttonClass, Canvas, Range, Readout } from './shared';
export function PictographGame({ board, mode, disabled, onAction }: MiniGameProps) {
  const id = useId(),
    [numerator, setNumerator] = useState(''),
    [denominator, setDenominator] = useState('');
  if (board.kind !== 'pictograph') return null;
  const n = Number(numerator),
    d = Number(denominator),
    valid =
      numerator !== '' &&
      denominator !== '' &&
      Number.isInteger(n) &&
      Number.isInteger(d) &&
      n >= 0 &&
      n <= 1000 &&
      d >= 1 &&
      d <= 1000;
  return (
    <>
      {mode === 'playground' && (
        <Range
          label="每圖案代表枝數"
          value={board.scale}
          min={2}
          max={10}
          onChange={(value) => onAction({ type: 'scale', value })}
        />
      )}
      <p>
        1 圖案＝{board.scale} 枝；全班共 {28 * board.scale} 枝。
      </p>
      <Canvas label="五位同學的蠟燭統計圖" viewBox="0 0 440 315">
        <defs>
          <clipPath id={`${id}-half`}>
            <rect x={0} y={0} width={12} height={40} />
          </clipPath>
        </defs>
        {[7, 5, 7, 4, board.icons].map((count, row) => (
          <g key={row} transform={`translate(0, ${20 + row * 59})`}>
            <text x={12} y={28} fontSize={17}>
              {['小安', '小明', '小可', '小樂', '小雪'][row]}
            </text>
            {Array.from({ length: Math.ceil(count) }, (_, i) => (
              <g
                key={i}
                transform={`translate(${75 + i * 34},0)`}
                clipPath={i + 1 > count ? `url(#${id}-half)` : undefined}
              >
                <path d="M12 2Q25 15 12 18Q0 15 12 2" fill="#de963c" />
                <rect
                  x={4}
                  y={19}
                  width={16}
                  height={27}
                  rx={3}
                  fill={row === 4 ? '#55a58f' : '#aabdd2'}
                />
              </g>
            ))}
          </g>
        ))}
      </Canvas>
      <div className="flex flex-wrap gap-2">
        <button
          className={buttonClass}
          disabled={disabled || board.icons < 1}
          onClick={() => onAction({ type: 'icons', value: board.icons - 1 })}
        >
          減少一個圖案
        </button>
        <button
          className={buttonClass}
          disabled={disabled || board.icons > 9}
          onClick={() => onAction({ type: 'icons', value: board.icons + 1 })}
        >
          增加一個圖案
        </button>
        {mode === 'playground' && (
          <>
            <button
              className={buttonClass}
              disabled={board.icons > 9.5}
              onClick={() => onAction({ type: 'icons', value: board.icons + 0.5 })}
            >
              增加半個圖案
            </button>
            <button
              className={buttonClass}
              disabled={board.icons < 0.5}
              onClick={() => onAction({ type: 'icons', value: board.icons - 0.5 })}
            >
              減少半個圖案
            </button>
          </>
        )}
      </div>
      <Readout>
        小雪：{board.icons} 個圖案 = {board.icons * board.scale} 枝
      </Readout>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !disabled) onAction({ type: 'share', numerator: n, denominator: d });
        }}
      >
        <p className="text-sm">
          小安占全班的最簡分數（已設定：{board.shareN ?? '？'}/{board.shareD ?? '？'}）
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          {[
            ['占比分子', numerator, setNumerator],
            ['占比分母', denominator, setDenominator],
          ].map(([label, value, setter]) => (
            <label className="min-w-0 flex-1 text-sm" key={String(label)}>
              {String(label)}
              <input
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3"
                type="number"
                inputMode="numeric"
                min={label === '占比分母' ? 1 : 0}
                max={1000}
                disabled={disabled}
                value={String(value)}
                onChange={(e) => (setter as (value: string) => void)(e.target.value)}
              />
            </label>
          ))}
          <button className={buttonClass} disabled={disabled || !valid}>
            設定占比分數
          </button>
        </div>
      </form>
    </>
  );
}
