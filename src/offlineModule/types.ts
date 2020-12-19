import {AnyAction, Dispatch} from "redux";

export type OfflineMetadata = {
  apiData?: any
}

export interface OfflineAction extends AnyAction {
  offline: OfflineMetadata
}

export type OfflineState = {
  queue: AnyAction[]
  isSyncing: boolean
  isRebuilding: boolean
}

export type DispatchFulfilledAction = (dispatch: Dispatch, optimisticAction: AnyAction, apiResponse: any) => void;

export type OfflineConfig = {
  selector: (state: any) => OfflineState
  dispatchFulfilledAction: DispatchFulfilledAction,
  makeApiRequest: (apiData: any) => Promise<any>;
}

export type GetOfflineState = () => OfflineState;
