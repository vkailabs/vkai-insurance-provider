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
                <th>Policy</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due date</th>
                <th>Paid date</th>
              </tr>
            </thead>
            <tbody>
              {premiums.map((row) => (
                <tr key={row.id}>
                  <td>{row.policy_name || row.plan_name || row.policy_id || '—'}</td>
                  <td>{formatCurrency(row.amount || row.premium_amount)}</td>
                  <td>{row.status || '—'}</td>
                  <td>{formatDate(row.due_date)}</td>
                  <td>{formatDate(row.paid_at || row.paid_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
