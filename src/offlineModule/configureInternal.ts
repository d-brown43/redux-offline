import {applyMiddleware, createStore, Store} from "redux";
import {createRealStoreMiddleware} from "./middleware";
import {OfflineConfig} from "./types";
import {GetState, OptimisticConfig} from "./internalTypes";

const makeGetState = (config: OfflineConfig): GetState => (store: Store) => {
  return config.selector(store.getState());
};

type ConfigureInternalConfig = (config: OfflineConfig) => OptimisticConfig;

export const configureInternalConfig: ConfigureInternalConfig = (config: OfflineConfig) => {
  const getState = makeGetState(config);

  const store = createStore(
    config.rootReducer,
    applyMiddleware(createRealStoreMiddleware({ config }))
  );

  return {
    getState,
    config,
    store,
  };
};
