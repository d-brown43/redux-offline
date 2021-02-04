import { MaybeOfflineAction, OfflineAction, OfflineState } from './types';
import {
  ACTION_HANDLED,
  GO_OFFLINE,
  GO_ONLINE,
  START_PROCESSING,
  STOP_PROCESSING,
} from './actions';

const initialState: OfflineState = {
  isOnline: false,
  offlineQueue: {
    isProcessing: false,
    pendingActions: [],
  },
};

const isOfflineAction = (
  action: MaybeOfflineAction
): action is OfflineAction => {
  return typeof (action as OfflineAction).offline !== 'undefined';
};

const offlineReducer = (state = initialState, action: MaybeOfflineAction) => {
  if (isOfflineAction(action)) {
    return {
      ...state,
      offlineQueue: {
        ...state.offlineQueue,
        pendingActions: [...state.offlineQueue.pendingActions, action],
      },
    };
  }
  switch (action.type) {
    case GO_ONLINE:
      return {
        ...state,
        isOnline: true,
      };
    case GO_OFFLINE:
      return {
        ...state,
        isOnline: false,
      };
    case START_PROCESSING:
      return {
        ...state,
        offlineQueue: {
          ...state.offlineQueue,
          isProcessing: true,
        },
      };
    case STOP_PROCESSING:
      return {
        ...state,
        offlineQueue: {
          ...state.offlineQueue,
          isProcessing: false,
        },
      };
    case ACTION_HANDLED:
      return {
        ...state,
        offlineQueue: {
          ...state.offlineQueue,
          pendingActions: state.offlineQueue.pendingActions.slice(1),
        },
      };
    default:
      return state;
  }
};

export default offlineReducer;
