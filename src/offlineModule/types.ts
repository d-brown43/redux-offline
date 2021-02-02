import { Action, AnyAction, Reducer, Store, StoreEnhancer } from 'redux';

type BaseMetadata = {
  isPassThrough?: boolean;
};

export type UniqueIdentifier = any;

export type ResourceIdentifier = {
  path: string;
  uniqueIdentifier: UniqueIdentifier;
};

export type Resource<V = any> = {
  uniqueIdentifier: UniqueIdentifier;
  value: V;
};

export type ResourcePaths = ResourceIdentifier | ResourceIdentifier[];

export type ApiActionMetadata = BaseMetadata & {
  apiData: any;
  dependencyPaths: ResourcePaths;
};

export type DependentActionMetadata = BaseMetadata & {
  dependsOn: ResourcePaths;
};

export type DependentApiActionMetadata = ApiActionMetadata &
  DependentActionMetadata;

export type ResolvedActionMetadata = BaseMetadata & {
  resolvedDependencies: ResourcePaths;
};

export type OfflineMetadata =
  | DependentActionMetadata
  | ApiActionMetadata
  | ResolvedActionMetadata;

export interface OfflineAction extends AnyAction {
  offline: OfflineMetadata;
}

export interface ResolvedAction extends OfflineAction {
  offline: ResolvedActionMetadata;
}

export type OptionalResolvedApiAction = AnyAction & {
  offline?: ResolvedActionMetadata;
};

export interface ApiAction extends OfflineAction {
  offline: ApiActionMetadata;
}

export interface DependentAction extends OfflineAction {
  offline: DependentActionMetadata;
}

export interface DependentApiAction extends OfflineAction {
  offline: DependentApiActionMetadata;
}

export type OfflineQueue = OfflineAction[];

export type OfflineState = {
  queue: OfflineQueue;
  isSyncing: boolean;
};

export type GetResolvedAction<T extends ApiAction = ApiAction> = (
  optimisticAction: T,
  apiResponse: any
) => OptionalResolvedApiAction | null;

export type GetRejectionAction = (
  optimisticAction: ApiAction,
  apiResponse: any
) => AnyAction | null;

export type OfflineConfig = {
  // The selector to retrieve the offline state - depends where
  // you place the "offlineReducer" in your app
  selector: (state: any) => OfflineState;
  // Function to get a single action that describes how
  // the original optimistic action gets mapped back to state, with any updated
  // data from your API.
  // TODO If you do not map to a ResolvedAction, the original optimistic
  // action will be used and no data will be updated in your optimistic store.
  getFulfilledAction: GetResolvedAction;
  // Optional utility function to map to an action when the request fails.
  // If an action is returned, this will be dispatched after the optimistic store
  // has been rebuilt. By default the ApiAction and any dependent actions
  // will be removed from the queue, meaning their optimistic changes get undone.
  // You may want to retry/perform other
  // changes based on the error such as displaying an error message
  getRollbackAction?: GetRejectionAction;
  // Function to make your api request based on any given api data
  // you provide to your ApiActions
  makeApiRequest: (apiData: any) => Promise<any>;
  // The root reducer you provide to your own store
  // Internally a second store containing the latest "source of truth"
  // (all resolved actions + your regular actions) is used for maintaining
  // the optimistic store
  rootReducer: Reducer;
  // Internally batching is enabled by default and added as a middleware
  // to your store, allowing arrays of actions to be dispatched. This is
  // to allow multiple actions to be replayed on your optimistic store
  // when it gets rebuilt, without notifying any store subscribers
  // until all the changes have been applied to state through your reducers.
  // Setting `useBatching` to false will disable batching, meaning your
  // subscribers will be notified of all updates as your store gets rebuilt
  useBatching?: boolean;
};

type Configured = {
  run: (store: Store) => void;
  storeEnhancer: StoreEnhancer;
  store: Store;
};

export type Configure = (config: OfflineConfig) => Configured;

// This is a bit of a type hack to satisfy the redux store type constraint
// It expects singular actions, and can't be overridden to accept arrays of actions
// (we're using a redux batch middleware)
// So instead make an interface that has an undefined "type" field assigned to
// the array of actions, and use a utility to create the array with type field
export interface ArrayAction extends Array<AnyAction>, Action<undefined> {}

export type ResolvedActionChanges = {
  original: OfflineAction;
  updated: OfflineAction;
}[];
