import { getCollection, getEntries, getEntry, type CollectionEntry } from 'astro:content';
import type { ExplorerPart } from '@/lib/explorer/renderer';

/* ------------------------------------------------------------------ *
 * The knowledge graph is stored as cross-references between content
 * collections. These helpers resolve it at build time so pages can
 * traverse it in any direction (body ↔ condition ↔ remedy ↔ compound
 * ↔ study) without each page re-implementing the joins.
 * ------------------------------------------------------------------ */

type Remedy = CollectionEntry<'remedies'>;
type Condition = CollectionEntry<'conditions'>;

const byOrder = (a: { data: { order?: number } }, b: { data: { order?: number } }) =>
  (a.data.order ?? 99) - (b.data.order ?? 99);

/** All body parts, shaped for the explorer island. */
export async function getExplorerParts(): Promise<ExplorerPart[]> {
  const parts = (await getCollection('bodyParts')).sort(byOrder);
  return Promise.all(
    parts.map(async (p) => {
      const conds = p.data.conditions.length ? await getEntries(p.data.conditions) : [];
      return {
        svgId: p.data.svgId,
        slug: p.id,
        name: p.data.name,
        summary: p.data.summary,
        systems: p.data.systems,
        conditions: conds.map((c) => ({ slug: c.id, name: c.data.name })),
      };
    })
  );
}

/** Best (highest) grade order for sorting; A is best. */
const GRADE_RANK: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, insufficient: 4 };

/** Remedies that have a graded efficacy claim for a given condition slug. */
export async function remediesForCondition(conditionSlug: string) {
  const remedies = await getCollection('remedies');
  const hits = remedies
    .map((r) => {
      const claim = r.data.efficacy.find((e) => e.condition.id === conditionSlug);
      return claim ? { remedy: r, claim } : null;
    })
    .filter((x): x is { remedy: Remedy; claim: Remedy['data']['efficacy'][number] } => x !== null);
  hits.sort((a, b) => GRADE_RANK[a.claim.grade] - GRADE_RANK[b.claim.grade]);
  return hits;
}

/** Resolve a single efficacy claim's citations (studies + sources). */
export async function resolveClaimCitations(claim: Remedy['data']['efficacy'][number]) {
  const studies = claim.studies.length ? await getEntries(claim.studies) : [];
  const sources = claim.sources.length ? await getEntries(claim.sources) : [];
  return { studies, sources };
}

/** Full remedy view: efficacy (with resolved condition + citations), compounds, interactions. */
export async function getRemedyView(remedy: Remedy) {
  const efficacy = await Promise.all(
    remedy.data.efficacy.map(async (e) => ({
      condition: await getEntry(e.condition),
      grade: e.grade,
      summary: e.summary,
      tradition: e.tradition,
      ...(await resolveClaimCitations(e)),
    }))
  );
  efficacy.sort((a, b) => GRADE_RANK[a.grade] - GRADE_RANK[b.grade]);

  const compounds = remedy.data.compounds.length ? await getEntries(remedy.data.compounds) : [];

  const interactions = await Promise.all(
    remedy.data.interactsWith.map(async (i) => ({
      target: await getEntry(i.target),
      severity: i.severity,
      mechanism: i.mechanism,
      source: i.source ? await getEntry(i.source) : null,
    }))
  );

  return { efficacy, compounds, interactions };
}

/** Condition view: affected body parts + graded remedies. */
export async function getConditionView(condition: Condition) {
  const bodyParts = condition.data.bodyParts.length
    ? await getEntries(condition.data.bodyParts)
    : [];
  const remedies = await remediesForCondition(condition.id);
  return { bodyParts, remedies };
}

/** Compound view: every remedy that contains this compound (+ that remedy's best grade). */
export async function getCompoundView(compoundSlug: string) {
  const remedies = await getCollection('remedies');
  const found = remedies.filter((r) => r.data.compounds.some((c) => c.id === compoundSlug));
  return found.map((r) => {
    const best = [...r.data.efficacy].sort((a, b) => GRADE_RANK[a.grade] - GRADE_RANK[b.grade])[0];
    return { remedy: r, bestGrade: best?.grade ?? null };
  });
}

/** Study view: every remedy×condition claim that cites this study. */
export async function getStudyCitedBy(studySlug: string) {
  const remedies = await getCollection('remedies');
  const out: { remedy: Remedy; conditionSlug: string; grade: string }[] = [];
  for (const r of remedies) {
    for (const e of r.data.efficacy) {
      if (e.studies.some((s) => s.id === studySlug)) {
        out.push({ remedy: r, conditionSlug: e.condition.id, grade: e.grade });
      }
    }
  }
  return out;
}

/** All remedies that list an interaction with the given remedy (incoming edges). */
export async function interactionsInvolving(remedySlug: string) {
  const remedies = await getCollection('remedies');
  const incoming: { remedy: Remedy; severity: string; mechanism: string }[] = [];
  for (const r of remedies) {
    for (const i of r.data.interactsWith) {
      if (i.target.id === remedySlug) {
        incoming.push({ remedy: r, severity: i.severity, mechanism: i.mechanism });
      }
    }
  }
  return incoming;
}

/** Flat remedy safety data for the client-side interaction checker. */
export async function getCheckerData() {
  const remedies = (await getCollection('remedies')).sort((a, b) =>
    a.data.name.localeCompare(b.data.name)
  );
  return Promise.all(
    remedies.map(async (r) => ({
      slug: r.id,
      name: r.data.name,
      kind: r.data.kind,
      aliases: r.data.aliases,
      compounds: r.data.compounds.length
        ? (await getEntries(r.data.compounds)).map((c) => ({ slug: c.id, name: c.data.name }))
        : [],
      interactions: r.data.safety.interactions,
      contraindications: r.data.safety.contraindications,
      pregnancy: r.data.safety.pregnancy,
      interactsWith: r.data.interactsWith.map((i) => ({
        target: i.target.id,
        severity: i.severity,
        mechanism: i.mechanism,
      })),
    }))
  );
}
