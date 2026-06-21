# Adding the 3D body model

The explorer renders **2D** until a segmented anatomy model exists at
`public/models/body.glb`; drop one there and it auto-switches to **3D** with true per-part
clicking (no code change — `hasModel` is detected at build time in `src/pages/index.astro`).

This guide produces that GLB from **Z-Anatomy** (the best free, per-part-named anatomy source).

## Why Blender is required

Z-Anatomy ships as a Blender `.blend` (built on BodyParts3D). It is **CC-BY-SA 4.0** — so the
exported model stays CC-BY-SA and must be attributed (already slotted in `ATTRIBUTIONS.md`). The
sandbox can't download it or run Blender, so this step is done on your machine.

## Steps

1. **Get the source.** Clone/download Z-Anatomy: https://github.com/Z-Anatomy/The-blend
   (the "Lite" build is smaller and plenty for v1). Open the `.blend` in **Blender 4.x**.
2. **Keep only what we need.** Z-Anatomy separates systems into collections. For the current
   musculoskeletal slice, keep **Skeleton + Muscles**; hide/delete the rest (nerves, vessels, etc.)
   to shrink the file. You can keep more later — breadth is cheap once the pipeline works.
3. **DO NOT "Join" meshes.** Keep structures as **separate named objects** — those object names
   become the glTF mesh names my code matches on. Joining everything into one mesh destroys per-part
   clicking.
4. **Decimate for the web.** The full atlas is huge. Select the meshes → add a **Decimate** modifier
   (Collapse, ratio ~0.2–0.4) and apply. Aim for a final GLB **under ~15 MB**.
5. **Export.** `File → Export → glTF 2.0 (.glb)`:
   - Format: **glTF Binary (.glb)**
   - Include: **Visible Objects** (or Selected)
   - Transform: leave **+Y Up** on (default) — my code expects Y-up; Blender converts automatically.
   - Data → Mesh: **on**. Material: **on**.
   - **Leave Draco compression OFF** (default `useGLTF` has no Draco decoder; decimation handles size).
6. **Drop it:** save as `public/models/body.glb`.
7. **Build/deploy** (`npm run build`) — the explorer is now 3D.

## Wiring the names to our parts

My component (`src/components/react/ThreeBody.tsx`) maps each mesh name → a part slug via
`PART_KEYWORDS` (keyword substring match, walking up parents), e.g. `femur`/`vastus`→`thigh`,
`patella`→`knee`, `tibia`/`gastrocnemius`→`calf`, `carpal`/`phalan`→`hand`, `lumbar`/`L1–L5`→
`lower-back`. Z-Anatomy uses standard anatomical names, so most match out of the box.

After you add the model, **open the browser console** — it logs `[ThreeBody] unmapped meshes: [...]`.
Paste me that list and I'll extend `PART_KEYWORDS` so every relevant structure is clickable. Meshes
that map to no part are visible but inert (correct — we only have content for 5 regions so far).

## Notes

- Hosting stays **$0** (static, Cloudflare unlimited bandwidth); the GLB is just a cached asset.
- Keep the GLB lean — it loads on the homepage only. If you need Draco later, enable it on export
  **and** switch the loader to `useGLTF(url, true)`.
- The 2D `AnatomyBody` remains the fallback, so the site never breaks if the model is missing.
