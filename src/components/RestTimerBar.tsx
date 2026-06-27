import { useAppStore } from '../store/useAppStore';
import { useRestTimer } from '../hooks/useRestTimer';

function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RestTimerBar() {
  const { active, remainingSec, progress } = useRestTimer();
  const startRest = useAppStore((s) => s.startRest);
  const stopRest = useAppStore((s) => s.stopRest);
  const durationSec = useAppStore((s) => s.rest.durationSec);

  if (!active) return null;

  return (
    <div className="rest-bar">
      <div className="rest-progress" style={{ width: `${progress * 100}%` }} />
      <div className="time">{formatClock(remainingSec)}</div>
      <div className="label">Rest</div>
      <button onClick={() => startRest(Math.max(0, remainingSec + 30))}>+30s</button>
      <button onClick={() => startRest(Math.max(0, remainingSec - 30))} disabled={durationSec === 0}>
        −30s
      </button>
      <button onClick={stopRest}>Skip</button>
    </div>
  );
}
