import {AnyAction, Reducer} from "redux";
import {ApiAction, OfflineAction, OfflineState} from "./types";
import {isDependentAction, actionHasSideEffect, isOfflineAction} from "./utils";

const initialState: OfflineState = {
  queue: [],
  processed: [],
  isSyncing: false,
  isRebuilding: false,
};

const SET_IS_SYNCING = 'SET_IS_SYNCING';
const MARK_ACTION_AS_PROCESSED = 'MARK_ACTION_AS_PROCESSED';
const REPLACE_OFFLINE_STATE = 'REPLACE_OFFLINE_STATE';
const OFFLINE_QUEUE_REPLACE_ROOT_STATE = 'OFFLINE_QUEUE_REPLACE_ROOT_STATE';
const SET_IS_REBUILDING = 'SET_IS_REBUILDING';
const REMOVE_PROCESSED_ACTIONS = 'REMOVE_PROCESSED_ACTIONS';

export const offlineActions = {
  SET_IS_SYNCING: true,
  MARK_ACTION_AS_PROCESSED: true,
  REPLACE_OFFLINE_STATE: true,
  OFFLINE_QUEUE_REPLACE_ROOT_STATE: true,
  SET_IS_REBUILDING: true,
  REMOVE_PROCESSED_ACTIONS: true,
};

export const createRootReducer = (rootReducer: Reducer) => (state: any, action: AnyAction) => {
  let nextState = state;
  if (action.type === OFFLINE_QUEUE_REPLACE_ROOT_STATE) {
    nextState = action.payload;
  }
  return rootReducer(nextState, action);
};

const reducer = (state = initialState, action: AnyAction) => {
  if (action.type === MARK_ACTION_AS_PROCESSED && !isDependentAction(action.payload.action)) {
    return {
      ...state,
      queue: state.queue.filter(a => a !== action.payload.action),
      processed: state.processed.concat([action.payload]),
    };
  } else if (action.type === MARK_ACTION_AS_PROCESSED && isDependentAction(action.payload.action)) {
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
    case REMOVE_PROCESSED_ACTIONS:
      return {
        ...state,
        processed: state.processed.filter(ar => !action.payload.includes(ar)),
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

export const removeProcessedActions = (actions: { action: ApiAction, response: any }[]) => ({
  type: REMOVE_PROCESSED_ACTIONS,
  payload: actions,
});
