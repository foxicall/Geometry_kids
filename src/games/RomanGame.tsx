import type { MiniGameProps } from '../types/game';
import { parseRoman } from './math';
import { buttonClass, Canvas, Readout } from './shared';
export function RomanGame({ board, disabled, onAction }: MiniGameProps) {
  if (board.kind !== 'roman') return null;
  const n = parseRoman(board.text),
    open = n === 465;
  return (
    <>
      <Canvas label="羅馬數字密碼門">
        <path
          d="M60 240V100Q220 -30 380 100V240Z"
          fill="#ddd6c5"
          stroke="#a79a82"
          strokeWidth={5}
        />
        <rect x={95} y={95} width={250} height={145} rx={12} fill={open ? '#c4e9dd' : '#334155'} />
        <text
          x={220}
          y={150}
          textAnchor="middle"
          fontSize={Math.min(32, 230 / Math.max(1, board.text.length))}
          fill={open ? '#145d50' : '#fff'}
        >
          {board.text || '等待密碼'}
        </text>
        <text x={220} y={207} textAnchor="middle" fontSize={24} fill={open ? '#145d50' : '#fff'}>
          {n ?? '？'}
        </text>
      </Canvas>
      <div className="flex flex-wrap gap-2">
        {Object.entries({ I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }).map(
          ([symbol, value]) => (
            <button
              className={buttonClass}
              key={symbol}
              disabled={disabled || board.text.length >= 15}
              aria-label={`加入 ${symbol}`}
              onClick={() => onAction({ type: 'roman', symbol })}
            >
              {symbol}
              <small className="ml-2 font-normal">{value}</small>
            </button>
          ),
        )}
        <button
          className={buttonClass}
          disabled={disabled || !board.text}
          onClick={() => onAction({ type: 'roman-delete' })}
        >
          刪除末位
        </button>
      </div>
      <Readout>
        {board.text || '空白'} → {n ?? '尚無合法數值'}
      </Readout>
    </>
  );
}
