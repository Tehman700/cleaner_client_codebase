type Status = 'pending' | 'progress' | 'done';

const MAP: Record<Status, [string, string]> = {
  pending:  ['badge-pending',  'Pending'],
  progress: ['badge-progress', 'In Progress'],
  done:     ['badge-done',     '✓ Complete'],
};

export default function StatusBadge({ status }: { status: Status }) {
  const [cls, label] = MAP[status] ?? MAP.pending;
  return <span className={`badge ${cls}`}>{label}</span>;
}
