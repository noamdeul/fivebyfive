import { getExercise } from './exercises';
import { isExerciseSucceeded } from './progression';
import { countSets, sessionSlug, sessionTitle } from './session';
import type { ExerciseDef, LoggedSet, RestSeconds, WorkoutSession } from './types';
import { formatWeight } from './units';

/** A single work set, reduced to what the share image needs to draw. */
export interface ShareSetView {
  reps: number;
  /** Whether the set was completed and hit its target reps. */
  hit: boolean;
}

export interface ShareExerciseView {
  name: string;
  /** Working weight, pre-formatted with the session's unit (e.g. "100 kg"). */
  weight: string;
  sets: ShareSetView[];
  succeeded: boolean;
}

/** A fully view-ready snapshot of a session for rendering a share image. */
export interface ShareModel {
  /** "Workout A" / "Workout B". */
  title: string;
  /** Localized date, e.g. "Saturday, Jun 27, 2026". */
  dateText: string;
  /** Localized time, e.g. "6:30 PM". */
  timeText: string;
  exercises: ShareExerciseView[];
  /** "3/3 exercises completed". */
  summaryText: string;
  /** Whether every exercise succeeded. */
  allSucceeded: boolean;
  /** Suggested download/share filename. */
  fileName: string;
}

function setView(reps: number, targetReps: number, done: boolean): ShareSetView {
  return { reps, hit: done && reps >= targetReps };
}

/**
 * Turn a (typically completed) session into a flat, locale-formatted model the
 * image renderer can draw without touching the domain types. Pure and testable;
 * no canvas/DOM here.
 */
export function buildShareModel(
  session: WorkoutSession,
  customExercises: ExerciseDef[] = [],
): ShareModel {
  const date = new Date(session.date);

  const exercises: ShareExerciseView[] = session.exercises.map((ex) => ({
    name: getExercise(ex.exerciseId, customExercises).name,
    weight: formatWeight(ex.weight, session.unit),
    sets: ex.workSets.map((s) => setView(s.reps, s.targetReps, s.done)),
    succeeded: isExerciseSucceeded(ex),
  }));

  const okCount = exercises.filter((e) => e.succeeded).length;
  const total = exercises.length;

  // Date slice is taken straight from the ISO string so the filename is stable
  // regardless of the runtime's locale/timezone.
  const isoDay = session.date.slice(0, 10);

  return {
    title: sessionTitle(session),
    dateText: date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    timeText: date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }),
    exercises,
    summaryText: `${okCount}/${total} exercises completed`,
    allSucceeded: total > 0 && okCount === total,
    fileName: `fivebyfive-workout-${sessionSlug(session)}-${isoDay}.png`,
  };
}

/** m:ss for a duration in seconds, e.g. 185 -> "3:05". */
export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

function timeOf(set: LoggedSet): number | null {
  if (!set.done || !set.completedAt) return null;
  const t = Date.parse(set.completedAt);
  return Number.isNaN(t) ? null : t;
}

/**
 * A plain-text summary of a session for pasting into a chat or notes app:
 * every warmup and work set with its weight and reps, plus the rest taken
 * before each set.
 *
 * Rest comes from the real set timestamps when they exist (the gap since the
 * previous completed set anywhere in the session). Sessions logged before
 * set-timing existed fall back to the configured rest from `restSeconds`, when
 * given, as one "planned" line per exercise.
 */
export function buildShareText(
  session: WorkoutSession,
  customExercises: ExerciseDef[] = [],
  restSeconds?: RestSeconds,
): string {
  const unit = session.unit;
  const date = new Date(session.date);

  // Every completed set's timestamp, sorted, so each set can look up the one
  // right before it regardless of which exercise it belonged to.
  const times = session.exercises
    .flatMap((ex) => [...(ex.warmupSets ?? []), ...ex.workSets])
    .map(timeOf)
    .filter((t): t is number => t !== null)
    .sort((a, b) => a - b);
  const hasTiming = times.length > 0;

  const restBefore = (set: LoggedSet): string => {
    const t = timeOf(set);
    if (t === null) return '';
    const prev = times.filter((x) => x < t).pop();
    return prev === undefined ? '' : ` · rest ${formatDuration((t - prev) / 1000)}`;
  };

  const setLine = (label: string, set: LoggedSet, weight: number, showHit: boolean): string => {
    if (!set.done) return `  ${label}: ${set.targetReps} × ${formatWeight(weight, unit)} (skipped)`;
    const mark = showHit ? (set.reps >= set.targetReps ? ' ✓' : ' ✕') : '';
    return `  ${label}: ${set.reps} × ${formatWeight(weight, unit)}${mark}${restBefore(set)}`;
  };

  const counts = countSets(session);
  const lines: string[] = [
    `🏋️ ${sessionTitle(session)}`,
    date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
    `Work sets: ${counts.workDone}/${counts.workTotal}` +
      (counts.warmupTotal > 0 ? ` · Warmups: ${counts.warmupDone}/${counts.warmupTotal}` : ''),
  ];
  if (times.length > 1) {
    lines.push(`Duration: ${formatDuration((times[times.length - 1] - times[0]) / 1000)}`);
  }

  for (const ex of session.exercises) {
    const name = getExercise(ex.exerciseId, customExercises).name;
    const ok = isExerciseSucceeded(ex);
    lines.push('', `${name} · ${formatWeight(ex.weight, unit)} ${ok ? '✓' : '✕'}`);

    const warmups = ex.warmupSets ?? [];
    warmups.forEach((s, i) => {
      lines.push(setLine(`Warmup ${i + 1}`, s, s.weight ?? ex.weight, false));
    });
    ex.workSets.forEach((s, i) => {
      lines.push(setLine(`Set ${i + 1}`, s, ex.weight, true));
    });

    if (!hasTiming && restSeconds) {
      const rest = ex.exerciseId === 'deadlift' ? restSeconds.deadlift : restSeconds.heavy;
      lines.push(`  Rest: ${formatDuration(rest)} between sets (planned)`);
    }
  }

  lines.push('', 'Logged with FiveByFive');
  return lines.join('\n');
}
