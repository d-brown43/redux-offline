import {Action, AnyAction, Reducer, Store, StoreEnhancer} from "redux";

type BaseMetadata = {
  isPassThrough?: boolean
}

export type ApiResourceMetadata = BaseMetadata & {
  dependencyPaths: string | string[]
}

export type ApiEntity = BaseMetadata & ApiResourceMetadata & {
  apiData: any
}

export type DependsOn = BaseMetadata & {
  dependsOn: string | string[]
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
}

export type GetFulfilledAction = (optimisticAction: ApiAction, apiResponse: any) => ApiResourceAction | null;
export type GetRollbackAction = (optimisticAction: ApiAction, apiResponse: any) => AnyAction | null;

export type OfflineConfig = {
  selector: (state: any) => OfflineState
  getFulfilledAction: GetFulfilledAction;
  getRollbackAction: GetRollbackAction;
  makeApiRequest: (apiData: any) => Promise<any>;
  rootReducer: Reducer,
}

type Configured = {
  run: (store: Store) => void,
  storeEnhancer: StoreEnhancer,
  store: Store
};

export type Configure = (config: OfflineConfig) => Configured;

// This is a bit of a type hack to satisfy the redux store type constraint
// It expects singular actions, and can't be overridden to accept arrays of actions
// (we're using a redux batch middleware)
// So instead make an interface that has an undefined "type" field assigned to
// the array of actions, and use a utility to create the array with type field
export interface ArrayAction extends Array<AnyAction>, Action<undefined> {
}
