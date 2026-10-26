import { CellRenderer } from './CellRenderer';
import type { GeometryUnit, MatrixQuestion } from '../types/matrix';

export function MatrixBoard({ question, answer }: { question: MatrixQuestion; answer?: GeometryUnit }) {
  return <div className={`matrix-board matrix-${question.size}`} role="group" aria-label={`${question.size} 乘 ${question.size} 圖形矩陣，右下角待填`}>
    {question.grid.flatMap((row, rowIndex) => row.map((cell, columnIndex) => {
      const rendered = cell ?? answer;
      return <div className={`matrix-cell ${cell ? '' : 'missing-cell'} ${!cell && answer ? 'revealed-cell' : ''}`} key={`${rowIndex}-${columnIndex}`}>
        <span className="sr-only">第 {rowIndex + 1} 列，第 {columnIndex + 1} 欄：</span>
        {rendered ? <CellRenderer cell={rendered} /> : <span className="question-mark" aria-label="待填的圖形">?</span>}
      </div>;
    }))}
  </div>;
}
