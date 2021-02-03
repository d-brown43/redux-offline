import { MaybeOfflineAction, OfflineAction, OfflineState } from './types';

const initialState: OfflineState = {
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
  return state;
};

export default offlineReducer;
