import { useId } from 'react';
import type { GeometryUnit } from '../types/matrix';

const shapeNames = { circle: '圓形', square: '正方形', triangle: '三角形', star: '星形' };
const fillNames = { solid: '實心', empty: '空心', striped: '斜線' };

export function cellLabel(cell: GeometryUnit): string {
  const rotation = cell.shape === 'circle' || cell.shape === 'square' ? '' : `，順時針 ${cell.rotation} 度`;
  return `${cell.count} 個${fillNames[cell.fill]}${shapeNames[cell.shape]}${rotation}`;
}

/** 所有圖形與斜線都是 SVG；每個組件獨立的 pattern ID 避免畫格互相污染。 */
export function CellRenderer({ cell, className = '', decorative = false }: {
  cell: GeometryUnit; className?: string; decorative?: boolean;
}) {
  const id = `stripe-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const positions = cell.count === 1 ? [[50, 50]] : cell.count === 2 ? [[29, 50], [71, 50]] : [[50, 28], [28, 69], [72, 69]];
  const scale = cell.count === 1 ? 1 : 0.62;
  const fill = cell.fill === 'solid' ? 'currentColor' : cell.fill === 'empty' ? 'none' : `url(#${id})`;
  const path = {
    circle: 'M 0 -24 A 24 24 0 1 1 0 24 A 24 24 0 1 1 0 -24 Z',
    square: 'M -23 -23 H 23 V 23 H -23 Z',
    triangle: 'M 0 -27 L 26 23 L -26 23 Z',
    star: 'M 0 -27 L 8 -10 L 26 -8 L 13 5 L 16 24 L 0 15 L -16 24 L -13 5 L -26 -8 L -8 -10 Z',
  }[cell.shape];
  return <svg viewBox="0 0 100 100" className={className} role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : cellLabel(cell)}>
    <defs>
      {/* pattern 反向旋轉，使圓／方形的斜線方向不因 rotation 而改變。 */}
      <pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform={`rotate(${-cell.rotation})`}>
        <path d="M-2 2 L2 -2 M0 7 L7 0 M5 9 L9 5" stroke="currentColor" strokeWidth="1.7" />
      </pattern>
    </defs>
    {positions.map(([x, y], index) => <g key={index} transform={`translate(${x} ${y}) scale(${scale}) rotate(${cell.rotation})`}>
      <path d={path} fill={fill} stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />
    </g>)}
  </svg>;
}
