import {AnyAction, Dispatch} from "redux";

type ApiEntity = {
  apiData: any
  dependencyPath: string
}

type DependsOn = {
  dependsOn: any
}

export type OfflineMetadata = DependsOn | ApiEntity;

export interface OfflineAction extends AnyAction {
  offline: OfflineMetadata
}

export interface ApiAction extends OfflineAction { offline: ApiEntity }
export interface ApiDependency extends OfflineAction { offline: DependsOn }

export type OfflineState = {
  queue: ApiAction[]
  processed: { action: ApiAction, response: any }[]
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
