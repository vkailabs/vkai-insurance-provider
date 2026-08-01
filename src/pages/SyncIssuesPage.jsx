import { useApi } from '../api/useApi';
import { getSyncIssues } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatDateTime } from '../utils/format';

// The API returns { counts, policies, premiums, claims } — each array holds the
// records of that type whose sync_status is 'failed'. Flatten them into a single
// tagged list for the table.
//
// Note: the records carry no sync-attempt timestamp, only a business timestamp
// (enrolledAt / paidAt / submittedAt) and a syncAttempts counter — so those are
// what we surface rather than inventing a "last attempt time".
function flattenIssues(payload) {
  if (!payload) return [];

  const policies = (payload.policies || []).map((p) => ({
    key: `policy-${p.id}`,
    recordType: 'Policy',
    businessId: p.clientPolicyId || p.id,
    attempts: p.syncAttempts,
    recordedAt: p.enrolledAt,
  }));
  const premiums = (payload.premiums || []).map((p) => ({
    key: `premium-${p.id}`,
    recordType: 'Premium',
    businessId: p.eventId || p.id,
    attempts: p.syncAttempts,
    recordedAt: p.paidAt,
  }));
  const claims = (payload.claims || []).map((c) => ({
    key: `claim-${c.id}`,
    recordType: 'Claim',
    businessId: c.clientClaimId || c.id,
    attempts: c.syncAttempts,
    recordedAt: c.submittedAt,
  }));

  return [...policies, ...premiums, ...claims];
}

export default function SyncIssuesPage() {
  const { data, loading, error, refetch } = useApi(getSyncIssues, []);

  if (loading) return <LoadingSpinner label="Loading sync issues…" />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  const issues = flattenIssues(data);
  const counts = data?.counts;

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Sync Issues</h1>
        <button type="button" className="btn btn--ghost" onClick={refetch}>
          Refresh
        </button>
      </div>

      {counts && (
        <p className="muted sync-summary">
          Failed syncs — Policies: {counts.policies} · Premiums:{' '}
          {counts.premiums} · Claims: {counts.claims}
        </p>
      )}

      {issues.length === 0 ? (
        <p className="empty-state">No sync issues. 🎉</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Record type</th>
                <th>Business ID</th>
                <th>Record date</th>
                <th>Sync attempts</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((row) => (
                <tr key={row.key}>
                  <td>{row.recordType}</td>
                  <td>
                    <code className="id-cell" title={row.businessId}>
                      {row.businessId || '—'}
                    </code>
                  </td>
                  <td>{formatDateTime(row.recordedAt)}</td>
                  <td>{row.attempts ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
