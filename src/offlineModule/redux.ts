import { AnyAction, Reducer } from "redux";
import { OfflineAction, OfflineState } from "./types";
import { isOfflineAction, isPassThrough } from "./utils";

const initialState: OfflineState = {
  queue: [],
  isSyncing: false,
};

const OFFLINE_MODULE_INIT_STATE = "OFFLINE_MODULE_INIT_STATE";
const SET_IS_SYNCING = "SET_IS_SYNCING";
const MARK_ACTION_AS_PROCESSED = "MARK_ACTION_AS_PROCESSED";
export const REPLACE_OFFLINE_STATE = "REPLACE_OFFLINE_STATE";
const OFFLINE_QUEUE_REPLACE_ROOT_STATE = "OFFLINE_QUEUE_REPLACE_ROOT_STATE";
const REPLACE_ACTION_IN_QUEUE = "REPLACE_ACTION_IN_QUEUE";
const REMOVE_ACTIONS_IN_QUEUE = "REMOVE_ACTIONS_IN_QUEUE";

export const offlineActions = {
  [OFFLINE_MODULE_INIT_STATE]: true,
  [SET_IS_SYNCING]: true,
  [MARK_ACTION_AS_PROCESSED]: true,
  [REPLACE_OFFLINE_STATE]: true,
  [OFFLINE_QUEUE_REPLACE_ROOT_STATE]: true,
  [REPLACE_ACTION_IN_QUEUE]: true,
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
    return rootReducer(state, action);
  };
};

export const reducer = (state = initialState, action: AnyAction) => {
  if (isOfflineAction(action) && !isPassThrough(action)) {
    return {
      ...state,
      queue: [...state.queue, action],
    };
  }
  switch (action.type) {
    case MARK_ACTION_AS_PROCESSED:
      return {
        ...state,
        queue: state.queue.filter((a) => a !== action.payload),
      };
    case SET_IS_SYNCING:
      return {
        ...state,
        isSyncing: action.payload,
      };
    case REPLACE_OFFLINE_STATE:
      return action.payload;
    case REPLACE_ACTION_IN_QUEUE: {
      const queue = [...state.queue];
      queue[action.payload.index] = action.payload.action;
      return {
        ...state,
        queue,
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

export const markActionAsProcessed = (action: OfflineAction) => ({
  type: MARK_ACTION_AS_PROCESSED,
  payload: action,
});

export const replaceOfflineState = (state: OfflineState) => ({
  type: REPLACE_OFFLINE_STATE,
  payload: state,
});

export const replaceRootState = (state: any) => ({
  type: OFFLINE_QUEUE_REPLACE_ROOT_STATE,
  payload: state,
});

export const replaceActionInQueue = (index: number, action: OfflineAction) => ({
  type: REPLACE_ACTION_IN_QUEUE,
  payload: {
    index,
    action,
  },
});

export const removeActionsInQueue = (actions: OfflineAction[]) => ({
  type: REMOVE_ACTIONS_IN_QUEUE,
  payload: actions,
});
