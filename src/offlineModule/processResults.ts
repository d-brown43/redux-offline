import {GetFulfilledAction, OptimisticPassThrough} from "./types";

export const mergeGetFulfilledActions = (...handlers: GetFulfilledAction[]) => {
  const merged: GetFulfilledAction = (optimisticAction, apiResponse) => {
    const result = handlers
      .map((handler) => {
        return handler(optimisticAction, apiResponse);
      })
      .find(result => result);
    if (typeof result === 'undefined') {
      return null;
    }
    return result;
  };

  return merged;
};

export const mergePassthroughs = (...handlers: OptimisticPassThrough[]) => {
  const merged: OptimisticPassThrough = (dispatch, action) => {
    handlers.forEach(handler => handler(dispatch, action));
  };

  return merged;
};
