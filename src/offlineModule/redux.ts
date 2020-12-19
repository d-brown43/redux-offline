import {AnyAction, Reducer} from "redux";
import {OfflineAction, OfflineState} from "./types";
import {isOfflineAction} from "./utils";

const initialState: OfflineState = {
  queue: [],
  isSyncing: false,
};

const SET_IS_SYNCING = 'SET_IS_SYNCING';
const MARK_ACTION_AS_PROCESSED = 'MARK_ACTION_AS_PROCESSED';
const REPLACE_OFFLINE_STATE = 'REPLACE_OFFLINE_STATE';
const OFFLINE_QUEUE_REPLACE_ROOT_STATE = 'OFFLINE_QUEUE_REPLACE_ROOT_STATE';

export const createRootReducer = (rootReducer: Reducer) => (state: any, action: AnyAction) => {
  let nextState = state;
  if (action.type === OFFLINE_QUEUE_REPLACE_ROOT_STATE) {
    nextState = action.payload;
  }
  return rootReducer(nextState, action);
};

const reducer = (state = initialState, action: AnyAction) => {
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
    case MARK_ACTION_AS_PROCESSED:
      return {
        ...state,
        queue: state.queue.filter(a => a !== action.payload),
      };
    case REPLACE_OFFLINE_STATE:
      return action.payload;
    default:
      return state;
  }
};

export default reducer;

export const setIsSyncing = (isSyncing: boolean) => ({
  type: SET_IS_SYNCING,
  payload: isSyncing,
});

export const markActionAsProcessed = (action: OfflineAction) => {
  console.log('marking action as processed');
  return {
    type: MARK_ACTION_AS_PROCESSED,
    payload: action,
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
