import {AnyAction} from "redux";
import {OfflineAction} from "./types";

export const isOfflineAction = (action: AnyAction): action is OfflineAction => {
  return typeof (action as OfflineAction).offline !== 'undefined';
};
