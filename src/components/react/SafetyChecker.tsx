import { useMemo, useState } from 'react';
import { AlertTriangle, Plus, X } from 'lucide-react';

export interface CheckerRemedy {
  slug: string;
  name: string;
  kind: string;
  aliases: string[];
  compounds: { slug: string; name: string }[];
  interactions: string[];
  contraindications: string[];
  pregnancy: 'avoid' | 'caution' | 'likely-safe' | 'unknown';
  interactsWith: { target: string; severity: string; mechanism: string }[];
}

// Risk classes inferred from each remedy's recorded interactions — lets us warn
// when a stack piles up several items that act on the same system.
const RISK_CLASSES: { label: string; kw: string[] }[] = [
  {
    label: 'increased bleeding risk',
    kw: ['anticoag', 'antiplatelet', 'warfarin', 'aspirin', 'bleeding', 'salicylate'],
  },
  {
    label: 'serotonin / antidepressant interaction',
    kw: ['ssri', 'maoi', 'antidepressant', 'serotonin'],
  },
  { label: 'excess sedation', kw: ['sedative', 'benzodiazepine', 'cns depressant', 'alcohol'] },
  { label: 'low blood sugar', kw: ['antidiabetic', 'blood sugar', 'glucose', 'diabet'] },
  { label: 'low blood pressure', kw: ['antihypertensive', 'blood pressure'] },
  { label: 'altered drug levels (CYP / P-gp)', kw: ['cyp', 'p-glycoprotein', 'p-gp'] },
];

const SEVERITY_RANK: Record<string, number> = { severe: 0, moderate: 1, minor: 2, theoretical: 3 };

function riskClassesOf(r: CheckerRemedy): string[] {
  const hay = r.interactions.join(' · ').toLowerCase();
  return RISK_CLASSES.filter((c) => c.kw.some((k) => hay.includes(k))).map((c) => c.label);
}

type Warning = {
  severity: 'severe' | 'moderate' | 'minor' | 'info';
  title: string;
  detail: string;
};

export default function SafetyChecker({ remedies }: { remedies: CheckerRemedy[] }) {
  const [stack, setStack] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const bySlug = useMemo(() => new Map(remedies.map((r) => [r.slug, r])), [remedies]);
  const items = stack.map((s) => bySlug.get(s)).filter((r): r is CheckerRemedy => !!r);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return remedies
      .filter(
        (r) =>
          !stack.includes(r.slug) &&
          (r.name.toLowerCase().includes(q) || r.aliases.some((a) => a.toLowerCase().includes(q)))
      )
      .slice(0, 6);
  }, [query, remedies, stack]);

  const warnings = useMemo<Warning[]>(() => {
    const out: Warning[] = [];
    // 1. explicit recorded interactions between two items in the stack
    for (const r of items) {
      for (const i of r.interactsWith) {
        if (stack.includes(i.target) && r.slug < i.target) {
          const other = bySlug.get(i.target);
          const sev = (i.severity as Warning['severity']) ?? 'moderate';
          out.push({
            severity: sev === 'theoretical' ? 'minor' : sev,
            title: `${r.name} + ${other?.name ?? i.target}`,
            detail: i.mechanism,
          });
        }
      }
    }
    // 2. additive risk classes (≥2 items sharing a class)
    const byClass = new Map<string, string[]>();
    for (const r of items) {
      for (const c of riskClassesOf(r)) {
        byClass.set(c, [...(byClass.get(c) ?? []), r.name]);
      }
    }
    for (const [cls, names] of byClass) {
      if (names.length >= 2)
        out.push({
          severity: 'moderate',
          title: `Additive ${cls}`,
          detail: `${names.join(', ')} can each contribute — combining them may add up.`,
        });
    }
    // 3. shared active compound (duplication)
    const byCompound = new Map<string, string[]>();
    for (const r of items) {
      for (const c of r.compounds)
        byCompound.set(c.name, [...(byCompound.get(c.name) ?? []), r.name]);
    }
    for (const [comp, names] of byCompound) {
      if (names.length >= 2)
        out.push({
          severity: 'minor',
          title: `Duplicate compound: ${comp}`,
          detail: `${names.join(', ')} all contain ${comp} — you may be doubling the dose.`,
        });
    }
    // 4. pregnancy flags
    const preg = items.filter((r) => r.pregnancy === 'avoid' || r.pregnancy === 'caution');
    if (preg.length)
      out.push({
        severity: 'info',
        title: 'Pregnancy caution',
        detail: preg.map((r) => `${r.name} (${r.pregnancy})`).join(', '),
      });
    return out.sort(
      (a, b) =>
        (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) ||
        a.title.localeCompare(b.title)
    );
  }, [items, stack, bySlug]);

  const COLOR: Record<Warning['severity'], string> = {
    severe: 'var(--color-warn)',
    moderate: 'var(--color-caution)',
    minor: 'var(--color-grade-d)',
    info: 'var(--color-accent)',
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <section>
        <label htmlFor="add" className="eyebrow mb-2 block">
          Add what you take
        </label>
        <div className="relative">
          <input
            id="add"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a herb, supplement, or drug…"
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          {results.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] shadow-lg">
              {results.map((r) => (
                <li key={r.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setStack([...stack, r.slug]);
                      setQuery('');
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-accent-soft)]"
                  >
                    <span>
                      {r.name}{' '}
                      <span className="text-[11px] text-[var(--color-faint)]">{r.kind}</span>
                    </span>
                    <Plus size={14} className="text-[var(--color-faint)]" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {items.length === 0 ? (
            <p className="text-sm text-[var(--color-faint)]">
              Your stack is empty. Add two or more items to check for interactions.
            </p>
          ) : (
            items.map((r) => (
              <span
                key={r.slug}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] py-1 pr-1.5 pl-3 text-sm"
              >
                {r.name}
                <button
                  type="button"
                  aria-label={`Remove ${r.name}`}
                  onClick={() => setStack(stack.filter((s) => s !== r.slug))}
                  className="rounded-full p-0.5 text-[var(--color-faint)] hover:bg-[var(--color-line)] hover:text-[var(--color-ink)]"
                >
                  <X size={13} />
                </button>
              </span>
            ))
          )}
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setStack([])}
            className="mt-3 text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            Clear all
          </button>
        )}
      </section>

      <section>
        <p className="eyebrow mb-2">
          {items.length < 2
            ? 'Checks'
            : warnings.length === 0
              ? 'No flags found'
              : `${warnings.length} flag${warnings.length === 1 ? '' : 's'}`}
        </p>
        {items.length < 2 ? (
          <p className="text-sm text-[var(--color-muted)]">Add at least two items to check.</p>
        ) : warnings.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            No interactions, duplications, or shared risks recorded for this combination. This is
            not a guarantee of safety — our data is not exhaustive.
          </p>
        ) : (
          <ul className="space-y-3">
            {warnings.map((w) => (
              <li
                key={`${w.title}-${w.severity}`}
                className="card flex gap-3 p-4"
                style={{
                  borderColor: `color-mix(in oklab, ${COLOR[w.severity]} 35%, transparent)`,
                }}
              >
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0"
                  style={{ color: COLOR[w.severity] }}
                />
                <div>
                  <p className="text-sm font-medium text-[var(--color-ink)]">
                    {w.title}
                    <span
                      className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white"
                      style={{ background: COLOR[w.severity] }}
                    >
                      {w.severity}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--color-muted)]">{w.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
