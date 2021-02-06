import { RootState } from './types';
import {
  INITIALISE_STATE,
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
    state: ST = rootReducer(undefined, { type: INITIALISE_STATE }),
    action: AnyAction
  ): ST => {
    if (action.type === REPLACE_ROOT_STATE) {
      // We are rebuilding the optimistic state, since we've just handled an optimistic action
      // Keep the offline-state from the optimistic store as that's where we keep it
      return {
        ...action.payload,
        offline: state.offline,
      };
    }

    if (action.type === REBUILD_STORE) {
      // State will have been initialised by this point
      const pendingActions = getPendingActions(state);
      return pendingActions.reduce<ST>((acc, action) => {
        // Remove the offline portion of the action to prevent re-queueing it,
        // we just want the optimistic effects to be rebuilt
        const { offline, ...rest } = action;
        return rootReducer(acc, rest);
      }, state);
    }

    // If it's an internal action/optimistic action, apply to the optimistic state
    // without tracking to real state
    if (isOfflineAction(action) || isInternalAction(action)) {
      return rootReducer(state, action);
    }

    const nextState = rootReducer(getRealState(state), action);
    const { offline, ...rest } = nextState;
    return {
      ...nextState,
      offline: {
        ...(!state ? nextState.offline : state.offline),
        realState: rest,
      },
    };
  };
};

export default makeRootReducer;
