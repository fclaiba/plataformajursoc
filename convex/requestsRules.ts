export type RequestLike = {
  _id: string;
  status: "PENDING" | "MATCHED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  matchedRequestId?: string;
};

export type FinalizableRequestLike = RequestLike & {
  userId: string;
  finalizedBy: string[];
};

export const areReciprocallyMatched = (left: RequestLike, right: RequestLike) =>
  left.matchedRequestId === right._id && right.matchedRequestId === left._id;

export const canBeCompleted = (left: RequestLike, right: RequestLike) =>
  areReciprocallyMatched(left, right) && left.status === "CONFIRMED" && right.status === "CONFIRMED";

const isConfirmableStatus = (status: RequestLike["status"]) =>
  status === "MATCHED" || status === "CONFIRMED" || status === "COMPLETED";

const hasOwnerFinalized = (request: FinalizableRequestLike) =>
  request.finalizedBy.includes(request.userId);

export const shouldAutoCompleteAfterDoubleFinalize = (
  left: FinalizableRequestLike,
  right: FinalizableRequestLike,
) =>
  areReciprocallyMatched(left, right) &&
  isConfirmableStatus(left.status) &&
  isConfirmableStatus(right.status) &&
  hasOwnerFinalized(left) &&
  hasOwnerFinalized(right);
