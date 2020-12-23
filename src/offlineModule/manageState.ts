import { replaceOfflineState, replaceRootState } from "./redux";
import { InternalConfig } from "./internalTypes";
import { AnyAction } from "redux";
import { ArrayAction } from "./types";

const createArrayAction = (actions: AnyAction[]): ArrayAction =>
  Object.assign(actions, { type: undefined });

export const getOptimisticStoreRebuildActions = (
  internalConfig: InternalConfig
) => {
  const { optimisticStore, store, getState } = internalConfig;
  const offlineState = getState(optimisticStore);

  return createArrayAction([
    replaceRootState(store.getState()),
    replaceOfflineState(offlineState),
    ...offlineState.queue.map((optimisticAction) => ({
      ...optimisticAction,
      offline: {
        ...optimisticAction.offline,
        // Label the action as a passThrough action, i.e. let it pass through
        // without doing anything special to it, we need to re-apply
        // the changes it caused to the optimistic state, but don't
        // want to requeue it, since it will already exist in the queue
        isPassThrough: true,
      },
    })),
  ]);
};

export const rebuildOptimisticStore = (internalConfig: InternalConfig) => {
  const { optimisticStore } = internalConfig;
  const actions = getOptimisticStoreRebuildActions(internalConfig);
  optimisticStore.dispatch(actions);
};
