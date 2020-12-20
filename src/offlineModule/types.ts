import {AnyAction, Middleware, Reducer, Store} from "redux";

export interface ApiResourceMetadata {
  dependencyPath: string
}

export interface ApiEntity extends ApiResourceMetadata {
  apiData: any
}

export interface DependsOn {
  dependsOn: string
}

export type OfflineMetadata = DependsOn | ApiResourceMetadata;

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

export type OfflineConfig = {
  selector: (state: any) => OfflineState
  getFulfilledAction: GetFulfilledAction;
  makeApiRequest: (apiData: any) => Promise<any>;
  rootReducer: Reducer,
}

type Configured = {
  run: (store: Store) => void,
  optimisticMiddleware: Middleware,
  store: Store
};

export type Configure = (config: OfflineConfig) => Configured;
