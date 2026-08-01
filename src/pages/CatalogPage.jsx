import { useCallback, useState } from 'react';
import { useApi } from '../api/useApi';
import { getPolicyCatalog, createPolicy, updatePolicy } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import RoleGate from '../components/RoleGate';
import { formatCurrency } from '../utils/format';

function toList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

const EMPTY_FORM = {
  name: '',
  description: '',
  premium_amount: '',
  coverage_amount: '',
};

// Inline form used for both "Add plan" and "Edit plan".
function PlanForm({ initial, onCancel, onSubmit }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Provider API expects camelCase field names (see API src/routes/policyCatalog.js).
      await onSubmit({
        name: form.name,
        description: form.description,
        premiumAmount: Number(form.premium_amount),
        coverageAmount: Number(form.coverage_amount),
      });
    } catch (err) {
      setError(err?.message || 'Save failed.');
      setBusy(false);
    }
  };

  return (
    <form className="card plan-form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field__label">Name</span>
        <input
          className="field__input"
          value={form.name}
          onChange={update('name')}
          required
        />
      </label>

      <label className="field">
        <span className="field__label">Description</span>
        <textarea
          className="field__input"
          value={form.description}
          onChange={update('description')}
          rows={2}
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span className="field__label">Premium amount</span>
          <input
            className="field__input"
            type="number"
            min="0"
            step="0.01"
            value={form.premium_amount}
            onChange={update('premium_amount')}
            required
          />
        </label>

        <label className="field">
          <span className="field__label">Coverage amount</span>
          <input
            className="field__input"
            type="number"
            min="0"
            step="0.01"
            value={form.coverage_amount}
            onChange={update('coverage_amount')}
            required
          />
        </label>
      </div>

      {error && <p className="error-message__text">⚠ {error}</p>}

      <div className="plan-form__actions">
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save plan'}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function CatalogPage() {
  const { data, loading, error, refetch } = useApi(getPolicyCatalog, []);
  const [editing, setEditing] = useState(null); // null | 'new' | plan.id

  if (loading) return <LoadingSpinner label="Loading catalog…" />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  const plans = toList(data);

  const handleCreate = async (payload) => {
    await createPolicy(payload);
    setEditing(null);
    refetch();
  };

  const handleUpdate = (id) => async (payload) => {
    await updatePolicy(id, payload);
    setEditing(null);
    refetch();
  };

  const handleDeactivate = async (plan) => {
    await updatePolicy(plan.id, { isActive: false });
    refetch();
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Policy Catalog</h1>
        <RoleGate approver>
          {editing !== 'new' && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setEditing('new')}
            >
              + Add plan
            </button>
          )}
        </RoleGate>
      </div>

      {editing === 'new' && (
        <PlanForm onCancel={() => setEditing(null)} onSubmit={handleCreate} />
      )}

      {plans.length === 0 ? (
        <p className="empty-state">No plans in the catalog yet.</p>
      ) : (
        <div className="card-grid">
          {plans.map((plan) => (
            <div key={plan.id} className="card plan-card">
              {editing === plan.id ? (
                <PlanForm
                  initial={{
                    name: plan.name ?? '',
                    description: plan.description ?? '',
                    premium_amount: plan.premiumAmount ?? '',
                    coverage_amount: plan.coverageAmount ?? '',
                  }}
                  onCancel={() => setEditing(null)}
                  onSubmit={handleUpdate(plan.id)}
                />
              ) : (
                <>
                  <div className="plan-card__head">
                    <h3 className="plan-card__name">{plan.name}</h3>
                    {plan.isActive === false && (
                      <span className="badge badge--rejected">Inactive</span>
                    )}
                  </div>
                  <p className="plan-card__desc">{plan.description}</p>
                  <dl className="plan-card__meta">
                    <div>
                      <dt>Premium</dt>
                      <dd>{formatCurrency(plan.premiumAmount)}</dd>
                    </div>
                    <div>
                      <dt>Coverage</dt>
                      <dd>{formatCurrency(plan.coverageAmount)}</dd>
                    </div>
                  </dl>

                  <RoleGate approver>
                    <div className="plan-card__actions">
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => setEditing(plan.id)}
                      >
                        Edit
                      </button>
                      {plan.isActive !== false && (
                        <button
                          type="button"
                          className="btn btn--danger"
                          onClick={() => handleDeactivate(plan)}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </RoleGate>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
