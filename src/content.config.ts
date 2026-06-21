import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { SYSTEM_IDS } from './data/systems';

/* ------------------------------------------------------------------ *
 * Shared vocabularies
 * ------------------------------------------------------------------ */

/**
 * Evidence grade — Examine-style consumer letter on top of a GRADE-inspired
 * certainty judgement underneath. Graded PER remedy × condition, never globally.
 */
export const GRADES = ['A', 'B', 'C', 'D', 'insufficient'] as const;
export type Grade = (typeof GRADES)[number];

export const REMEDY_KINDS = [
  'herb',
  'supplement',
  'nutrient',
  'chemical',
  'medicine',
  'drug',
  'practice',
] as const;

export const TRADITIONS = ['ayurveda', 'tcm', 'western', 'other'] as const;
export const ALIGNMENTS = ['aligns', 'conflicts', 'mixed', 'unstudied'] as const;

export const STUDY_DESIGNS = [
  'systematic-review',
  'meta-analysis',
  'rct',
  'cohort',
  'case-control',
  'cross-sectional',
  'case-report',
  'in-vitro',
  'animal',
  'review',
  'other',
] as const;

const REGIONS = [
  'head',
  'neck',
  'thorax',
  'abdomen',
  'pelvis',
  'upper-limb',
  'lower-limb',
  'back',
  'whole-body',
] as const;

const SEVERITY = ['self-limiting', 'chronic', 'see-a-doctor'] as const;
const PREGNANCY = ['avoid', 'caution', 'likely-safe', 'unknown'] as const;
const INTERACTION_SEVERITY = ['severe', 'moderate', 'minor', 'theoretical'] as const;

/** A traditional-medicine claim, paired with how modern evidence treats it. */
const traditionClaim = z.object({
  system: z.enum(TRADITIONS),
  claim: z.string(),
  alignment: z.enum(ALIGNMENTS),
});

/**
 * One efficacy claim = (this remedy) × (one condition), graded and cited.
 * This array is the Examine-style remedy×outcome matrix and the source data
 * for the condition pages, the evidence heatmap, and comparison tables.
 *
 * INVARIANT: every claim must cite at least one study or source. Enforced at
 * build time so an uncited medical claim can never ship.
 */
const efficacyClaim = z
  .object({
    condition: reference('conditions'),
    grade: z.enum(GRADES),
    /** Plain-language one-liner justifying the grade in context. Required. */
    summary: z.string(),
    studies: z.array(reference('studies')).default([]),
    sources: z.array(reference('sources')).default([]),
    tradition: z.array(traditionClaim).default([]),
  })
  .refine((c) => c.studies.length + c.sources.length > 0, {
    message: 'Each efficacy claim must cite at least one study or source.',
  });

/* ------------------------------------------------------------------ *
 * Collections
 * ------------------------------------------------------------------ */

/** sources — non-study citations: fact sheets, monographs, .gov pages. */
const sources = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/sources' }),
  schema: z.object({
    title: z.string(),
    publisher: z.enum([
      'NCCIH',
      'MedlinePlus',
      'MSK About Herbs',
      'Cochrane',
      'Examine',
      'NIH ODS',
      'WHO',
      'other',
    ]),
    url: z.string().url(),
    year: z.number().int().optional(),
    accessed: z.coerce.date(),
    type: z
      .enum(['fact-sheet', 'monograph', 'guideline', 'database', 'other'])
      .default('fact-sheet'),
  }),
});

/** studies — primary research. The research-paper backbone. */
const studies = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/studies' }),
  schema: z.object({
    title: z.string(),
    design: z.enum(STUDY_DESIGNS),
    year: z.number().int(),
    /** sample size, when applicable */
    n: z.number().int().optional(),
    population: z.string().optional(),
    intervention: z.string().optional(),
    outcome: z.string().optional(),
    /** plain-language takeaway of the result */
    effect: z.string(),
    journal: z.string().optional(),
    pmid: z.string().optional(),
    doi: z.string().optional(),
    url: z.string().url(),
    accessed: z.coerce.date(),
  }),
});

/** compounds — active constituents as first-class graph nodes. */
const compounds = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/compounds' }),
  schema: z.object({
    name: z.string(),
    aliases: z.array(z.string()).default([]),
    classification: z.string().optional(), // e.g. "polyphenol (curcuminoid)"
    summary: z.string(),
    /** mechanism-of-action explainer */
    mechanism: z.string().optional(),
    /** biological targets / pathways */
    targets: z.array(z.string()).default([]),
  }),
});

/** bodyParts — anatomical regions; the explorer's clickable nodes. */
const bodyParts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/body-parts' }),
  schema: z.object({
    name: z.string(),
    /** which anatomical layers this part appears on */
    systems: z.array(z.enum(SYSTEM_IDS)).nonempty(),
    /** id used as data-part on the SVG path(s); usually === slug */
    svgId: z.string(),
    region: z.enum(REGIONS),
    view: z.array(z.enum(['anterior', 'posterior'])).default(['anterior']),
    summary: z.string(),
    conditions: z.array(reference('conditions')).default([]),
    order: z.number().default(99),
  }),
});

/** conditions — symptoms / disorders. The link between body and remedy. */
const conditions = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/conditions' }),
  schema: z.object({
    name: z.string(),
    /** lay terms + synonyms — drives symptom search ("joint pain" → arthralgia) */
    aliases: z.array(z.string()).default([]),
    summary: z.string(),
    bodyParts: z.array(reference('bodyParts')).default([]),
    severity: z.enum(SEVERITY).default('self-limiting'),
    /** symptoms that mean "see a clinician, do not self-treat" */
    redFlags: z.array(z.string()).default([]),
    order: z.number().default(99),
  }),
});

/** remedies — herbs, supplements, chemicals, and drugs. */
const remedies = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/remedies' }),
  schema: z.object({
    name: z.string(),
    kind: z.enum(REMEDY_KINDS),
    aliases: z.array(z.string()).default([]),
    summary: z.string(),
    compounds: z.array(reference('compounds')).default([]),
    /** the remedy×condition evidence matrix */
    efficacy: z.array(efficacyClaim).default([]),
    /** non-prescriptive: what researchers studied, never a recommendation */
    typicalUse: z
      .object({
        form: z.string().optional(),
        studiedRange: z.string().optional(),
        notes: z.string().optional(),
      })
      .optional(),
    safety: z
      .object({
        interactions: z.array(z.string()).default([]),
        contraindications: z.array(z.string()).default([]),
        sideEffects: z.array(z.string()).default([]),
        pregnancy: z.enum(PREGNANCY).default('unknown'),
      })
      .default({}),
    /** typed interaction edges — powers the safety checker */
    interactsWith: z
      .array(
        z.object({
          target: reference('remedies'),
          severity: z.enum(INTERACTION_SEVERITY),
          mechanism: z.string(),
          source: reference('sources').optional(),
        })
      )
      .default([]),
  }),
});

export const collections = {
  sources,
  studies,
  compounds,
  bodyParts,
  conditions,
  remedies,
};
