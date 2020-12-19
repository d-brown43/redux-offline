import {DispatchFulfilledAction} from "./types";

export const mergeFulfilledHandlers = (...handlers: DispatchFulfilledAction[]) => {
  const merged: DispatchFulfilledAction = (dispatch, optimisticAction, apiResponse) => {
    handlers.forEach(handler => handler(dispatch, optimisticAction, apiResponse));
  };

  return merged;
};
