import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../api/useApi';
import { getEnrollments, activatePolicy } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EnrollmentStatusBadge from '../components/EnrollmentStatusBadge';
import RoleGate from '../components/RoleGate';
import { formatCurrency, formatDate } from '../utils/format';

// Filter values map to the provider API's lowercase status values
// (pending | active | expired | cancelled); 'all' means no status query.
// The default view is the pending queue, preserving the historical behavior.
const FILTERS = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' },
];

function toList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export default function EnrollmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'pending';

  const fetcher = useCallback(
    () => getEnrollments(statusFilter === 'all' ? undefined : statusFilter),
    [statusFilter]
  );
  const { data, loading, error, refetch } = useApi(fetcher, [statusFilter]);

  const [actingId, setActingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const handleFilterChange = (e) => {
    const value = e.target.value;
    // 'pending' is the default view, so it clears the query string.
    if (value === 'pending') {
      setSearchParams({});
    } else {
      setSearchParams({ status: value });
    }
  };

  const handleActivate = async (id) => {
    setActingId(id);
    setActionError(null);
    try {
      await activatePolicy(id);
      refetch();
    } catch (err) {
      setActionError(err?.message || 'Activation failed.');
    } finally {
      setActingId(null);
    }
  };

  const enrollments = toList(data);

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Enrollments</h1>
        <div className="page__controls">
          <label className="field field--inline">
            <span className="field__label">Status</span>
            <select
              className="field__input"
              value={statusFilter}
              onChange={handleFilterChange}
            >
              {FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn btn--ghost" onClick={refetch}>
            Refresh
          </button>
        </div>
      </div>

      {actionError && <ErrorMessage error={actionError} />}

      {loading ? (
        <LoadingSpinner label="Loading enrollments…" />
      ) : error ? (
        <ErrorMessage error={error} onRetry={refetch} />
      ) : enrollments.length === 0 ? (
        <p className="empty-state">No enrollments match this filter.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Client user ref</th>
                <th>Plan</th>
                <th>Premium</th>
                <th>Requested</th>
                <th>Status</th>
                <th className="table__actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((row) => (
                <tr key={row.id}>
                  <td>
                    {/* Only identifier the API has — an opaque Firebase UID
                        from the client side, not a real name. */}
                    <code className="id-cell" title={row.clientUserRef}>
                      {row.clientUserRef || '—'}
                    </code>
                  </td>
                  <td>{row.policyCatalog?.name || '—'}</td>
                  <td>{formatCurrency(row.policyCatalog?.premiumAmount)}</td>
                  <td>{formatDate(row.enrolledAt)}</td>
                  <td>
                    <EnrollmentStatusBadge status={row.status} />
                  </td>
                  <td className="table__actions-col">
                    {/* Activate is only ever offered for pending enrollments.
                        Non-pending rows (cancelled/active/expired) show no
                        action — and the API 409s a non-pending activate. */}
                    {row.status === 'pending' ? (
                      <RoleGate
                        approver
                        fallback={<span className="muted">Read-only</span>}
                      >
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => handleActivate(row.id)}
                          disabled={actingId === row.id}
                        >
                          {actingId === row.id ? 'Activating…' : 'Activate'}
                        </button>
                      </RoleGate>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
