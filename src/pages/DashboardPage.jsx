import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../api/useApi';
import {
  getPendingEnrollments,
  getClaims,
  getSyncIssues,
} from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const CLAIM_STATUSES = [
  'Submitted',
  'Under Review',
  'Approved',
  'Rejected',
  'Paid',
];

// Normalize an API list response that may be an array or a { data: [...] } shape.
function toList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export default function DashboardPage() {
  const fetchAll = useCallback(
    () =>
      Promise.all([
        getPendingEnrollments(),
        getClaims('All'),
        getSyncIssues(),
      ]),
    []
  );

  const { data, loading, error, refetch } = useApi(fetchAll, []);

  if (loading) return <LoadingSpinner label="Loading dashboard…" />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  const [enrollmentsRaw, claimsRaw, syncRaw] = data;
  const enrollments = toList(enrollmentsRaw);
  const claims = toList(claimsRaw);
  const syncIssues = toList(syncRaw);

  const claimCounts = CLAIM_STATUSES.reduce((acc, status) => {
    acc[status] = claims.filter((c) => c.status === status).length;
    return acc;
  }, {});

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Dashboard</h1>
        <button type="button" className="btn btn--ghost" onClick={refetch}>
          Refresh
        </button>
      </div>

      <div className="stat-grid">
        <Link to="/enrollments" className="stat-card">
          <span className="stat-card__value">{enrollments.length}</span>
          <span className="stat-card__label">Pending enrollments</span>
        </Link>

        <Link to="/claims" className="stat-card">
          <span className="stat-card__value">{claims.length}</span>
          <span className="stat-card__label">Total claims</span>
        </Link>

        <Link to="/sync-issues" className="stat-card stat-card--warn">
          <span className="stat-card__value">{syncIssues.length}</span>
          <span className="stat-card__label">Sync issues</span>
        </Link>
      </div>

      <h2 className="page__subtitle">Claims by status</h2>
      <div className="stat-grid stat-grid--compact">
        {CLAIM_STATUSES.map((status) => (
          <Link
            key={status}
            to={`/claims?status=${encodeURIComponent(status)}`}
            className="stat-card stat-card--small"
          >
            <span className="stat-card__value">{claimCounts[status]}</span>
            <span className="stat-card__label">{status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
