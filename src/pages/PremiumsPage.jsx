import { useApi } from '../api/useApi';
import { getPremiums } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { formatCurrency, formatDate } from '../utils/format';

function toList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export default function PremiumsPage() {
  const { data, loading, error, refetch } = useApi(getPremiums, []);

  if (loading) return <LoadingSpinner label="Loading premiums…" />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  const premiums = toList(data);

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Premiums</h1>
        <button type="button" className="btn btn--ghost" onClick={refetch}>
          Refresh
        </button>
      </div>

      {premiums.length === 0 ? (
        <p className="empty-state">No premium records.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {/* The premium record has no plan name or "status"/"due date"
                    (only the client policy it belongs to, plus paidAt). */}
                <th>Policy ref</th>
                <th>Amount</th>
                <th>Paid at</th>
                <th>Sync status</th>
              </tr>
            </thead>
            <tbody>
              {premiums.map((row) => {
                const policyRef = row.policy?.clientPolicyId || row.policyId;
                return (
                  <tr key={row.id}>
                    <td>
                      <code className="id-cell" title={policyRef}>
                        {policyRef || '—'}
                      </code>
                    </td>
                    <td>{formatCurrency(row.amount)}</td>
                    <td>{formatDate(row.paidAt)}</td>
                    <td>{row.syncStatus || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
