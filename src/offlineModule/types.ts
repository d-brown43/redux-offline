import { Action, Store } from 'redux';
import { DELETE_PENDING_ACTION } from './utils';
import { DependencyGraph } from './dependencyGraph';

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

export type MapDependentActionFunction<ActionTypes> = (
  originalAction: ActionTypes,
  fulfilledAction: ActionTypes,
  pendingAction: ActionTypes
) => ActionTypes | null | typeof DELETE_PENDING_ACTION;

export type MapDependentAction<ActionTypes> =
  | typeof DELETE_PENDING_ACTION
  | MapDependentActionFunction<ActionTypes>;

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = T | U extends object
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

export type OfflineQueueRuntimeConfigInput<
  ST,
  ActionTypes extends Action
> = XOR<
  { dependencyGraph: DependencyGraph<ActionTypes> },
  { mapDependentAction: MapDependentAction<ActionTypes> }
> & {
  networkEffectHandler: NetworkEffectHandler;
  store: StoreType<ST>;
};

export type OfflineQueueRuntimeConfig<ST, ActionTypes extends Action> = {
  mapDependentAction: MapDependentAction<ActionTypes>;
  networkEffectHandler: NetworkEffectHandler;
  store: StoreType<ST>;
};
