const BASE = import.meta.env.VITE_API_URL ?? '';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw Object.assign(new Error(text || res.statusText), { status: res.status });
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

interface RawPlot         { id: string; name: string; address: string; tasks: string[] }
interface RawScheduleEntry { id: string; day: string; plot_id: string }
interface RawJob          { day: string; plot_id: string; tasks: Record<string, boolean>; photo: string | null; photo_name: string | null }

export const api = {
  verifyPin: (role: string, pin: string) =>
    request<{ success: boolean; role: string | null }>('/auth/verify', {
      method: 'POST', body: JSON.stringify({ role, pin }),
    }),

  getPlots:    () => request<RawPlot[]>('/plots'),
  createPlot:  (data: { name: string; address: string; tasks: string[] }) =>
    request<RawPlot>('/plots', { method: 'POST', body: JSON.stringify(data) }),
  updatePlot:  (id: string, data: Partial<{ name: string; address: string; tasks: string[] }>) =>
    request<RawPlot>(`/plots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlot:  (id: string) =>
    request<void>(`/plots/${id}`, { method: 'DELETE' }),

  getSchedule:    () => request<RawScheduleEntry[]>('/schedule'),
  addSchedule:    (day: string, plot_id: string) =>
    request<RawScheduleEntry>('/schedule', { method: 'POST', body: JSON.stringify({ day, plot_id }) }),
  removeSchedule: (id: string) =>
    request<void>(`/schedule/${id}`, { method: 'DELETE' }),

  getJobsForDay: (day: string) =>
    request<RawJob[]>(`/jobs/${day}`),
  getJob: (day: string, plotId: string) =>
    request<RawJob>(`/jobs/${day}/${plotId}`),
  updateJob: (day: string, plotId: string, data: { tasks?: Record<string, boolean>; photo?: string | null; photo_name?: string | null }) =>
    request<RawJob>(`/jobs/${day}/${plotId}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export type { RawPlot, RawScheduleEntry, RawJob };
