import type { Job, Plot } from '../types';

export function todayKey(): string {
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
}

export function todayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function getCurrentWeekDates(): Record<string, string> {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  const abbrs = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result: Record<string, string> = {};
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    result[abbrs[i]] = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  return result;
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
