import {Action, Store} from 'redux';

export type NetworkEffect = {};

export type OfflineEffects = {
  networkEffect: NetworkEffect;
  commitAction: Action;
  rollbackAction?: Action;
};

export type OfflineAction = Action & {
  [k: string]: any;
  offline: OfflineEffects;
};

export type RollbackRequiredAction = OfflineAction & {
  offline: Required<OfflineEffects>;
};

export type MaybeOfflineAction = Action & Partial<OfflineAction>

export type OfflineState = {
  isOnline: boolean;
  offlineQueue: {
    pendingActions: OfflineAction[];
  };
};

export type RootState = {
  offline: OfflineState;
};

export type NetworkEffectHandler = <Result>(networkEffect: NetworkEffect) => Promise<Result>;

export type QueueProcessorConfig<StoreType> = {
  networkEffectHandler: NetworkEffectHandler;
  store: Store<StoreType, MaybeOfflineAction>;
};
