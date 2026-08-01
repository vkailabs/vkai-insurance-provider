import { useAuth } from '../auth/AuthContext';

// Conditionally renders children based on the current user's role.
//
//   <RoleGate approver>          -> only Approvers
//   <RoleGate reviewerOrAbove>   -> Reviewers and Approvers
//
// Optional `fallback` renders when the gate is closed.
export default function RoleGate({
  approver = false,
  reviewerOrAbove = false,
  fallback = null,
  children,
}) {
  const auth = useAuth();

  let allowed = false;
  if (approver) allowed = auth.isApprover;
  else if (reviewerOrAbove) allowed = auth.isReviewerOrAbove;

  return allowed ? <>{children}</> : fallback;
}
