import _ from "lodash";
import {
  ApiAction,
  ApiDependentAction,
  ApiResourceAction,
  OfflineAction,
  ResolvedApiEntityAction,
  ResolvedDependencies,
  Resource,
  ResourceIdentifier,
} from "./types";
import {
  isDependentAction,
  actionHasSideEffect,
  isResolvedAction,
  isResourcesEqual,
  isResourceIdentifiersEqual,
  getRemoteResourceIdentifiers,
  getDependencyResourceIdentifiers,
} from "./utils";
import {
  markActionAsProcessed,
  replaceActionInQueue,
  removeActionsInQueue,
} from "./redux";
import { validateResourceIdentifiersOnAction } from "./schemaValidation";
import { InternalConfig } from "./internalTypes";
import { rebuildOptimisticStore } from "./manageState";

const getRemoteResources = (
  action: ApiAction | ApiResourceAction
): Resource[] => {
  return getRemoteResourceIdentifiers(action).map(({ path, type }) => ({
    type,
    value: getSingularResource(action, path),
  }));
};

const getSingularResource = (action: object, path: string) =>
  _.get(action, path);

const getDependencies = (action: ApiDependentAction): Resource[] => {
  return getDependencyResourceIdentifiers(action).map(({ type, path }) => ({
    type,
    value: getSingularResource(action, path),
  }));
};

const getResolvedResourceIdentifier = (
  optimisticIdentifier: ResourceIdentifier,
  resolvedIdentifiers: ResolvedDependencies
) => {
  const getErrorMessage = () => {
    return `Unable to find matching resource path`;
  };

  if (!Array.isArray(resolvedIdentifiers)) {
    if (
      !isResourceIdentifiersEqual(optimisticIdentifier, resolvedIdentifiers)
    ) {
      throw new Error(getErrorMessage());
    }
    return resolvedIdentifiers;
  }
  const result = resolvedIdentifiers.find((identifierOrPair) => {
    return isResourceIdentifiersEqual(identifierOrPair, optimisticIdentifier);
  });
  if (!result) {
    throw new Error(getErrorMessage());
  }
  return result;
};

const updateDependencies = (
  action: ApiDependentAction,
  optimisticAction: ApiResourceAction,
  fulfilledAction: ResolvedApiEntityAction
) => {
  const dependencyResourceIdentifiers = getDependencyResourceIdentifiers(
    action
  );
  const optimisticResourceIdentifiers = getRemoteResourceIdentifiers(
    optimisticAction
  );

  const getUpdatedResource = (
    currentResourceIdentifier: ResourceIdentifier
  ) => {
    const optimisticResourceIdentifier = optimisticResourceIdentifiers.find(
      (p) => isResourceIdentifiersEqual(p, currentResourceIdentifier)
    );
    if (!optimisticResourceIdentifier) {
      throw new Error("Could not find matching resource");
    }
    const resolvedIdentifier = getResolvedResourceIdentifier(
      optimisticResourceIdentifier,
      fulfilledAction.offline.resolvedDependencies
    );
    return getSingularResource(fulfilledAction, resolvedIdentifier.path);
  };

  return dependencyResourceIdentifiers.reduce((acc, identifier) => {
    return _.setWith(
      _.clone(acc),
      identifier.path,
      getUpdatedResource(identifier),
      _.clone
    );
  }, action);
};

const actionDependsOn = (
  action: ApiAction,
  dependentAction: ApiDependentAction
) => {
  const resources = getRemoteResources(action);
  const resourceDependencies = getDependencies(dependentAction);
  return resources.some((r) =>
    resourceDependencies.some((d) => isResourcesEqual(d, r))
  );
};

const updateDependentActions = (
  internalConfig: InternalConfig,
  optimisticAction: ApiAction,
  fulfilledAction: ResolvedApiEntityAction
) => {
  const { getState, optimisticStore } = internalConfig;
  const queue: OfflineAction[] = getState(optimisticStore).queue;
  queue.forEach((action, index) => {
    if (
      isDependentAction(action) &&
      actionDependsOn(optimisticAction, action)
    ) {
      optimisticStore.dispatch(
        replaceActionInQueue(
          index,
          updateDependencies(action, optimisticAction, fulfilledAction)
        )
      );
    }
  });
};

const removeDependentActions = (
  internalConfig: InternalConfig,
  optimisticAction: ApiAction
) => {
  const { getState, optimisticStore } = internalConfig;
  const queue: OfflineAction[] = getState(optimisticStore).queue;

  const actionsToRemove = queue.reduce<OfflineAction[]>((acc, action) => {
    if (
      isDependentAction(action) &&
      actionDependsOn(optimisticAction, action)
    ) {
      return acc.concat([action]);
    }
    return acc;
  }, []);

  optimisticStore.dispatch(removeActionsInQueue(actionsToRemove));

  actionsToRemove.forEach((action) => {
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
  response: any
) => {
  const { optimisticStore, config, store } = internalConfig;
  optimisticStore.dispatch(markActionAsProcessed(action));
  const fulfilledAction = config.getFulfilledAction(action, response);
  if (fulfilledAction) {
    if (!isResolvedAction(fulfilledAction)) {
      console.error(
        "Expecting a resolved action or null to be returned by getFulfilledAction, got",
        fulfilledAction
      );
      console.info(
        "A resolved action is an action with a `dependencyPath` attribute for the offline metadata and no other properties"
      );
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
  response: any
) => {
  const { optimisticStore, config, store } = internalConfig;
  optimisticStore.dispatch(markActionAsProcessed(action));
  const rollbackAction = config.getRollbackAction(action, response);
  if (rollbackAction) {
    store.dispatch(rollbackAction);
  }
  removeDependentActions(internalConfig, action);
  rebuildOptimisticStore(internalConfig);
};

const handlePassThrough = (
  internalConfig: InternalConfig,
  action: ApiDependentAction
) => {
  const { optimisticStore, store } = internalConfig;
  optimisticStore.dispatch(markActionAsProcessed(action));
  const { offline, ...nextAction } = action;
  store.dispatch(nextAction);
  rebuildOptimisticStore(internalConfig);
};

const handleApiRequest = (
  internalConfig: InternalConfig,
  action: ApiAction
) => {
  const { config } = internalConfig;

  return config
    .makeApiRequest(action.offline.apiData)
    .then((response) => {
      handleOptimisticUpdateResolved(internalConfig, action, response);
      return syncNextPendingAction(internalConfig);
    })
    .catch((error) => {
      handleOptimisticUpdateRollback(internalConfig, action, error);
      return syncNextPendingAction(internalConfig);
    });
};

const syncNextPendingAction = (
  internalConfig: InternalConfig
): Promise<any> => {
  const { optimisticStore, getState } = internalConfig;
  const state = getState(optimisticStore);
  if (state.queue.length === 0) return Promise.resolve();
  const action = state.queue[0];

  validateResourceIdentifiersOnAction(action);

  if (isDependentAction(action)) {
    handlePassThrough(internalConfig, action);
    return syncNextPendingAction(internalConfig);
  }

  if (!actionHasSideEffect(action)) {
    throw new Error(
      `Unexpected action found in queue: ${JSON.stringify(action)}`
    );
  }

  return handleApiRequest(internalConfig, action);
};

export default syncNextPendingAction;
