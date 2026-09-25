import { useState } from 'react';
import { buildShareText } from '../domain/share';
import { sessionTitle } from '../domain/session';
import type { WorkoutSession } from '../domain/types';
import { useAppStore } from '../store/useAppStore';

interface Props {
  session: WorkoutSession;
  /** Override the button class (defaults to a neutral `btn`). */
  className?: string;
  label?: string;
}

/** Shares a plain-text summary of the session (warmups, sets, weights, rest)
 *  through the native share sheet, or copies it to the clipboard. */
export function ShareTextButton({ session, className, label = '📝 Share as text' }: Props) {
  const [msg, setMsg] = useState<string | null>(null);
  const customExercises = useAppStore((s) => s.customExercises);
  const restSeconds = useAppStore((s) => s.settings.restSeconds);

  const onShare = async () => {
    setMsg(null);
    const text = buildShareText(session, customExercises, restSeconds);
    try {
      if (navigator.share) {
        await navigator.share({ title: sessionTitle(session), text });
      } else {
        await navigator.clipboard.writeText(text);
        setMsg('Workout summary copied to the clipboard.');
      }
    } catch (e) {
      // The user dismissing the native share sheet is not an error.
      if ((e as Error).name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(text);
        setMsg('Workout summary copied to the clipboard.');
      } catch {
        setMsg(`Couldn't share: ${(e as Error).message}`);
      }
    }
  };

  return (
    <>
      <button className={className ?? 'btn'} onClick={onShare}>
        {label}
      </button>
      {msg && (
        <p className="muted" style={{ marginTop: 10, textAlign: 'center' }}>
          {msg}
        </p>
      )}
    </>
  );
}
