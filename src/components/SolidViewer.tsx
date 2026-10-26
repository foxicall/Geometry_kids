import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Hand, Pause, Play, RotateCcw } from 'lucide-react';
import { buildSolid, rotatePoint, solidName } from '../lib/solids';
import type { SolidSpec } from '../types/solid';

export function SolidViewer({ solid }: { solid: SolidSpec }) {
  const mesh = useMemo(() => buildSolid(solid), [solid.kind, solid.sides]);
  const [angle, setAngle] = useState(0.3);
  const [pitch, setPitch] = useState(-0.3);
  const [rotating, setRotating] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [vertices, setVertices] = useState(true);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  useEffect(() => {
    if (!rotating) return;
    let frame: number;
    let previous: number | null = null;
    const animate = (time: number) => {
      const delta = previous === null ? 0 : Math.min(time - previous, 50);
      setAngle((value) => (value + delta * 0.00022) % (Math.PI * 2));
      previous = time;
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [rotating]);

  const points = mesh.vertices.map((point) => rotatePoint(point, angle, pitch));
  const project = (index: number) => ({ x: 300 + points[index].x * 1.18, y: 205 - points[index].y * 1.18 });
  const faces = mesh.faces.map((face, index) => {
    const a = points[face[0]], b = points[face[1]], c = points[face[2]];
    const front = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0;
    return { face, index, front, depth: face.reduce((sum, vertex) => sum + points[vertex].z, 0) / face.length };
  });
  const edgeVisible = (a: number, b: number) => faces.some(({ face, front }) => front && face.includes(a) && face.includes(b));
  function turn(direction: number) { setRotating(false); setAngle((value) => value + direction * Math.PI / 8); }

  return <div className="solid-viewer">
    <div className="solid-scene">
      <div className="scene-label"><span className="scene-dot" />{rotating ? '自動旋轉中' : '已暫停 · 自由觀察'}</div>
      <span className="scene-dimension">3D VIEW</span>
      <svg viewBox="0 0 600 410" role="img" aria-label={`${solidName(solid)}立體模型，可拖曳或使用方向鍵旋轉`} tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); turn(event.key === 'ArrowLeft' ? -1 : 1); }
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); setRotating(false); setPitch((value) => Math.max(-1.2, Math.min(1.2, value + (event.key === 'ArrowUp' ? -0.12 : 0.12)))); }
        }}
        onPointerDown={(event) => { if (event.button !== 0) return; setRotating(false); drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={(event) => {
          if (!drag.current || event.pointerId !== drag.current.id) return;
          const dx = event.clientX - drag.current.x, dy = event.clientY - drag.current.y;
          setAngle((value) => value + dx * 0.009);
          setPitch((value) => Math.max(-1.2, Math.min(1.2, value + dy * 0.007)));
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        }}
        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
        <defs>
          <radialGradient id={`glow-${id}`}><stop stopColor="#1b655f" stopOpacity=".55" /><stop offset="1" stopColor="#0f2930" stopOpacity="0" /></radialGradient>
          <pattern id={`grid-${id}`} width="35" height="35" patternUnits="userSpaceOnUse"><path d="M35 0H0V35" fill="none" stroke="#80c1ba" strokeOpacity=".08" /></pattern>
        </defs>
        <rect width="600" height="410" fill={`url(#grid-${id})`} />
        <ellipse cx="300" cy="230" rx="245" ry="180" fill={`url(#glow-${id})`} />
        <ellipse cx="300" cy="355" rx="120" ry="16" fill="#071e25" opacity=".6" />
        <g data-testid="solid-geometry" data-yaw={angle.toFixed(3)}>
          {[...faces].sort((a, b) => a.depth - b.depth).map(({ face, index, front }) => <polygon key={index} data-face={index} points={face.map((vertex) => `${project(vertex).x},${project(vertex).y}`).join(' ')} fill={index === 0 ? '#f5b474' : index === 1 && solid.kind === 'prism' ? '#b9f1c2' : '#70cfc0'} fillOpacity={front ? 0.2 : 0.065} />)}
          {[false, true].map((visible) => <g key={String(visible)}>{mesh.edges.filter(([a, b]) => edgeVisible(a, b) === visible).map(([a, b]) => <line key={`${a}-${b}`} x1={project(a).x} y1={project(a).y} x2={project(b).x} y2={project(b).y} stroke={visible ? '#b1f0d4' : '#6baca8'} strokeWidth={visible ? 2.4 : 1.6} strokeDasharray={visible ? undefined : '5 5'} opacity={visible ? 1 : 0.6} />)}</g>)}
          {vertices && points.map((point, index) => <g key={index}><circle cx={project(index).x} cy={project(index).y} r="7" fill="#ffd295" opacity=".13" /><circle cx={project(index).x} cy={project(index).y} r="3.8" fill={point.z > 0 ? '#ffd295' : '#c49662'} stroke="#223d40" strokeWidth="1" /></g>)}
        </g>
      </svg>
      <div className="scene-caption"><Hand size={14} />拖曳轉動 · 虛線是背面的邊</div>
    </div>
    <div className="viewer-controls">
      <button onClick={() => setRotating(!rotating)} aria-label={rotating ? '暫停旋轉' : '繼續旋轉'}>{rotating ? <Pause size={16} /> : <Play size={16} />}<span>{rotating ? '暫停' : '旋轉'}</span></button>
      <button onClick={() => turn(-1)} aria-label="向左旋轉"><ChevronLeft size={19} /></button>
      <button onClick={() => turn(1)} aria-label="向右旋轉"><ChevronRight size={19} /></button>
      <span className="control-divider" />
      <button onClick={() => setVertices(!vertices)} aria-pressed={vertices}><Eye size={16} /><span>標出頂點</span></button>
      <button onClick={() => { setAngle(0.3); setPitch(-0.3); }} aria-label="重設視角" className="reset-camera"><RotateCcw size={16} /></button>
    </div>
  </div>;
}
