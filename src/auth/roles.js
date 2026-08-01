import { reviewerGroupId, approverGroupId } from '../authConfig';

export const ROLE_APPROVER = 'Approver';
export const ROLE_REVIEWER = 'Reviewer';

// Resolve the ops user's role from the ID token's groups claim.
// A user may be in both groups; Approver is a superset of Reviewer here, so
// Approver wins. Returns null if the user is in neither group.
//
// NOTE: This is a UI convenience only. Real authorization is enforced
// server-side in the provider API — getting this wrong is a UX bug, not a
// security hole.
export function resolveRole(account) {
  const claims = account?.idTokenClaims ?? {};
  const groups = Array.isArray(claims.groups) ? claims.groups : [];

  const isApprover = approverGroupId && groups.includes(approverGroupId);
  const isReviewer = reviewerGroupId && groups.includes(reviewerGroupId);

  if (isApprover) return ROLE_APPROVER;
  if (isReviewer) return ROLE_REVIEWER;
  return null;
}

export function isApprover(role) {
  return role === ROLE_APPROVER;
}

// Reviewer-level access is granted to Reviewers and Approvers alike.
export function isReviewerOrAbove(role) {
  return role === ROLE_REVIEWER || role === ROLE_APPROVER;
}
