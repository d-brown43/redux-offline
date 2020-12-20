import {AnyAction} from "redux";
import {ApiAction, ApiDependentAction, OfflineAction} from "./types";

export const isOfflineAction = (action: AnyAction): action is OfflineAction => 'offline' in action;

export const actionHasSideEffect = (action: OfflineAction): action is ApiAction => {
  return isOfflineAction(action) && 'apiData' in action.offline;
};

export const isDependentAction = (action: OfflineAction): action is ApiDependentAction => {
  return isOfflineAction(action) && 'dependsOn' in action.offline;
};
