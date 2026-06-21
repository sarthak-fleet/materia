# Attributions

Materia is ad-free and cites all evidence. This file tracks third-party **assets** and their
licenses (CC-BY / CC-BY-SA require attribution). Evidence **citations** live inline on each entity
page and study page, not here.

## Data sources (bulk-imported)

Reproducible importers live in `scripts/import/`. All sources below are **public domain**; we import
only structured facts and write our own neutral descriptions (no copied prose → no CC-BY-SA
contamination). Imported entities carry **no efficacy claims** — grading stays curated and verified.

| Source | License | Used for | Importer |
|--------|---------|----------|----------|
| [PubChem](https://pubchem.ncbi.nlm.nih.gov) (NIH/NLM) | Public domain | Compound chemistry (CID, molecular formula); each compound links to its CID | `scripts/import/pubchem-compounds.mjs` |
| [openFDA](https://open.fda.gov) / [DailyMed](https://dailymed.nlm.nih.gov) (U.S. FDA/NLM) | Public domain | Drug brand-name aliases + reference stubs (drug *class* is curated by hand — openFDA's `pharm_class` is unreliable for combination products) | `scripts/import/openfda-drugs.mjs` |
| [Wikidata](https://www.wikidata.org) | CC0 (public domain) | Herb taxon QID + scientific name; herb stubs linked to imported compounds (identity summaries written by us, not copied) | `scripts/import/wikidata-herbs.mjs` |

*NCCIH / NIH ODS / MedlinePlus are public-domain too but are HTML fact sheets (no clean bulk API), so
they're cited inline as `sources` on curated entries rather than mass-imported.*

We deliberately do **not** scrape proprietary databases (Examine, NatMed, Healthline). Their graded
evidence is copyrighted editorial work; copying it would infringe and would defeat Materia's purpose.

## Fonts

- **Inter** (Variable) — SIL Open Font License 1.1 — via `@fontsource-variable/inter`.
- **Fraunces** (Variable) — SIL Open Font License 1.1 — via `@fontsource-variable/fraunces`.

## Icons & 3D libraries

- **Lucide** — ISC License — via `lucide-react`.
- **Draco decoder** (`public/draco/`) — Apache License 2.0 (Google) — self-hosted from the copy
  bundled in `three`, used to decode the Draco-compressed anatomy GLBs.

## Anatomy artwork

### 3D explorer (active renderer)

The explorer renders in 3D via react-three-fiber (`src/components/react/ThreeBody.tsx`).
Interaction (hover/select per part id) flows through the same nanostores seam as the 2D SVG fallback,
so the visible model is swappable per layer without touching the wiring.

- **Visible body meshes:** **all 9 Z-Anatomy system layers** (skeletal, muscular, organs [+brain],
  nervous, cardiovascular, respiratory, digestive, endocrine, integumentary), extracted to
  **Draco-compressed** GLBs under `public/models/` (~14 MB total), swapped by the layer toggle. The 2D
  `AnatomyBody` is the fallback if a file is absent. A visible credit is shown under the explorer
  (CC-BY-SA requirement).

| Asset | Source | Author | License | Notes |
|-------|--------|--------|---------|-------|
| `public/models/body.glb` (skeleton) | [Z-Anatomy / Models-of-human-anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy) | Z-Anatomy (built on DBCLS BodyParts3D) | **CC-BY-SA 4.0** | Extracted the "1: Skeletal system" collection, decimated (Blender, ratio 0.18) to ~2.9 MB. Derivative stays CC-BY-SA; credited here + visibly in-app. |
| `public/models/body-muscular.glb` (muscles) | [Z-Anatomy / Models-of-human-anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy) | Z-Anatomy (built on DBCLS BodyParts3D) | **CC-BY-SA 4.0** | Extracted the "4: Muscular system" collection, decimated (Blender, ratio 0.10) to ~4.9 MB. Same CC-BY-SA terms. |

### 2D fallback (retained)

The original hand-authored stylized region map (`src/components/react/AnatomyBody.tsx`) is kept as
the SVG fallback implementation of the renderer contract — original art, no third-party source.

**License policy:** prefer MIT / CC-BY / public-domain. CC-BY-SA (share-alike) is acceptable for the
3D model **only**; if used, it must be attributed here and visibly in the app, and the model
derivative remains share-alike (does not affect site code or content).
