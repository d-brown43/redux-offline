import {applyMiddleware, createStore, Middleware, Reducer, Store} from "redux";
import _ from 'lodash';
import {ApiAction, ApiDependentAction, ApiResourceAction, GetOfflineState, OfflineAction, OfflineConfig} from "./types";
import {isDependentAction, actionHasSideEffect, isOfflineAction} from "./utils";
import {
  markActionAsProcessed,
  replaceRootState,
  replaceOfflineState,
  setIsSyncing,
  offlineActions,
  setIsRebuilding,
  replaceActionInQueue,
  createRootReducer,
  reducer,
} from "./redux";

type GetState = (store: Store) => any;

const makeGetState = (config: OfflineConfig) => (store: Store) => {
  return config.selector(store.getState());
};

const rebuildOptimisticStore = (
  store: Store,
  optimisticStore: Store,
  config: OfflineConfig,
) => {
  const offlineState = config.selector(optimisticStore.getState());
  console.log('before offline state', offlineState);
  optimisticStore.dispatch(replaceRootState(store.getState()));
  const offlineStateLoading = reducer(offlineState, setIsRebuilding(true));
  optimisticStore.dispatch(replaceOfflineState(offlineStateLoading));
  offlineState.queue.forEach(optimisticAction => {
    const {offline, ...action} = optimisticAction;
    optimisticStore.dispatch(action);
  });
  optimisticStore.dispatch(setIsRebuilding(false));
  console.log('after offline state', config.selector(optimisticStore.getState()));
};

const getResourceId = (action: ApiAction | ApiResourceAction) => _.get(action, action.offline.dependencyPath);
const getDependency = (action: ApiDependentAction) => _.get(action, action.offline.dependsOn);

const updateDependency = (action: ApiDependentAction, fulfilledAction: ApiResourceAction) => {
  return _.setWith(_.clone(action), action.offline.dependsOn, getResourceId(fulfilledAction), _.clone);
};

const actionDependsOn = (action: ApiAction, dependentAction: ApiDependentAction) => {
  return getResourceId(action) === getDependency(dependentAction);
};

const updateDependentActions = (optimisticAction: ApiAction, fulfilledAction: ApiResourceAction, optimisticStore: Store, getState: GetState) => {
  const queue: OfflineAction[] = getState(optimisticStore).queue;
  queue.forEach((action, index) => {
    if (isDependentAction(action) && actionDependsOn(optimisticAction, action)) {
      optimisticStore.dispatch(replaceActionInQueue(index, updateDependency(action, fulfilledAction)));
    }
  });
};

const handleOptimisticUpdateFulfilled = (
  optimisticStore: Store,
  store: Store,
  action: ApiAction,
  response: any,
  config: OfflineConfig,
  getState: GetState,
) => {
  optimisticStore.dispatch(markActionAsProcessed(action, response));
  const fulfilledAction = config.getFulfilledAction(action, response);
  if (fulfilledAction) {
    store.dispatch(fulfilledAction);
    updateDependentActions(action, fulfilledAction, optimisticStore, getState);
  }
};

const handlePassthroughs = (
  optimisticStore: Store,
  store: Store,
  action: OfflineAction,
  config: OfflineConfig,
) => {
  optimisticStore.dispatch(markActionAsProcessed(action, null));
  config.optimisticPassthrough(store.dispatch, action);
};

const syncNextPendingAction = (
  optimisticStore: Store,
  store: Store,
  config: OfflineConfig,
  getState: GetState,
): Promise<any> => {
  const state = config.selector(optimisticStore.getState());
  if (state.queue.length === 0) return Promise.resolve();
  const action = state.queue[0];

  if (isDependentAction(action)) {
    // If it's labelled as a dependent action, but is the first
    // action in the queue, this means the data its dependent on is actually
    // real data and not temporary data, meaning we can dispatch the real
    // action immediately. We don't know what the final action is however,
    // so we pass control back to the app
    handlePassthroughs(
      optimisticStore,
      store,
      action,
      config,
    );
    rebuildOptimisticStore(store, optimisticStore, config);
    return syncNextPendingAction(optimisticStore, store, config, getState);
  }

  if (!actionHasSideEffect(action)) {
    throw new Error(`Unexpected action found in queue: ${JSON.stringify(action)}`);
  }

  return config.makeApiRequest(action.offline.apiData)
    .then((response) => {
      handleOptimisticUpdateFulfilled(
        optimisticStore,
        store,
        action,
        response,
        config,
        getState,
      );
      rebuildOptimisticStore(store, optimisticStore, config);
    })
    .then(() => {
      return syncNextPendingAction(optimisticStore, store, config, getState);
    });
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

  const isNonOfflineAction = !isOfflineAction(action) && !(action.type in offlineActions) && !offlineState.isRebuilding;

  if (isNonOfflineAction) {
    realStore.dispatch(action);
    rebuildOptimisticStore(realStore, (store as Store), config);
  } else {
    next(action);
  }
};

const run = (store: Store, rootOptimisticReducer: Reducer, config: OfflineConfig) => {
  const optimisticMiddleware = applyMiddleware(optimisticActionSpy(store, config));
  const optimisticStore = createStore(createRootReducer(rootOptimisticReducer), optimisticMiddleware);

  const getOfflineState = makeGetOfflineState(optimisticStore, config);
  const hasActionsToProcess = makeHasActionsToProcess(getOfflineState);
  const isSyncing = makeIsSyncing(getOfflineState);

  const getState = makeGetState(config);

  const setSyncing = (isSyncing: boolean) => {
    optimisticStore.dispatch(setIsSyncing(isSyncing));
  };

  optimisticStore.subscribe(() => {
    if (hasActionsToProcess() && !isSyncing()) {
      setSyncing(true);
      syncNextPendingAction(optimisticStore, store, config, getState);
    } else if (!hasActionsToProcess() && isSyncing()) {
      setSyncing(false);
    }
  });

  return optimisticStore;
};

export default run;
