import {AnyAction, applyMiddleware, compose, createStore, Middleware, Store} from "redux";
import {reduxBatch} from '@manaflair/redux-batch';
import _ from 'lodash';
import {
  ApiAction,
  ApiDependentAction,
  ApiResourceAction, ArrayAction,
  Configure,
  OfflineAction,
  OfflineConfig,
  OfflineState, ResolvedApiEntityAction, ResolvedDependencies, Resource, ResourceIdentifier
} from "./types";
import {
  isDependentAction,
  actionHasSideEffect,
  isOfflineAction,
  isResolvedAction,
  isResourcesEqual,
  isResourceIdentifiersEqual, getRemoteResourceIdentifiers, getDependencyResourceIdentifiers
} from "./utils";
import {
  markActionAsProcessed,
  replaceRootState,
  replaceOfflineState,
  setIsSyncing,
  replaceActionInQueue,
  removeActionsInQueue,
  isInternalOfflineAction,
} from "./redux";
import {validateResourceIdentifiersOnAction} from "./schemaValidation";

type GetState = (store: Store) => OfflineState;

const createArrayAction = (actions: AnyAction[]): ArrayAction => Object.assign(actions, {type: undefined});

type InternalConfig = {
  store: Store<any, ArrayAction | AnyAction>,
  optimisticStore: Store,
  config: OfflineConfig,
  getState: GetState,
}

type OptimisticConfig = Pick<InternalConfig, 'store' | 'config' | 'getState'>;

type OptimisticActionSpy = (config: OptimisticConfig) => Middleware;

const makeGetState = (config: OfflineConfig): GetState => (store: Store) => {
  return config.selector(store.getState());
};

const getOptimisticStoreRebuildActions = (internalConfig: InternalConfig) => {
  const {optimisticStore, store, getState} = internalConfig;
  const offlineState = getState(optimisticStore);

  return createArrayAction([
    replaceRootState(store.getState()),
    replaceOfflineState(offlineState),
    ...offlineState.queue.map(optimisticAction => ({
      ...optimisticAction,
      offline: {
        ...optimisticAction.offline,
        // Label the action as a passThrough action, i.e. let it pass through
        // without doing anything special to it, we need to re-apply
        // the changes it caused to the optimistic state, but don't
        // want to requeue it, since it will already exist in the queue
        isPassThrough: true,
      }
    })),
  ]);
};

const rebuildOptimisticStore = (internalConfig: InternalConfig) => {
  const {optimisticStore} = internalConfig;
  const actions = getOptimisticStoreRebuildActions(internalConfig);
  optimisticStore.dispatch(actions);
};

const getSingularResource = (action: object, path: string) => _.get(action, path);

const getRemoteResources = (action: ApiAction | ApiResourceAction): Resource[] => {
  return getRemoteResourceIdentifiers(action).map(({path, type}) => ({
    type,
    value: getSingularResource(action, path),
  }));
};

const getSingularDependency = (action: ApiDependentAction, path: string) => _.get(action, path);

const getDependencies = (action: ApiDependentAction): Resource[] => {
  return getDependencyResourceIdentifiers(action).map(({type, path}) => ({
    type,
    value: getSingularDependency(action, path)
  }));
};

const getResolvedResourceIdentifier = (optimisticIdentifier: ResourceIdentifier, resolvedIdentifiers: ResolvedDependencies) => {
  const getErrorMessage = () => {
    return `Unable to find matching resource path`;
  };

  if (typeof resolvedIdentifiers === 'object' && !Array.isArray(resolvedIdentifiers)) {
    if (!isResourceIdentifiersEqual(optimisticIdentifier, resolvedIdentifiers)) {
      throw new Error(getErrorMessage());
    }
    return resolvedIdentifiers;
  }
  const result = resolvedIdentifiers.find((identifierOrPair) => {
    const comparisonIdentifier = !Array.isArray(identifierOrPair) ? identifierOrPair : identifierOrPair[0];
    return isResourceIdentifiersEqual(comparisonIdentifier, optimisticIdentifier);
  });
  if (!result) {
    throw new Error(getErrorMessage());
  }
  return !Array.isArray(result) ? result : result[1];
};

const updateDependencies = (action: ApiDependentAction, optimisticAction: ApiResourceAction, fulfilledAction: ResolvedApiEntityAction) => {
  const dependencyResourceIdentifiers = getDependencyResourceIdentifiers(action);
  const optimisticResourceIdentifiers = getRemoteResourceIdentifiers(optimisticAction);

  const getUpdatedResource = (currentResourceIdentifier: ResourceIdentifier) => {
    const optimisticResourceIdentifier = optimisticResourceIdentifiers
      .find(
        p => isResourceIdentifiersEqual(p, currentResourceIdentifier),
      );
    if (!optimisticResourceIdentifier) {
      throw new Error('Could not find matching resource');
    }
    const resolvedIdentifier = getResolvedResourceIdentifier(optimisticResourceIdentifier, fulfilledAction.offline.resolvedDependencies);
    return getSingularResource(fulfilledAction, resolvedIdentifier.path);
  };

  return dependencyResourceIdentifiers.reduce((acc, identifier) => {
    return _.setWith(_.clone(acc), identifier.path, getUpdatedResource(identifier), _.clone);
  }, action);
};

const actionDependsOn = (action: ApiAction, dependentAction: ApiDependentAction) => {
  const resources = getRemoteResources(action);
  const resourceDependencies = getDependencies(dependentAction);
  return resources.some(r => resourceDependencies.some(d => isResourcesEqual(d, r)));
};

const updateDependentActions = (
  internalConfig: InternalConfig,
  optimisticAction: ApiAction,
  fulfilledAction: ResolvedApiEntityAction,
) => {
  const {getState, optimisticStore} = internalConfig;
  const queue: OfflineAction[] = getState(optimisticStore).queue;
  queue.forEach((action, index) => {
    if (isDependentAction(action) && actionDependsOn(optimisticAction, action)) {
      optimisticStore.dispatch(replaceActionInQueue(index, updateDependencies(action, optimisticAction, fulfilledAction)));
    }
  });
};

const removeDependentActions = (
  internalConfig: InternalConfig,
  optimisticAction: ApiAction,
) => {
  const {getState, optimisticStore} = internalConfig;
  const queue: OfflineAction[] = getState(optimisticStore).queue;

  const actionsToRemove = queue.reduce<OfflineAction[]>((acc, action) => {
    if (isDependentAction(action) && actionDependsOn(optimisticAction, action)) {
      return acc.concat([action]);
    }
    return acc;
  }, []);

  optimisticStore.dispatch(removeActionsInQueue(actionsToRemove));

  actionsToRemove.forEach(action => {
    if (actionHasSideEffect(action)) {
      // TODO Option for dealing with dependent actions instead of removing?
      // Might want to convert the action to something else/retry
      removeDependentActions(internalConfig, action);
    }
  });
};

const handleOptimisticUpdateResolved = (
  internalConfig: InternalConfig,
  action: ApiAction,
  response: any,
) => {
  const {optimisticStore, config, store} = internalConfig;
  optimisticStore.dispatch(markActionAsProcessed(action));
  const fulfilledAction = config.getFulfilledAction(action, response);
  if (fulfilledAction) {
    if (!isResolvedAction(fulfilledAction)) {
      console.error('Expecting a resolved action or null to be returned by getFulfilledAction, got', fulfilledAction);
      console.info('A resolved action is an action with a `dependencyPath` attribute for the offline metadata and no other properties');
      throw new Error(JSON.stringify(fulfilledAction));
    }
    store.dispatch(fulfilledAction);
    updateDependentActions(internalConfig, action, fulfilledAction);
    rebuildOptimisticStore(internalConfig);
  }
};

const handleOptimisticUpdateRollback = (
  internalConfig: InternalConfig,
  action: ApiAction,
  response: any,
) => {
  const {optimisticStore, config, store} = internalConfig;
  optimisticStore.dispatch(markActionAsProcessed(action));
  const rollbackAction = config.getRollbackAction(action, response);
  if (rollbackAction) {
    store.dispatch(rollbackAction);
  }
  removeDependentActions(internalConfig, action);
  rebuildOptimisticStore(internalConfig);
};

const handlePassThrough = (internalConfig: InternalConfig, action: ApiDependentAction) => {
  const {optimisticStore, store} = internalConfig;
  optimisticStore.dispatch(markActionAsProcessed(action));
  const {offline, ...nextAction} = action;
  store.dispatch(nextAction);
  rebuildOptimisticStore(internalConfig);
};

const handleApiRequest = (internalConfig: InternalConfig, action: ApiAction) => {
  const {config} = internalConfig;

  return config.makeApiRequest(action.offline.apiData)
    .then((response) => {
      handleOptimisticUpdateResolved(internalConfig, action, response);
      return syncNextPendingAction(internalConfig);
    })
    .catch((error) => {
      handleOptimisticUpdateRollback(internalConfig, action, error);
      return syncNextPendingAction(internalConfig);
    });
};

const syncNextPendingAction = (internalConfig: InternalConfig): Promise<any> => {
  const {optimisticStore, getState} = internalConfig;
  const state = getState(optimisticStore);
  if (state.queue.length === 0) return Promise.resolve();
  const action = state.queue[0];

  validateResourceIdentifiersOnAction(action);

  if (isDependentAction(action)) {
    handlePassThrough(internalConfig, action);
    return syncNextPendingAction(internalConfig);
  }

  if (!actionHasSideEffect(action)) {
    throw new Error(`Unexpected action found in queue: ${JSON.stringify(action)}`);
  }

  return handleApiRequest(internalConfig, action);
};

export const optimisticActionSpy: OptimisticActionSpy = (config) => optimisticStore => next => action => {
  const offlineAction = isOfflineAction(action) || isInternalOfflineAction(action);

  if (!offlineAction) {
    const {store} = config;
    store.dispatch(action);
    next(getOptimisticStoreRebuildActions({...config, optimisticStore: optimisticStore as Store}));
  } else {
    next(action);
  }
};

const realStoreMiddleware: Middleware = () => next => action => {
  if (isOfflineAction(action)) {
    // Lets us use the same rootReducer for the real store and optimistic store
    // without re-queueing the offline actions
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

  // Duplication of reduxBatch is not a bug, we need it duplicated to be able
  // to dispatch batched actions from optimisticMiddleware
  const storeEnhancer = compose(
    reduxBatch,
    applyMiddleware(optimisticMiddleware),
    reduxBatch,
  );

  const run = makeRun(internalConfig);

  return {
    storeEnhancer,
    run,
    store,
  }
};

export default configure;
