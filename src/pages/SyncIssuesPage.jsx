import { useApi } from '../api/useApi';
import { getSyncIssues } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatDateTime } from '../utils/format';

function toList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export default function SyncIssuesPage() {
  const { data, loading, error, refetch } = useApi(getSyncIssues, []);

  if (loading) return <LoadingSpinner label="Loading sync issues…" />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  const issues = toList(data);

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Sync Issues</h1>
        <button type="button" className="btn btn--ghost" onClick={refetch}>
          Refresh
        </button>
      </div>

      {issues.length === 0 ? (
        <p className="empty-state">No sync issues. 🎉</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Record type</th>
                <th>Business ID</th>
                <th>Last attempt</th>
                <th>Attempts</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td>{row.record_type || row.type || '—'}</td>
                  <td>{row.business_id || row.reference_id || '—'}</td>
                  <td>{formatDateTime(row.last_attempt_at || row.last_attempt)}</td>
                  <td>{row.attempt_count ?? row.attempts ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
