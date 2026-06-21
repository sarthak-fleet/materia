# Decision log

Durable "why" behind Materia's shape. Status/roadmap live in `../PROJECT_STATUS.md`.

## Stack: Astro (not a Vite+React SPA) — 2026-06-21
Materia is content-first (a cited reference library) with **one** interactive surface (the explorer).
Astro content collections give type-safe, statically-rendered per-entity pages with real URLs and
SEO; the explorer is a single hydrated island. A full SPA would pay JS everywhere for no benefit.

## Data model: a knowledge graph with first-class compounds & studies — 2026-06-21
Six cross-referenced collections (`bodyParts`, `conditions`, `remedies`, `compounds`, `studies`,
`sources`). Modeling **compounds** and **studies** as their own nodes is the differentiator: it lets
every entity become a richly interlinked page (a combinatorial SEO long-tail) and supports traversal
from any direction. `reference()` makes the graph build-checked.

## Trust as a hard constraint — 2026-06-21
- **Every efficacy claim must cite ≥1 study/source**, enforced in the schema (`.nonempty()`); the
  build fails otherwise. This makes "fully cited" a guarantee, not a promise.
- **Grade conservatively, per remedy × condition**; efficacy and safety are separate axes.
- **Describe, don't prescribe:** `typicalUse.studiedRange` only ("studied at…"), never a dose. A
  content-check lints for imperative dosing prose.
- **No ads / affiliates / supplement sales** — both a differentiator and the lowest FTC-liability
  posture. A future commerce layer stays architecturally firewalled from evidence.

## In-browser AI: embeddings, not a generative medical model — 2026-06-21
Research finding: no prebuilt medical LLM exists for browser runtimes; the one capable small model
(MedGemma 4B) is license-barred from patient-facing use; and medical fine-tunes underperform
generalists (RAG > fine-tuning). So Materia will use a **small embedding model client-side** for
semantic search/RAG over our own cited content — it ranks and retrieves vetted passages, never
generates medical prose. Generative chat is out.

## Build sequence: deep vertical slice first — 2026-06-21
Target is the full vision (all systems, all moats), but built as a complete-but-narrow slice
(musculoskeletal) wired through the entire feature set, so the whole product is visible early; breadth
is then incremental. v1 anatomy art is an original stylized region map — a deliberate placeholder for
a later segmented per-system art pass (sources/licensing in `ATTRIBUTIONS.md`).

## Citation verification & the unverifiable few — 2026-06-21
The seed evidence was verified against PubMed / NCCIH / Cochrane / MSK. Where a specific identifier
could not be 100% confirmed, we cite the **confirmed umbrella reference / DOI** instead of a doubtful
PMID:
- **Comfrey** individual RCTs → cited via the confirmed *Staiger 2012, Phytotherapy Research* overview
  (PMID 22359388).
- **Menthol** → cited via *Sundstrup 2014* (DOI 10.1155/2014/310913), PMID intentionally omitted as
  unconfirmed.
Principle: when in doubt, cite what is verified, or grade down — never publish a fabricated citation.

A follow-up link-check of every source URL found two dead secondary links (NCCIH `cayenne`
and MSK `devils-claw`, both 404). Both were only *secondary* citations on claims that already cite a
verified primary study (Tshering 2024; Cochrane Oltean 2014), so they were **dropped** rather than
guessed — the claims stay fully cited. ODS factsheet URLs return 403 to bots but are the correct
canonical pattern. Re-run the check before adding sources: link-check `src/content/sources/*` URLs.

## Naming & domain — 2026-06-21
Name **Materia** (from *materia medica*). Exact-match `.com`s were all taken; `materia.io` is
available and is the chosen domain (`askgalen.com` reserved as a `.com` alternative).
