import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
export const buttonClass =
  'min-h-11 rounded-xl border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-50 disabled:cursor-default disabled:opacity-40';
export const panelClass = 'rounded-2xl border border-slate-200 bg-white p-4 sm:p-6';
export function NumberEntry({
  label,
  value,
  max = 100000,
  min = 0,
  disabled,
  onCommit,
}: {
  label: string;
  value: number | null;
  max?: number;
  min?: number;
  disabled: boolean;
  onCommit: (n: number) => void;
}) {
  const [text, setText] = useState(value === null ? '' : String(value));
  useEffect(() => setText(value === null ? '' : String(value)), [value]);
  const n = Number(text),
    valid = text.trim() !== '' && Number.isInteger(n) && n >= min && n <= max;
  return (
    <form
      className="my-3 flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && !disabled) onCommit(n);
      }}
    >
      <label className="min-w-0 flex-1 text-sm font-medium">
        {label}
        <input
          className="mt-2 block min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-base"
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
        />
      </label>
      <button className={buttonClass} disabled={disabled || !valid}>
        設定{label}
      </button>
    </form>
  );
}
export function Range({
  label,
  value,
  min,
  max,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="my-4 block text-sm">
      {label}：<strong>{value}</strong>
      <input
        className="block min-h-11 w-full accent-teal-700"
        aria-label={label}
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
export function Canvas({
  label,
  children,
  viewBox = '0 0 440 280',
}: {
  label: string;
  children: ReactNode;
  viewBox?: string;
}) {
  return (
    <svg
      role="group"
      aria-label={label}
      viewBox={viewBox}
      className="mx-auto my-4 block w-full max-w-xl overflow-visible rounded-2xl bg-slate-50"
      style={{ touchAction: 'manipulation' }}
    >
      <title>{label}</title>
      {children}
    </svg>
  );
}
export function SvgButton({
  label,
  disabled,
  onClick,
  children,
  ...props
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
  transform?: string;
}) {
  return (
    <g
      {...props}
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => {
        if (!disabled) onClick();
      }}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className="imo-svg-button"
    >
      <title>{label}</title>
      {children}
    </g>
  );
}
export function Readout({ children }: { children: ReactNode }) {
  return (
    <div
      className="my-4 rounded-xl bg-teal-50 p-4 text-center text-lg font-semibold text-teal-900"
      data-testid="board-readout"
    >
      {children}
    </div>
  );
}
