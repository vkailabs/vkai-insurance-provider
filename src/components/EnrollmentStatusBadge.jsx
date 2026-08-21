// Color-coded enrollment (policy) status badge. Enrollment statuses are the
// lowercase values the provider API returns: pending | active | expired |
// cancelled. Reuses the shared `.badge` styling (see ClaimStatusBadge).

const STATUS_CLASS = {
  pending: 'badge--pending',
  active: 'badge--active',
  expired: 'badge--expired',
  cancelled: 'badge--cancelled',
};

const STATUS_LABEL = {
  pending: 'Pending',
  active: 'Active',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

export default function EnrollmentStatusBadge({ status }) {
  const key = typeof status === 'string' ? status.toLowerCase() : '';
  const cls = STATUS_CLASS[key] || 'badge--default';
  const label = STATUS_LABEL[key] || (status ? String(status) : 'Unknown');
  return <span className={`badge ${cls}`}>{label}</span>;
}
