import type { MiniGameProps } from '../types/game';
import { buttonClass, Canvas, NumberEntry, Readout, SvgButton } from './shared';
import { useState } from 'react';
export function FractionGame({ board, mode, disabled, onAction }: MiniGameProps) {
  const [divisor, setDivisor] = useState('4');
  if (board.kind !== 'fraction') return null;
  const d = board.slices.length,
    n = board.slices.filter(Boolean).length,
    v = Number(divisor),
    canDivide = Number.isInteger(v) && v > 1 && n % v === 0 && d % v === 0;
  return (
    <>
      <p className="text-sm">點切片可塗上或擦掉起司。約分時，總份量必須保留。</p>
      {mode === 'playground' && (
        <NumberEntry
          label="總切片數"
          value={d}
          min={1}
          max={32}
          disabled={disabled}
          onCommit={(value) => onAction({ type: 'denominator', value })}
        />
      )}
      <Canvas label={`披薩 ${n}/${d}`} viewBox="0 0 360 360">
        {board.slices.map((selected, i) => {
          const a = (i / d) * Math.PI * 2 - Math.PI / 2,
            b = ((i + 1) / d) * Math.PI * 2 - Math.PI / 2;
          const path = `M180 180L${180 + 155 * Math.cos(a)} ${180 + 155 * Math.sin(a)}A155 155 0 ${d === 1 ? 1 : 0} 1 ${180 + 155 * Math.cos(b)} ${180 + 155 * Math.sin(b)}Z`;
          return (
            <SvgButton
              key={`${d}-${i}`}
              label={`切片 ${i + 1}，${selected ? '已塗色' : '未塗色'}`}
              disabled={disabled}
              onClick={() => onAction({ type: 'slice', index: i })}
            >
              {d === 1 ? (
                <circle
                  cx={180}
                  cy={180}
                  r={155}
                  fill={selected ? '#efb34e' : '#fff5df'}
                  stroke="#896b3f"
                />
              ) : (
                <path
                  d={path}
                  fill={selected ? '#efb34e' : '#fff5df'}
                  stroke="#896b3f"
                  strokeWidth={1.5}
                />
              )}
            </SvgButton>
          );
        })}
      </Canvas>
      <div className="flex flex-wrap gap-2">
        <button
          className={buttonClass}
          disabled={disabled || n === d}
          onClick={() => onAction({ type: 'slice', index: board.slices.indexOf(false) })}
        >
          多塗一片
        </button>
        <button
          className={buttonClass}
          disabled={disabled || n === 0}
          onClick={() => onAction({ type: 'slice', index: board.slices.lastIndexOf(true) })}
        >
          少塗一片
        </button>
      </div>
      <Readout>
        {n}/{d}
      </Readout>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (canDivide && !disabled) onAction({ type: 'divide-fraction', value: v });
        }}
      >
        <label className="min-w-0 flex-1 text-sm">
          分子分母同除以
          <input
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3"
            type="number"
            inputMode="numeric"
            min={2}
            max={32}
            value={divisor}
            disabled={disabled}
            onChange={(e) => setDivisor(e.target.value)}
          />
        </label>
        <button className={buttonClass} disabled={disabled || !canDivide}>
          合併切片
        </button>
      </form>
      {!canDivide && (
        <p className="mt-2 text-sm text-amber-800">請選能同時整除分子與分母、且大於 1 的整數。</p>
      )}
    </>
  );
}
