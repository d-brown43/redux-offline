import { isOfflineAction } from "./utils";
import { isInternalOfflineAction } from "./redux";
import { AnyAction, Store } from "redux";
import {
  ConfigureMiddleware,
  OptimisticConfig,
  RealStoreConfig,
} from "./internalTypes";
import { getOptimisticStoreRebuildActions } from "./manageState";
import { ArrayAction } from "./types";

export const createOptimisticMiddleware: ConfigureMiddleware<OptimisticConfig> = (
  config
) => (optimisticStore) => (originalNext) => {
  const { useBatching = true } = config.config;
  const next = useBatching
    ? (actions: ArrayAction) => originalNext(actions)
    : (actions: ArrayAction) => {
        if (Array.isArray(actions)) {
          actions.forEach(originalNext);
        } else {
          originalNext(actions);
        }
      };

  return (action) => {
    const offlineAction =
      isOfflineAction(action) || isInternalOfflineAction(action);

    if (!offlineAction) {
      const { store } = config;
      store.dispatch(action);
      next(
        getOptimisticStoreRebuildActions({
          ...config,
          optimisticStore: optimisticStore as Store,
        })
      );
    } else {
      next(action);
    }
  };
};

export const createRealStoreMiddleware: ConfigureMiddleware<RealStoreConfig> = ({
  config,
}) => {
  const { useBatching = true } = config;
  const actionCheck = useBatching
    ? (action: AnyAction) =>
        !Array.isArray(action) && !isInternalOfflineAction(action)
    : (action: AnyAction) => !isInternalOfflineAction(action);

  return () => (next) => (action) => {
    if (actionCheck(action)) {
      // Ignore all internal actions, the only reason we will have
      // the offline reducer in the real store at all
      // is to allow the user to re-use the same rootReducer for
      // both the optimistic store and real store.
      // The queue is only used by the optimistic store
      next(action);
    }
  };
};
