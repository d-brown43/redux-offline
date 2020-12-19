import {applyMiddleware, createStore, Middleware, Reducer, Store} from "redux";
import get from 'lodash.get';
import {ApiAction, GetOfflineState, OfflineAction, OfflineConfig} from "./types";
import {actionDependsOn, actionHasSideEffect, isOfflineAction} from "./utils";
import {
  markActionAsProcessed,
  replaceRootState,
  replaceOfflineState,
  setIsSyncing,
  offlineActions,
  setIsRebuilding, removeProcessedActions
} from "./redux";

const copyOptimisticToReal = (store: Store, optimisticStore: Store, config: OfflineConfig) => {
  const state = config.selector(store.getState());
  const optimisticState = config.selector(optimisticStore.getState());
  if (state !== optimisticState) {
    store.dispatch(replaceOfflineState(optimisticState));
  }
};

const rebuildOptimisticStore = (
  store: Store,
  optimisticStore: Store,
  config: OfflineConfig,
) => {
  optimisticStore.dispatch(replaceRootState(store.getState()));
  optimisticStore.dispatch(setIsRebuilding(true));
  const state = config.selector(store.getState());
  state.queue.forEach(optimisticAction => {
    const {offline, ...action} = optimisticAction;
    optimisticStore.dispatch(action);
  });
  optimisticStore.dispatch(setIsRebuilding(false));
};

const getDependentActions = (queue: OfflineAction[], resourceId: any) => {
  return queue.filter(action => {
    if (actionDependsOn(action)) {
      return action.offline.dependsOn === resourceId;
    }
    return false;
  });
};

const propagateProcessedActions = (
  optimisticStore: Store,
  store: Store,
  config: OfflineConfig,
) => {
  const state = config.selector(optimisticStore.getState());
  const processedActions = state.processed;
  processedActions.forEach(({action, response}) => {
    const resourceId = get(action, action.offline.dependencyPath);
    const dependentQueuedActions = getDependentActions(state.queue, resourceId);
    if (dependentQueuedActions.length > 0) {
      console.log('propagating to dependent actions', dependentQueuedActions, action, response);
      dependentQueuedActions.forEach(dependentAction => {
        handleOptimisticUpdateFulfilled(
          optimisticStore,
          store,
          dependentAction,
          response,
          config,
        );
        config.dispatchFulfilledAction(store.dispatch, dependentAction, response);
      });
    }
  });
  optimisticStore.dispatch(removeProcessedActions(processedActions));
};

const handleOptimisticUpdateFulfilled = (
  optimisticStore: Store,
  store: Store,
  action: OfflineAction,
  response: any,
  config: OfflineConfig,
) => {
  optimisticStore.dispatch(markActionAsProcessed(action, response));
  config.dispatchFulfilledAction(store.dispatch, action, response);
  propagateProcessedActions(optimisticStore, store, config);
};

const startSyncing = (
  optimisticStore: Store,
  store: Store,
  config: OfflineConfig,
): Promise<any> => {
  const state = config.selector(optimisticStore.getState());
  if (state.queue.length === 0) return Promise.resolve();
  const action = state.queue[0];
  if (isOfflineAction(action)) {
    return Promise.resolve()
      .then(() => {
        if (actionHasSideEffect(action)) {
          return config.makeApiRequest(action.offline.apiData);
        }
        return null;
      })
      .then((response) => {
        handleOptimisticUpdateFulfilled(
          optimisticStore,
          store,
          action,
          response,
          config,
        );
        rebuildOptimisticStore(store, optimisticStore, config);
      })
      .then(() => {
        return startSyncing(optimisticStore, store, config);
      });
  } else {
    throw new Error(`Unexpected action found in offline queue ${JSON.stringify(action, null, 2)}`);
  }
};

const makeGetOfflineState = (store: Store, config: OfflineConfig) => () => {
  const state = store.getState();
  return config.selector(state);
};

const makeHasActionsToProcess = (getOfflineState: GetOfflineState) => () => {
  return getOfflineState().queue.length > 0;
};

const makeIsSyncing = (getOfflineState: GetOfflineState) => () => {
  return getOfflineState().isSyncing;
};

type OptimisticActionSpy = (s: Store, config: OfflineConfig) => Middleware;

const optimisticActionSpy: OptimisticActionSpy = (realStore, config) => store => next => action => {
  const offlineState = config.selector(store.getState());
  if (!isOfflineAction(action) && !(action.type in offlineActions) && !offlineState.isRebuilding) {
    realStore.dispatch(action);
    rebuildOptimisticStore(realStore, (store as Store), config);
  } else {
    return next(action);
  }
};

const run = (store: Store, rootOptimisticReducer: Reducer, config: OfflineConfig) => {
  const optimisticMiddleware = applyMiddleware(optimisticActionSpy(store, config));
  const optimisticStore = createStore(rootOptimisticReducer, optimisticMiddleware);

  const getOfflineState = makeGetOfflineState(optimisticStore, config);
  const hasActionsToProcess = makeHasActionsToProcess(getOfflineState);
  const isSyncing = makeIsSyncing(getOfflineState);

  const setSyncing = (isSyncing: boolean) => {
    optimisticStore.dispatch(setIsSyncing(isSyncing));
  };

  optimisticStore.subscribe(() => {
    copyOptimisticToReal(store, optimisticStore, config);
  });

  optimisticStore.subscribe(() => {
    if (hasActionsToProcess() && !isSyncing()) {
      setSyncing(true);
      startSyncing(optimisticStore, store, config);
    } else if (!hasActionsToProcess() && isSyncing()) {
      setSyncing(false);
    }
  });

  return optimisticStore;
};

export default run;
