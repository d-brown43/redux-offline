import {DispatchFulfilledAction, OptimisticPassthrough} from "./types";

export const mergeFulfilledHandlers = (...handlers: DispatchFulfilledAction[]) => {
  const merged: DispatchFulfilledAction = (dispatch, state, optimisticAction, apiResponse) => {
    handlers.forEach(handler => handler(dispatch, state, optimisticAction, apiResponse));
  };

  return merged;
};

export const mergePassthroughs = (...handlers: OptimisticPassthrough[]) => {
  const merged: OptimisticPassthrough = (dispatch, action) => {
    handlers.forEach(handler => handler(dispatch, action));
  };

  return merged;
};
