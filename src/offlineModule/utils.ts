import {AnyAction} from "redux";
import {ApiAction, ApiDependentAction, ApiResourceAction, OfflineAction} from "./types";

export const isOfflineAction = (action: AnyAction): action is OfflineAction => 'offline' in action;

export const actionHasSideEffect = (action: OfflineAction): action is ApiAction => {
  return isOfflineAction(action) && 'apiData' in action.offline;
};

export const isDependentAction = (action: OfflineAction): action is ApiDependentAction => {
  return isOfflineAction(action) && 'dependsOn' in action.offline;
};

export const isResolvedAction = (action: AnyAction): action is ApiResourceAction => {
  return isOfflineAction(action) && !actionHasSideEffect(action) && 'resolvedPaths' in action.offline;
};

export const isPassThrough = (action: AnyAction) => {
  return isOfflineAction(action) && Boolean(action.offline.isPassThrough);
};
