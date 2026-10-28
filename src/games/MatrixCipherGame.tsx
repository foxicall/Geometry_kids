import type { ArithmeticOperator, MiniGameProps } from '../types/game';
import { matrixValue } from './levels';
import { buttonClass, Canvas, NumberEntry, Readout } from './shared';
export function MatrixCipherGame({ board, mode, disabled, onAction }: MiniGameProps) {
  if (board.kind !== 'matrix') return null;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          [8, 3, 4, 20],
          [9, 5, 5, 34],
          [14, board.unknown, 7, 35],
        ].map(([a, b, c, target], i) => (
          <Canvas key={i} label={`第 ${i + 1} 組規律`} viewBox="0 0 180 190">
            <path d="M90 35 30 140H150Z" fill="#edf3ed" stroke="#8ca997" strokeWidth={2} />
            {[
              [90, 35, 'A', a],
              [30, 140, 'B', b],
              [150, 140, 'C', c],
            ].map(([x, y, label, v]) => (
              <g key={String(label)}>
                <circle cx={Number(x)} cy={Number(y)} r={24} fill="#fff" stroke="#8ca997" />
                <text x={Number(x)} y={Number(y) + 6} textAnchor="middle" fontSize={20}>
                  {v ?? 'x'}
                </text>
                <text x={Number(x)} y={Number(y) + 41} textAnchor="middle" fontSize={13}>
                  {label}
                </text>
              </g>
            ))}
            <text x={90} y={112} textAnchor="middle" fontSize={24} fontWeight="bold">
              {target}
            </text>
          </Canvas>
        ))}
      </div>
      <Readout>
        ( B {board.first ?? '□'} C ) {board.second ?? '□'} A
      </Readout>
      {(['first', 'second'] as const).map((slot, i) => (
        <fieldset className="my-4" key={slot} disabled={disabled}>
          <legend className="mb-2 text-sm">第 {i + 1} 個運算位置</legend>
          <div className="flex flex-wrap gap-2">
            {(['+', '−', '×', '÷'] as ArithmeticOperator[]).map((value) => (
              <button
                type="button"
                key={value}
                className={buttonClass}
                aria-pressed={board[slot] === value}
                aria-label={`第 ${i + 1} 運算 ${value}`}
                onClick={() => onAction({ type: 'operator', slot, value })}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      <NumberEntry
        label="未知數 x"
        value={board.unknown}
        max={100}
        disabled={disabled}
        onCommit={(value) => onAction({ type: 'unknown', value })}
      />
      {mode === 'playground' && (
        <>
          <p className="mt-6 text-sm">自選一組數字，觀察同一條規則會得到什麼結果。</p>
          {board.probe.map((value, index) => (
            <NumberEntry
              key={index}
              label={`測試 ${['A', 'B', 'C'][index]}`}
              value={value}
              max={30}
              disabled={disabled}
              onCommit={(value) => onAction({ type: 'probe', index, value })}
            />
          ))}
          <Readout>
            自選組結果：{matrixValue(board, ...board.probe) ?? '未完成或除以 0，沒有定義'}
          </Readout>
        </>
      )}
    </>
  );
}
