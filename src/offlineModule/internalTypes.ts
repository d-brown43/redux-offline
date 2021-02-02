import { AnyAction, Middleware, Store } from 'redux';
import { ArrayAction, OfflineConfig, OfflineState } from './types';

export type GetState = (store: Store) => OfflineState;

export type InternalConfig = {
  store: Store<any, ArrayAction | AnyAction>;
  optimisticStore: Store;
  config: OfflineConfig;
  getState: GetState;
};

export type OptimisticConfig = Omit<
  InternalConfig,
  'optimisticStore'
>;

export type RealStoreConfig = Pick<InternalConfig, 'config'>;

export type ConfigureMiddleware<T extends Partial<InternalConfig>> = (
  config: T
) => Middleware;
