import { useId, useState } from 'react';
import { Lightbulb, MoveHorizontal, ZoomIn, ZoomOut } from 'lucide-react';
import type { ReasoningDiagram as Diagram, ReasoningQuestion } from '../types/reasoning';

type Point = { x: number; y: number };
const green = '#2f8a74', orange = '#bc7024', ink = '#274b48';
const polygon = (points: Point[]) => points.map((p) => `${p.x},${p.y}`).join(' ');
const rad = (degrees: number) => degrees * Math.PI / 180;
const between = (a: Point, b: Point, t = 0.5): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

function Label({ x, y, children, color = ink }: Point & { children: React.ReactNode; color?: string }) {
  return <text x={x} y={y} textAnchor="middle" fill={color} stroke="white" strokeWidth="4" paintOrder="stroke" fontSize="15" fontWeight="650">{children}</text>;
}
function Line({ a, b, dashed = false, color = green, width = 2 }: { a: Point; b: Point; dashed?: boolean; color?: string; width?: number }) {
  return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={width} strokeDasharray={dashed ? '6 5' : undefined} />;
}
function Arc({ center, from, to, radius = 28, label, color = orange }: { center: Point; from: Point; to: Point; radius?: number; label?: string; color?: string }) {
  let start = Math.atan2(from.y - center.y, from.x - center.x), end = Math.atan2(to.y - center.y, to.x - center.x);
  while (end < start) end += Math.PI * 2;
  if (end - start > Math.PI) { const old = start; start = end; end = old + Math.PI * 2; }
  const p = (angle: number, r: number) => ({ x: center.x + Math.cos(angle) * r, y: center.y + Math.sin(angle) * r });
  const a = p(start, radius), b = p(end, radius), mid = p((start + end) / 2, radius + 17);
  return <g><path d={`M ${a.x} ${a.y} A ${radius} ${radius} 0 0 1 ${b.x} ${b.y}`} stroke={color} fill="none" strokeWidth="2" />{label && <Label {...mid} color={color}>{label}</Label>}</g>;
}
function Tick({ a, b }: { a: Point; b: Point }) {
  const m = between(a, b), length = Math.hypot(b.x - a.x, b.y - a.y), dx = (b.y - a.y) / length * 6, dy = -(b.x - a.x) / length * 6;
  return <Line a={{ x: m.x - dx, y: m.y - dy }} b={{ x: m.x + dx, y: m.y + dy }} color={ink} />;
}

/** 圖形依同一份題目參數按比例繪製，不用不相符的固定示意圖。 */
function Drawing({ d, helper, position }: { d: Diagram; helper: boolean; position: number }) {
  if (d.kind === 'angles') {
    // 由兩個底角求交點，再等比例縮放，標示角度與實際圖形一致。
    const length = 300, ac = length * Math.sin(rad(d.right)) / Math.sin(rad(d.top));
    const rawC = { x: ac * Math.cos(rad(d.left)), y: ac * Math.sin(rad(d.left)) };
    const scale = Math.min(1, 190 / rawC.y), A = { x: 65, y: 270 }, B = { x: 65 + length * scale, y: 270 }, C = { x: 65 + rawC.x * scale, y: 270 - rawC.y * scale };
    const D = { x: 430, y: 270 }, angle = Math.atan2(C.y - B.y, C.x - B.x) / 2;
    const E = { x: B.x + Math.cos(angle) * 105, y: B.y + Math.sin(angle) * 105 };
    return <g><polygon points={polygon([A, B, C])} fill="#e5f4ec" stroke={green} strokeWidth="2.5" /><Label x={A.x - 14} y={A.y + 20}>A</Label><Label x={B.x} y={B.y + 23}>B</Label><Label x={C.x} y={C.y - 17}>C</Label>
      <Arc center={A} from={B} to={C} label={d.mode === 'isosceles' ? '?°' : `${d.left}°`} />
      {d.mode === 'sum' ? <><Arc center={B} from={C} to={A} label={`${d.right}°`} /><Arc center={C} from={A} to={B} label="?°" /></> : <Arc center={C} from={A} to={B} label={`${d.top}°`} />}
      {d.mode === 'isosceles' && <><Tick a={A} b={C} /><Tick a={B} b={C} /><Arc center={B} from={C} to={A} label={helper ? '同樣大' : undefined} color={green} /></>}
      {d.mode === 'bisector' && <><Line a={B} b={D} color={ink} /><Label x={D.x} y={D.y + 24}>D</Label><Line a={B} b={E} color={orange} width={3} /><Arc center={B} from={D} to={E} label="?°" radius={32} /><Arc center={B} from={E} to={C} radius={32} />{helper && <Arc center={B} from={C} to={A} radius={22} label="內角" color={green} />}</>}
      {helper && d.mode === 'sum' && <text x="235" y="325" textAnchor="middle" fill={green} fontSize="15">三個內角合起來是 180°</text>}
    </g>;
  }
  if (d.kind === 'height') {
    const scale = Math.min(330 / (d.left + d.right), 175 / d.height), leftX = (470 - (d.left + d.right) * scale) / 2;
    const A = { x: leftX, y: 270 }, D = { x: leftX + d.left * scale, y: 270 }, B = { x: leftX + (d.left + d.right) * scale, y: 270 }, C = { x: leftX + (d.left + d.right) * scale * (0.1 + position * 0.008), y: 270 - d.height * scale };
    return <g><polygon points={polygon([A, D, C])} fill="#d9efe3" stroke={green} strokeWidth="2" /><polygon points={polygon([D, B, C])} fill="#ffedd5" stroke={orange} strokeWidth="2" />
      {[[A, 'A'], [D, 'D'], [B, 'B']] .map(([p, name]) => <Label key={name as string} x={(p as Point).x} y={294} >{name as string}</Label>)}
      <Label x={C.x} y={C.y - 16}>C</Label><Label x={(A.x + D.x) / 2} y={320}>{d.left} cm</Label><Label x={(D.x + B.x) / 2} y={320}>{d.mode === 'inverse' ? '? cm' : `${d.right} cm`}</Label>
      {(helper || d.mode === 'area') && <g data-testid="height-helper"><Line a={C} b={{ x: C.x, y: 270 }} dashed color="#6385a9" /><path d={`M${C.x} 260h10v10`} fill="none" stroke="#6385a9" /><Label x={C.x + 24} y={(C.y + 270) / 2}>{d.mode === 'area' ? `${d.height} cm` : '同高'}</Label></g>}
      <Label x={125} y={46} color={green}>左邊：{d.mode === 'area' ? '? cm²' : `${d.left * d.height / 2} cm²`}</Label>
      {d.mode !== 'area' && <Label x={340} y={46} color={orange}>右邊：{d.mode === 'inverse' ? `${d.right * d.height / 2} cm²` : '? cm²'}</Label>}
    </g>;
  }
  if (d.kind === 'cut') {
    const scale = Math.min(310 / d.width, 190 / d.height), x = (470 - d.width * scale) / 2, y = 65, w = d.width * scale, h = d.height * scale, cw = d.cutWidth * scale, ch = d.cutHeight * scale;
    const points = d.mode === 'corner' ? [{ x, y }, { x: x + w - cw, y }, { x: x + w, y: y + ch }, { x: x + w, y: y + h }, { x, y: y + h }] : d.mode === 'notch' ? [{ x, y }, { x: x + w - cw, y }, { x: x + w - cw, y: y + ch }, { x: x + w, y: y + ch }, { x: x + w, y: y + h }, { x, y: y + h }] : [{ x, y }, { x: x + w - cw, y }, { x: x + w, y: y + h }, { x, y: y + h }];
    return <g><polygon points={polygon(points)} fill="#deeee4" stroke={green} strokeWidth="2.5" />
      {d.mode !== 'trapezoid' && <><path d={`M${x + w - cw} ${y}H${x + w}V${y + ch}`} fill="none" stroke="#9baea6" strokeDasharray="6 5" /><Label x={x + w - cw / 2} y={y - 15}>{d.cutWidth} cm</Label><Label x={x + w + 33} y={y + ch / 2 + 4}>{d.cutHeight} cm</Label><Label x={x - 32} y={y + h / 2}>{d.height} cm</Label></>}
      <Label x={x + w / 2} y={y + h + 28}>{d.width} cm</Label>
      {d.mode === 'trapezoid' && <><polygon points={polygon([{ x: x + w - cw, y }, { x: x + w - cw, y: y + h }, { x: x + w, y: y + h }])} fill="#ffead1" /><Line a={{ x: x + w - cw, y }} b={{ x: x + w, y: y + h }} color={orange} /><Label x={x + (w - cw) / 2} y={y - 15}>{d.width - d.cutWidth} cm</Label><Label x={x + w - cw / 3} y={y + h * 0.77} color={orange}>{d.cutWidth * d.height / 2} cm²</Label>{helper && <><Line a={{ x: x + w - cw, y }} b={{ x: x + w - cw, y: y + h }} dashed /><path d={`M${x + w - cw} ${y + h - 12}h12v12`} fill="none" stroke={green} /><Label x={x + w - cw - 18} y={y + h / 2}>高</Label></>}</>}
      {helper && d.mode !== 'trapezoid' && <text x="235" y="323" textAnchor="middle" fill={green} fontSize="15">整個長方形 − 白色缺口 ＝ 綠色面積</text>}
    </g>;
  }
  if (d.kind === 'similar') {
    const height = 2 * d.area / d.side, factor = Math.min(300 / (d.side * (1 + d.scale)), 170 / (height * d.scale)), w = d.side * factor, h = height * factor;
    const shapes = [{ x: 55, factor: 1, color: green }, { x: 120 + w, factor: d.scale, color: orange }];
    return <g>{shapes.map((shape, index) => { const width = w * shape.factor, tall = h * shape.factor; return <g key={index}><polygon points={`${shape.x},270 ${shape.x + width},270 ${shape.x},${270 - tall}`} fill={index ? '#ffecd5' : '#dceee4'} stroke={shape.color} strokeWidth="2.5" /><path d={`M${shape.x} 260h10v10`} fill="none" stroke={shape.color} /><Label x={shape.x + width / 2} y={300}>{d.mode === 'area' ? index ? '大三角形' : '小三角形' : index ? '? cm' : `${d.side} cm`}</Label>{d.mode !== 'length' && <Label x={shape.x + width / 3} y={270 - tall / 3}>{index ? d.mode === 'inverse' ? `${d.area * d.scale * d.scale} cm²` : '? cm²' : `${d.area} cm²`}</Label>}</g>; })}
      {d.mode !== 'inverse' && <Label x={235} y={30}>每條邊放大 {d.scale} 倍</Label>}
      {helper && <g><text x="235" y="57" textAnchor="middle" fontSize="15" fill={green}>底與高都按同一倍數改變</text><text x="235" y="82" textAnchor="middle" fontSize="14" fill={green}>面積倍數＝邊長倍數 × 邊長倍數</text></g>}
    </g>;
  }
  if (d.kind === 'squares') {
    const O = { x: 0, y: 0 }, A = { x: d.a, y: 0 }, B = { x: 0, y: -d.b };
    const smallA = [O, A, { x: d.a, y: d.a }, { x: 0, y: d.a }], smallB = [O, B, { x: -d.b, y: -d.b }, { x: -d.b, y: 0 }], large = [A, B, { x: d.b, y: -d.b - d.a }, { x: d.a + d.b, y: -d.a }];
    const scale = Math.min(350 / (d.a + 2 * d.b), 245 / (2 * d.a + d.b)), centerX = 235 - d.a * scale / 2, centerY = 170 + d.b * scale / 2;
    const p = (point: Point): Point => ({ x: centerX + point.x * scale, y: centerY + point.y * scale });
    const average = (points: Point[]) => p({ x: points.reduce((s, v) => s + v.x, 0) / points.length, y: points.reduce((s, v) => s + v.y, 0) / points.length });
    return <g>{[smallA, smallB, large].map((points, i) => <polygon key={i} points={polygon(points.map(p))} fill={i === 2 ? '#ffead0' : '#dceee6'} stroke={i === 2 ? orange : green} strokeWidth="2" />)}<polygon points={polygon([O, A, B].map(p))} fill="white" stroke={ink} strokeWidth="2" /><path d={`M${p(O).x} ${p(O).y - 9}h9v9`} fill="none" stroke={ink} />
      {d.mode === 'area' ? <><Label {...average(smallA)}>{d.a * d.a} cm²</Label><Label {...average(smallB)}>{d.b * d.b} cm²</Label><Label {...average(large)} color={orange}>? cm²</Label></> : <><Label {...p({ x: d.a / 2, y: 0.8 })}>{d.a} cm</Label><Label {...p({ x: -0.8, y: -d.b * 0.3 })}>{d.mode === 'leg' ? '? cm' : `${d.b} cm`}</Label><Label {...p({ x: d.a / 2 + 0.6, y: -d.b / 2 - 0.6 })} color={orange}>{d.mode === 'leg' ? `${d.c} cm` : '? cm'}</Label>{helper && <><Label {...average(smallA)}>{d.a} × {d.a}</Label><Label {...average(d.mode === 'leg' ? large : smallB)}>{d.mode === 'leg' ? `${d.c} × ${d.c}` : `${d.b} × ${d.b}`}</Label></>}</>}
      {helper && <text x="235" y="325" textAnchor="middle" fontSize="14" fill={green}>兩個綠色正方形面積之和＝橘色正方形面積</text>}
    </g>;
  }
  const factor = Math.min(260 / d.width, 200 / d.height), w = d.width * factor, h = d.height * factor, x = (470 - w) / 2, y = (330 - h) / 2, seam = y + h - d.split * factor;
  return <g><rect x={x} y={y} width={w} height={h} fill="#e5f2e7" stroke={green} strokeWidth="2" />
    {d.mode === 'unfold' && <><rect x={x} y={y} width={w} height={h - d.split * factor} fill="#e1e9f7" /><Line a={{ x, y: seam }} b={{ x: x + w, y: seam }} dashed color="#657e9d" /><Label x={x + w / 2} y={y + (seam - y) / 2}>牆面</Label><Label x={x + w / 2} y={seam + (y + h - seam) / 2}>地面</Label><Label x={x - 37} y={(y + seam) / 2}>{d.height - d.split} cm</Label><Label x={x - 37} y={(seam + y + h) / 2}>{d.split} cm</Label></>}
    <Label x={x + w / 2} y={y + h + 27}>{d.width} cm</Label>{d.mode !== 'unfold' && <Label x={x - 36} y={y + h / 2}>{d.height} cm</Label>}
    {(d.mode === 'road' || helper) && <path d={`M${x} ${y + h}H${x + w}V${y}`} fill="none" stroke={d.mode === 'road' ? orange : '#9dada6'} strokeWidth={d.mode === 'road' ? 5 : 2} strokeDasharray={d.mode === 'road' ? undefined : '5 5'} />}
    {d.mode !== 'road' && helper && <Line a={{ x, y: y + h }} b={{ x: x + w, y }} color={orange} width={4} />}
    <circle cx={x} cy={y + h} r="5" fill={ink} /><circle cx={x + w} cy={y} r="5" fill={ink} /><Label x={x - 16} y={y + h + 17}>A</Label><Label x={x + w + 16} y={y - 8}>B</Label>
    <text x="235" y="325" textAnchor="middle" fill={green} fontSize="14">{d.mode === 'unfold' ? '兩面已攤平；虛線是地面與牆面的接縫' : d.mode === 'road' ? '依題目限制，沿橘色的邊走' : '畫出 A 到 B 的直線，找找直角三角形'}</text>
  </g>;
}

export function ReasoningDiagram({ question, revealed = false }: { question: ReasoningQuestion; revealed?: boolean }) {
  const [helper, setHelper] = useState(false), [position, setPosition] = useState(45), [zoomed, setZoomed] = useState(false);
  const titleId = useId(), descriptionId = useId();
  return <div className="reasoning-figure">
    <div className={`reasoning-canvas ${zoomed ? 'zoomed' : ''}`} tabIndex={zoomed ? 0 : undefined} aria-label={zoomed ? '放大的幾何圖，可左右捲動' : undefined}><svg viewBox="0 0 470 350" role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
      <title id={titleId}>{`${question.title}的幾何圖`}</title><desc id={descriptionId}>{question.prompt} {question.given.join('；')}。依標示條件推理，不用量螢幕。</desc>
      <Drawing d={question.diagram} helper={helper || revealed} position={position} />
    </svg></div>
    <div className="reasoning-figure-tools"><button type="button" aria-pressed={helper || revealed} disabled={revealed} onClick={() => setHelper(!helper)}><Lightbulb size={16} />{helper || revealed ? '已顯示輔助線索' : '顯示輔助線索'}</button><button type="button" aria-pressed={zoomed} onClick={() => setZoomed(!zoomed)}>{zoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}{zoomed ? '還原大小' : '放大圖形'}</button><span>cm＝公分 · cm²＝平方公分</span></div>
    {zoomed && <p className="reasoning-zoom-note">圖形已放大，可以左右滑動查看全部。</p>}
    {question.diagram.kind === 'height' && <label className="reasoning-slider"><span><MoveHorizontal size={17} />左右移動頂點 C，高度保持不變</span><input aria-label="移動頂點 C" type="range" min="0" max="100" value={position} onChange={(e) => setPosition(Number(e.target.value))} /><small>試著移動看看，底和高都不變，所以面積也不變。</small></label>}
  </div>;
}
