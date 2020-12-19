import {AnyAction} from "redux";
import {OfflineAction, OfflineState} from "./types";
import {isOfflineAction} from "./utils";

const initialState: OfflineState = {
  queue: [],
  isSyncing: false,
};

const SET_IS_SYNCING = 'SET_IS_SYNCING';
const MARK_ACTION_AS_PROCESSED = 'MARK_ACTION_AS_PROCESSED';

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
