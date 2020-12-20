import {GetFulfilledAction, GetRollbackAction} from "./types";

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

export const mergeGetRollbackActions = (...handlers: GetRollbackAction[]) => {
  const merged: GetRollbackAction = (optimisticAction, apiResponse) => {
    const handler = handlers
      .find(handler => handler(optimisticAction, apiResponse));

    if (handler) {
      return handler(optimisticAction, apiResponse);
    }
    return null;
  };

  return merged;
};
