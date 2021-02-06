import { Action, AnyAction, Store } from 'redux';
import {DELETE_PENDING_ACTION} from "./utils";

export type NetworkEffect = {};

export type OfflineEffects = {
  networkEffect?: NetworkEffect;
  dependent?: true;
};

export type OfflineAction = Action & {
  [k: string]: any;
  offline: OfflineEffects;
};

export type DataOfflineAction<T> = OfflineAction & {
  payload: T;
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
) => Promise<Action | void | null>;

export type StoreType<ST> = Store<ST, MaybeOfflineAction>;

export type MapDependentAction = (
  originalAction: OfflineAction,
  fulfilledAction: AnyAction,
  pendingAction: OfflineAction
) => OfflineAction | null | typeof DELETE_PENDING_ACTION;

export type OfflineQueueRuntimeConfig<ST> = {
  networkEffectHandler: NetworkEffectHandler;
  mapDependentAction: MapDependentAction;
  store: StoreType<ST>;
};
