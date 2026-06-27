import { ShareButton } from '../components/ShareButton';
import { EXERCISES } from '../domain/exercises';
import { isExerciseSucceeded } from '../domain/progression';
import type { WorkoutSession } from '../domain/types';
import { formatWeight } from '../domain/units';

interface Props {
  session: WorkoutSession;
  onBack: () => void;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function SessionDetail({ session, onBack }: Props) {
  return (
    <>
      <div className="screen-header">
        <button className="muted" onClick={onBack} style={{ marginBottom: 8 }}>
          ‹ Back to history
        </button>
        <h1>Workout {session.type}</h1>
        <div className="sub">{formatDateTime(session.date)}</div>
      </div>
      <div className="screen">
        {session.exercises.map((ex) => {
          const ok = isExerciseSucceeded(ex);
          return (
            <div key={ex.exerciseId} className="card">
              <div className="card-head">
                <h3>{EXERCISES[ex.exerciseId].name}</h3>
                <span className={`badge ${ok ? 'ok' : 'bad'}`}>{ok ? '✓' : 'Missed'}</span>
              </div>
              <div className="weight-big">{formatWeight(ex.weight, session.unit)}</div>
              <div className="set-grid" style={{ marginTop: 12 }}>
                {ex.workSets.map((s, i) => {
                  const fail = s.reps < s.targetReps;
                  return (
                    <div key={i} className={`set-cell ${fail ? 'fail' : 'done'}`}>
                      {s.reps}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <ShareButton session={session} label="📤 Share this workout" />
      </div>
    </>
  );
}
