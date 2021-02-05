import {RootState} from "./types";
import {REBUILD_STORE, REPLACE_ROOT_STATE, replaceRootState} from "./actions";
import {AnyAction} from "redux";
import {getPendingActions} from "./selectors";
import {isOfflineAction} from "./utils";

const makeRootReducer = <ST extends RootState>(rootReducer: (state: ST | undefined, action: AnyAction) => ST) => {
  return (state: ST, action: AnyAction): ST => {
    if (action.type === REPLACE_ROOT_STATE) {
      return {
        ...(action as ReturnType<typeof replaceRootState>).payload,
        offline: state.offline,
      } as ST;
    }
    if (action.type === REBUILD_STORE) {
      const pendingActions = getPendingActions(state);
      return pendingActions.reduce((acc, action) => {
        // Remove the offline portion of the action to prevent re-queueing it,
        // we just want the optimistic effects to be rebuilt
        const { offline, ...rest } = action;
        return rootReducer(acc, rest);
      }, state);
    }
    // If the action is an optimistic action, return the changes directly and do not update the real store
    if (isOfflineAction(action)) {
      return rootReducer(state, action);
    }
    const nextState = rootReducer(state, action);
    const { offline, ...rest } = nextState;
    return {
      ...nextState,
      offline: {
        ...nextState.offline,
        // Keep track of the real state in our offline reducer
        realState: rest,
      }
    };
  };
};

export default makeRootReducer;
