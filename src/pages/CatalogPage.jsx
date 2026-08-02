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

// The create/update endpoints return the plan object, sometimes wrapped in a
// `data` envelope (mirrors the list unwrapping in toList). Normalize to the
// bare plan object so we can read the server-generated `key`.
function toPlan(payload) {
  if (payload && !Array.isArray(payload) && typeof payload === 'object') {
    if (payload.data && !Array.isArray(payload.data)) return payload.data;
    return payload;
  }
  return null;
}

const EMPTY_FORM = {
  name: '',
  description: '',
  premium_amount: '',
  coverage_amount: '',
};

// Inline form used for both "Add plan" and "Edit plan".
// `onSubmit` resolves with the saved plan object (which includes the
// server-generated `key`). The Key field is always read-only — it is generated
// and kept unique server-side; the frontend only displays it.
function PlanForm({ initial, onCancel, onSubmit }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // On "Add plan" the key does not exist until the API creates the plan, so it
  // starts empty and is filled in from the create response after Save.
  const [planKey, setPlanKey] = useState(initial?.key ?? '');
  const [saved, setSaved] = useState(false);

  const isEdit = Boolean(initial);

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Provider API expects camelCase field names (see API src/routes/policyCatalog.js).
      const result = await onSubmit({
        name: form.name,
        description: form.description,
        premiumAmount: Number(form.premium_amount),
        coverageAmount: Number(form.coverage_amount),
      });
      if (!isEdit) {
        // Create: reveal the server-generated key and keep the form open so the
        // user sees it. (Edit closes immediately — the parent unmounts us.)
        const savedPlan = toPlan(result);
        if (savedPlan?.key) setPlanKey(savedPlan.key);
        setSaved(true);
        setBusy(false);
      }
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
          disabled={saved}
          required
        />
      </label>

      {/* Read-only, server-generated key. Rendered below Name. On "Add plan"
          it is empty (with a hint) until the create response returns it. */}
      <label className="field">
        <span className="field__label">Key</span>
        <input
          className="field__input field__input--locked"
          value={planKey}
          placeholder={
            isEdit ? '—' : 'Generated automatically after you save'
          }
          readOnly
          disabled
          aria-readonly="true"
        />
      </label>

      <label className="field">
        <span className="field__label">Description</span>
        <textarea
          className="field__input"
          value={form.description}
          onChange={update('description')}
          disabled={saved}
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
            disabled={saved}
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
            disabled={saved}
            required
          />
        </label>
      </div>

      {error && <p className="error-message__text">⚠ {error}</p>}

      {saved && !isEdit && (
        <p className="plan-form__note">
          Plan saved. Its key <strong>{planKey || '—'}</strong> was assigned
          automatically and cannot be edited.
        </p>
      )}

      <div className="plan-form__actions">
        {saved ? (
          // After a successful save the plan (and its server-generated key)
          // exists; there is nothing more to submit, so just let the user close.
          <button
            type="button"
            className="btn btn--primary"
            onClick={onCancel}
          >
            Done
          </button>
        ) : (
          <>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={busy}
            >
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
          </>
        )}
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
    // Do NOT close the form here: the form reveals the server-generated key
    // (returned in the create response) and the user closes it via "Done".
    // Refetch so the new plan appears in the list behind the form.
    const created = await createPolicy(payload);
    refetch();
    return created;
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
                    key: plan.key ?? '',
                  }}
                  onCancel={() => setEditing(null)}
                  onSubmit={handleUpdate(plan.id)}
                />
              ) : (
                <>
                  <div className="plan-card__head">
                    <h3 className="plan-card__name">
                      {plan.key && (
                        <span className="plan-card__key">{plan.key}</span>
                      )}
                      {plan.key ? ` - ${plan.name}` : plan.name}
                    </h3>
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
