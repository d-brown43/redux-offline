import { AnyAction } from 'redux';
import {
  ApiAction,
  DependentAction,
  DependentApiAction,
  OfflineAction,
  OptionalResolvedApiAction,
  ResolvedAction,
  Resource,
  ResourceIdentifier,
  ResourcePaths,
  UniqueIdentifier,
} from './types';
import _ from 'lodash';

export const isOfflineAction = (action: AnyAction): action is OfflineAction =>
  'offline' in action;

type IsApiAction = (action: OfflineAction) => action is ApiAction;
type IsDependentAction = (action: OfflineAction) => action is DependentAction;
type IsDependentApiAction = (
  action: OfflineAction
) => action is DependentApiAction;
type IsResolvedAction = (action: OfflineAction) => action is ResolvedAction;

export const isApiAction: IsApiAction = (action): action is ApiAction => {
  return (
    isOfflineAction(action) &&
    'apiData' in action.offline &&
    'dependencyPaths' in action.offline
  );
};

export const isDependentAction: IsDependentAction = (
  action
): action is DependentAction => {
  return isOfflineAction(action) && 'dependsOn' in action.offline;
};

export const isDependentApiAction: IsDependentApiAction = (
  action
): action is DependentApiAction => {
  return isApiAction(action) && isDependentAction(action);
};

export const isResolvedAction: IsResolvedAction = (
  action: AnyAction
): action is ResolvedAction => {
  return isOfflineAction(action) && 'resolvedDependencies' in action.offline;
};

export const isPassThrough = (action: OfflineAction) => {
  return isOfflineAction(action) && Boolean(action.offline.isPassThrough);
};

export const isResourcesIdentifiersEqual = (
  identifierA: ResourceIdentifier
) => (identifierB: ResourceIdentifier) =>
  identifierA.uniqueIdentifier === identifierB.uniqueIdentifier;

export const isResourcesEqual = (
  resourceA: { uniqueIdentifier: UniqueIdentifier },
  resourceB: { uniqueIdentifier: UniqueIdentifier }
) => {
  return resourceA.uniqueIdentifier === resourceB.uniqueIdentifier;
};

type GetPathsFromAction = <
  K extends keyof T['offline'],
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
  'dependencyPaths'
);
export const getDependencyResourceIdentifiers = getPathsFromAction('dependsOn');

export const makePassThrough = (action: OfflineAction): OfflineAction => ({
  ...action,
  offline: {
    ...action.offline,
    isPassThrough: true,
  },
});

export const getSingularResource = (action: object, path: string) =>
  _.get(action, path);

export const getResourceIdentifierValue = (
  resourceIdentifier: ResourceIdentifier,
  action: OfflineAction
): Resource => ({
  uniqueIdentifier: resourceIdentifier.uniqueIdentifier,
  value: getSingularResource(action, resourceIdentifier.path),
});

export const getRemoteResources = (action: ApiAction): Resource[] => {
  return getRemoteResourceIdentifiers(action).map(
    ({ path, uniqueIdentifier }) => ({
      uniqueIdentifier,
      value: getSingularResource(action, path),
    })
  );
};

export const getDependencies = (action: DependentAction): Resource[] => {
  return getDependencyResourceIdentifiers(action).map((identifier) =>
    getResourceIdentifierValue(identifier, action)
  );
};

export const actionDependsOn = (
  action: ApiAction,
  dependentAction: DependentAction
) => {
  const resources = getRemoteResources(action);
  const resourceDependencies = getDependencies(dependentAction);
  return resources.some((r) =>
    resourceDependencies.some((d) => isResourcesEqual(d, r))
  );
};

const isIdentifiersEqual = (
  identifiersA: UniqueIdentifier[],
  identifiersB: UniqueIdentifier[]
) => {
  const doComparison = (a: UniqueIdentifier[], b: UniqueIdentifier[]) => {
    return a.every((identifier) => b.some((i) => i === identifier));
  };

  return (
    doComparison(identifiersA, identifiersB) &&
    doComparison(identifiersB, identifiersA)
  );
};

const getUniqueIdentifiers = (descriptors: ResourcePaths) => {
  return getDependencyResourceIdentifiers({
    offline: { dependsOn: descriptors },
  }).map((identifier) => identifier.uniqueIdentifier);
};

export const isMatchingResourceIdentifiers = (
  optimisticAction: ApiAction,
  resolvedAction: ResolvedAction
) => {
  if (
    optimisticAction.offline.dependencyPaths ===
    resolvedAction.offline.resolvedDependencies
  ) {
    return true;
  }
  return isIdentifiersEqual(
    getUniqueIdentifiers(optimisticAction.offline.dependencyPaths),
    getUniqueIdentifiers(resolvedAction.offline.resolvedDependencies)
  );
};

export const ensureResolvedAction = (
  optimisticAction: ApiAction,
  resolvedAction: OptionalResolvedApiAction | null
): OptionalResolvedApiAction => {
  if (resolvedAction === null) {
    return {
      ...optimisticAction,
      offline: {
        resolvedDependencies: optimisticAction.offline.dependencyPaths,
      },
    };
  }
  return resolvedAction;
};

export const ensureResolvedPaths = (
  optimisticAction: ApiAction,
  resolvedAction: OptionalResolvedApiAction
): ResolvedAction => {
  if (typeof resolvedAction.offline === 'undefined') {
    return {
      ...resolvedAction,
      offline: {
        resolvedDependencies: optimisticAction.offline.dependencyPaths,
      },
    };
  }
  return {
    ...resolvedAction,
    offline: {
      resolvedDependencies: resolvedAction.offline.resolvedDependencies,
    },
  };
};
