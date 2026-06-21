import type { SystemId } from '@/data/systems';
import type { ViewId } from './store';

/**
 * The data the explorer needs about each clickable region, independent of how
 * it's drawn. Astro resolves this at build time from the bodyParts collection
 * and hands it to the island as a plain serializable array.
 */
export interface ExplorerPart {
  /** matches a `data-part` / mesh name in the renderer */
  svgId: string;
  /** content slug → /part/[slug] */
  slug: string;
  name: string;
  summary: string;
  systems: SystemId[];
  conditions: { slug: string; name: string }[];
}

/**
 * AnatomyRenderer — the contract a body renderer fulfils. The v1 `SvgBody`
 * React component is the implementation; a future `ThreeBody` (Z-Anatomy
 * meshes) can implement the same contract without touching the panel, the
 * layer toggle, or the store. Selection is exchanged purely as part ids.
 */
export interface AnatomyRenderer {
  /** which layer + view to draw */
  layer: { system: SystemId; view: ViewId };
  /** the regions to make interactive */
  parts: ExplorerPart[];
  /** the renderer reports interaction UP via the store (hoverPart/togglePart) */
  /** and reads the active multi-selection DOWN from the store ($selectedParts) */
}

/** Build a fast svgId → part lookup for a renderer. */
export function indexParts(parts: ExplorerPart[]): Map<string, ExplorerPart> {
  return new Map(parts.map((p) => [p.svgId, p]));
}
