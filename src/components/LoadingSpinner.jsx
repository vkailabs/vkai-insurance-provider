export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="loading-spinner" role="status" aria-live="polite">
      <span className="loading-spinner__dot" />
      <span className="loading-spinner__label">{label}</span>
    </div>
  );
}
