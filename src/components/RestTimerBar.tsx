import { useAppStore } from '../store/useAppStore';
import { useRestTimer } from '../hooks/useRestTimer';

function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RestTimerBar() {
  const { phase, seconds, progress } = useRestTimer();
  const startRest = useAppStore((s) => s.startRest);
  const stopRest = useAppStore((s) => s.stopRest);
  const startSet = useAppStore((s) => s.startSet);

  if (phase === 'idle') return null;

  if (phase === 'lifting') {
    return (
      <div className="rest-bar lifting">
        <div className="time">{formatClock(seconds)}</div>
        <div className="label">Set in progress</div>
        <button onClick={stopRest} aria-label="Hide set timer">
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className={`rest-bar${phase === 'overtime' ? ' overtime' : ''}`}>
      <div className="rest-progress" style={{ width: `${progress * 100}%` }} />
      <div className="time">
        {phase === 'overtime' ? '+' : ''}
        {formatClock(seconds)}
      </div>
      <div className="label">{phase === 'overtime' ? 'Rest done' : 'Rest'}</div>
      {phase === 'resting' && (
        <>
          <button onClick={() => startRest(seconds + 30)}>+30s</button>
          <button onClick={() => startRest(Math.max(0, seconds - 30))}>−30s</button>
        </>
      )}
      <button className="start-set" onClick={startSet}>
        Start set
      </button>
    </div>
  );
}
