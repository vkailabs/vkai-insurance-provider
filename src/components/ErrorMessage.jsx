export default function ErrorMessage({ error, onRetry }) {
  const message =
    typeof error === 'string' ? error : error?.message || 'Something went wrong.';

  return (
    <div className="error-message" role="alert">
      <p className="error-message__text">⚠ {message}</p>
      {onRetry && (
        <button type="button" className="btn btn--ghost" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
