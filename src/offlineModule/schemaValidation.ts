import {AnyAction} from "redux";
import _ from 'lodash';
import {isOfflineAction, isResolvedAction} from "./utils";
import {ResolvedApiEntityAction, ResourceIdentifier} from "./types";

const reportError = (error: string) => {
  console.error(error);
  throw new Error(error);
};

const validateResolvedIdentifiers = (action: ResolvedApiEntityAction) => {
  const checkResourceIdentifier = (identifier: ResourceIdentifier) => {
    if (!_.has(action, identifier.path)) {
      const error = `Action type "${action.type}" has invalid resolved path metadata,
path was specified as "${identifier.path}",
but no such field exists on action: ${JSON.stringify(action, null, 2)}`;
      reportError(error);
    }
  };

  const resolvedDependencies = action.offline.resolvedDependencies;
  if (!Array.isArray(resolvedDependencies)) {
    checkResourceIdentifier(resolvedDependencies);
  } else {
    resolvedDependencies.forEach(dependency => {
      if (Array.isArray(dependency)) {
        // Check the resolved value only
        checkResourceIdentifier(dependency[1]);
      } else {
        checkResourceIdentifier(dependency);
      }
    });
  }
};

export const validateResourceIdentifiersOnAction = (action: AnyAction) => {
  if (!isOfflineAction(action)) return;
  if (isResolvedAction(action)) return validateResolvedIdentifiers(action);
};
