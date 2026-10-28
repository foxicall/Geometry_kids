import { useState } from 'react';
import type { MiniGameProps } from '../types/game';
import { buttonClass, Canvas, Readout, SvgButton } from './shared';
const names = ['萬位', '千位', '百位', '十位', '個位'];
export function PlaceValueGame({ board, mode, disabled, onAction }: MiniGameProps) {
  const [slot, setSlot] = useState(0);
  if (board.kind !== 'place') return null;
  return (
    <>
      <p className="text-sm">先點舞台，再點數字卡。藍色舞台是目前選的位置。</p>
      <Canvas label="五個位值舞台" viewBox="0 0 440 250">
        {board.slots.map((n, i) => (
          <SvgButton
            key={i}
            label={`選擇${names[i]}`}
            disabled={disabled}
            onClick={() => setSlot(i)}
          >
            <rect
              x={8 + i * 86}
              y={20}
              width={78}
              height={210}
              rx={12}
              fill={slot === i ? '#d5f3ed' : '#fff'}
              stroke={slot === i ? '#0f766e' : '#cbd5e1'}
              strokeWidth={2}
            />
            <text x={47 + i * 86} y={52} textAnchor="middle" fontSize={16}>
              {names[i]}
            </text>
            <text x={47 + i * 86} y={100} textAnchor="middle" fontSize={32} fontWeight="bold">
              {n ?? '?'}
            </text>
            {Array.from({ length: n ?? 0 }, (_, k) => (
              <circle
                key={k}
                cx={29 + i * 86 + (k % 3) * 18}
                cy={125 + Math.floor(k / 3) * 20}
                r={6}
                fill="#0f766e"
              />
            ))}
            <text x={47 + i * 86} y={207} textAnchor="middle" fontSize={12}>
              {n === null ? '等你放卡' : n * 10 ** (4 - i)}
            </text>
          </SvgButton>
        ))}
      </Canvas>
      <p className="mb-2 text-sm">把卡放到：{names[slot]}</p>
      <div className="flex flex-wrap gap-2">
        {(mode === 'challenge' ? [2, 4, 0, 7, 9] : Array.from({ length: 10 }, (_, i) => i)).map(
          (n) => (
            <button
              key={n}
              className={buttonClass}
              disabled={disabled}
              aria-label={`放入數字 ${n}`}
              onClick={() => {
                onAction({ type: 'place', slot, digit: n });
                setSlot((slot + 1) % 5);
              }}
            >
              {n}
            </button>
          ),
        )}
      </div>
      <Readout>{board.slots.map((n) => n ?? '□').join('')}</Readout>
      <p className="break-words text-sm">
        展開式：{board.slots.map((n, i) => `${n ?? '□'} × ${10 ** (4 - i)}`).join(' + ')}
      </p>
    </>
  );
}
