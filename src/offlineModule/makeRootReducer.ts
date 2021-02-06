import { RootState } from './types';
import {
  isInternalAction,
  REBUILD_STORE,
  REPLACE_ROOT_STATE,
} from './actions';
import { AnyAction, Reducer } from 'redux';
import { getPendingActions, getRealState } from './selectors';
import { isOfflineAction } from './utils';

const makeRootReducer = <ST extends RootState>(
  rootReducer: Reducer<ST>
): Reducer<ST> => {
  return (
    state: ST | undefined,
    action: AnyAction
  ): ST => {
    if (!state) {
      const { offline, ...rest } = rootReducer(undefined, action);
      return {
        ...rest,
        offline: {
          ...offline,
          realState: rest,
        }
      } as ST;
    }
    if (action.type === REPLACE_ROOT_STATE) {
      // We are re-initialising the optimistic state, since we've just handled an optimistic action
      // Keep the offline-state from the optimistic store as that's where we keep it
      return {
        ...action.payload,
        offline: state.offline,
      };
    }

    // Replay the optimistic actions we have in the queue still
    if (action.type === REBUILD_STORE) {
      // State will have been initialised by this point
      const pendingActions = getPendingActions(state);
      return pendingActions.reduce<ST>((acc, action) => {
        // Remove the offline portion of the action to prevent re-queueing it,
        // we just want the optimistic effects to be replayed
        const { offline, ...rest } = action;
        return rootReducer(acc, rest);
      }, state);
    }

    // If it's an internal action/optimistic action, apply to the optimistic state
    // without tracking to real state
    if (isOfflineAction(action) || isInternalAction(action)) {
      return rootReducer(state, action);
    }

    // This is a real action and we should keep track of it in our "real" state
    const nextState = rootReducer(getRealState(state), action);
    const { offline, ...rest } = nextState;
    return {
      ...nextState,
      offline: {
        ...state.offline,
        realState: rest,
      },
    };
  };
};

export default makeRootReducer;
