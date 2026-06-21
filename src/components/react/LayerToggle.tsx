import { useStore } from '@nanostores/react';
import {
  Activity,
  Bone,
  Brain,
  Droplets,
  Hand,
  Heart,
  HeartPulse,
  Soup,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { SYSTEMS, type SystemId } from '@/data/systems';
import { $activeSystem, setSystem } from '@/lib/explorer/store';

const ICONS: Record<SystemId, LucideIcon> = {
  skeletal: Bone,
  muscular: Activity,
  organs: HeartPulse,
  nervous: Brain,
  cardiovascular: Heart,
  respiratory: Wind,
  digestive: Soup,
  endocrine: Droplets,
  integumentary: Hand,
};

export default function LayerToggle() {
  const active = useStore($activeSystem);

  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Anatomical layer">
      {SYSTEMS.map((s) => {
        const Icon = ICONS[s.id];
        const isActive = active === s.id;
        return (
          <button
            type="button"
            key={s.id}
            role="tab"
            aria-selected={isActive}
            disabled={!s.available}
            title={s.available ? s.blurb : `${s.name} — layer coming soon`}
            onClick={() => s.available && setSystem(s.id)}
            className={[
              'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]'
                : 'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-muted)]',
              s.available
                ? 'hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)]'
                : 'cursor-not-allowed opacity-50',
            ].join(' ')}
          >
            <Icon size={14} strokeWidth={1.8} />
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
