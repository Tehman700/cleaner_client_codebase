const BASE = import.meta.env.VITE_API_URL ?? '';

export function trackEvent(
  eventType: string,
  role?: string,
  metadata?: Record<string, unknown>,
) {
  // Fire-and-forget — never blocks the UI
  fetch(`${BASE}/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: eventType, role, metadata }),
  }).catch(() => {});
}
