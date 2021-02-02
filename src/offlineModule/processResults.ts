import { ApiAction, GetResolvedAction, GetRejectionAction } from './types';

type Handler<R> = (optimisticAction: ApiAction, apiResponse: any) => R;

type MergeHandlers = <R>(...handlers: Handler<R>[]) => Handler<R | null>;

const mergeHandlers: MergeHandlers = <R>(...handlers: Handler<R>[]) => {
  return (optimisticAction, apiResponse) => {
    return handlers.reduce<R | null>((acc, handler) => {
      if (acc) {
        return acc;
      }
      return handler(optimisticAction, apiResponse);
    }, null);
  };
};

export const mergeGetFulfilledActions = (...handlers: GetResolvedAction[]) => {
  const mergedHandlers = mergeHandlers(...handlers);
  const merged: GetResolvedAction = (optimisticAction, apiResponse) => {
    const result = mergedHandlers(optimisticAction, apiResponse);
    if (result) {
      return result;
    }
    // TODO If no action returned, use the optimistic action, rewriting the offline
    // metadata to match the dependencies properly
    // TODO if no offline metadata returned, use the optimistic action metadata
    throw new Error(
      'Require a fulfilled action to be returned when API resolved'
    );
  };

  return merged;
};

export const mergeGetRollbackActions = (...handlers: GetRejectionAction[]) =>
  mergeHandlers(...handlers);
