import { lazy, Suspense } from 'react';
import { useStore } from '@nanostores/react';
import AnatomyBody from './AnatomyBody';
import LayerToggle from './LayerToggle';
import PartPanel from './PartPanel';
import type { ExplorerPart } from '@/lib/explorer/renderer';
import { $activeSystem } from '@/lib/explorer/store';
import { SYSTEM_BY_ID } from '@/data/systems';

// three.js is only pulled in when a real model exists — keeps the 2D path light.
const ThreeBody = lazy(() => import('./ThreeBody'));

/**
 * The interactive explorer island. `models` maps an anatomical system → its GLB
 * URL (resolved at build time by the page). When the active layer has a model we
 * render the 3D renderer for it (true per-part mesh clicking); otherwise the 2D
 * SVG body. Switching layers swaps the model. All renderers share the same
 * nanostores selection atoms, so the panel/toggle/links are renderer-agnostic.
 */
export default function BodyExplorer({
  parts,
  models = {},
}: {
  parts: ExplorerPart[];
  models?: Record<string, string>;
}) {
  const system = useStore($activeSystem);
  const activeParts = parts.filter((p) => p.systems.includes(system));
  const modelUrl = models[system];

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] p-4">
        <LayerToggle />
        <p className="text-xs text-[var(--color-faint)]">
          {activeParts.length} interactive {activeParts.length === 1 ? 'region' : 'regions'} ·{' '}
          {SYSTEM_BY_ID[system].name}
        </p>
      </div>

      <div className="relative grid place-items-center bg-[var(--color-base)] p-6">
        {modelUrl ? (
          <Suspense
            fallback={
              <div className="grid h-[560px] w-full place-items-center text-xs text-[var(--color-faint)]">
                Loading 3D body…
              </div>
            }
          >
            <ThreeBody key={system} parts={activeParts} modelUrl={modelUrl} />
          </Suspense>
        ) : (
          <AnatomyBody parts={activeParts} />
        )}
        <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-xs text-[var(--color-faint)]">
          {modelUrl
            ? 'Drag to rotate · click a highlighted region to see remedies'
            : 'Hover to highlight · click a highlighted region to see remedies'}
        </p>
      </div>

      {modelUrl && (
        <p className="border-t border-[var(--color-line)] px-4 py-2 text-[11px] text-[var(--color-faint)]">
          3D model:{' '}
          <a
            href="https://github.com/Z-Anatomy/Models-of-human-anatomy"
            target="_blank"
            rel="noopener nofollow"
            className="underline hover:text-[var(--color-muted)]"
          >
            Z-Anatomy
          </a>{' '}
          · CC BY-SA 4.0
        </p>
      )}

      <PartPanel parts={parts} />
    </div>
  );
}
