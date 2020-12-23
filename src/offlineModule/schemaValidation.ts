import { AnyAction } from "redux";
import _ from "lodash";
import {
  isApiAction,
  getDependencyResourceIdentifiers,
  getRemoteResourceIdentifiers,
  isDependentAction,
  isOfflineAction,
  isResolvedAction,
} from "./utils";
import {
  ApiAction,
  ApiDependentAction,
  ResolvedApiEntityAction,
  ResourceIdentifier,
} from "./types";

const reportError = (error: string) => {
  console.error(error);
  throw new Error(error);
};

const generateError = (
  action: AnyAction,
  reason: string,
  identifier: ResourceIdentifier
) => {
  return `Action type "${action.type}" ${reason},
path was specified as "${identifier.path}",
but no such field exists on action: ${JSON.stringify(action, null, 2)}`;
};

const validateResolvedIdentifiers = (action: ResolvedApiEntityAction) => {
  const checkResourceIdentifier = (identifier: ResourceIdentifier) => {
    if (!_.has(action, identifier.path)) {
      reportError(
        generateError(action, "has invalid resolved path metadata", identifier)
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

const validateDependentAction = (action: ApiDependentAction) => {
  getDependencyResourceIdentifiers(action).forEach((identifier) => {
    if (!_.has(action, identifier.path)) {
      reportError(
        generateError(action, "has invalid dependency metadata", identifier)
      );
    }
  });
};

const validateSideEffectAction = (action: ApiAction) => {
  getRemoteResourceIdentifiers(action).forEach((identifier) => {
    if (!_.has(action, identifier.path)) {
      reportError(
        generateError(action, "has invalid dependency path", identifier)
      );
    }
  });
};

export const validateResourceIdentifiersOnAction = (action: AnyAction) => {
  if (!isOfflineAction(action)) return;
  if (isResolvedAction(action)) return validateResolvedIdentifiers(action);
  if (isDependentAction(action)) return validateDependentAction(action);
  if (isApiAction(action)) return validateSideEffectAction(action);
};
