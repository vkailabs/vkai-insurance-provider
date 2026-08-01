// Color-coded claim status badge. Recreated here (the client side has its own
// copy) since these are separate codebases.

const STATUS_CLASS = {
  Submitted: 'badge--submitted',
  'Under Review': 'badge--under-review',
  Approved: 'badge--approved',
  Rejected: 'badge--rejected',
  Paid: 'badge--paid',
};

export default function ClaimStatusBadge({ status }) {
  const cls = STATUS_CLASS[status] || 'badge--default';
  return <span className={`badge ${cls}`}>{status || 'Unknown'}</span>;
}
