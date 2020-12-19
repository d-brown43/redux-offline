import {AnyAction, createStore, Store} from "redux";
import rootReducer, {rootOptimisticReducer, mergedFulfilledHandlers, getOffline, State} from './rootReducer';
import {createRootReducer, run} from "../offlineModule";
import api from "./api";

export type StoreType = Store<State, AnyAction>;

const configureStore = () => {
  const store: StoreType = createStore(createRootReducer(rootReducer));
  const optimisticStore = run(store, createRootReducer(rootOptimisticReducer), {
    selector: getOffline,
    dispatchFulfilledAction: mergedFulfilledHandlers,
    makeApiRequest: api,
  });
  return {
    store,
    optimisticStore,
  };
};

export default configureStore;
