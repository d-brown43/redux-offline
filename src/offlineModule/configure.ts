import { GetState, OptimisticConfig } from "./internalTypes";
import { applyMiddleware, compose, createStore, Store } from "redux";
import { createRealStoreRootReducer, setIsSyncing } from "./redux";
import { Configure, OfflineConfig } from "./types";
import { createOptimisticMiddleware } from "./middleware";
import { reduxBatch } from "@manaflair/redux-batch";
import syncNextPendingAction from "./processQueue";

const makeGetState = (config: OfflineConfig): GetState => (store: Store) => {
  return config.selector(store.getState());
};

const makeRun = (configuredConfig: OptimisticConfig) => (
  optimisticStore: Store
) => {
  const setSyncing = (isSyncing: boolean) => {
    optimisticStore.dispatch(setIsSyncing(isSyncing));
  };

  const { getState, store, config } = configuredConfig;

  const internalConfig = {
    store,
    optimisticStore,
    config,
    getState,
  };

  optimisticStore.subscribe(() => {
    if (
      getState(optimisticStore).queue.length > 0 &&
      !getState(optimisticStore).isSyncing
    ) {
      setSyncing(true);
      syncNextPendingAction(internalConfig);
    } else if (
      getState(optimisticStore).queue.length === 0 &&
      getState(optimisticStore).isSyncing
    ) {
      setSyncing(false);
    }
  });
};

const configure: Configure = (config) => {
  const getState = makeGetState(config);
  const store = createStore(createRealStoreRootReducer(config.rootReducer));

  const internalConfig = {
    getState,
    config,
    store,
  };

  const optimisticMiddleware = createOptimisticMiddleware(internalConfig);

  const { useBatching } = config;

  const storeEnhancer = useBatching
    ? compose(reduxBatch, applyMiddleware(optimisticMiddleware), reduxBatch)
    : applyMiddleware(optimisticMiddleware);

  const run = makeRun(internalConfig);

  return {
    storeEnhancer,
    run,
    store,
  };
};

export default configure;
