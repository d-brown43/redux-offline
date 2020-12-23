import { GetState, OptimisticConfig } from "./internalTypes";
import { applyMiddleware, compose, createStore, Store } from "redux";
import { Configure, OfflineConfig } from "./types";
import {
  createOptimisticMiddleware,
  createRealStoreMiddleware,
} from "./middleware";
import { reduxBatch } from "@manaflair/redux-batch";
import subscribeToQueue from "./processQueue";

const makeGetState = (config: OfflineConfig): GetState => (store: Store) => {
  return config.selector(store.getState());
};

const makeRun = (configuredConfig: OptimisticConfig) => (
  optimisticStore: Store
) => {
  const { getState, store, config } = configuredConfig;

  subscribeToQueue({
    store,
    optimisticStore,
    config,
    getState,
  });
};

const configure: Configure = (config) => {
  const getState = makeGetState(config);
  const store = createStore(
    config.rootReducer,
    applyMiddleware(createRealStoreMiddleware({ config }))
  );

  const internalConfig = {
    getState,
    config,
    store,
  };

  const optimisticMiddleware = createOptimisticMiddleware(internalConfig);

  const { useBatching = true } = config;

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
