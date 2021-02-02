import { AnyAction, Reducer } from 'redux';
import { OfflineAction, OfflineState, ResolvedActionChanges } from './types';
import { isOfflineAction, isPassThrough } from './utils';
import { validateResourceIdentifiersOnAction } from './validateActions';

const initialState: OfflineState = {
  queue: [],
  isSyncing: false,
};

export const getQueue = (offlineState: OfflineState) => offlineState.queue;
export const getIsSyncing = (offlineState: OfflineState) => offlineState.isSyncing;

const prefix = '@@offline-queue/';

const OFFLINE_MODULE_INIT_STATE = `${prefix}OFFLINE_MODULE_INIT_STATE`;
const SET_IS_SYNCING = `${prefix}SET_IS_SYNCING`;
export const REPLACE_OFFLINE_STATE = `${prefix}REPLACE_OFFLINE_STATE`;
const OFFLINE_QUEUE_REPLACE_ROOT_STATE = `${prefix}OFFLINE_QUEUE_REPLACE_ROOT_STATE`;
const REPLACE_ACTIONS_IN_QUEUE = `${prefix}REPLACE_ACTIONS_IN_QUEUE`;
const REMOVE_ACTIONS_IN_QUEUE = `${prefix}REMOVE_ACTIONS_IN_QUEUE`;

export const offlineActions = {
  [OFFLINE_MODULE_INIT_STATE]: true,
  [SET_IS_SYNCING]: true,
  [REPLACE_OFFLINE_STATE]: true,
  [OFFLINE_QUEUE_REPLACE_ROOT_STATE]: true,
  [REPLACE_ACTIONS_IN_QUEUE]: true,
  [REMOVE_ACTIONS_IN_QUEUE]: true,
};

export const isInternalOfflineAction = (action: AnyAction) =>
  action.type in offlineActions;

const getInitialState = (rootReducer: Reducer) => {
  return rootReducer(undefined, {
    type: OFFLINE_MODULE_INIT_STATE,
  });
};

export const createRootReducer = (rootReducer: Reducer) => {
  const initialState = getInitialState(rootReducer);
  return (state: any = initialState, action: AnyAction) => {
    if (action.type === OFFLINE_QUEUE_REPLACE_ROOT_STATE) {
      return action.payload;
    }
    if (process.env.NODE_ENV === 'development' && isOfflineAction(action)) {
      validateResourceIdentifiersOnAction(action);
    }
    return rootReducer(state, action);
  };
};

const createUpdateMap = (changes: ResolvedActionChanges) => {
  return changes.reduce((acc, { original, updated }) => {
    return acc.set(original, updated);
  }, new Map());
};

export const reducer = (state = initialState, action: AnyAction) => {
  if (isOfflineAction(action) && !isPassThrough(action)) {
    return {
      ...state,
      queue: [...state.queue, action],
    };
  }
  switch (action.type) {
    case SET_IS_SYNCING:
      return {
        ...state,
        isSyncing: action.payload,
      };
    case REPLACE_OFFLINE_STATE:
      return action.payload;
    case REPLACE_ACTIONS_IN_QUEUE: {
      const updates = createUpdateMap(action.payload);
      const queue = [...state.queue];
      return {
        ...state,
        queue: queue.reduce<OfflineAction[]>((acc, action) => {
          if (updates.has(action)) {
            return [...acc, updates.get(action)];
          }
          return acc.concat([action]);
        }, []),
      };
    }
    case REMOVE_ACTIONS_IN_QUEUE: {
      return {
        ...state,
        queue: state.queue.filter((a) => !action.payload.includes(a)),
      };
    }
    default:
      return state;
  }
};

export default reducer;

export const setIsSyncing = (isSyncing: boolean) => ({
  type: SET_IS_SYNCING,
  payload: isSyncing,
});

export const replaceOfflineState = (state: OfflineState) => ({
  type: REPLACE_OFFLINE_STATE,
  payload: state,
});

export const replaceRootState = (state: any) => ({
  type: OFFLINE_QUEUE_REPLACE_ROOT_STATE,
  payload: state,
});

export const replaceActionsInQueue = (changes: ResolvedActionChanges) => ({
  type: REPLACE_ACTIONS_IN_QUEUE,
  payload: changes,
});

export const removeActionsInQueue = (actions: OfflineAction[]) => ({
  type: REMOVE_ACTIONS_IN_QUEUE,
  payload: actions,
});
