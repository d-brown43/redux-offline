import {AnyAction, Reducer} from "redux";
import {OfflineAction, OfflineState} from "./types";
import {isOfflineAction} from "./utils";

const initialState: OfflineState = {
  queue: [],
  isSyncing: false,
  isRebuilding: false,
};

const SET_IS_SYNCING = 'SET_IS_SYNCING';
const MARK_ACTION_AS_PROCESSED = 'MARK_ACTION_AS_PROCESSED';
const REPLACE_OFFLINE_STATE = 'REPLACE_OFFLINE_STATE';
const OFFLINE_QUEUE_REPLACE_ROOT_STATE = 'OFFLINE_QUEUE_REPLACE_ROOT_STATE';
const SET_IS_REBUILDING = 'SET_IS_REBUILDING';
const REPLACE_ACTION_IN_QUEUE = 'REPLACE_ACTION_IN_QUEUE';

export const offlineActions = {
  SET_IS_SYNCING: true,
  MARK_ACTION_AS_PROCESSED: true,
  REPLACE_OFFLINE_STATE: true,
  OFFLINE_QUEUE_REPLACE_ROOT_STATE: true,
  SET_IS_REBUILDING: true,
  REPLACE_ACTION_IN_QUEUE: true,
};

export const createRootReducer = (rootReducer: Reducer) => (state: any, action: AnyAction) => {
  let nextState = state;
  if (action.type === OFFLINE_QUEUE_REPLACE_ROOT_STATE) {
    nextState = action.payload;
  }
  return rootReducer(nextState, action);
};

export const reducer = (state = initialState, action: AnyAction) => {
  if (action.type === MARK_ACTION_AS_PROCESSED) {
    return {
      ...state,
      queue: state.queue.filter(a => a !== action.payload.action),
    };
  }
  if (isOfflineAction(action)) {
    return {
      ...state,
      queue: [
        ...state.queue,
        action,
      ]
    }
  }
  switch (action.type) {
    case SET_IS_SYNCING:
      return {
        ...state,
        isSyncing: action.payload,
      };
    case REPLACE_OFFLINE_STATE:
      return action.payload;
    case SET_IS_REBUILDING:
      return {
        ...state,
        isRebuilding: action.payload,
      };
    case REPLACE_ACTION_IN_QUEUE:
      const queue = [...state.queue];
      queue[action.payload.index] = action.payload.action;
      return {
        ...state,
        queue,
      };
    default:
      return state;
  }
};

export default reducer;

export const setIsSyncing = (isSyncing: boolean) => ({
  type: SET_IS_SYNCING,
  payload: isSyncing,
});

export const markActionAsProcessed = (action: OfflineAction, response: any) => {
  console.log('marking action as processed', action);
  return {
    type: MARK_ACTION_AS_PROCESSED,
    payload: {
      action,
      response,
    },
  };
};

export const replaceOfflineState = (state: OfflineState) => ({
  type: REPLACE_OFFLINE_STATE,
  payload: state,
});

export const replaceRootState = (state: any) => ({
  type: OFFLINE_QUEUE_REPLACE_ROOT_STATE,
  payload: state,
});

export const setIsRebuilding = (rebuilding: boolean) => ({
  type: SET_IS_REBUILDING,
  payload: rebuilding,
});

export const replaceActionInQueue = (index: number, action: OfflineAction) => ({
  type: REPLACE_ACTION_IN_QUEUE,
  payload: {
    index,
    action,
  }
});
