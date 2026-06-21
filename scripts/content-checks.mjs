/**
 * Soft content-integrity checks (warnings, non-fatal).
 *
 * The HARD invariants — referential integrity and "every efficacy claim is
 * cited" — are already enforced at build time by Zod + reference() in
 * content.config.ts, so the build fails on those. This script catches the
 * softer issues that should be reviewed but not block a build:
 *   1. body-part svgId with no matching region in the explorer SVG
 *   2. remedy prose that reads like a dose/prescription
 *
 * Run: `node scripts/content-checks.mjs`
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src', 'content');

// Keep in sync with REGIONS in src/components/react/AnatomyBody.tsx
const SVG_REGIONS = new Set([
  'head',
  'neck',
  'shoulder',
  'chest',
  'abdomen',
  'upper-arm',
  'forearm',
  'hand',
  'hip',
  'thigh',
  'knee',
  'calf',
  'foot',
]);

// Imperative dosing language we never want in prose (we describe, not prescribe).
const DOSING = /\b(take|use|consume|swallow|apply)\s+\d/i;

let warnings = 0;
const warn = (msg) => {
  warnings++;
  console.warn(`  ⚠ ${msg}`);
};

const read = (col) => {
  const dir = join(CONTENT, col);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .map((f) => ({ slug: f.replace(/\.mdx?$/, ''), text: readFileSync(join(dir, f), 'utf8') }));
};

console.log('Content checks…');

console.log('• body-part svgId → explorer region');
for (const { slug, text } of read('body-parts')) {
  const m = text.match(/svgId:\s*"([^"]+)"/);
  if (m && !SVG_REGIONS.has(m[1])) {
    warn(
      `body-parts/${slug}: svgId "${m[1]}" has no anterior region yet (content ok, not clickable in the explorer)`
    );
  }
}

console.log('• remedy prose dosing language');
for (const { slug, text } of read('remedies')) {
  const body = text.split(/^---$/m).slice(2).join('---');
  if (DOSING.test(body)) {
    warn(
      `remedies/${slug}: prose looks like a dose ("take 500 mg"). Use "studied at …" framing instead.`
    );
  }
}

console.log(warnings === 0 ? '✓ No warnings.' : `Done — ${warnings} warning(s) to review.`);
