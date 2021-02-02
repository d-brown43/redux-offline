import {
  ApiAction,
  DependentAction,
  DependentApiAction,
  OfflineAction,
} from './types';
import {
  isDependentAction,
  isApiAction,
  ensureResolvedPaths,
  ensureResolvedAction,
} from './utils';
import {
  replaceActionsInQueue,
  removeActionsInQueue,
  setIsSyncing, getQueue, getIsSyncing,
} from './redux';
import { InternalConfig } from './internalTypes';
import { createArrayAction, rebuildOptimisticStore } from './manageState';
import { verifyResolvedAction } from './validateActions';
import {
  getExpandedDependentActions,
  getUpdatedDependentActions,
} from './expandActions';

const getRemoveDependentActions = (
  internalConfig: InternalConfig,
  optimisticAction: ApiAction | DependentApiAction
) => {
  const { getState, optimisticStore } = internalConfig;
  const queue: OfflineAction[] = getState(optimisticStore).queue;
  const dependentActions = getExpandedDependentActions(
    queue,
    internalConfig,
    optimisticAction
  );
  return removeActionsInQueue(dependentActions);
};

const handleOptimisticUpdateResolved = (
  internalConfig: InternalConfig,
  action: ApiAction,
  response: any
) => {
  const { optimisticStore, config, store } = internalConfig;

  const fulfilledAction = config.getFulfilledAction(action, response);
  const nonNullFulfilledAction = ensureResolvedAction(action, fulfilledAction);
  const withMetadata = ensureResolvedPaths(action, nonNullFulfilledAction);

  if (process.env.NODE_ENV === 'development') {
    verifyResolvedAction(action, withMetadata);
  }

  const updateActions = replaceActionsInQueue(
    getUpdatedDependentActions(internalConfig, action, withMetadata)
  );

  // TODO Allow dispatching the fulfilled action to the optimistic store?
  // Would allow dispatching new API requests based on this result
  // Think should not allow this, and they should use something else to respond to
  // changes themselves after resolving
  store.dispatch(withMetadata);
  optimisticStore.dispatch(
    createArrayAction([removeActionsInQueue([action]), updateActions])
  );
  rebuildOptimisticStore(internalConfig);
};

const handleOptimisticUpdateRollback = (
  internalConfig: InternalConfig,
  action: ApiAction,
  response: any
) => {
  const { optimisticStore, config, store } = internalConfig;

  optimisticStore.dispatch(getRemoveDependentActions(internalConfig, action));

  if (config.getRollbackAction) {
    const rollbackAction = config.getRollbackAction(action, response);
    if (rollbackAction) {
      store.dispatch(rollbackAction);
    }
  }

  rebuildOptimisticStore(internalConfig);
};

const handlePassThrough = (
  internalConfig: InternalConfig,
  action: DependentAction
) => {
  const { optimisticStore, store } = internalConfig;
  optimisticStore.dispatch(removeActionsInQueue([action]));
  const { offline, ...nextAction } = action;
  store.dispatch(nextAction);
  rebuildOptimisticStore(internalConfig);
};

const handleApiRequest = (
  internalConfig: InternalConfig,
  action: ApiAction
) => {
  const { config } = internalConfig;

  let handled = false;
  return config
    .makeApiRequest(action.offline.apiData)
    .catch((error) => {
      handleOptimisticUpdateRollback(internalConfig, action, error);
      handled = true;
      return syncNextPendingAction(internalConfig);
    })
    .then((response) => {
      if (!handled) {
        handleOptimisticUpdateResolved(internalConfig, action, response);
        return syncNextPendingAction(internalConfig);
      }
      return response;
    });
};

const syncNextPendingAction = (
  internalConfig: InternalConfig
): Promise<any> => {
  const { optimisticStore, getState } = internalConfig;
  const state = getState(optimisticStore);
  if (state.queue.length === 0) return Promise.resolve();
  const action = state.queue[0];

  if (isDependentAction(action)) {
    handlePassThrough(internalConfig, action);
    return syncNextPendingAction(internalConfig);
  }

  if (!isApiAction(action)) {
    throw new Error(
      `Unexpected action found in queue: ${JSON.stringify(action)}`
    );
  }

  return handleApiRequest(internalConfig, action);
};

const subscribeToStore = (internalConfig: InternalConfig) => {
  const setSyncing = (isSyncing: boolean) => {
    optimisticStore.dispatch(setIsSyncing(isSyncing));
  };

  const { optimisticStore, getState } = internalConfig;

  optimisticStore.subscribe(() => {
    if (
      getQueue(getState(optimisticStore)).length > 0 &&
      !getIsSyncing(getState(optimisticStore))
    ) {
      setSyncing(true);
      syncNextPendingAction(internalConfig);
    } else if (
      getQueue(getState(optimisticStore)).length === 0 &&
      getIsSyncing(getState(optimisticStore))
    ) {
      setSyncing(false);
    }
  });
};

export default subscribeToStore;
