import type { Job, Plot } from '../types';

export function todayKey(): string {
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
}

export function dayLabel(k: string): string {
  const map: Record<string, string> = {
    Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
    Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
  };
  return map[k] ?? k;
}

export function getWeekDays(): string[] {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

export function jobKey(day: string, plotId: string): string {
  return `${day}__${plotId}`;
}

export function plotStatus(
  _day: string,
  plot: Plot,
  job: Job | undefined,
): 'pending' | 'progress' | 'done' {
  if (!job) return 'pending';
  const taskCount  = plot.tasks.filter(t => t).length;
  const doneCount  = Object.values(job.tasks).filter(Boolean).length;
  if (doneCount === 0)            return 'pending';
  if (doneCount < taskCount)      return 'progress';
  return 'done';
}
