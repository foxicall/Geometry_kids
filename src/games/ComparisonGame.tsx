import type { MiniGameProps } from '../types/game';
import { lcm } from './math';
import { buttonClass, Canvas, NumberEntry } from './shared';
export function ComparisonGame({ board, mode, disabled, onAction }: MiniGameProps) {
  if (board.kind !== 'compare') return null;
  const common = lcm(board.b, board.d);
  return (
    <>
      {mode === 'playground' && (
        <div className="grid gap-2 sm:grid-cols-2">
          {(['a', 'b', 'c', 'd'] as const).map((field, i) => (
            <NumberEntry
              key={field}
              label={['左分子', '左分母', '右分子', '右分母'][i]}
              value={board[field]}
              max={field === 'a' ? board.b : field === 'c' ? board.d : 12}
              min={field === 'b' ? Math.max(1, board.a) : field === 'd' ? Math.max(1, board.c) : 0}
              disabled={disabled}
              onCommit={(value) => onAction({ type: 'compare-value', field, value })}
            />
          ))}
        </div>
      )}
      <Canvas label="全長相同的兩條分數跑道">
        {[
          [board.a, board.b],
          [board.c, board.d],
        ].map(([n, d], i) => {
          const divisions = board.normalized ? common : d;
          return (
            <g key={i} transform={`translate(30,${45 + i * 125})`}>
              <text y={0} fontSize={18}>
                {i === 0 ? '左車' : '右車'} {n}/{d}
                {board.normalized && ` = ${(n * common) / d}/${common}`}
              </text>
              <rect y={20} width={380} height={35} fill="#e2e8f0" rx={4} />
              <rect
                y={20}
                width={(380 * n) / d}
                height={35}
                fill={i === 0 ? '#66b8a7' : '#e6b36b'}
              />
              {Array.from({ length: divisions + 1 }, (_, k) => (
                <path
                  key={k}
                  d={`M${(k / divisions) * 380} 20v35`}
                  stroke="#475569"
                  strokeWidth={0.6}
                />
              ))}
              <circle cx={(n / d) * 380} cy={65} r={8} fill={i === 0 ? '#0f766e' : '#a76518'} />
            </g>
          );
        })}
      </Canvas>
      <button
        className={buttonClass}
        disabled={disabled || board.normalized}
        onClick={() => onAction({ type: 'normalize' })}
      >
        LCM 通分
      </button>
      <div className="mt-4 flex flex-wrap gap-2">
        {(['left', 'equal', 'right'] as const).map((value, i) => (
          <button
            key={value}
            className={buttonClass}
            disabled={disabled}
            aria-pressed={board.choice === value}
            onClick={() => onAction({ type: 'compare-choice', value })}
          >
            {['左邊比較大', '一樣大', '右邊比較大'][i]}
          </button>
        ))}
      </div>
    </>
  );
}
