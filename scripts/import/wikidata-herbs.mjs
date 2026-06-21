// Wikidata herb importer (CC0 / public domain — https://www.wikidata.org).
//
// Generates herb remedy STUBS from a curated list of medicinal plants. Wikidata
// (via SPARQL) supplies the canonical taxon QID + scientific name; we link each
// herb to compounds we already imported, and write our own identity-only summary
// (no copied prose). Stubs carry NO efficacy claims (efficacy: []) — grading is
// curated/verified separately. Foods and herbs already in the library are skipped.
//
// Run: node scripts/import/wikidata-herbs.mjs
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REMEDIES_DIR = resolve(HERE, '../../src/content/remedies');

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const yamlList = (a) => `[${a.map((x) => `"${x.replace(/"/g, '\\"')}"`).join(', ')}]`;

// common · scientific (taxon, P225) · linked compound slugs (must already exist) · identity summary
const HERBS = [
  ['Green tea', 'Camellia sinensis', ['epigallocatechin-gallate', 'catechin'], 'The leaves of Camellia sinensis, rich in catechin antioxidants.'],
  ['Rosemary', 'Salvia rosmarinus', ['carnosic-acid'], 'An aromatic culinary herb of the mint family.'],
  ['Oregano', 'Origanum vulgare', ['carvacrol'], 'A pungent culinary and medicinal mint-family herb.'],
  ['Thyme', 'Thymus vulgaris', ['thymol'], 'An aromatic culinary herb traditionally used for coughs.'],
  ['Clove', 'Syzygium aromaticum', ['eugenol'], 'The dried flower buds of the clove tree, traditionally used for toothache.'],
  ['Licorice', 'Glycyrrhiza glabra', ['glycyrrhizin'], 'The sweet root of Glycyrrhiza glabra, long used in herbal medicine.'],
  ['Chinese skullcap', 'Scutellaria baicalensis', ['baicalin'], 'A root used in traditional Chinese medicine.'],
  ['Fennel', 'Foeniculum vulgare', ['anethole'], 'An anise-flavoured culinary herb traditionally used for digestion.'],
  ['Black pepper', 'Piper nigrum', ['piperine'], 'The common spice, whose piperine can enhance absorption of other compounds.'],
  ['Eucalyptus', 'Eucalyptus globulus', ['eucalyptol'], 'A tree whose leaf oil is traditionally inhaled for congestion.'],
  ['Rhodiola', 'Rhodiola rosea', [], 'An adaptogenic root traditionally used for fatigue and stress.'],
  ['Asian ginseng', 'Panax ginseng', [], 'A root traditionally used as a tonic and adaptogen.'],
  ['Holy basil', 'Ocimum tenuiflorum', [], 'Also called tulsi; an Ayurvedic herb used as an adaptogen.'],
  ['Fenugreek', 'Trigonella foenum-graecum', [], 'A seed used as a culinary spice and traditional remedy.'],
  ['Saw palmetto', 'Serenoa repens', [], 'A palm-berry extract traditionally used for prostate symptoms.'],
  ['Black cohosh', 'Actaea racemosa', [], 'A root traditionally used for menopausal symptoms.'],
  ['Passionflower', 'Passiflora incarnata', [], 'A climbing plant traditionally used for anxiety and sleep.'],
  ['Horse chestnut', 'Aesculus hippocastanum', [], 'A seed extract traditionally used for leg-vein symptoms.'],
  ['Gotu kola', 'Centella asiatica', [], 'An Ayurvedic and TCM herb used for wounds and circulation.'],
  ['Maca', 'Lepidium meyenii', [], 'An Andean root vegetable used as a traditional tonic.'],
  ['Andrographis', 'Andrographis paniculata', [], 'A bitter herb traditionally used for colds.'],
  ['Astragalus', 'Astragalus propinquus', [], 'A root used in traditional Chinese medicine as a tonic.'],
  ['Dandelion', 'Taraxacum officinale', [], 'A common plant whose leaf and root are used traditionally as a diuretic and digestive.'],
  ['Marshmallow root', 'Althaea officinalis', [], 'A mucilage-rich root traditionally used to soothe throat and gut.'],
  ['Schisandra', 'Schisandra chinensis', [], 'A berry used in traditional Chinese medicine as an adaptogen.'],
  ['Reishi', 'Ganoderma lingzhi', [], 'A medicinal mushroom used in traditional Chinese medicine.'],
  ["Cat's claw", 'Uncaria tomentosa', [], 'An Amazonian vine bark traditionally used for inflammation.'],
];

async function qid(scientific) {
  try {
    const q = `SELECT ?item WHERE { ?item wdt:P225 "${scientific}" } LIMIT 1`;
    const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/sparql-results+json', 'User-Agent': 'materia-importer/1.0 (research; contact via repo)' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const uri = json?.results?.bindings?.[0]?.item?.value;
    return uri ? uri.split('/').pop() : null;
  } catch {
    return null;
  }
}

const existing = new Set(
  existsSync(REMEDIES_DIR) ? readdirSync(REMEDIES_DIR).map((f) => f.replace(/\.md$/, '')) : []
);

let written = 0, skipped = 0;
for (const [common, scientific, compounds, summary] of HERBS) {
  const slug = slugify(common);
  if (existing.has(slug)) { skipped++; continue; }
  const q = await qid(scientific);
  await sleep(400);
  const src = q
    ? `[Wikidata ${q}](https://www.wikidata.org/wiki/${q}) (CC0)`
    : `[Wikidata](https://www.wikidata.org/wiki/Special:Search?search=${encodeURIComponent(scientific)}) (CC0)`;
  const body = [
    '---',
    `name: "${common}"`,
    'kind: "herb"',
    `aliases: ${yamlList([scientific])}`,
    `summary: "${summary.replace(/"/g, '\\"')}"`,
    `compounds: ${yamlList(compounds)}`,
    'efficacy: []',
    'safety: {"interactions":[],"contraindications":[],"sideEffects":[],"pregnancy":"unknown"}',
    'interactsWith: []',
    '---',
    '',
    `${summary} This is a reference stub — its evidence-graded uses are not yet curated here.`,
    '',
    `Identity: ${src}.`,
    '',
  ].join('\n');
  writeFileSync(resolve(REMEDIES_DIR, `${slug}.md`), body);
  console.log(`  ✓ ${common} (${scientific})${q ? ` — ${q}` : ' — no QID, search link'}${compounds.length ? ` · ${compounds.join(', ')}` : ''}`);
  written++;
}
console.log(`\nWikidata import: ${written} written · ${skipped} already existed.`);
