// PubChem compound importer (public domain — https://pubchem.ncbi.nlm.nih.gov).
//
// Enriches a CURATED seed list (we write the neutral summary + classification —
// no copied prose, so no CC-BY-SA contamination) with verifiable public-domain
// chemistry from PubChem REST: CID + molecular formula. We only write a file if
// PubChem resolves the name to a real CID, so nothing is fabricated. Compounds
// carry no efficacy claims — they are factual chemistry nodes.
//
// Run: node scripts/import/pubchem-compounds.mjs
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const COMPOUNDS_DIR = resolve(HERE, '../../src/content/compounds');

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// name · classification · neutral one-line summary (curated by us) · aliases
const SEED = [
  ['Quercetin', 'flavonol (polyphenol)', 'A flavonol antioxidant abundant in onions, apples, and tea.', []],
  ['Resveratrol', 'stilbenoid polyphenol', 'A polyphenol from grapes and red wine studied for metabolic and cardiovascular effects.', []],
  ['Epigallocatechin gallate', 'catechin (flavan-3-ol)', 'The main catechin of green tea.', ['EGCG']],
  ['Sulforaphane', 'isothiocyanate', 'An isothiocyanate from broccoli and other cruciferous vegetables.', []],
  ['Lutein', 'xanthophyll carotenoid', 'A carotenoid pigment concentrated in the macula of the eye.', []],
  ['Lycopene', 'carotenoid', 'The red carotenoid pigment of tomatoes.', []],
  ['Genistein', 'isoflavone', 'A soy isoflavone with weak estrogen-like activity.', []],
  ['Hesperidin', 'flavanone glycoside', 'A citrus-peel flavonoid.', []],
  ['Rutin', 'flavonol glycoside', 'A glycoside of quercetin found in buckwheat and citrus.', []],
  ['Apigenin', 'flavone', 'A flavone found in chamomile and parsley.', []],
  ['Luteolin', 'flavone', 'A flavone found in many culinary herbs.', []],
  ['Kaempferol', 'flavonol', 'A flavonol found across many edible plants.', []],
  ['Ellagic acid', 'polyphenol', 'A polyphenol found in berries and pomegranate.', []],
  ['Chlorogenic acid', 'hydroxycinnamic acid ester', 'A polyphenol abundant in coffee.', []],
  ['Ferulic acid', 'hydroxycinnamic acid', 'A plant cell-wall antioxidant phenolic.', []],
  ['Piperine', 'alkaloid', 'The pungent alkaloid of black pepper, studied for boosting absorption of other compounds.', []],
  ['Eugenol', 'phenylpropanoid', 'The aromatic compound of clove oil.', []],
  ['Thymol', 'monoterpene phenol', 'An antiseptic aromatic compound from thyme.', []],
  ['Carvacrol', 'monoterpene phenol', 'An antimicrobial aromatic compound from oregano.', []],
  ['Eucalyptol', 'monoterpenoid ether', 'The main component of eucalyptus oil.', ['cineole', '1,8-cineole']],
  ['Valerenic acid', 'sesquiterpenoid', 'A sedative constituent of valerian root.', []],
  ['Hypericin', 'naphthodianthrone', 'A red pigment of St John’s wort.', []],
  ['Bisabolol', 'sesquiterpene alcohol', 'A soothing constituent of chamomile.', ['alpha-bisabolol']],
  ['Naringenin', 'flavanone', 'A citrus flavanone (notably grapefruit).', []],
  ['Baicalin', 'flavone glycoside', 'A flavonoid from Scutellaria (skullcap).', []],
  ['Glycyrrhizin', 'triterpenoid saponin', 'The sweet saponin of licorice root.', ['glycyrrhizic acid']],
  ['Gymnemic acid', 'triterpenoid saponin', 'Saponins from Gymnema sylvestre studied for blood sugar and sweet-taste suppression.', []],
  ['Anethole', 'phenylpropene', 'The sweet aromatic of fennel and anise.', []],
  ['Carnosic acid', 'diterpene', 'An antioxidant diterpene from rosemary and sage.', []],
  ['Theaflavin', 'polyphenol', 'A polyphenol formed when black tea is oxidized.', []],
  ['Catechin', 'flavan-3-ol', 'A flavan-3-ol found in tea, cocoa, and many fruits.', []],
];

async function pubchem(name) {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
    name
  )}/property/MolecularFormula/JSON`;
  const res = await fetch(url, { headers: { 'User-Agent': 'materia-importer/1.0 (research)' } });
  if (!res.ok) return null;
  const json = await res.json();
  const p = json?.PropertyTable?.Properties?.[0];
  return p?.CID ? { cid: p.CID, formula: p.MolecularFormula ?? '' } : null;
}

const yamlList = (arr) => `[${arr.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(', ')}]`;

const existing = new Set(
  existsSync(COMPOUNDS_DIR) ? readdirSync(COMPOUNDS_DIR).map((f) => f.replace(/\.md$/, '')) : []
);

let written = 0;
let skipped = 0;
let failed = 0;
for (const [name, classification, summary, aliases] of SEED) {
  const slug = slugify(name);
  if (existing.has(slug)) {
    skipped++;
    continue;
  }
  let info = null;
  try {
    info = await pubchem(name);
  } catch {
    info = null;
  }
  await sleep(250); // be gentle to PubChem (<5 req/s)
  if (!info) {
    console.log(`  ✗ ${name} — no PubChem CID resolved, skipped (not fabricating)`);
    failed++;
    continue;
  }
  const body = [
    '---',
    `name: "${name}"`,
    `classification: "${classification}"`,
    `aliases: ${yamlList(aliases)}`,
    `summary: "${summary.replace(/"/g, '\\"')}"`,
    'targets: []',
    '---',
    '',
    `${summary} Chemistry verified via PubChem (CID ${info.cid}${info.formula ? `, ${info.formula}` : ''}).`,
    '',
    `Source: [PubChem CID ${info.cid}](https://pubchem.ncbi.nlm.nih.gov/compound/${info.cid}) (public domain).`,
    '',
  ].join('\n');
  writeFileSync(resolve(COMPOUNDS_DIR, `${slug}.md`), body);
  console.log(`  ✓ ${name} (CID ${info.cid}, ${info.formula})`);
  written++;
}

console.log(`\nPubChem import: ${written} written · ${skipped} already existed · ${failed} unresolved.`);
