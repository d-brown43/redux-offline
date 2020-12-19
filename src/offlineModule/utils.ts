import {AnyAction} from "redux";
import {ApiAction, ApiDependency, OfflineAction} from "./types";

export const isOfflineAction = (action: AnyAction): action is OfflineAction => 'offline' in action;

export const actionHasSideEffect = (action: OfflineAction): action is ApiAction => {
  return 'apiData' in action.offline;
};

export const actionDependsOn = (action: OfflineAction): action is ApiDependency => {
  return 'dependsOn' in action.offline;
};
