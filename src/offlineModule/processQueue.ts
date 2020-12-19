import {Store} from "redux";
import {GetOfflineState, OfflineConfig} from "./types";
import {actionHasSideEffect, isOfflineAction} from "./utils";
import {markActionAsProcessed, setIsSyncing} from "./redux";

const startSyncing = (store: Store, getOfflineState: GetOfflineState, config: OfflineConfig) => {
  const state = getOfflineState();
  if (state.queue.length > 0) {
    const action = state.queue[0];
    if (isOfflineAction(action)) {
      return Promise.resolve()
        .then(() => {
          if (actionHasSideEffect(action)) {
            return config.makeApiRequest(action.offline.apiData);
          }
          return null;
        })
        .then((response) => {
          store.dispatch(markActionAsProcessed(action));
          config.dispatchFulfilledAction(store.dispatch, action, response);
        });
    }
  }
};

const makeGetOfflineState = (store: Store, config: OfflineConfig) => () => {
  const state = store.getState();
  return config.selector(state);
};

const makeHasActionsToProcess = (getOfflineState: GetOfflineState) => () => {
  return getOfflineState().queue.length > 0;
};

const makeIsSyncing = (getOfflineState: GetOfflineState) => () => {
  return getOfflineState().isSyncing;
};

const run = (store: Store, config: OfflineConfig) => {
  const getOfflineState = makeGetOfflineState(store, config);
  const hasActionsToProcess = makeHasActionsToProcess(getOfflineState);
  const isSyncing = makeIsSyncing(getOfflineState);

  const setSyncing = (isSyncing: boolean) => store.dispatch(setIsSyncing(isSyncing));

  store.subscribe(() => {
    if (hasActionsToProcess() && !isSyncing()) {
      setSyncing(true);
      startSyncing(store, getOfflineState, config);
    } else if (!hasActionsToProcess() && isSyncing()) {
      setSyncing(false);
    }
  });
};

export default run;
