export default function LoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
      Loading…
    </div>
  );
}
