import {createStore, Reducer, Store} from "redux";
import {GetOfflineState, OfflineConfig} from "./types";
import {actionHasSideEffect, isOfflineAction} from "./utils";
import {markActionAsProcessed, replaceRootState, replaceState, setIsSyncing} from "./redux";

const copyOptimisticToReal = (store: Store, optimisticStore: Store, config: OfflineConfig) => {
  const state = config.selector(store.getState());
  const optimisticState = config.selector(optimisticStore.getState());
  if (state !== optimisticState) {
    store.dispatch(replaceState(optimisticState));
  }
};

const rebuildOptimisticStore = (
  getOfflineState: GetOfflineState,
  store: Store,
  optimisticStore: Store,
  config: OfflineConfig,
) => {
  copyOptimisticToReal(store, optimisticStore, config);
  optimisticStore.dispatch(replaceRootState(store.getState()));
  const state = config.selector(store.getState());
  state.queue.forEach(optimisticAction => {
    const {offline, ...action} = optimisticAction;
    optimisticStore.dispatch(action);
  });
};

const startSyncing = (
  optimisticStore: Store,
  store: Store,
  getOfflineState: GetOfflineState,
  config: OfflineConfig,
) => {
  const state = getOfflineState();
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
        optimisticStore.dispatch(markActionAsProcessed(action));
        config.dispatchFulfilledAction(store.dispatch, action, response);
        rebuildOptimisticStore(getOfflineState, store, optimisticStore, config);
      })
      .then(() => {
        console.log('Checking for next queued action');
      });
  } else {
    throw new Error(`Unexpected action found in offline queue ${JSON.stringify(action, null, 2)}`);
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

const run = (store: Store, rootOptimisticReducer: Reducer, config: OfflineConfig) => {
  const optimisticStore = createStore(rootOptimisticReducer);

  const getOfflineState = makeGetOfflineState(optimisticStore, config);
  const hasActionsToProcess = makeHasActionsToProcess(getOfflineState);
  const isSyncing = makeIsSyncing(getOfflineState);

  const setSyncing = (isSyncing: boolean) => {
    optimisticStore.dispatch(setIsSyncing(isSyncing));
    copyOptimisticToReal(store, optimisticStore, config);
  };

  optimisticStore.subscribe(() => {
    if (hasActionsToProcess() && !isSyncing()) {
      setSyncing(true);
      startSyncing(optimisticStore, store, getOfflineState, config);
    } else if (!hasActionsToProcess() && isSyncing()) {
      setSyncing(false);
    }
  });

  return optimisticStore;
};

export default run;
