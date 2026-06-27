import { useState } from 'react';
import { EXERCISES } from '../domain/exercises';
import { isExerciseSucceeded } from '../domain/progression';
import type { WorkoutSession } from '../domain/types';
import { formatWeight } from '../domain/units';
import { useAppStore } from '../store/useAppStore';
import { SessionDetail } from './SessionDetail';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function HistoryScreen() {
  const history = useAppStore((s) => s.history);
  const [selected, setSelected] = useState<WorkoutSession | null>(null);

  if (selected) {
    return <SessionDetail session={selected} onBack={() => setSelected(null)} />;
  }

  const reversed = [...history].reverse();

  return (
    <>
      <div className="screen-header">
        <h1>History</h1>
        <div className="sub">{history.length} workouts logged</div>
      </div>
      <div className="screen">
        {reversed.length === 0 && (
          <div className="empty">
            <div className="big">📅</div>
            <div>No workouts yet.</div>
            <div className="muted">Finish a workout and it'll show up here.</div>
          </div>
        )}
        {reversed.map((session) => {
          const okCount = session.exercises.filter(isExerciseSucceeded).length;
          const allOk = okCount === session.exercises.length;
          return (
            <button key={session.id} className="card" onClick={() => setSelected(session)}>
              <div className="hist-row">
                <div className="top">
                  <span className="date">
                    Workout {session.type} · {formatDate(session.date)}
                  </span>
                  <span className={`badge ${allOk ? 'ok' : 'bad'}`}>
                    {allOk ? '✓ All sets' : `${okCount}/${session.exercises.length}`}
                  </span>
                </div>
                <div className="muted">
                  {session.exercises
                    .map(
                      (ex) =>
                        `${EXERCISES[ex.exerciseId].name} ${formatWeight(ex.weight, session.unit)}`,
                    )
                    .join(' · ')}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
