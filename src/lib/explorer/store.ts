import { atom } from 'nanostores';
import type { SystemId } from '@/data/systems';

/**
 * Explorer state — plain slugs only, with ZERO knowledge of how the body is
 * rendered. The 2D SVG body and the 3D body both read/write these same atoms,
 * so the panel, layer toggle, and renderer stay decoupled.
 *
 * Selection is MULTI-SELECT: `$selectedParts` holds svgIds in selection order.
 */
export type ViewId = 'anterior' | 'posterior';

export const $activeSystem = atom<SystemId>('skeletal');
export const $activeView = atom<ViewId>('anterior');

/** svgIds of the currently selected parts, in the order they were added. */
export const $selectedParts = atom<string[]>([]);
/** svgId currently hovered (a clickable region), for region highlight. */
export const $hoveredPart = atom<string | null>(null);
/** human-readable name of the exact structure under the cursor (any mesh). */
export const $hoverLabel = atom<string | null>(null);
/** true once the user has interacted (hover/drag) — stops the idle auto-spin. */
export const $engaged = atom(false);

/** Add the part if absent, remove it if already selected. */
export function togglePart(svgId: string) {
  const cur = $selectedParts.get();
  $selectedParts.set(cur.includes(svgId) ? cur.filter((x) => x !== svgId) : [...cur, svgId]);
}
export function removePart(svgId: string) {
  $selectedParts.set($selectedParts.get().filter((x) => x !== svgId));
}
export function clearParts() {
  $selectedParts.set([]);
}
export function hoverPart(svgId: string | null) {
  $hoveredPart.set(svgId);
}
export function setSystem(system: SystemId) {
  $activeSystem.set(system);
  // Switching layers clears the selection (and closes the panel) — the previous
  // layer's parts may not exist on the new one.
  $selectedParts.set([]);
}
export function setView(view: ViewId) {
  $activeView.set(view);
}
