import {applyMiddleware, createStore, Middleware, Store} from "redux";
import _ from 'lodash';
import {
  ApiAction,
  ApiDependentAction,
  ApiResourceAction,
  Configure,
  OfflineAction,
  OfflineConfig,
  OfflineState
} from "./types";
import {isDependentAction, actionHasSideEffect, isOfflineAction} from "./utils";
import {
  markActionAsProcessed,
  replaceRootState,
  replaceOfflineState,
  setIsSyncing,
  offlineActions,
  setIsRebuilding,
  replaceActionInQueue,
  reducer,
} from "./redux";

type GetState = (store: Store) => OfflineState;

type InternalConfig = {
  store: Store,
  optimisticStore: Store,
  config: OfflineConfig,
  getState: GetState,
}

type OptimisticConfig = Pick<InternalConfig, 'store' | 'config' | 'getState'>;

type OptimisticActionSpy = (config: OptimisticConfig) => Middleware;

const makeGetState = (config: OfflineConfig): GetState => (store: Store) => {
  return config.selector(store.getState());
};

const rebuildOptimisticStore = (internalConfig: InternalConfig) => {
  const {optimisticStore, store, getState} = internalConfig;
  const offlineState = getState(optimisticStore);
  optimisticStore.dispatch(replaceRootState(store.getState()));
  const offlineStateLoading = reducer(offlineState, setIsRebuilding(true));
  optimisticStore.dispatch(replaceOfflineState(offlineStateLoading));
  offlineState.queue.forEach(optimisticAction => {
    const {offline, ...action} = optimisticAction;
    optimisticStore.dispatch(action);
  });
  optimisticStore.dispatch(setIsRebuilding(false));
};

const getResourceId = (action: ApiAction | ApiResourceAction) => _.get(action, action.offline.dependencyPath);
const getDependency = (action: ApiDependentAction) => _.get(action, action.offline.dependsOn);

const updateDependency = (action: ApiDependentAction, fulfilledAction: ApiResourceAction) => {
  return _.setWith(_.clone(action), action.offline.dependsOn, getResourceId(fulfilledAction), _.clone);
};

const actionDependsOn = (action: ApiAction, dependentAction: ApiDependentAction) => {
  return getResourceId(action) === getDependency(dependentAction);
};

const updateDependentActions = (
  internalConfig: InternalConfig,
  optimisticAction: ApiAction,
  fulfilledAction: ApiResourceAction,
) => {
  const {getState, optimisticStore} = internalConfig;
  const queue: OfflineAction[] = getState(optimisticStore).queue;
  queue.forEach((action, index) => {
    if (isDependentAction(action) && actionDependsOn(optimisticAction, action)) {
      optimisticStore.dispatch(replaceActionInQueue(index, updateDependency(action, fulfilledAction)));
    }
  });
};

const handleOptimisticUpdateResolved = (
  internalConfig: InternalConfig,
  action: ApiAction,
  response: any,
) => {
  const {optimisticStore, config, store} = internalConfig;
  optimisticStore.dispatch(markActionAsProcessed(action, response));
  const fulfilledAction = config.getFulfilledAction(action, response);
  if (fulfilledAction) {
    store.dispatch(fulfilledAction);
    updateDependentActions(internalConfig, action, fulfilledAction);
    rebuildOptimisticStore(internalConfig);
  }
};

const handlePassthroughs = (internalConfig: InternalConfig, action: ApiDependentAction) => {
  const {optimisticStore, store} = internalConfig;
  optimisticStore.dispatch(markActionAsProcessed(action, null));
  const {offline, ...nextAction} = action;
  store.dispatch(nextAction);
  rebuildOptimisticStore(internalConfig);
};

const syncNextPendingAction = (internalConfig: InternalConfig): Promise<any> => {
  const {config, optimisticStore, getState} = internalConfig;
  const state = getState(optimisticStore);
  if (state.queue.length === 0) return Promise.resolve();
  const action = state.queue[0];

  if (isDependentAction(action)) {
    handlePassthroughs(internalConfig, action);
    return syncNextPendingAction(internalConfig);
  }

  if (!actionHasSideEffect(action)) {
    throw new Error(`Unexpected action found in queue: ${JSON.stringify(action)}`);
  }

  return config.makeApiRequest(action.offline.apiData)
    .then((response) => {
      handleOptimisticUpdateResolved(internalConfig, action, response);
      return syncNextPendingAction(internalConfig);
    });
};

export const optimisticActionSpy: OptimisticActionSpy = (config) => optimisticStore => next => action => {
  const {store, getState} = config;

  const isNonOfflineAction = (
    !isOfflineAction(action)
    && !(action.type in offlineActions)
    && !getState(optimisticStore as Store).isRebuilding
  );

  const mergedConfig = {...config, optimisticStore: optimisticStore as Store};

  if (isNonOfflineAction) {
    store.dispatch(action);
    rebuildOptimisticStore(mergedConfig);
  } else {
    next(action);
  }
};

const realStoreMiddleware: Middleware = () => next => action => {
  if (isOfflineAction(action)) {
    // Lets us use the same rootReducer for the real store and optimistic store
    const {offline, ...rest} = action;
    next(rest);
  } else {
    next(action);
  }
};

const makeRun = (configuredConfig: OptimisticConfig) => (optimisticStore: Store) => {
  const setSyncing = (isSyncing: boolean) => {
    optimisticStore.dispatch(setIsSyncing(isSyncing));
  };

  const {getState, store, config} = configuredConfig;

  const internalConfig = {
    store,
    optimisticStore,
    config,
    getState,
  };

  optimisticStore.subscribe(() => {
    if (
      getState(optimisticStore).queue.length > 0
      && !getState(optimisticStore).isSyncing
    ) {
      setSyncing(true);
      syncNextPendingAction(internalConfig);
    } else if (
      getState(optimisticStore).queue.length === 0
      && getState(optimisticStore).isSyncing
    ) {
      setSyncing(false);
    }
  });
};

const configure: Configure = (config) => {
  const getState = makeGetState(config);
  const store = createStore(config.rootReducer, applyMiddleware(realStoreMiddleware));

  const internalConfig = {
    getState,
    config,
    store,
  };

  const optimisticMiddleware = optimisticActionSpy(internalConfig);

  const run = makeRun(internalConfig);

  return {
    optimisticMiddleware,
    run,
    store,
  }
};

export default configure;
