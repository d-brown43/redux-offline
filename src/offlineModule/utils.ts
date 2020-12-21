import {AnyAction} from "redux";
import {
  ApiAction,
  ApiDependentAction,
  ApiResourceAction,
  OfflineAction,
  ResolvedApiEntityAction,
  Resource,
  ResourceIdentifier
} from "./types";

export const isOfflineAction = (action: AnyAction): action is OfflineAction => 'offline' in action;

export const actionHasSideEffect = (action: OfflineAction): action is ApiAction => {
  return isOfflineAction(action) && 'apiData' in action.offline;
};

export const isDependentAction = (action: OfflineAction): action is ApiDependentAction => {
  return isOfflineAction(action) && 'dependsOn' in action.offline;
};

export const isResolvedAction = (action: AnyAction): action is ResolvedApiEntityAction => {
  return isOfflineAction(action) && !actionHasSideEffect(action) && 'resolvedDependencies' in action.offline;
};

export const isPassThrough = (action: AnyAction) => {
  return isOfflineAction(action) && Boolean(action.offline.isPassThrough);
};

export const isResourceIdentifiersEqual = (identifierA: ResourceIdentifier, identifierB: ResourceIdentifier) => {
  return (
    identifierA.type === identifierB.type
  )
};

export const isResourcesEqual = (resourceA: Resource, resourceB: Resource) => {
  return (
    resourceA.type === resourceB.type
    && resourceA.value === resourceB.value
  );
};

export const getRemoteResourceIdentifiers = (action: ApiAction | ApiResourceAction) => {
  if (typeof action.offline.dependencyPaths === 'object' && !Array.isArray(action.offline.dependencyPaths)) {
    return [action.offline.dependencyPaths];
  }
  return action.offline.dependencyPaths;
};

export const getDependencyResourceIdentifiers = (action: ApiDependentAction) => {
  if (!Array.isArray(action.offline.dependsOn)) {
    return [action.offline.dependsOn];
  }
  return action.offline.dependsOn;
};
