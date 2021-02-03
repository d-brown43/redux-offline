import { Action } from 'redux';

export type NetworkEffect = {};

export type OfflineEffects = {
  networkEffect: NetworkEffect;
};

export type OfflineAction = Action & {
  offline: OfflineEffects;
};

export type MaybeOfflineAction = Action & Partial<OfflineAction>;

export type OfflineState = {
  offlineQueue: {
    pendingActions: OfflineAction[];
  };
};


export type NetworkEffectHandler<Result> = (networkEffect: NetworkEffect) => Promise<Result>;
