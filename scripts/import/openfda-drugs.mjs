// openFDA drug importer (public domain — https://open.fda.gov).
//
// LESSON LEARNED: openFDA's pharm_class_epc[0] is unreliable because a generic
// name often matches a COMBINATION-product label (e.g. metformin matched a
// metformin+sitagliptin label → "DPP-4 inhibitor", which is wrong). So the drug
// CLASS is curated here (correct, by hand) and openFDA contributes only verified
// brand-name aliases (filtered to single-token brands to avoid combo noise).
// Drugs are reference stubs with no efficacy claims (efficacy: []).
//
// Run: node scripts/import/openfda-drugs.mjs
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REMEDIES_DIR = resolve(HERE, '../../src/content/remedies');

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const yamlList = (arr) => `[${arr.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(', ')}]`;

// generic → curated, correct classification phrase (used verbatim in the summary).
const DRUGS = {
  ibuprofen: 'nonsteroidal anti-inflammatory drug (NSAID)',
  naproxen: 'nonsteroidal anti-inflammatory drug (NSAID)',
  aspirin: 'salicylate NSAID and antiplatelet drug',
  acetaminophen: 'analgesic and antipyretic',
  celecoxib: 'COX-2 selective nonsteroidal anti-inflammatory drug',
  omeprazole: 'proton pump inhibitor',
  esomeprazole: 'proton pump inhibitor',
  pantoprazole: 'proton pump inhibitor',
  famotidine: 'histamine H2-receptor antagonist',
  metformin: 'biguanide antidiabetic drug',
  atorvastatin: 'statin (HMG-CoA reductase inhibitor)',
  simvastatin: 'statin (HMG-CoA reductase inhibitor)',
  rosuvastatin: 'statin (HMG-CoA reductase inhibitor)',
  lisinopril: 'ACE inhibitor',
  amlodipine: 'calcium channel blocker',
  losartan: 'angiotensin II receptor blocker (ARB)',
  metoprolol: 'beta blocker',
  hydrochlorothiazide: 'thiazide diuretic',
  warfarin: 'vitamin K antagonist anticoagulant',
  clopidogrel: 'antiplatelet drug (P2Y12 inhibitor)',
  apixaban: 'direct factor Xa inhibitor anticoagulant',
  rivaroxaban: 'direct factor Xa inhibitor anticoagulant',
  levothyroxine: 'thyroid hormone replacement',
  sertraline: 'selective serotonin reuptake inhibitor (SSRI) antidepressant',
  fluoxetine: 'selective serotonin reuptake inhibitor (SSRI) antidepressant',
  escitalopram: 'selective serotonin reuptake inhibitor (SSRI) antidepressant',
  citalopram: 'selective serotonin reuptake inhibitor (SSRI) antidepressant',
  amoxicillin: 'penicillin-class antibiotic',
  azithromycin: 'macrolide antibiotic',
  ciprofloxacin: 'fluoroquinolone antibiotic',
  doxycycline: 'tetracycline antibiotic',
  prednisone: 'corticosteroid',
  albuterol: 'short-acting beta-2 agonist bronchodilator',
  montelukast: 'leukotriene receptor antagonist',
  gabapentin: 'gabapentinoid anticonvulsant and nerve-pain drug',
  tramadol: 'opioid analgesic',
  amitriptyline: 'tricyclic antidepressant',
  duloxetine: 'serotonin-norepinephrine reuptake inhibitor (SNRI)',
  diphenhydramine: 'first-generation (sedating) antihistamine',
  loratadine: 'second-generation (non-sedating) antihistamine',
  cetirizine: 'second-generation (non-sedating) antihistamine',
  fexofenadine: 'second-generation (non-sedating) antihistamine',
  metronidazole: 'nitroimidazole antibiotic',
  fluconazole: 'azole antifungal',
  ramipril: 'ACE inhibitor',
  enalapril: 'ACE inhibitor',
  perindopril: 'ACE inhibitor',
  valsartan: 'angiotensin II receptor blocker (ARB)',
  candesartan: 'angiotensin II receptor blocker (ARB)',
  telmisartan: 'angiotensin II receptor blocker (ARB)',
  irbesartan: 'angiotensin II receptor blocker (ARB)',
  atenolol: 'beta blocker',
  bisoprolol: 'beta blocker',
  carvedilol: 'beta blocker',
  propranolol: 'beta blocker',
  diltiazem: 'calcium channel blocker',
  verapamil: 'calcium channel blocker',
  nifedipine: 'calcium channel blocker',
  furosemide: 'loop diuretic',
  spironolactone: 'potassium-sparing diuretic',
  indapamide: 'thiazide-like diuretic',
  pravastatin: 'statin (HMG-CoA reductase inhibitor)',
  glipizide: 'sulfonylurea antidiabetic drug',
  gliclazide: 'sulfonylurea antidiabetic drug',
  glimepiride: 'sulfonylurea antidiabetic drug',
  sitagliptin: 'DPP-4 inhibitor antidiabetic drug',
  empagliflozin: 'SGLT2 inhibitor antidiabetic drug',
  dapagliflozin: 'SGLT2 inhibitor antidiabetic drug',
  pioglitazone: 'thiazolidinedione antidiabetic drug',
  lansoprazole: 'proton pump inhibitor',
  rabeprazole: 'proton pump inhibitor',
  paroxetine: 'selective serotonin reuptake inhibitor (SSRI) antidepressant',
  venlafaxine: 'serotonin-norepinephrine reuptake inhibitor (SNRI)',
  mirtazapine: 'atypical antidepressant',
  bupropion: 'atypical antidepressant (NDRI)',
  diazepam: 'benzodiazepine',
  lorazepam: 'benzodiazepine',
  alprazolam: 'benzodiazepine',
  zolpidem: 'non-benzodiazepine sedative-hypnotic',
  codeine: 'opioid analgesic',
  morphine: 'opioid analgesic',
  oxycodone: 'opioid analgesic',
  dabigatran: 'direct thrombin inhibitor anticoagulant',
  ticagrelor: 'antiplatelet drug (P2Y12 inhibitor)',
  sildenafil: 'PDE5 inhibitor',
  tadalafil: 'PDE5 inhibitor',
  sumatriptan: 'triptan (serotonin 5-HT1 agonist)',
  ondansetron: 'serotonin 5-HT3 receptor antagonist antiemetic',
  allopurinol: 'xanthine oxidase inhibitor (urate-lowering drug)',
  alendronate: 'bisphosphonate',
  clarithromycin: 'macrolide antibiotic',
  nitrofurantoin: 'urinary antibiotic',
  trimethoprim: 'antibiotic',
  cephalexin: 'cephalosporin antibiotic',
  acyclovir: 'antiviral',
  oseltamivir: 'antiviral (neuraminidase inhibitor)',
  terbinafine: 'antifungal',
  hydrocortisone: 'corticosteroid',
};

// Curated risk-class keywords per drug, phrased to trigger the SafetyChecker's
// additive-risk-class matcher (bleeding / serotonin / sedation / blood sugar /
// blood pressure / CYP). This is what makes a stacked herb+drug combo flag.
const RISK = {
  ibuprofen: ['Antiplatelet effect — additive bleeding risk with anticoagulants', 'May raise blood pressure'],
  naproxen: ['Antiplatelet effect — additive bleeding risk with anticoagulants', 'May raise blood pressure'],
  aspirin: ['Antiplatelet / salicylate — additive bleeding risk', 'Anticoagulant interactions'],
  celecoxib: ['Antiplatelet/bleeding risk with anticoagulants', 'May raise blood pressure'],
  metformin: ['Additive blood sugar lowering with other antidiabetic agents'],
  atorvastatin: ['CYP3A4 substrate — levels raised by CYP3A4 inhibitors'],
  simvastatin: ['CYP3A4 substrate — levels raised by CYP3A4 inhibitors'],
  rosuvastatin: ['Affected by drugs altering its transport'],
  lisinopril: ['Additive blood pressure lowering', 'Potassium retention'],
  amlodipine: ['Additive blood pressure lowering'],
  losartan: ['Additive blood pressure lowering', 'Potassium retention'],
  metoprolol: ['Additive blood pressure lowering and heart-rate slowing'],
  hydrochlorothiazide: ['Additive blood pressure lowering'],
  warfarin: ['Anticoagulant — additive bleeding risk', 'Many CYP interactions alter its levels'],
  clopidogrel: ['Antiplatelet — additive bleeding risk'],
  apixaban: ['Anticoagulant — additive bleeding risk', 'CYP3A4 / P-glycoprotein substrate'],
  rivaroxaban: ['Anticoagulant — additive bleeding risk', 'CYP3A4 / P-glycoprotein substrate'],
  levothyroxine: ['Absorption reduced by calcium, iron, and magnesium'],
  sertraline: ['Serotonergic antidepressant — serotonin syndrome risk with other serotonergic agents'],
  fluoxetine: ['Serotonergic antidepressant (SSRI) — serotonin syndrome risk', 'CYP inhibitor'],
  escitalopram: ['Serotonergic antidepressant (SSRI) — serotonin syndrome risk'],
  citalopram: ['Serotonergic antidepressant (SSRI) — serotonin syndrome risk'],
  duloxetine: ['Serotonergic antidepressant (SNRI) — serotonin syndrome risk'],
  amitriptyline: ['Serotonergic antidepressant — serotonin syndrome risk', 'Sedative / CNS depressant'],
  tramadol: ['Serotonergic opioid — serotonin syndrome risk', 'Sedative / CNS depressant'],
  ciprofloxacin: ['Absorption reduced by calcium, iron, and magnesium'],
  doxycycline: ['Absorption reduced by calcium, iron, and magnesium'],
  prednisone: ['May raise blood sugar', 'May raise blood pressure'],
  gabapentin: ['Sedative / CNS depressant — additive sedation'],
  diphenhydramine: ['Sedative / CNS depressant — additive sedation', 'Anticholinergic'],
  metronidazole: ['Disulfiram-like reaction with ethanol'],
  fluconazole: ['CYP inhibitor — raises levels of some drugs'],
  ramipril: ['Additive blood pressure lowering', 'Potassium retention'],
  enalapril: ['Additive blood pressure lowering', 'Potassium retention'],
  perindopril: ['Additive blood pressure lowering'],
  valsartan: ['Additive blood pressure lowering', 'Potassium retention'],
  candesartan: ['Additive blood pressure lowering'],
  telmisartan: ['Additive blood pressure lowering'],
  irbesartan: ['Additive blood pressure lowering'],
  atenolol: ['Additive blood pressure lowering and heart-rate slowing'],
  bisoprolol: ['Additive blood pressure lowering and heart-rate slowing'],
  carvedilol: ['Additive blood pressure lowering and heart-rate slowing'],
  propranolol: ['Additive blood pressure lowering and heart-rate slowing'],
  diltiazem: ['Additive blood pressure lowering', 'CYP3A4 inhibitor'],
  verapamil: ['Additive blood pressure lowering', 'CYP3A4 inhibitor'],
  nifedipine: ['Additive blood pressure lowering'],
  furosemide: ['Additive blood pressure lowering'],
  spironolactone: ['Additive blood pressure lowering', 'Potassium retention'],
  indapamide: ['Additive blood pressure lowering'],
  glipizide: ['Additive blood sugar lowering with other antidiabetic agents'],
  gliclazide: ['Additive blood sugar lowering with other antidiabetic agents'],
  glimepiride: ['Additive blood sugar lowering with other antidiabetic agents'],
  sitagliptin: ['Additive blood sugar lowering'],
  empagliflozin: ['Additive blood sugar lowering'],
  dapagliflozin: ['Additive blood sugar lowering'],
  pioglitazone: ['Additive blood sugar lowering'],
  paroxetine: ['Serotonergic antidepressant (SSRI) — serotonin syndrome risk', 'CYP2D6 inhibitor'],
  venlafaxine: ['Serotonergic antidepressant (SNRI) — serotonin syndrome risk', 'May raise blood pressure'],
  mirtazapine: ['Serotonergic antidepressant — serotonin syndrome risk', 'Sedative / CNS depressant'],
  diazepam: ['Sedative / CNS depressant — additive sedation'],
  lorazepam: ['Sedative / CNS depressant — additive sedation'],
  alprazolam: ['Sedative / CNS depressant — additive sedation'],
  zolpidem: ['Sedative / CNS depressant — additive sedation'],
  codeine: ['Sedative / CNS depressant — additive sedation', 'Serotonergic — serotonin syndrome risk'],
  morphine: ['Sedative / CNS depressant — additive sedation'],
  oxycodone: ['Sedative / CNS depressant — additive sedation'],
  dabigatran: ['Anticoagulant — additive bleeding risk', 'P-glycoprotein substrate'],
  ticagrelor: ['Antiplatelet — additive bleeding risk', 'CYP3A4 substrate'],
  sildenafil: ['Additive blood pressure lowering (dangerous with nitrates)'],
  tadalafil: ['Additive blood pressure lowering (dangerous with nitrates)'],
  sumatriptan: ['Serotonergic (triptan) — serotonin syndrome risk with antidepressants'],
  ondansetron: ['Serotonergic — serotonin syndrome risk (theoretical)'],
  clarithromycin: ['Strong CYP3A4 inhibitor — raises levels of many drugs'],
  terbinafine: ['CYP2D6 inhibitor'],
  hydrocortisone: ['May raise blood sugar', 'May raise blood pressure'],
};

async function brands(generic) {
  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(
      generic
    )}"&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'materia-importer/1.0 (research)' } });
    if (!res.ok) return [];
    const json = await res.json();
    const list = json?.results?.[0]?.openfda?.brand_name || [];
    return [...new Set(list.map((b) => titleCase(b.toLowerCase().trim())))]
      .filter((b) => /^[A-Za-z][A-Za-z0-9-]+$/.test(b) && b.toLowerCase() !== generic.toLowerCase())
      .slice(0, 2);
  } catch {
    return [];
  }
}

const existing = new Set(
  existsSync(REMEDIES_DIR) ? readdirSync(REMEDIES_DIR).map((f) => f.replace(/\.md$/, '')) : []
);

let written = 0, skipped = 0;
for (const [generic, cls] of Object.entries(DRUGS)) {
  const slug = slugify(generic);
  if (existing.has(slug)) { skipped++; continue; }
  const aliases = await brands(generic);
  await sleep(300);
  const name = titleCase(generic);
  const an = /^[aeiou]/i.test(cls);
  const dailymed = `https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${encodeURIComponent(generic)}`;
  const body = [
    '---',
    `name: "${name}"`,
    'kind: "drug"',
    `aliases: ${yamlList(aliases)}`,
    `summary: "${an ? 'An' : 'A'} ${cls}."`,
    'compounds: []',
    'efficacy: []',
    `safety: {"interactions":${JSON.stringify(RISK[generic] || [])},"contraindications":[],"sideEffects":[],"pregnancy":"unknown"}`,
    'interactsWith: []',
    '---',
    '',
    `${name} is ${an ? 'an' : 'a'} ${cls}. This is a reference stub — its uses and interactions are not yet curated here.`,
    '',
    `Source: [U.S. FDA drug labeling](${dailymed}) via openFDA (public domain).`,
    '',
  ].join('\n');
  writeFileSync(resolve(REMEDIES_DIR, `${slug}.md`), body);
  console.log(`  ✓ ${name} — ${cls}${aliases.length ? ` (${aliases.join(', ')})` : ''}`);
  written++;
}
console.log(`\nopenFDA import: ${written} written · ${skipped} already existed.`);
