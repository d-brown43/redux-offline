import { AnyAction } from "redux";
import {
  ApiAction,
  ApiDependentAction,
  OfflineAction,
  ResolvedApiEntityAction,
  Resource,
  ResourceIdentifier,
} from "./types";

export const isOfflineAction = (action: AnyAction): action is OfflineAction =>
  "offline" in action;

export const isApiAction = (action: OfflineAction): action is ApiAction => {
  return isOfflineAction(action) && "apiData" in action.offline;
};

export const isDependentAction = (
  action: OfflineAction
): action is ApiDependentAction => {
  return isOfflineAction(action) && "dependsOn" in action.offline;
};

export const isResolvedAction = (
  action: AnyAction
): action is ResolvedApiEntityAction => {
  return (
    isOfflineAction(action) &&
    !isApiAction(action) &&
    "resolvedDependencies" in action.offline
  );
};

export const isPassThrough = (action: AnyAction) => {
  return isOfflineAction(action) && Boolean(action.offline.isPassThrough);
};

export const isResourceIdentifiersEqual = (
  identifierA: ResourceIdentifier,
  identifierB: ResourceIdentifier
) => {
  return identifierA.type === identifierB.type;
};

export const isResourcesEqual = (resourceA: Resource, resourceB: Resource) => {
  return (
    resourceA.type === resourceB.type && resourceA.value === resourceB.value
  );
};

type GetPathsFromAction = <
  K extends keyof T["offline"],
  T extends {
    offline: Record<K, ResourceIdentifier | ResourceIdentifier[]> & {
      [k: string]: any;
    };
  }
>(
  key: K
) => (action: T) => ResourceIdentifier[];

const getPathsFromAction: GetPathsFromAction = (key) => (action) => {
  if (!Array.isArray(action.offline[key])) {
    return [action.offline[key]];
  }
  return action.offline[key];
};

export const getRemoteResourceIdentifiers = getPathsFromAction(
  "dependencyPaths"
);
export const getDependencyResourceIdentifiers = getPathsFromAction("dependsOn");
