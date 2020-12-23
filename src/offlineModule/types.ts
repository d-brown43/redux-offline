import {Action, AnyAction, Reducer, Store, StoreEnhancer} from "redux";

type BaseMetadata = {
  isPassThrough?: boolean
}

export type ResourceIdentifier<T extends string = any> = {
  path: string
  type: T
}

export type Resource<T = any, V = any> = {
  type: T,
  value: V
}

export type ApiResourceMetadata = BaseMetadata & {
  dependencyPaths: ResourceIdentifier | ResourceIdentifier[]
}

export type ApiEntityMetadata = BaseMetadata & ApiResourceMetadata & {
  apiData: any
}

export type DependsOnMetadata = BaseMetadata & {
  dependsOn: ResourceIdentifier | ResourceIdentifier[]
}

export type ResolvedDependencies = ResourceIdentifier[] | ResourceIdentifier;

export type ResolvedEntityMetadata = BaseMetadata & {
  resolvedDependencies: ResolvedDependencies
}

export type OfflineMetadata = DependsOnMetadata | ApiEntityMetadata | ApiResourceMetadata | ResolvedEntityMetadata;

export interface OfflineAction extends AnyAction {
  offline: OfflineMetadata
}

export interface ApiResourceAction extends OfflineAction {
  offline: ApiResourceMetadata
}

export interface ResolvedApiEntityAction extends OfflineAction {
  offline: ResolvedEntityMetadata
}

export interface ApiAction extends OfflineAction {
  offline: ApiEntityMetadata
}

export interface ApiDependentAction extends OfflineAction {
  offline: DependsOnMetadata
}

export type OfflineState = {
  queue: OfflineAction[]
  isSyncing: boolean
}

export type GetFulfilledAction = (optimisticAction: ApiAction, apiResponse: any) => ResolvedApiEntityAction | null;
export type GetRollbackAction = (optimisticAction: ApiAction, apiResponse: any) => AnyAction | null;

export type OfflineConfig = {
  selector: (state: any) => OfflineState
  getFulfilledAction: GetFulfilledAction;
  getRollbackAction: GetRollbackAction;
  makeApiRequest: (apiData: any) => Promise<any>;
  rootReducer: Reducer,
  useBatching?: boolean
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
