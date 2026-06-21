import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Bounds, OrbitControls, useGLTF } from '@react-three/drei';
import { useStore } from '@nanostores/react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  $engaged,
  $hoverLabel,
  $hoveredPart,
  $selectedParts,
  hoverPart,
  togglePart,
} from '@/lib/explorer/store';
import type { ExplorerPart } from '@/lib/explorer/renderer';

/**
 * ThreeBody — the 3D renderer. It loads whichever segmented GLB the active layer
 * points to (`modelUrl`: skeleton or muscle), and maps each mesh's anatomical
 * name → one of our part slugs (PART_KEYWORDS) for TRUE per-part hover/click.
 * Interaction flows through the same nanostores seam as the 2D body, so the
 * panel/toggle/links are renderer-agnostic. Floating `.g` text labels are stripped.
 *
 * PART_KEYWORDS is ORDER-SENSITIVE — specific-first so substrings resolve right:
 *   head before chest  ("cribriform" ⊃ "rib")
 *   forearm before foot/calf, foot before calf  ("…digitorum longus" is leg)
 * After adding a model, the dev console logs `[ThreeBody] unmapped meshes:`.
 */
const ACCENT = '#1f8a70';
const ACCENT_COLOR = new THREE.Color(ACCENT);

const PART_KEYWORDS: Record<string, string[]> = {
  head: [
    'mandible',
    'maxilla',
    'skull',
    'cranium',
    'cranial',
    'frontal',
    'parietal',
    'occipital',
    'temporal',
    'sphenoid',
    'ethmoid',
    'cribriform',
    'nasal',
    'zygomatic',
    'lacrimal',
    'vomer',
    'palatine',
    'tooth',
    'teeth',
    'orbit',
    'hyoid',
    'malleus',
    'incus',
    'stapes',
    'ossicle',
    'concha',
    'turbinate',
    'clinoid',
    'petrous',
    'sella',
    'mastoid',
    'pterygoid',
    'clivus',
    'glabella',
    'vermian',
    'mental',
    'squamous part',
    'tympanic',
    'masseter',
    'orbicularis',
    'buccinator',
    'risorius',
    'procerus',
    'nasalis',
    'depressor',
    'levator labii',
    'auricular',
    'digastric',
    'mylohyoid',
    'geniohyoid',
    'genioglossus',
    'styloglossus',
    'hyoglossus',
    'levator palpebrae',
    'of eyeball',
  ],
  neck: [
    'cervical vertebra',
    'atlas',
    'axis',
    'arytenoid',
    'cricoid',
    'laryngeal',
    'corniculate',
    'thyroid cartilage',
    'dens',
    'sternocleidomastoid',
    'scalene',
    'longus colli',
    'longus capitis',
    'platysma',
    'omohyoid',
    'sternohyoid',
    'sternothyroid',
    'thyrohyoid',
    'splenius',
  ],
  'lower-back': [
    'lumbar',
    'sacrum',
    'sacral',
    'coccyx',
    'coccygeal',
    'quadratus lumborum',
    'psoas',
  ],
  'upper-back': [
    'thoracic vertebra',
    'trapezius',
    'rhomboid',
    'latissimus',
    'levator scapulae',
    'erector spinae',
    'semispinalis',
    'multifidus',
    'serratus posterior',
    'iliocostalis',
    'longissimus',
  ],
  chest: [
    'rib',
    'costal',
    'sternum',
    'xiphoid',
    'manubrium',
    'thoracic cage',
    'jugular notch',
    'clavicular notch',
    'pectoralis',
    'serratus anterior',
    'intercostal',
    'subclavius',
    'transversus thoracis',
  ],
  shoulder: [
    'scapula',
    'clavicle',
    'acromial',
    'acromion',
    'glenoid',
    'coracoid',
    'scapular',
    'suprascapular',
    'deltoid',
    'supraspinatus',
    'infraspinatus',
    'teres major',
    'teres minor',
    'subscapularis',
  ],
  'upper-arm': [
    'humerus',
    'humeral',
    'deltoid tuberosity',
    'capitulum',
    'trochlea of humerus',
    'biceps brachii',
    'triceps brachii',
    'brachialis',
    'coracobrachialis',
    'anconeus',
  ],
  forearm: [
    'radius',
    'ulna',
    'olecranon',
    'radial',
    'ulnar',
    'brachioradialis',
    'pronator',
    'supinator',
    'flexor carpi',
    'extensor carpi',
    'palmaris',
    'flexor digitorum superficialis',
    'flexor digitorum profundus',
  ],
  hand: [
    'of hand',
    'metacarp',
    'scaphoid',
    'lunate',
    'capitate',
    'hamate',
    'trapezium',
    'trapezoid',
    'triquetrum',
    'pisiform',
    'carpal bone',
    'wrist',
    'thenar',
    'adductor pollicis',
    'opponens',
    'abductor pollicis brevis',
    'flexor pollicis brevis',
  ],
  hip: [
    'ilium',
    'iliac',
    'ischium',
    'ischial',
    'pubis',
    'pubic',
    'acetabul',
    'coxal',
    'obturator',
    'pelvi',
    'gluteal line',
    'sciatic',
    'arcuate line',
    'ramus',
    'gluteus',
    'iliopsoas',
    'iliacus',
    'piriformis',
    'tensor fasciae',
    'gemellus',
    'quadratus femoris',
  ],
  foot: [
    'of foot',
    'metatars',
    'talus',
    'calcaneus',
    'calcaneal',
    'navicular',
    'cuboid',
    'cuneiform',
    'hallux',
    'tarsal',
    'malleolus',
    'malleolar',
    'flexor digitorum brevis',
    'quadratus plantae',
    'abductor hallucis',
  ],
  thigh: [
    'femur',
    'femoral',
    'trochanter',
    'adductor tubercle',
    'linea aspera',
    'gluteal tuberosity',
    'intercondylar fossa',
    'patellar surface',
    'popliteal',
    'quadriceps',
    'rectus femoris',
    'vastus',
    'sartorius',
    'gracilis',
    'pectineus',
    'adductor magnus',
    'adductor longus',
    'adductor brevis',
    'biceps femoris',
    'semitendinosus',
    'semimembranosus',
  ],
  knee: ['patella', 'popliteus'],
  calf: [
    'tibia',
    'fibula',
    'tibial',
    'fibular',
    'intercondylar area',
    'intercondylar eminence',
    'soleal line',
    'gastrocnemius',
    'soleus',
    'plantaris',
    'tibialis',
    'fibularis',
    'peroneus',
    'flexor digitorum longus',
    'flexor hallucis longus',
    'extensor digitorum longus',
    'extensor hallucis longus',
  ],
  brain: [
    'brain',
    'brainstem',
    'cerebr',
    'cerebell',
    'thalamus',
    'hypothalamus',
    'hippocamp',
    'amygdala',
    'pons',
    'medulla oblongata',
    'midbrain',
    'forebrain',
    'diencephalon',
    'corpus callosum',
    'basal ganglia',
    'lobe',
    'cortex',
    'gyrus',
    'sulcus',
    'aqueduct of midbrain',
    'spinal cord',
    'ventricle',
  ],
  lungs: ['lung', 'pulmonary', 'bronch', 'trachea', 'alveol'],
  liver: ['liver', 'hepatic', 'gallbladder', 'bile', 'biliary'],
  stomach: ['stomach', 'gastric', 'oesophagus', 'esophagus', 'pyloric', 'cardia'],
  intestines: [
    'intestine',
    'colon',
    'duoden',
    'jejun',
    'ileum',
    'cecum',
    'caecum',
    'rectum',
    'vermiform appendix',
    'sigmoid',
    'bowel',
  ],
  kidneys: ['kidney', 'renal', 'ureter'],
  pancreas: ['pancreas', 'pancreatic'],
  thyroid: ['thyroid'],
  skin: [
    'skin',
    'epidermis',
    'dermis',
    'nail',
    'hair',
    'perionyx',
    'eyelash',
    'integument',
    'cutaneous',
  ],
  heart: [
    'heart',
    'ventricle',
    'atrium',
    'papillary',
    'myocard',
    'aorta',
    'coronary',
    'tricuspid',
    'mitral',
    'pericard',
    'vena cava',
  ],
};

function mapName(raw: string, interactive: Set<string>): string | null {
  const n = raw.toLowerCase();
  for (const [slug, kws] of Object.entries(PART_KEYWORDS)) {
    if (interactive.has(slug) && kws.some((k) => n.includes(k))) return slug;
  }
  return null;
}

/** Walk up the hit object's ancestry to find a name that maps to a part. */
function resolvePart(obj: THREE.Object3D, interactive: Set<string>): string | null {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    const slug = mapName(cur.name ?? '', interactive);
    if (slug) return slug;
    cur = cur.parent;
  }
  return null;
}

/** Human-readable structure name from a raw mesh name (strip LOD/side suffixes). */
function cleanName(raw: string): string {
  let n = raw;
  let side = '';
  const m = n.match(/\.([lrij])$/i);
  if (m) {
    const s = m[1].toLowerCase();
    if (s === 'l') side = ' (left)';
    else if (s === 'r') side = ' (right)';
    n = n.slice(0, -2);
  }
  n = n.replace(/^\(/, '').replace(/\)$/, '').trim();
  return n + side;
}

function GltfBody({
  interactive,
  url,
  focusRef,
}: {
  interactive: Set<string>;
  url: string;
  focusRef: { current: THREE.Vector3 | null };
}) {
  // Draco-compressed GLBs; decoder is self-hosted at /draco/ (no external CDN).
  const { scene } = useGLTF(url, '/draco/');
  const selected = useStore($selectedParts);
  const hovered = useStore($hoveredPart);
  const lastHover = useRef<THREE.Mesh | null>(null);
  // structure-level selections — clicked meshes that map to no content region,
  // tracked by clean name and prefixed with "#" inside $selectedParts.
  const selectedStructs = useMemo(
    () => new Set(selected.filter((s) => s.startsWith('#')).map((s) => s.slice(1))),
    [selected]
  );

  const { root, meshes, baseByUuid } = useMemo(() => {
    const clone = scene.clone(true);

    // Drop Z-Anatomy floating text labels ("…system.g") BEFORE measuring the
    // bounding box, so the figure stays centered and fills the frame.
    const labels: THREE.Object3D[] = [];
    clone.traverse((o) => {
      if (o.name?.toLowerCase().endsWith('.g')) labels.push(o);
    });
    for (const l of labels) l.removeFromParent();

    const list: { mesh: THREE.Mesh; slug: string | null; base: THREE.Color }[] = [];
    const unmapped = new Set<string>();
    clone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.material = (m.material as THREE.Material).clone();
      const slug = resolvePart(m, interactive);
      if (!slug && m.name) unmapped.add(m.name);
      const std = m.material as THREE.MeshStandardMaterial;
      list.push({
        mesh: m,
        slug,
        base: std.color ? std.color.clone() : new THREE.Color('#d9dee5'),
      });
    });
    if (unmapped.size && import.meta.env.DEV) {
      console.info('[ThreeBody] unmapped meshes:', [...unmapped].sort());
    }
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    clone.position.set(-center.x, -box.min.y, -center.z);
    const wrap = new THREE.Group();
    wrap.add(clone);
    wrap.scale.setScalar(1.8 / (size.y || 1));
    const map = new Map(list.map((it) => [it.mesh.uuid, it]));
    return { root: wrap, meshes: list, baseByUuid: map };
  }, [scene, interactive]);

  // Recolor on selection / hovered-region change (not on mouse move). Handles
  // both mapped-region selections (by slug) and structure selections (by name).
  useEffect(() => {
    for (const { mesh, slug, base } of meshes) {
      const std = mesh.material as THREE.MeshStandardMaterial;
      if (!std?.emissive) continue;
      const isSel = slug
        ? selected.includes(slug)
        : selectedStructs.has(cleanName(mesh.name || ''));
      if (isSel) {
        std.color.copy(ACCENT_COLOR);
        std.emissive.copy(ACCENT_COLOR);
        std.emissiveIntensity = 0.45;
      } else if (slug && slug === hovered) {
        std.color.copy(base).lerp(ACCENT_COLOR, 0.5);
        std.emissive.copy(ACCENT_COLOR);
        std.emissiveIntensity = 0.2;
      } else {
        std.color.copy(base);
        std.emissive.setRGB(0, 0, 0);
        std.emissiveIntensity = 0;
      }
    }
  }, [selected, hovered, meshes, selectedStructs]);

  // O(1) restore of a previously hover-lit mesh to its resting state (base, or
  // accent if it's a selected structure). Mapped meshes are managed by recolor.
  const restore = (m: THREE.Mesh | null) => {
    if (!m) return;
    const it = baseByUuid.get(m.uuid);
    if (!it || it.slug) return;
    const std = m.material as THREE.MeshStandardMaterial;
    if (!std?.emissive) return;
    if (selectedStructs.has(cleanName(m.name || ''))) {
      std.color.copy(ACCENT_COLOR);
      std.emissive.copy(ACCENT_COLOR);
      std.emissiveIntensity = 0.45;
    } else {
      std.color.copy(it.base);
      std.emissive.setRGB(0, 0, 0);
      std.emissiveIntensity = 0;
    }
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: react-three-fiber <primitive> is a 3D scene object, not a DOM element
    <primitive
      object={root}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        const obj = e.object as THREE.Mesh;
        if (obj === lastHover.current) return; // same structure → no work, no rerender
        e.stopPropagation();
        $engaged.set(true); // stop the idle auto-spin on first interaction
        restore(lastHover.current);
        lastHover.current = obj;
        if (e.point) focusRef.current = e.point.clone();
        const it = baseByUuid.get(obj.uuid);
        // light-highlight the exact hovered mesh imperatively (unmapped + not
        // already selected); mapped regions / selections are covered by recolor.
        if (it && !it.slug && !selectedStructs.has(cleanName(obj.name || ''))) {
          const std = obj.material as THREE.MeshStandardMaterial;
          if (std?.emissive) {
            std.color.copy(it.base).lerp(ACCENT_COLOR, 0.3);
            std.emissive.copy(ACCENT_COLOR);
            std.emissiveIntensity = 0.12;
          }
        }
        $hoverLabel.set(cleanName(obj.name || ''));
        hoverPart(it ? it.slug : resolvePart(obj, interactive));
        document.body.style.cursor = 'pointer'; // everything is clickable
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        restore(lastHover.current);
        lastHover.current = null;
        $hoverLabel.set(null);
        hoverPart(null);
        document.body.style.cursor = 'default';
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        const obj = e.object as THREE.Mesh;
        const it = baseByUuid.get(obj.uuid);
        const slug = it ? it.slug : resolvePart(obj, interactive);
        const id = slug ?? `#${cleanName(obj.name || '')}`;
        if (id === '#') return;
        togglePart(id);
      }}
    />
  );
}

function SlowSpin({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  // Idle auto-spin until the user interacts (read fresh each frame, no
  // subscription → no re-render). Stopping on engage keeps the zoom focus valid.
  useFrame((_, dt) => {
    if (ref.current && !$engaged.get()) ref.current.rotation.y += dt * 0.12;
  });
  return <group ref={ref}>{children}</group>;
}

/** Isolated so hover updates only re-render this tiny label, never the Canvas. */
function HoverLabel() {
  const label = useStore($hoverLabel);
  if (!label) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-3 max-w-[80%] -translate-x-1/2 truncate rounded-md bg-[var(--color-ink)]/85 px-3 py-1 text-center text-xs font-medium text-white shadow">
      {label}
    </div>
  );
}

export default function ThreeBody({
  parts,
  modelUrl,
}: {
  parts: ExplorerPart[];
  modelUrl: string;
}) {
  const interactive = useMemo(() => new Set(parts.map((p) => p.svgId)), [parts]);
  const [ready, setReady] = useState(false);
  const controls = useRef<OrbitControlsImpl>(null);
  // World point under the cursor (set on hover) so zoom focuses that area.
  const focus = useRef<THREE.Vector3 | null>(null);

  // Scroll wheel zooms toward the cursor (zoomToCursor on OrbitControls); these
  // buttons zoom toward the last-hovered structure (or scene centre).
  const zoom = (factor: number) => {
    const c = controls.current;
    if (!c) return;
    $engaged.set(true); // stop the auto-spin so the zoom isn't fought by re-framing
    if (factor < 1 && focus.current) c.target.lerp(focus.current, 0.6);
    const dir = c.object.position.clone().sub(c.target);
    const dist = Math.min(c.maxDistance, Math.max(c.minDistance, dir.length() * factor));
    c.object.position.copy(c.target).add(dir.setLength(dist));
    c.update();
  };

  return (
    <div
      className="relative h-[560px] w-full"
      role="group"
      aria-label="Interactive 3D body — drag to rotate"
    >
      <Canvas
        camera={{ position: [0, 1, 3.2], fov: 38 }}
        dpr={[1, 2]}
        onCreated={() => setReady(true)}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 4]} intensity={1.1} />
        <directionalLight position={[-4, 2, -3]} intensity={0.4} />
        <Suspense fallback={null}>
          <Bounds fit clip margin={1.05}>
            <SlowSpin>
              <GltfBody interactive={interactive} url={modelUrl} focusRef={focus} />
            </SlowSpin>
          </Bounds>
        </Suspense>
        <OrbitControls
          ref={controls}
          makeDefault
          enablePan={false}
          enableZoom
          zoomToCursor
          zoomSpeed={1.2}
          onStart={() => $engaged.set(true)}
          minDistance={0.6}
          maxDistance={9}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.85}
        />
      </Canvas>

      <div className="absolute right-3 top-3 flex flex-col gap-1">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => zoom(0.7)}
          className="grid h-8 w-8 place-items-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)]/90 text-lg text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => zoom(1.4)}
          className="grid h-8 w-8 place-items-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)]/90 text-lg text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          −
        </button>
      </div>

      <HoverLabel />

      {!ready && (
        <div className="absolute inset-0 grid place-items-center text-xs text-[var(--color-faint)]">
          Loading 3D body…
        </div>
      )}
    </div>
  );
}

// Preload only the default layer; others load on demand when toggled.
useGLTF.preload('/models/body.glb?v=hd', '/draco/');
