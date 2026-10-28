import type { MiniGameProps } from '../types/game';
import { boundaryEdges, edgePoints, gridEdges } from './math';
import { Canvas, Range, Readout, SvgButton } from './shared';
export function PerimeterGame({ board, mode, disabled, hint, onAction }: MiniGameProps) {
  if (board.kind !== 'perimeter') return null;
  const edges = gridEdges(board.cells),
    boundary = boundaryEdges(board.cells),
    correct = board.fences.filter((e) => boundary.includes(e)).length;
  return (
    <>
      {mode === 'playground' && (
        <>
          <p className="text-sm">點方格可增減積木，圍欄會清空，方便重新量周長。</p>
          <Range
            label="每段邊長（公分）"
            value={board.side}
            min={1}
            max={5}
            onChange={(value) => onAction({ type: 'side', value })}
          />
        </>
      )}
      <Canvas label="城堡方格與圍欄" viewBox="0 0 360 360">
        {Array.from({ length: 16 }, (_, i) => {
          const rect = (
            <rect
              x={40 + (i % 4) * 70}
              y={40 + Math.floor(i / 4) * 70}
              width={70}
              height={70}
              fill={board.cells.includes(i) ? '#c8dfd4' : '#f1f5f9'}
              stroke="#d8e0e5"
            />
          );
          return mode === 'playground' ? (
            <SvgButton
              key={i}
              label={`積木第 ${Math.floor(i / 4) + 1} 列第 ${(i % 4) + 1} 格`}
              disabled={disabled}
              onClick={() => onAction({ type: 'cell', index: i })}
            >
              {rect}
            </SvgButton>
          ) : (
            <g key={i}>{rect}</g>
          );
        })}
        {[...edges].map(([edge, count]) => {
          const [x1, y1, x2, y2] = edgePoints(edge),
            selected = board.fences.includes(edge),
            color = selected
              ? count === 1
                ? '#0f766e'
                : '#c45b27'
              : hint >= 2 && count === 1
                ? '#cf9425'
                : '#8fa69e';
          const [axis, row, col] = edge.split(':');
          return (
            <SvgButton
              key={edge}
              label={`${axis === 'h' ? '橫' : '直'}邊 第 ${Number(row) + 1} 列第 ${Number(col) + 1} 段${selected ? ' 已圍' : ''}`}
              disabled={disabled || selected}
              onClick={() => onAction({ type: 'fence', edge })}
            >
              <path
                data-edge={edge}
                d={`M${40 + x1 * 70} ${40 + y1 * 70}L${40 + x2 * 70} ${40 + y2 * 70}`}
                fill="none"
                stroke={color}
                strokeWidth={selected ? 8 : 3}
              />
              <path
                d={`M${40 + x1 * 70} ${40 + y1 * 70}L${40 + x2 * 70} ${40 + y2 * 70}`}
                stroke="transparent"
                strokeWidth={22}
              />
            </SvgButton>
          );
        })}
      </Canvas>
      <Readout>
        已圍對 {correct} 段 × {board.side} 公分 = {correct * board.side} 公分
      </Readout>
      {mode === 'playground' && (
        <p className="text-sm">
          這個圖形的完整周長：{boundary.length} × {board.side} = {boundary.length * board.side}{' '}
          公分。包含空洞邊界；空盤周長為 0。
        </p>
      )}
    </>
  );
}
