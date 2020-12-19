import {DispatchFulfilledAction} from "./types";

export const mergeFulfilledHandlers = (...handlers: DispatchFulfilledAction[]) => {
  const merged: DispatchFulfilledAction = (dispatch, state, optimisticAction, apiResponse) => {
    handlers.forEach(handler => handler(dispatch, state, optimisticAction, apiResponse));
  };

  return merged;
};
