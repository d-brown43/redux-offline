import {AnyAction, Middleware, Store} from "redux";
import {ArrayAction, OfflineConfig, OfflineState} from "./types";

export type GetState = (store: Store) => OfflineState;

export type InternalConfig = {
  store: Store<any, ArrayAction | AnyAction>,
  optimisticStore: Store,
  config: OfflineConfig,
  getState: GetState,
}

export type OptimisticConfig = Pick<InternalConfig, 'store' | 'config' | 'getState'>;

export type CreateOptimisticMiddleware = (config: OptimisticConfig) => Middleware;