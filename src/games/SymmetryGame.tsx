import { useState } from 'react';
import type { MiniGameProps, SymmetryShape } from '../types/game';
import { axisCandidates, isSymmetry, reflect, shapePoints } from './math';
import { buttonClass, Canvas, Readout } from './shared';
export function SymmetryGame({ board, mode, disabled, onAction }: MiniGameProps) {
  const [angle, setAngle] = useState(0);
  if (board.kind !== 'symmetry') return null;
  const shape = board.shape,
    good = board.lastAxis !== null && isSymmetry(shape, board.lastAxis);
  const line = (a: number) => {
    const t = (a * Math.PI) / 180;
    return `M${-125 * Math.cos(t)} ${125 * Math.sin(t)}L${125 * Math.cos(t)} ${-125 * Math.sin(t)}`;
  };
  const names: Record<SymmetryShape, string> = {
    square: '正方形',
    rectangle: '長方形',
    triangle: '正三角形',
    hexagon: '不等邊六角形',
    circle: '圓',
  };
  return (
    <>
      {mode === 'playground' && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(names) as SymmetryShape[]).map((value) => (
            <button
              className={buttonClass}
              aria-pressed={shape === value}
              key={value}
              onClick={() => onAction({ type: 'shape', value })}
            >
              {names[value]}
            </button>
          ))}
        </div>
      )}
      <Canvas label={`${names[shape]}與摺線鏡像`} viewBox="0 0 360 320">
        <g transform="translate(180,160)">
          {shape === 'circle' ? (
            <circle r={95} fill="#d3e4f2" stroke="#567a9b" strokeWidth={3} />
          ) : (
            <polygon
              points={shapePoints[shape].map((p) => p.join(',')).join(' ')}
              fill="#d3e4f2"
              stroke="#567a9b"
              strokeWidth={3}
            />
          )}
          {board.lastAxis !== null &&
            (shape === 'circle' ? (
              <circle
                key={board.lastAxis}
                r={95}
                fill="#8dd0b455"
                stroke="#0f766e"
                strokeDasharray="6 4"
                strokeWidth={4}
                className="imo-reflection"
              />
            ) : (
              <polygon
                key={board.lastAxis}
                points={shapePoints[shape]
                  .map((p) => reflect(p, board.lastAxis!).join(','))
                  .join(' ')}
                fill={good ? '#8dd0b455' : '#f5b68555'}
                stroke={good ? '#0f766e' : '#c45b27'}
                strokeDasharray="6 4"
                strokeWidth={4}
                className="imo-reflection"
              />
            ))}
          {board.tried
            .filter((a) => isSymmetry(shape, a))
            .map((a) => (
              <path key={a} d={line(a)} stroke="#b28527" strokeWidth={3} />
            ))}
          <path d={line(angle)} stroke="#334155" strokeWidth={2} strokeDasharray="5 5" />
        </g>
      </Canvas>
      <p className="text-sm">選摺線角度（0° 是水平），再按對折。虛線輪廓顯示鏡像。</p>
      <div className="my-3 flex flex-wrap gap-2">
        {axisCandidates.map((a) => (
          <button
            key={a}
            className={buttonClass}
            aria-pressed={angle === a}
            disabled={disabled}
            onClick={() => setAngle(a)}
          >
            {a}°
          </button>
        ))}
      </div>
      <button
        className={buttonClass}
        disabled={disabled || board.tried.includes(angle)}
        onClick={() => onAction({ type: 'fold', angle })}
      >
        沿 {angle}° 對折
      </button>
      <Readout>
        {board.lastAxis === null ? '選一條摺線試試' : good ? '鏡像完全貼合' : '輪廓沒有貼合'}
      </Readout>
    </>
  );
}
