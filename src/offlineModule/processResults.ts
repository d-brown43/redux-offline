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

export const mergePassthroughs = (...handlers: OptimisticPassThrough[]): OptimisticPassThrough => {
  return (action) => {
    const result = handlers
      .map((handler) => handler(action))
      .find(result => result);
    if (result) return result;
    return null;
  };
};
