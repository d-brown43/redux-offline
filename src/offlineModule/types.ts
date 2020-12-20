import {AnyAction, Dispatch} from "redux";

export interface ApiResourceMetadata {
  dependencyPath: string
}

export interface ApiEntity extends ApiResourceMetadata {
  apiData: any
}

export interface DependsOn {
  dependsOn: string
}

export type OfflineMetadata = DependsOn | ApiEntity | ApiResourceMetadata;

export interface OfflineAction extends AnyAction {
  offline: OfflineMetadata
}

export interface ApiResourceAction extends OfflineAction {
  offline: ApiResourceMetadata
}

export interface ApiAction extends OfflineAction {
  offline: ApiEntity
}

export interface ApiDependentAction extends OfflineAction {
  offline: DependsOn
}

export type OfflineState = {
  queue: OfflineAction[]
  isSyncing: boolean
  isRebuilding: boolean
}

export type GetFulfilledAction = (optimisticAction: ApiAction, apiResponse: any) => ApiResourceAction | null;
export type OptimisticPassthrough = (dispatch: Dispatch, optimisticAction: AnyAction) => void;

export type OfflineConfig = {
  selector: (state: any) => OfflineState
  getFulfilledAction: GetFulfilledAction;
  optimisticPassthrough: OptimisticPassthrough,
  makeApiRequest: (apiData: any) => Promise<any>;
}

export type GetOfflineState = () => OfflineState;
