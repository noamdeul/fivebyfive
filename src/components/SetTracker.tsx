import type { LoggedSet } from '../domain/types';

interface Props {
  sets: LoggedSet[];
  onCycle: (index: number) => void;
}

/**
 * Tappable work-set circles. Each tap cycles the set:
 *   not done -> done at target reps -> target-1 -> ... -> 0 -> not done.
 * This makes logging a failed set (e.g. 5/5/5/5/3) a couple of taps, with no
 * keyboard needed.
 */
export function SetTracker({ sets, onCycle }: Props) {
  return (
    <div className="set-grid">
      {sets.map((s, i) => {
        const fail = s.done && s.reps < s.targetReps;
        const cls = s.done ? (fail ? 'set-cell fail' : 'set-cell done') : 'set-cell';
        return (
          <button
            key={i}
            className={cls}
            onClick={() => onCycle(i)}
            aria-label={`Set ${i + 1}: ${s.done ? `${s.reps} reps` : 'not done'}`}
          >
            {s.done ? s.reps : s.targetReps}
          </button>
        );
      })}
    </div>
  );
}
