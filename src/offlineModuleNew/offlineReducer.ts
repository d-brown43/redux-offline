import { MaybeOfflineAction, OfflineAction, OfflineState } from './types';
import {GO_OFFLINE, GO_ONLINE} from "./actions";

const initialState: OfflineState = {
  isOnline: false,
  offlineQueue: {
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
    case GO_ONLINE: return {
      ...state,
      isOnline: true,
    };
    case GO_OFFLINE: return {
      ...state,
      isOnline: false,
    };
    default: return state;
  }
};

export default offlineReducer;
