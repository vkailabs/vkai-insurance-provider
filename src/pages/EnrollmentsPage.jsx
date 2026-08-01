import { useState } from 'react';
import { useApi } from '../api/useApi';
import { getPendingEnrollments, activatePolicy } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import RoleGate from '../components/RoleGate';
import { formatCurrency, formatDate } from '../utils/format';

function toList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export default function EnrollmentsPage() {
  const { data, loading, error, refetch } = useApi(getPendingEnrollments, []);
  const [actingId, setActingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  if (loading) return <LoadingSpinner label="Loading enrollments…" />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  const enrollments = toList(data);

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

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Pending Enrollments</h1>
        <button type="button" className="btn btn--ghost" onClick={refetch}>
          Refresh
        </button>
      </div>

      {actionError && <ErrorMessage error={actionError} />}

      {enrollments.length === 0 ? (
        <p className="empty-state">No pending enrollments.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Policy holder</th>
                <th>Plan</th>
                <th>Premium</th>
                <th>Requested</th>
                <th className="table__actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((row) => (
                <tr key={row.id}>
                  <td>{row.policy_holder_name || row.member_name || row.user_email || '—'}</td>
                  <td>{row.plan_name || row.policy_name || '—'}</td>
                  <td>{formatCurrency(row.premium_amount)}</td>
                  <td>{formatDate(row.created_at || row.requested_at)}</td>
                  <td className="table__actions-col">
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
