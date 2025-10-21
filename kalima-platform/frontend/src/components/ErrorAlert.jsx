export function ErrorAlert({ error, onRetry }) {
  return (
    <div className="alert alert-error max-w-md mx-auto">
      <p>{error}</p>
      <button className="btn btn-sm btn-outline" onClick={onRetry}>
        إعادة المحاولة
      </button>
    </div>
  );
}