import { Action, Store } from 'redux';
import { DELETE_PENDING_ACTION } from './utils';
import DependencyGraph from './DependencyGraph';

export type NetworkDetector = (
  offlineHandler: (isOnline: boolean) => void
) => void;

// TODO Use generics to provide type safety on network effects
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

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type OfflineQueueRuntimeConfig<ST, ActionTypes extends Action> = {
  mapDependentAction: MapDependentAction<ActionTypes>;
  networkEffectHandler: NetworkEffectHandler;
  store: StoreType<ST>;
  networkDetector: NetworkDetector;
};

export type OfflineQueueRuntimeConfigInput<
  ST,
  ActionTypes extends Action
> = XOR<
  { dependencyGraph: DependencyGraph<ActionTypes> },
  { mapDependentAction: MapDependentAction<ActionTypes> }
> &
  Optional<
    Omit<
      OfflineQueueRuntimeConfig<ST, ActionTypes>,
      'dependencyGraph' | 'mapDependentAction'
    >,
    'networkDetector'
  >;

export type Dependency<ActionTypes extends Action = Action> = {
  type: ActionTypes['type'];
  dependsOn: <A extends ActionTypes, B extends ActionTypes>(
    action: A,
    pendingAction: B
  ) => boolean;
  updateDependency: MapDependentAction<ActionTypes>;
};

export type Node<
  ActionTypes extends Action = Action,
  T extends ActionTypes['type'] = string
> = {
  type: T;
  dependencies: Dependency<ActionTypes>[];
};
