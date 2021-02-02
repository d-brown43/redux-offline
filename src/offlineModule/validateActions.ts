import { AnyAction } from 'redux';
import _ from 'lodash';
import {
  isApiAction,
  getDependencyResourceIdentifiers,
  getRemoteResourceIdentifiers,
  isDependentAction,
  isOfflineAction,
  isResolvedAction,
  isMatchingResourceIdentifiers,
} from './utils';
import {
  ApiAction,
  DependentAction,
  OfflineAction,
  ResolvedAction,
  ResourceIdentifier,
  ResourcePaths,
} from './types';

export const reportError = (error: string) => {
  console.error(error);
  throw new Error(error);
};

const errorNoPathExists = (
  action: AnyAction,
  reason: string,
  identifier: ResourceIdentifier
) => {
  return `Action type "${action.type}" ${reason},
path was specified as "${identifier.path}",
but no such field exists on action: ${JSON.stringify(action, null, 2)}`;
};

const validateResolvedIdentifiers = (action: ResolvedAction) => {
  const checkResourceIdentifier = (identifier: ResourceIdentifier) => {
    if (!_.has(action, identifier.path)) {
      reportError(
        errorNoPathExists(
          action,
          'has invalid resolved path metadata',
          identifier
        )
      );
    }
  };

  const resolvedDependencies = action.offline.resolvedDependencies;
  if (!Array.isArray(resolvedDependencies)) {
    checkResourceIdentifier(resolvedDependencies);
  } else {
    resolvedDependencies.forEach((dependency) => {
      checkResourceIdentifier(dependency);
    });
  }
};

const validateDependentAction = (action: DependentAction) => {
  getDependencyResourceIdentifiers(action).forEach((identifier) => {
    if (!_.has(action, identifier.path)) {
      reportError(
        errorNoPathExists(action, 'has invalid dependency metadata', identifier)
      );
    }
  });
};

const validateSideEffectAction = (action: ApiAction) => {
  getRemoteResourceIdentifiers(action).forEach((identifier) => {
    if (!_.has(action, identifier.path)) {
      reportError(
        errorNoPathExists(action, 'has invalid dependency path', identifier)
      );
    }
  });
};

export const errorNotFulfilledAction = (action: AnyAction) => {
  return `Expecting a resolved action or null to be returned by getFulfilledAction, got: ${JSON.stringify(
    action,
    null,
    2
  )}
A resolved action is an action with a \`resolvedDependencies\` attribute for the offline metadata and no other properties`;
};

export const errorMismatchedResourceIdentifiers = (
  optimisticIdentifiers: ResourcePaths,
  resolvedIdentifiers: ResourcePaths
) => {
  return `Resource identifiers did not match between optimistic and resolved actions
Optimistic identifiers: ${JSON.stringify(optimisticIdentifiers, null, 2)}
Resolved identifiers: ${JSON.stringify(resolvedIdentifiers, null, 2)}`;
};

export const validateResourceIdentifiersOnAction = (action: AnyAction) => {
  if (!isOfflineAction(action)) return;
  if (isResolvedAction(action)) return validateResolvedIdentifiers(action);
  if (isDependentAction(action)) return validateDependentAction(action);
  if (isApiAction(action)) return validateSideEffectAction(action);
};

export const verifyResolvedAction = (
  optimisticAction: ApiAction,
  resolvedAction: OfflineAction
): resolvedAction is ResolvedAction => {
  if (!isResolvedAction(resolvedAction)) {
    return reportError(errorNotFulfilledAction(resolvedAction));
  }
  if (!isMatchingResourceIdentifiers(optimisticAction, resolvedAction)) {
    return reportError(
      errorMismatchedResourceIdentifiers(
        optimisticAction.offline.dependencyPaths,
        resolvedAction.offline.resolvedDependencies
      )
    );
  }
  return true;
};
