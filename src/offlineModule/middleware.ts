import { isOfflineAction } from "./utils";
import { isInternalOfflineAction } from "./redux";
import { Store } from "redux";
import { CreateOptimisticMiddleware } from "./internalTypes";
import { getOptimisticStoreRebuildActions } from "./manageState";
import { ArrayAction } from "./types";

export const createOptimisticMiddleware: CreateOptimisticMiddleware = (
  config
) => (optimisticStore) => (originalNext) => {
  const { useBatching = true } = config.config;
  const next = useBatching
    ? (actions: ArrayAction) => originalNext(actions)
    : (actions: ArrayAction) => actions.forEach(originalNext);

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
