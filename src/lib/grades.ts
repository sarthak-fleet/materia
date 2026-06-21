import type { Grade } from '@/content.config';

export const GRADE_META: Record<
  Grade,
  { letter: string; label: string; color: string; short: string }
> = {
  A: { letter: 'A', label: 'Strong evidence', color: 'var(--color-grade-a)', short: 'Strong' },
  B: { letter: 'B', label: 'Moderate evidence', color: 'var(--color-grade-b)', short: 'Moderate' },
  C: { letter: 'C', label: 'Limited evidence', color: 'var(--color-grade-c)', short: 'Limited' },
  D: { letter: 'D', label: 'Weak evidence', color: 'var(--color-grade-d)', short: 'Weak' },
  insufficient: {
    letter: '—',
    label: 'Insufficient evidence',
    color: 'var(--color-grade-none)',
    short: 'Insufficient',
  },
};

export const TRADITION_LABEL: Record<string, string> = {
  ayurveda: 'Ayurveda',
  tcm: 'Traditional Chinese Medicine',
  western: 'Western herbalism',
  other: 'Traditional use',
};

export const ALIGNMENT_META: Record<string, { label: string; color: string }> = {
  aligns: { label: 'Evidence aligns', color: 'var(--color-grade-a)' },
  conflicts: { label: 'Evidence conflicts', color: 'var(--color-warn)' },
  mixed: { label: 'Evidence mixed', color: 'var(--color-grade-c)' },
  unstudied: { label: 'Not well studied', color: 'var(--color-grade-none)' },
};

export const SEVERITY_META: Record<string, { label: string; color: string }> = {
  severe: { label: 'Severe', color: 'var(--color-warn)' },
  moderate: { label: 'Moderate', color: 'var(--color-caution)' },
  minor: { label: 'Minor', color: 'var(--color-grade-d)' },
  theoretical: { label: 'Theoretical', color: 'var(--color-grade-none)' },
};
