import { replaceOfflineState, replaceRootState } from './redux';
import { InternalConfig } from './internalTypes';
import { AnyAction } from 'redux';
import { ArrayAction } from './types';
import { makePassThrough } from './utils';

export const createArrayAction = (actions: AnyAction[]): ArrayAction =>
  Object.assign(actions, { type: undefined });

export const getOptimisticStoreRebuildActions = (
  internalConfig: InternalConfig
) => {
  const { optimisticStore, store, getState } = internalConfig;
  const offlineState = getState(optimisticStore);

  return createArrayAction([
    replaceRootState(store.getState()),
    replaceOfflineState(offlineState),
    ...offlineState.queue.map(makePassThrough),
  ]);
};

export const rebuildOptimisticStore = (internalConfig: InternalConfig) => {
  const { optimisticStore } = internalConfig;
  const actions = getOptimisticStoreRebuildActions(internalConfig);
  optimisticStore.dispatch(actions);
};
