// Condition skeleton scaffolder.
//
// Bulk-creates condition STUBS across ICD-11 body systems to broaden coverage.
// IMPORTANT: names/aliases/summaries are neutral and written here; severity and
// red-flags are CURATED BY HAND (never scraped) because they are safety-critical.
// Stubs have no remedies until the curated import→grade loop reaches them; each
// links a MedlinePlus topic (public domain) for identity. Existing slugs skipped.
//
// Run: node scripts/import/conditions-scaffold.mjs
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(HERE, '../../src/content/conditions');
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const yamlList = (a) => `[${a.map((x) => `"${x.replace(/"/g, '\\"')}"`).join(', ')}]`;

// {name, slug?, aliases[], summary, severity, redFlags[], bodyParts[], mlp(MedlinePlus topic)}
const C = [
  // — Cardiovascular —
  { name: 'Heart failure', aliases: ['congestive heart failure', 'CHF'], summary: 'A long-term condition where the heart cannot pump blood as effectively as it should, causing breathlessness, fatigue, and fluid build-up.', severity: 'see-a-doctor', bodyParts: ['heart'], redFlags: ['Severe or sudden breathlessness, breathlessness at rest or lying flat, or waking gasping for air — seek urgent care.', 'Chest pain, fainting, or a racing/irregular heartbeat.', 'Rapid weight gain or swelling of legs/abdomen over days.'], mlp: 'heartfailure' },
  { name: 'Atrial fibrillation', aliases: ['AFib', 'irregular heartbeat', 'arrhythmia'], summary: 'An irregular, often rapid heart rhythm that raises the risk of stroke and heart failure.', severity: 'see-a-doctor', bodyParts: ['heart'], redFlags: ['Chest pain, severe breathlessness, or fainting — call emergency services.', 'Stroke signs (face droop, arm weakness, speech difficulty) — emergency.', 'A new irregular or racing pulse needs medical assessment and stroke-risk review.'], mlp: 'atrialfibrillation' },
  { name: 'Coronary artery disease', aliases: ['CAD', 'ischemic heart disease', 'clogged arteries'], summary: 'Narrowing of the arteries supplying the heart, which can cause chest pain (angina) and heart attacks.', severity: 'see-a-doctor', bodyParts: ['heart'], redFlags: ['Chest pain/pressure spreading to arm, jaw, or back, with sweating or breathlessness — possible heart attack; call emergency services.', 'Chest pain at rest or worsening with less exertion.'], mlp: 'coronaryarterydisease' },
  { name: 'High triglycerides', aliases: ['hypertriglyceridemia'], summary: 'Raised levels of triglyceride fats in the blood, which contribute to cardiovascular risk and, when very high, pancreatitis.', severity: 'chronic', bodyParts: ['heart', 'liver'], redFlags: ['Severe abdominal pain (very high triglycerides can trigger pancreatitis).'], mlp: 'triglycerides' },
  { name: 'Peripheral artery disease', aliases: ['PAD', 'claudication'], summary: 'Narrowed leg arteries that reduce blood flow, causing cramping leg pain on walking.', severity: 'see-a-doctor', bodyParts: ['calf'], redFlags: ['Leg pain at rest, non-healing foot wounds, or a cold/pale/blue foot — possible critical limb ischemia; urgent care.'], mlp: 'peripheralarterialdisease' },
  // — Respiratory —
  { name: 'Asthma', aliases: ['reactive airway disease'], summary: 'A chronic condition where the airways narrow and inflame, causing wheezing, breathlessness, and cough.', severity: 'see-a-doctor', bodyParts: ['lungs'], redFlags: ['Severe breathlessness, inability to speak in full sentences, blue lips, or a reliever inhaler not working — emergency.', 'Frequent night-time symptoms or rising reliever use needs review.'], mlp: 'asthma' },
  { name: 'COPD', aliases: ['chronic obstructive pulmonary disease', 'emphysema', 'chronic bronchitis'], summary: 'Long-term lung disease, usually from smoking, causing progressive breathlessness and cough.', severity: 'see-a-doctor', bodyParts: ['lungs'], redFlags: ['Sudden worsening breathlessness, blue lips, confusion, or coughing up blood — urgent care.', 'Fever and increased/discoloured phlegm (possible exacerbation).'], mlp: 'copd' },
  { name: 'Sinusitis', aliases: ['sinus infection', 'rhinosinusitis'], summary: 'Inflammation of the sinuses causing facial pressure, congestion, and nasal discharge — usually viral and self-limiting.', severity: 'self-limiting', bodyParts: ['head'], redFlags: ['Severe headache, swelling/redness around the eye, vision changes, or confusion — seek urgent care.', 'Symptoms beyond ~10 days or high fever (possible bacterial infection).'], mlp: 'sinusitis' },
  { name: 'Influenza', aliases: ['flu', 'seasonal flu'], summary: 'A viral respiratory infection causing fever, aches, and fatigue — usually self-limiting but riskier for vulnerable groups.', severity: 'self-limiting', bodyParts: ['lungs'], redFlags: ['Difficulty breathing, chest pain, persistent high fever, confusion, or bluish lips — urgent care.', 'High-risk groups (elderly, pregnant, chronic illness) should seek early advice.'], mlp: 'flu' },
  // — Digestive —
  { name: 'Peptic ulcer disease', aliases: ['stomach ulcer', 'duodenal ulcer'], summary: 'Open sores in the stomach or upper intestine lining, often from H. pylori or NSAIDs, causing burning upper-abdominal pain.', severity: 'see-a-doctor', bodyParts: ['stomach'], redFlags: ['Vomiting blood or black/tarry stools, or sudden severe abdominal pain — emergency (bleeding or perforation).', 'Unintentional weight loss or difficulty swallowing.'], mlp: 'pepticulcer' },
  { name: 'Hemorrhoids', aliases: ['piles'], summary: 'Swollen veins in the lower rectum and anus causing itching, discomfort, and bright-red bleeding.', severity: 'self-limiting', bodyParts: ['intestines'], redFlags: ['Significant or persistent rectal bleeding, dark blood, or change in bowel habits — must be checked to exclude other causes.'], mlp: 'hemorrhoids' },
  { name: 'Inflammatory bowel disease', aliases: ['IBD', "Crohn's disease", 'ulcerative colitis'], summary: 'Chronic immune-driven inflammation of the gut (Crohn’s or ulcerative colitis) causing diarrhea, pain, and bleeding.', severity: 'see-a-doctor', bodyParts: ['intestines'], redFlags: ['Bloody diarrhea, severe abdominal pain, high fever, or dehydration — urgent care.', 'Unintentional weight loss; this condition needs specialist management.'], mlp: 'crohnsdisease' },
  { name: 'Gallstones', aliases: ['cholelithiasis'], summary: 'Hardened deposits in the gallbladder that can block bile flow and cause severe right-upper-abdominal pain.', severity: 'see-a-doctor', bodyParts: ['liver'], redFlags: ['Severe abdominal pain with fever, jaundice (yellow skin/eyes), or vomiting — urgent care (possible infection or blockage).'], mlp: 'gallstones' },
  // — Endocrine / metabolic —
  { name: 'Hypothyroidism', aliases: ['underactive thyroid', 'low thyroid'], summary: 'An underactive thyroid producing too little hormone, causing fatigue, weight gain, cold intolerance, and low mood.', severity: 'see-a-doctor', bodyParts: ['thyroid'], redFlags: ['Profound lethargy, confusion, or low body temperature — rare but serious (myxedema); urgent care.', 'Do not stop prescribed thyroid medication; supplements do not replace it.'], mlp: 'hypothyroidism' },
  { name: 'Hyperthyroidism', aliases: ['overactive thyroid'], summary: 'An overactive thyroid producing too much hormone, causing weight loss, palpitations, anxiety, and heat intolerance.', severity: 'see-a-doctor', bodyParts: ['thyroid'], redFlags: ['High fever, racing/irregular heart, agitation, or confusion — possible thyroid storm; emergency.', 'Palpitations or significant weight loss need medical assessment.'], mlp: 'hyperthyroidism' },
  { name: 'Prediabetes', aliases: ['impaired glucose tolerance', 'borderline diabetes'], summary: 'Blood sugar higher than normal but not yet diabetic — a reversible warning stage where diet and activity matter most.', severity: 'chronic', bodyParts: ['pancreas'], redFlags: ['Symptoms of diabetes (excessive thirst, frequent urination, blurred vision) suggest progression — get tested.'], mlp: 'prediabetes' },
  { name: 'Obesity', aliases: ['overweight', 'weight management'], summary: 'Excess body fat that raises the risk of diabetes, heart disease, and joint problems; managed with diet, activity, and sometimes medication.', severity: 'chronic', bodyParts: [], redFlags: ['Rapid unexplained weight change, or weight gain with swelling/breathlessness — get assessed.'], mlp: 'obesity' },
  { name: 'Metabolic syndrome', aliases: ['insulin resistance syndrome'], summary: 'A cluster of risk factors — abdominal fat, high blood pressure, high blood sugar, and abnormal lipids — that together raise cardiovascular and diabetes risk.', severity: 'chronic', bodyParts: [], redFlags: ['Chest pain or stroke symptoms indicate the downstream cardiovascular risk has become acute — emergency.'], mlp: 'metabolicsyndrome' },
  // — Mental / neuro —
  { name: 'ADHD', aliases: ['attention deficit hyperactivity disorder'], summary: 'A neurodevelopmental condition affecting attention, impulse control, and activity level across daily life.', severity: 'see-a-doctor', bodyParts: ['brain'], redFlags: ['Thoughts of self-harm, or severe functional breakdown — seek professional help.', 'Diagnosis and treatment should be clinician-led; supplements are not a substitute.'], mlp: 'attentiondeficithyperactivitydisorder' },
  { name: 'Chronic stress', aliases: ['stress', 'burnout'], summary: 'Prolonged psychological stress that affects sleep, mood, and physical health.', severity: 'chronic', bodyParts: ['brain'], redFlags: ['Thoughts of suicide or self-harm — seek emergency help.', 'Stress with chest pain, panic, or inability to function — get support.'], mlp: 'stress' },
  { name: 'Restless legs syndrome', aliases: ['RLS', 'Willis-Ekbom disease'], summary: 'An irresistible urge to move the legs, usually in the evening, that disrupts sleep.', severity: 'chronic', bodyParts: ['calf'], redFlags: ['New, rapidly worsening, or one-sided symptoms, or weakness/numbness — get evaluated (and iron levels checked).'], mlp: 'restlesslegs' },
  { name: "Parkinson's disease", slug: 'parkinsons-disease', aliases: ['parkinsonism'], summary: 'A progressive neurological disorder affecting movement, causing tremor, stiffness, and slowness.', severity: 'see-a-doctor', bodyParts: ['brain'], redFlags: ['Sudden severe symptoms, falls, swallowing or breathing difficulty, or confusion — urgent care.', 'This condition requires specialist neurological management.'], mlp: 'parkinsonsdisease' },
  { name: 'Chronic fatigue', aliases: ['chronic fatigue syndrome', 'ME/CFS', 'persistent tiredness'], summary: 'Persistent, disabling fatigue not relieved by rest and not explained by another condition.', severity: 'chronic', bodyParts: [], redFlags: ['Fatigue with chest pain, breathlessness, marked weight loss, or fainting needs prompt medical work-up to exclude serious causes.'], mlp: 'chronicfatiguesyndrome' },
  // — Skin —
  { name: 'Psoriasis', aliases: ['plaque psoriasis'], summary: 'A chronic immune-driven skin condition causing thick, scaly, often itchy plaques.', severity: 'chronic', bodyParts: ['skin'], redFlags: ['Sudden widespread redness/pustules with fever (erythrodermic/pustular psoriasis) — urgent care.', 'Joint pain/swelling (possible psoriatic arthritis) needs assessment.'], mlp: 'psoriasis' },
  { name: 'Rosacea', aliases: ['facial redness'], summary: 'A chronic skin condition causing facial flushing, redness, and pimple-like bumps, usually on the central face.', severity: 'chronic', bodyParts: ['skin'], redFlags: ['Eye irritation, grittiness, or vision changes (ocular rosacea) — see a clinician.'], mlp: 'rosacea' },
  { name: 'Hair loss', aliases: ['androgenetic alopecia', 'male pattern baldness', 'thinning hair'], summary: 'Gradual thinning or loss of scalp hair, most commonly the hereditary androgenetic pattern.', severity: 'chronic', bodyParts: ['skin'], redFlags: ['Sudden patchy loss, scarring, scalp inflammation, or hair loss with other symptoms — get evaluated for treatable causes.'], mlp: 'hairloss' },
  { name: 'Seborrheic dermatitis', aliases: ['dandruff', 'seborrhea'], summary: 'A common scaly, itchy rash of oily areas like the scalp and face (dandruff is the mild scalp form).', severity: 'self-limiting', bodyParts: ['skin'], redFlags: ['Spreading redness, weeping, or signs of infection — see a clinician.'], mlp: 'seborrheicdermatitis' },
  // — Eye / ear —
  { name: 'Dry eye', aliases: ['dry eye syndrome', 'keratoconjunctivitis sicca'], summary: 'Insufficient or poor-quality tears causing gritty, irritated, tired eyes.', severity: 'chronic', bodyParts: ['head'], redFlags: ['Sudden vision change, severe pain, light sensitivity, or eye injury — urgent eye care.'], mlp: 'dryeye' },
  { name: 'Age-related macular degeneration', aliases: ['AMD', 'macular degeneration'], summary: 'Progressive damage to the central retina that blurs central vision in older adults.', severity: 'see-a-doctor', bodyParts: ['head'], redFlags: ['Sudden distortion or loss of central vision, or a dark spot — urgent ophthalmology (possible wet AMD).'], mlp: 'maculardegeneration' },
  { name: 'Tinnitus', aliases: ['ringing in the ears'], summary: 'The perception of ringing or buzzing with no external source, often linked to hearing loss.', severity: 'chronic', bodyParts: ['head'], redFlags: ['One-sided tinnitus, sudden hearing loss, vertigo, or pulsatile (heartbeat) tinnitus — needs prompt assessment.'], mlp: 'tinnitus' },
  // — Genitourinary / reproductive —
  { name: 'Benign prostatic hyperplasia', aliases: ['BPH', 'enlarged prostate'], summary: 'Non-cancerous prostate enlargement in older men causing urinary frequency, urgency, and a weak stream.', severity: 'see-a-doctor', bodyParts: [], redFlags: ['Inability to urinate (retention), blood in urine, or fever with urinary symptoms — urgent care.'], mlp: 'enlargedprostatebph' },
  { name: 'Erectile dysfunction', aliases: ['ED', 'impotence'], summary: 'Difficulty getting or keeping an erection, which can also be an early sign of cardiovascular disease.', severity: 'see-a-doctor', bodyParts: [], redFlags: ['New ED can signal heart or vascular disease or diabetes — worth a medical check.', 'An erection lasting over 4 hours (priapism) is an emergency.'], mlp: 'erectiledysfunction' },
  { name: 'Premenstrual syndrome', aliases: ['PMS', 'PMDD', 'premenstrual'], summary: 'Physical and emotional symptoms in the days before a period, ranging from mild to disabling (PMDD).', severity: 'self-limiting', bodyParts: [], redFlags: ['Severe mood symptoms or thoughts of self-harm (possible PMDD) — seek help.'], mlp: 'premenstrualsyndrome' },
  { name: 'Menopause symptoms', aliases: ['menopause', 'hot flashes', 'perimenopause'], summary: 'Symptoms around the end of menstruation — hot flashes, sleep and mood changes — from declining estrogen.', severity: 'chronic', bodyParts: [], redFlags: ['Bleeding after menopause must always be medically evaluated.'], mlp: 'menopause' },
  { name: 'Polycystic ovary syndrome', aliases: ['PCOS'], summary: 'A common hormonal disorder causing irregular periods, excess androgens, and metabolic effects.', severity: 'see-a-doctor', bodyParts: [], redFlags: ['Very irregular or absent periods, or difficulty conceiving — needs medical assessment and metabolic screening.'], mlp: 'polycysticovarysyndrome' },
  { name: 'Period pain', aliases: ['dysmenorrhea', 'menstrual cramps'], summary: 'Painful cramping during menstruation, usually from uterine contractions.', severity: 'self-limiting', bodyParts: [], redFlags: ['Severe or worsening pain, pain outside periods, or pain with fever/abnormal bleeding — may signal endometriosis or infection.'], mlp: 'perioddpain' },
  { name: 'Overactive bladder', aliases: ['OAB', 'urinary urgency'], summary: 'A sudden, frequent urge to urinate, sometimes with leakage.', severity: 'chronic', bodyParts: [], redFlags: ['Blood in urine, pain, fever, or new urgency with neurological symptoms — get evaluated.'], mlp: 'urinaryincontinence' },
  // — Pain / other —
  { name: 'Fibromyalgia', aliases: ['widespread pain syndrome'], summary: 'A chronic condition of widespread pain, fatigue, and sleep and mood disturbance, with heightened pain sensitivity.', severity: 'chronic', bodyParts: [], redFlags: ['New focal weakness, joint swelling, fever, or weight loss suggests a different diagnosis — get assessed.'], mlp: 'fibromyalgia' },
  { name: 'Cold sores', aliases: ['herpes labialis', 'fever blisters'], summary: 'Recurrent blisters around the lips caused by the herpes simplex virus.', severity: 'self-limiting', bodyParts: ['head'], redFlags: ['Sores near the eye, widespread blisters, or in someone immunocompromised — seek care.'], mlp: 'coldsores' },
];

const existing = new Set(
  existsSync(DIR) ? readdirSync(DIR).map((f) => f.replace(/\.md$/, '')) : []
);
let written = 0, skipped = 0, order = 40;
for (const c of C) {
  const slug = c.slug || slugify(c.name);
  if (existing.has(slug)) { skipped++; continue; }
  const rf = c.redFlags.map((r) => `  - "${r.replace(/"/g, '\\"')}"`).join('\n');
  const body = [
    '---',
    `name: "${c.name}"`,
    `aliases: ${yamlList(c.aliases)}`,
    `summary: "${c.summary.replace(/"/g, '\\"')}"`,
    `bodyParts: ${yamlList(c.bodyParts)}`,
    `severity: "${c.severity}"`,
    'redFlags:',
    rf,
    `order: ${order++}`,
    '---',
    '',
    `${c.summary} This is a reference stub — evidence-graded remedies for it are not yet curated here.`,
    '',
    `Background: [MedlinePlus](https://medlineplus.gov/${c.mlp}.html) (public domain).`,
    '',
  ].join('\n');
  writeFileSync(resolve(DIR, `${slug}.md`), body);
  console.log(`  ✓ ${c.name} [${c.severity}]${c.bodyParts.length ? ' · ' + c.bodyParts.join(',') : ''}`);
  written++;
}
console.log(`\nConditions scaffold: ${written} written · ${skipped} already existed.`);
