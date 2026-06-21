# Materia — agent guide

The "Examine.com of the whole body": an Astro static, content-first reference where a layered,
clickable human body leads into a knowledge graph of **body → condition → remedy → compound →
study**, with every remedy evidence-graded and study-cited. Ad-free, not medical advice.

Read `PROJECT_STATUS.md` first — it is the single durable status record. This file is navigation.

## Stack

- **Astro 5** static (`output: 'static'`, `build.format: 'file'`, inlined CSS). Deploy: Cloudflare Pages.
- **Tailwind v4** via `@tailwindcss/vite` + Lightning CSS. Tokens live in `src/styles/global.css` (`@theme`).
- **React 19 islands** (`@astrojs/react`) only where interactive; **nanostores** for explorer state.
- **Content collections** + Zod + `reference()` — `src/content.config.ts`. **npm**, Node 22, **Biome 2.5**.

## Layout

```
src/
  content.config.ts        # 6 collections: sources, studies, compounds, bodyParts, conditions, remedies
  content/<collection>/*.md # the canonical, hand-editable content (frontmatter = the graph)
  data/systems.ts          # anatomical layers (single source of truth)
  lib/graph.ts             # build-time graph joins (use these; don't re-implement)
  lib/grades.ts            # grade/tradition/severity metadata
  lib/explorer/            # store.ts (nanostores), renderer.ts (3D-ready contract)
  components/astro/*        # EvidenceBadge, CitationList, SafetyBlock, UseGuidance, TraditionOverlay, …
  components/react/*        # BodyExplorer, AnatomyBody, LayerToggle, PartPanel
  pages/                   # index + part/condition/remedy/compound/study/[slug] + lists + search
scripts/content-checks.mjs # soft warnings (svgId↔region, dosing-verb lint)
```

## Commands

- `npm run dev` · `npm run build` · `npm run check` (astro check) · `npm run checks` (content) ·
  `npm run lint` / `npm run format` (Biome).

## Rules that matter here

- **Every efficacy claim must be cited.** The schema enforces `≥1 study/source` per claim — the build
  fails otherwise. Never weaken this. Do not invent PMIDs/DOIs; verify against PubMed/NCCIH/Cochrane.
- **Grade conservatively, per remedy × condition.** Keep efficacy and safety as separate axes.
- **Describe, don't prescribe.** Use `typicalUse.studiedRange` ("studied at…"), never a dose. The
  content-check lints for imperative dosing prose.
- **Cross-link with `reference()`** so integrity is build-checked. New body-part `svgId`s should match
  a region in `AnatomyBody.tsx` (keep `SVG_REGIONS` in `content-checks.mjs` in sync) or they warn.
- **Trust posture:** no ads, no affiliate links, no supplement sales. The commerce layer is reserved
  but must stay firewalled from evidence.
- Disclaimers are non-negotiable: sitewide banner + inline block on entity pages + red-flag gating.

## Fleet guidance

Follows the fleet Astro standard (ref: `sarthakagrawal`) and `AGENTS.md` at the fleet root. Keep
changes small and typed; keep the build green; update `PROJECT_STATUS.md` when scope ships.
