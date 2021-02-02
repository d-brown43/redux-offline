import {
  ApiAction,
  DependentAction,
  OfflineAction,
  ResolvedAction,
  ResolvedActionChanges,
  ResourceIdentifier,
  ResourcePaths,
} from './types';
import { InternalConfig } from './internalTypes';
import {
  actionDependsOn,
  getDependencyResourceIdentifiers,
  getRemoteResourceIdentifiers,
  getSingularResource,
  isApiAction,
  isDependentAction,
  isResourcesIdentifiersEqual,
} from './utils';
import _ from 'lodash';
import { getQueue } from './redux';

// Gets all dependencies of the given optimisticAction, including transitive dependencies
// E.g. Given ApiAction A, if DependentApiAction B depends on A, and DependentAction C depends on B,
// will return [A, B, C]
export const getExpandedDependentActions = (
  queue: OfflineAction[],
  internalConfig: InternalConfig,
  optimisticAction: OfflineAction
): OfflineAction[] => {
  if (!isApiAction(optimisticAction)) {
    return [optimisticAction];
  }
  return queue.reduce<OfflineAction[]>(
    (acc, action, i) => {
      if (
        isDependentAction(action) &&
        !acc.includes(action) &&
        actionDependsOn(optimisticAction, action)
      ) {
        return acc.concat(
          getExpandedDependentActions(
            queue.slice(i + 1),
            internalConfig,
            action
          )
        );
      }
      return acc;
    },
    [optimisticAction]
  );
};

const getResolvedResourceIdentifier = (
  optimisticIdentifier: ResourceIdentifier,
  resolvedIdentifiers: ResourcePaths
) => {
  const getErrorMessage = () => {
    return `Unable to find matching resource path`;
  };

  if (!Array.isArray(resolvedIdentifiers)) {
    if (
      !isResourcesIdentifiersEqual(optimisticIdentifier)(resolvedIdentifiers)
    ) {
      throw new Error(getErrorMessage());
    }
    return resolvedIdentifiers;
  }
  const result = resolvedIdentifiers.find(
    isResourcesIdentifiersEqual(optimisticIdentifier)
  );
  if (!result) {
    throw new Error(getErrorMessage());
  }
  return result;
};

export const updateDependencies = (
  action: DependentAction,
  optimisticAction: ApiAction,
  resolvedAction: ResolvedAction
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
      isResourcesIdentifiersEqual(currentResourceIdentifier)
    );
    if (!optimisticResourceIdentifier) {
      throw new Error(
        `Could not find matching resource, no matching identifier for: ${currentResourceIdentifier.uniqueIdentifier}`
      );
    }
    const resolvedIdentifier = getResolvedResourceIdentifier(
      optimisticResourceIdentifier,
      resolvedAction.offline.resolvedDependencies
    );
    return getSingularResource(resolvedAction, resolvedIdentifier.path);
  };

  return dependencyResourceIdentifiers.reduce((acc, identifier) => {
    // Create new object updating only the object(s) along the path
    return _.setWith(
      _.clone(acc),
      identifier.path,
      getUpdatedResource(identifier),
      _.clone
    );
  }, action);
};

export const getUpdatedDependentActions = (
  internalConfig: InternalConfig,
  optimisticAction: ApiAction,
  fulfilledAction: ResolvedAction
): ResolvedActionChanges => {
  const { getState, optimisticStore } = internalConfig;
  const queue: OfflineAction[] = getQueue(getState(optimisticStore));

  return queue.reduce<ResolvedActionChanges>((acc, action, index) => {
    if (
      isDependentAction(action) &&
      actionDependsOn(optimisticAction, action)
    ) {
      // Check if the optimistic action is the last one the dependent action
      // could depend on.
      // Find all actions the dependent action could depend on,
      const possibleOptimisticActions = queue.filter((a, i) => {
        if (i < index) {
          return isApiAction(a) && actionDependsOn(a, action);
        }
        return false;
      });
      // If it's the last optimistic action the dependent action could depend on...
      if (
        optimisticAction ===
        possibleOptimisticActions[possibleOptimisticActions.length - 1]
      ) {
        return acc.concat([
          {
            original: action,
            updated: updateDependencies(
              action,
              optimisticAction,
              fulfilledAction
            ),
          },
        ]);
      }
    }
    return acc;
  }, []);
};

type PathType = 'array' | 'object';
type Visitor = (value: any, depth: number, accPath: PathType[]) => any;

const visitObject = <R>(path: string[], object: any, visitor: Visitor): R => {
  const doVisit = (
    path: string[],
    object: any,
    visitor: Visitor,
    accPath: PathType[],
    depth: number
  ): any => {
    if (path.length === 0) return visitor(object, depth, accPath);
    if (Array.isArray(object)) {
      return object.flatMap((p) =>
        doVisit(path, p, visitor, accPath.concat(['array']), depth + 1)
      );
    }
    if (typeof object === 'object' && path[0] in object) {
      return doVisit(
        path.slice(1),
        object[path[0]],
        visitor,
        accPath.concat(['object']),
        depth + 1
      );
    }
    return visitor(undefined, depth, accPath);
  };

  return doVisit(path, object, visitor, [], 0);
};

const pathsToField = (path: string[], object: any): PathType[][] => {
  return visitObject(path, object, (value, depth, accPath) => {
    return [accPath];
  });
};

const getParts = (path: string): string[] => path.split(/\./g);

const isBalanced = (path: string[], object: any) => {
  const paths = pathsToField(path, object);
  return paths.every((path) => {
    return path.every((type, i) => {
      return type === paths[0][i];
    });
  });
};

export const resolvePath = <R>(path: string, object: any): R | undefined => {
  const parts = getParts(path);

  if (!isBalanced(parts, object)) {
    return undefined;
  }

  return visitObject(parts, object, (value) => {
    return value;
  });
};

export const has = (path: string, object: any): boolean => {
  return typeof resolvePath(path, object) !== 'undefined';
};

export const updateValuesIn = (path: string, object: any, values: any[]) => {
  const parts = getParts(path);

  const doUpdate = (path: string[], rest: any, values: any[]): any => {
    if (path.length === 0) {
      const value = values[0];
      values.splice(0, 1);
      return value;
    }
    if (Array.isArray(rest)) {
      return rest.map((s) => doUpdate(path, s, values));
    }
    if (typeof rest === 'object' && path[0] in rest) {
      return {
        ...rest,
        [path[0]]: doUpdate(path.slice(1), rest[path[0]], values),
      };
    }
    return undefined;
  };

  if (!isBalanced(parts, object)) {
    return undefined;
  }

  if (
    visitObject<any[]>(parts, object, () => [null]).length !== values.length
  ) {
    return undefined;
  }

  return doUpdate(parts, object, values);
};
