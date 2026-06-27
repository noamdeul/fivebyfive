import type { LoggedSet, Unit } from '../domain/types';
import { formatWeight } from '../domain/units';

interface Props {
  sets: LoggedSet[];
  unit: Unit;
  onToggle: (index: number) => void;
}

export function WarmupSets({ sets, unit, onToggle }: Props) {
  if (sets.length === 0) return null;
  return (
    <div className="warmups">
      <div className="section-label">Warmup</div>
      {sets.map((s, i) => (
        <button key={i} className="warmup-row" onClick={() => onToggle(i)}>
          <span style={{ fontSize: '1.1rem' }}>{s.done ? '✅' : '⬜️'}</span>
          <span className="w">{formatWeight(s.weight ?? 0, unit)}</span>
          <span>× {s.reps}</span>
        </button>
      ))}
    </div>
  );
}
