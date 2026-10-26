import { CellRenderer } from './CellRenderer';

/** 原創向量插畫，與題目共用渲染器，無外部圖片或字型請求。 */
export function ExplorerArt() {
  return <div className="explorer-art" aria-hidden="true">
    <span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" />
    <span className="art-spark spark-one">✦</span><span className="art-spark spark-two">✧</span>
    <div className="art-tile art-circle"><CellRenderer decorative cell={{ shape: 'circle', count: 1, rotation: 0, fill: 'empty' }} /><span className="face">··<i /></span></div>
    <div className="art-tile art-triangle"><CellRenderer decorative cell={{ shape: 'triangle', count: 1, rotation: 0, fill: 'solid' }} /></div>
    <div className="art-tile art-star"><CellRenderer decorative cell={{ shape: 'star', count: 1, rotation: 0, fill: 'striped' }} /></div>
    <div className="art-tile art-missing">?<span className="little-check">✓</span></div>
    <span className="art-caption">一起把「？」變成「！」</span>
  </div>;
}
