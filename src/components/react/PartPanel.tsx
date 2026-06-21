import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { ArrowRight, X } from 'lucide-react';
import { $selectedParts, clearParts, removePart } from '@/lib/explorer/store';
import type { ExplorerPart } from '@/lib/explorer/renderer';

type Entry =
  | { id: string; kind: 'part'; part: ExplorerPart }
  | { id: string; kind: 'structure'; name: string };

/**
 * Multi-select side panel. Non-modal (no backdrop) so you can keep clicking the
 * body to add structures. Shows mapped regions (with cited conditions) and
 * any clicked structure that has no content region yet (by name).
 */
export default function PartPanel({ parts }: { parts: ExplorerPart[] }) {
  const selectedIds = useStore($selectedParts);
  const entries: Entry[] = selectedIds
    .map((id): Entry | null => {
      if (id.startsWith('#')) return { id, kind: 'structure', name: id.slice(1) };
      const part = parts.find((p) => p.svgId === id);
      return part ? { id, kind: 'part', part } : null;
    })
    .filter((e): e is Entry => e !== null);

  useEffect(() => {
    if (entries.length === 0) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && clearParts();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [entries.length]);

  if (entries.length === 0) return null;

  return (
    <aside
      aria-label="Selected structures"
      className="fixed inset-x-0 bottom-0 z-40 max-h-[72vh] overflow-y-auto border-t border-[var(--color-line)] bg-[var(--color-surface)] shadow-2xl sm:inset-x-auto sm:top-14 sm:right-0 sm:bottom-0 sm:max-h-none sm:w-[380px] sm:border-t-0 sm:border-l"
      style={{ animation: 'rise 0.22s var(--ease-out-expo) both' }}
    >
      <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-faint)]">
          Selected · {entries.length}
        </p>
        <button
          type="button"
          onClick={() => clearParts()}
          className="text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
        >
          Clear all
        </button>
      </div>

      <div className="divide-y divide-[var(--color-line)]">
        {entries.map((entry) => {
          const name = entry.kind === 'part' ? entry.part.name : entry.name;
          return (
            <section key={entry.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-xl text-[var(--color-ink)]">{name}</h2>
                <button
                  type="button"
                  aria-label={`Remove ${name}`}
                  onClick={() => removePart(entry.id)}
                  className="rounded-md p-1 text-[var(--color-faint)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
                >
                  <X size={16} />
                </button>
              </div>

              {entry.kind === 'structure' ? (
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-faint)]">
                  No remedy data is recorded for this specific structure yet. Hover the body to
                  explore, and click a{' '}
                  <span className="text-[var(--color-accent)]">highlighted region</span> for cited
                  remedies.
                </p>
              ) : (
                <>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
                    {entry.part.summary}
                  </p>
                  {entry.part.conditions.length > 0 ? (
                    <ul className="mt-3 space-y-1.5">
                      {entry.part.conditions.map((c) => (
                        <li key={c.slug}>
                          <a
                            href={`/condition/${c.slug}`}
                            className="flex items-center justify-between rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
                          >
                            {c.name}
                            <ArrowRight size={15} className="text-[var(--color-faint)]" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--color-faint)]">
                      No conditions linked yet.
                    </p>
                  )}
                  <a
                    href={`/part/${entry.part.slug}`}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] hover:underline"
                  >
                    Open {entry.part.name} page <ArrowRight size={14} />
                  </a>
                </>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
}
