import { useStore } from '@nanostores/react';
import { $hoveredPart, $selectedParts, hoverPart, togglePart } from '@/lib/explorer/store';
import type { ExplorerPart } from '@/lib/explorer/renderer';

/**
 * v1 stylized region map (anterior). A clean, symmetric placeholder for the
 * detailed per-system anatomical art that lands in a later asset pass. Each
 * region carries a `data-part` id that matches a bodyParts `svgId`.
 */
type Shape =
  | { k: 'rect'; x: number; y: number; w: number; h: number; r?: number }
  | { k: 'circle'; cx: number; cy: number; r: number }
  | { k: 'ellipse'; cx: number; cy: number; rx: number; ry: number };

interface Region {
  id: string;
  shapes: Shape[];
}

// viewBox 0 0 220 520, symmetric about x = 110
const REGIONS: Region[] = [
  { id: 'head', shapes: [{ k: 'circle', cx: 110, cy: 44, r: 26 }] },
  { id: 'neck', shapes: [{ k: 'rect', x: 100, y: 66, w: 20, h: 16, r: 5 }] },
  {
    id: 'shoulder',
    shapes: [
      { k: 'ellipse', cx: 73, cy: 102, rx: 17, ry: 14 },
      { k: 'ellipse', cx: 147, cy: 102, rx: 17, ry: 14 },
    ],
  },
  { id: 'chest', shapes: [{ k: 'rect', x: 79, y: 92, w: 62, h: 56, r: 16 }] },
  { id: 'abdomen', shapes: [{ k: 'rect', x: 83, y: 150, w: 54, h: 62, r: 14 }] },
  {
    id: 'upper-arm',
    shapes: [
      { k: 'rect', x: 53, y: 100, w: 17, h: 66, r: 8 },
      { k: 'rect', x: 150, y: 100, w: 17, h: 66, r: 8 },
    ],
  },
  {
    id: 'forearm',
    shapes: [
      { k: 'rect', x: 47, y: 168, w: 15, h: 62, r: 7 },
      { k: 'rect', x: 158, y: 168, w: 15, h: 62, r: 7 },
    ],
  },
  {
    id: 'hand',
    shapes: [
      { k: 'ellipse', cx: 54, cy: 244, rx: 11, ry: 15 },
      { k: 'ellipse', cx: 166, cy: 244, rx: 11, ry: 15 },
    ],
  },
  { id: 'hip', shapes: [{ k: 'rect', x: 81, y: 212, w: 58, h: 40, r: 14 }] },
  {
    id: 'thigh',
    shapes: [
      { k: 'rect', x: 84, y: 250, w: 24, h: 88, r: 11 },
      { k: 'rect', x: 112, y: 250, w: 24, h: 88, r: 11 },
    ],
  },
  {
    id: 'knee',
    shapes: [
      { k: 'ellipse', cx: 96, cy: 346, rx: 14, ry: 13 },
      { k: 'ellipse', cx: 124, cy: 346, rx: 14, ry: 13 },
    ],
  },
  {
    id: 'calf',
    shapes: [
      { k: 'rect', x: 86, y: 358, w: 20, h: 86, r: 9 },
      { k: 'rect', x: 114, y: 358, w: 20, h: 86, r: 9 },
    ],
  },
  {
    id: 'foot',
    shapes: [
      { k: 'rect', x: 82, y: 448, w: 24, h: 16, r: 6 },
      { k: 'rect', x: 114, y: 448, w: 24, h: 16, r: 6 },
    ],
  },
];

function renderShape(s: Shape, key: number, fill: string, stroke: string) {
  const common = {
    key,
    fill,
    stroke,
    strokeWidth: 1.5,
    style: { transition: 'fill 0.15s ease, stroke 0.15s ease' },
  };
  if (s.k === 'rect') return <rect {...common} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} />;
  if (s.k === 'circle') return <circle {...common} cx={s.cx} cy={s.cy} r={s.r} />;
  return <ellipse {...common} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} />;
}

export default function AnatomyBody({ parts }: { parts: ExplorerPart[] }) {
  const selected = useStore($selectedParts);
  const hovered = useStore($hoveredPart);
  const byId = new Map(parts.map((p) => [p.svgId, p]));

  return (
    <svg
      viewBox="0 0 220 520"
      role="group"
      aria-label="Interactive body — select a region"
      className="mx-auto h-full max-h-[560px] w-auto"
    >
      {REGIONS.map((region) => {
        const part = byId.get(region.id);
        const interactive = !!part;
        const isSelected = selected.includes(region.id);
        const isHovered = hovered === region.id;

        let fill = 'var(--color-surface-2)';
        let stroke = 'var(--color-line-strong)';
        let opacity = 1;
        if (!interactive) {
          stroke = 'var(--color-line)';
          opacity = 0.55;
        } else if (isSelected) {
          fill = 'var(--color-accent)';
          stroke = 'var(--color-accent-strong)';
        } else if (isHovered) {
          fill = 'var(--color-accent-soft)';
          stroke = 'var(--color-accent)';
        }

        const shapeEls = region.shapes.map((s, i) => renderShape(s, i, fill, stroke));
        if (!interactive) {
          return (
            <g
              key={region.id}
              data-part={region.id}
              opacity={opacity}
              style={{ cursor: 'default' }}
            >
              {shapeEls}
            </g>
          );
        }
        return (
          <g
            key={region.id}
            data-part={region.id}
            role="button"
            tabIndex={0}
            aria-label={part?.name}
            style={{ cursor: 'pointer', outline: 'none' }}
            onMouseEnter={() => hoverPart(region.id)}
            onMouseLeave={() => hoverPart(null)}
            onFocus={() => hoverPart(region.id)}
            onBlur={() => hoverPart(null)}
            onClick={() => togglePart(region.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePart(region.id);
              }
            }}
          >
            {shapeEls}
          </g>
        );
      })}
    </svg>
  );
}
