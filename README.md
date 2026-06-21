# Materia

**The Examine.com of the whole body.** Explore a layered, clickable human body and find the herbs,
supplements, chemicals, and drugs that may help any part or condition — each one **evidence-graded**
and **linked to the research behind it**. Ad-free. Educational, not medical advice.

It's built on a knowledge graph: **body → condition → remedy → active compound → mechanism → study**,
traversable from any direction. Every claim is cited (the build fails if one isn't).

## Quick start

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output → dist/
npm run check      # astro type check
npm run checks     # content-integrity warnings
npm run lint       # biome
```

Node 22 (`.nvmrc`). Deploys static to Cloudflare Pages.

## How it's organized

- **Content is the product.** Each body part, condition, remedy, compound, and study is a Markdown
  file in `src/content/` whose frontmatter wires the graph. See `src/content.config.ts`.
- **One interactive surface.** The body explorer is a React island (`src/components/react/`); the
  rest is static HTML.
- Architecture, conventions, and contributor rules: **`AGENTS.md`**. Status and roadmap:
  **`PROJECT_STATUS.md`**. Asset licenses: **`ATTRIBUTIONS.md`**. Decisions: **`docs/`**.

## Principles

- Every efficacy claim is graded (A/B/C/D/insufficient) **and** cited. No exceptions.
- Grades are per remedy × condition; efficacy and safety are separate.
- We describe what was studied — never a dose to take.
- No ads, no affiliate links, no supplement sales.
- Prominent disclaimers and red-flag triage throughout.
