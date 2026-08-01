import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../api/useApi';
import {
  getClaims,
  reviewClaim,
  approveClaim,
  rejectClaim,
  markClaimPaid,
} from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ClaimStatusBadge from '../components/ClaimStatusBadge';
import RoleGate from '../components/RoleGate';
import { formatCurrency, formatDate } from '../utils/format';

const FILTERS = [
  'All',
  'Submitted',
  'Under Review',
  'Approved',
  'Rejected',
  'Paid',
];

function toList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export default function ClaimsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'All';

  const fetcher = useCallback(() => getClaims(statusFilter), [statusFilter]);
  const { data, loading, error, refetch } = useApi(fetcher, [statusFilter]);

  const [actingId, setActingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const handleFilterChange = (e) => {
    const value = e.target.value;
    if (value === 'All') {
      setSearchParams({});
    } else {
      setSearchParams({ status: value });
    }
  };

  const runAction = async (id, fn) => {
    setActingId(id);
    setActionError(null);
    try {
      await fn(id);
      refetch();
    } catch (err) {
      setActionError(err?.message || 'Action failed.');
    } finally {
      setActingId(null);
    }
  };

  const claims = toList(data);

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Claims</h1>
        <div className="page__controls">
          <label className="field field--inline">
            <span className="field__label">Status</span>
            <select
              className="field__input"
              value={statusFilter}
              onChange={handleFilterChange}
            >
              {FILTERS.map((f) => (
                <option key={f} value={f}>
                  {f}
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
        <LoadingSpinner label="Loading claims…" />
      ) : error ? (
        <ErrorMessage error={error} onRetry={refetch} />
      ) : claims.length === 0 ? (
        <p className="empty-state">No claims match this filter.</p>
      ) : (
        <div className="card-grid">
          {claims.map((claim) => {
            const busy = actingId === claim.id;
            const status = claim.status;
            return (
              <div key={claim.id} className="card claim-card">
                <div className="claim-card__head">
                  <span className="claim-card__amount">
                    {formatCurrency(claim.amount)}
                  </span>
                  <ClaimStatusBadge status={status} />
                </div>

                <p className="claim-card__desc">
                  {claim.description || 'No description provided.'}
                </p>

                <p className="claim-card__date muted">
                  Submitted {formatDate(claim.created_at || claim.submitted_at)}
                </p>

                <div className="claim-card__actions">
                  {status === 'Submitted' && (
                    <RoleGate reviewerOrAbove>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => runAction(claim.id, reviewClaim)}
                        disabled={busy}
                      >
                        Move to Under Review
                      </button>
                    </RoleGate>
                  )}

                  {(status === 'Submitted' || status === 'Under Review') && (
                    <RoleGate approver>
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        onClick={() => runAction(claim.id, approveClaim)}
                        disabled={busy}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        onClick={() => runAction(claim.id, rejectClaim)}
                        disabled={busy}
                      >
                        Reject
                      </button>
                    </RoleGate>
                  )}

                  {status === 'Approved' && (
                    <RoleGate approver>
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        onClick={() => runAction(claim.id, markClaimPaid)}
                        disabled={busy}
                      >
                        Mark as Paid
                      </button>
                    </RoleGate>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
