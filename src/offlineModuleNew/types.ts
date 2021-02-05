import { Action, Store } from 'redux';

export type NetworkEffect = {};

export type OfflineEffects = {
  networkEffect: NetworkEffect;
};

export type OfflineAction = Action & {
  [k: string]: any;
  offline: OfflineEffects;
};

export type MaybeOfflineAction = Action & Partial<OfflineAction>;

export type OfflineState = {
  isOnline: boolean;
  offlineQueue: {
    isProcessing: boolean;
    pendingActions: OfflineAction[];
  };
  realState: any;
};

export type RootState = {
  [k: string]: any;
  offline: OfflineState;
};

export type NetworkEffectHandler = (
  offlineAction: OfflineAction
) => Promise<Action>;

export type StoreType<ST> = Store<ST, MaybeOfflineAction>;

export type OfflineQueueRuntimeConfig<ST> = {
  networkEffectHandler: NetworkEffectHandler;
  store: StoreType<ST>;
};
