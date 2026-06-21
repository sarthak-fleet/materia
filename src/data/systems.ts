/**
 * Anatomical systems = the layers the explorer can toggle between, and the
 * single source of truth for which `system` values content may reference.
 *
 * `available` marks whether a tagged SVG layer ships yet. Systems without art
 * still get a /systems/[system] content page and a "layer coming" state in the
 * explorer — breadth of *content* runs ahead of breadth of *art* by design.
 */
export type SystemId =
  | 'skeletal'
  | 'muscular'
  | 'organs'
  | 'nervous'
  | 'cardiovascular'
  | 'respiratory'
  | 'digestive'
  | 'endocrine'
  | 'integumentary';

export interface AnatomicalSystem {
  id: SystemId;
  name: string;
  blurb: string;
  /** lucide-react icon name */
  icon: string;
  /** does a tagged, clickable SVG layer exist yet? */
  available: boolean;
}

export const SYSTEMS: AnatomicalSystem[] = [
  {
    id: 'skeletal',
    name: 'Skeletal',
    blurb: 'Bones and joints — the frame, and where wear, breaks, and arthritis live.',
    icon: 'Bone',
    available: true,
  },
  {
    id: 'muscular',
    name: 'Muscular',
    blurb: 'Muscles and tendons — strains, soreness, cramps, and recovery.',
    icon: 'Activity',
    available: true,
  },
  {
    id: 'organs',
    name: 'Organs',
    blurb: 'The major viscera — heart, lungs, liver, gut, kidneys, brain.',
    icon: 'HeartPulse',
    available: true,
  },
  {
    id: 'nervous',
    name: 'Nervous',
    blurb: 'Brain, spinal cord, and nerves — pain signalling, sleep, mood.',
    icon: 'Brain',
    available: true,
  },
  {
    id: 'cardiovascular',
    name: 'Cardiovascular',
    blurb: 'Heart and vessels — blood pressure, lipids, circulation.',
    icon: 'Heart',
    available: true,
  },
  {
    id: 'respiratory',
    name: 'Respiratory',
    blurb: 'Airways and lungs — cough, congestion, breathing.',
    icon: 'Wind',
    available: true,
  },
  {
    id: 'digestive',
    name: 'Digestive',
    blurb: 'Stomach, intestines, and gut — reflux, bloating, regularity.',
    icon: 'Soup',
    available: true,
  },
  {
    id: 'endocrine',
    name: 'Endocrine',
    blurb: 'Hormones and glands — thyroid, blood sugar, stress.',
    icon: 'Droplets',
    available: true,
  },
  {
    id: 'integumentary',
    name: 'Skin',
    blurb: 'Skin, hair, and nails — the body’s outer surface.',
    icon: 'Hand',
    available: true,
  },
];

export const SYSTEM_IDS = SYSTEMS.map((s) => s.id) as [SystemId, ...SystemId[]];

export const SYSTEM_BY_ID: Record<SystemId, AnatomicalSystem> = Object.fromEntries(
  SYSTEMS.map((s) => [s.id, s])
) as Record<SystemId, AnatomicalSystem>;
