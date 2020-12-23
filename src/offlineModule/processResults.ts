import {
  GetFulfilledAction,
  GetRollbackAction,
  ResolvedApiEntityAction,
} from "./types";

export const mergeGetFulfilledActions = (...handlers: GetFulfilledAction[]) => {
  const merged: GetFulfilledAction = (
    optimisticAction,
    apiResponse
  ): ResolvedApiEntityAction => {
    const result = handlers
      .map((handler) => {
        return handler(optimisticAction, apiResponse);
      })
      .find((result) => result);
    if (result) {
      return result;
    }
    // TODO If no action returned, use the optimistic action, rewriting the offline
    // metadata to match the dependencies properly
    throw new Error(
      "Require a fulfilled action to be returned when API resolved"
    );
  };

  return merged;
};

export const mergeGetRollbackActions = (...handlers: GetRollbackAction[]) => {
  const merged: GetRollbackAction = (optimisticAction, apiResponse) => {
    const handler = handlers.find((handler) =>
      handler(optimisticAction, apiResponse)
    );

    if (handler) {
      return handler(optimisticAction, apiResponse);
    }
    return null;
  };

  return merged;
};
