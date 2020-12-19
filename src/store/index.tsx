import {AnyAction, createStore, Store} from "redux";
import rootReducer, {rootOptimisticReducer, mergedFulfilledHandlers, getOffline, State} from './rootReducer';
import {createRootReducer, run} from "../offlineModule";

export type StoreType = Store<State, AnyAction>;

const configureStore = () => {
  const store: StoreType = createStore(createRootReducer(rootReducer));
  const optimisticStore = run(store, createRootReducer(rootOptimisticReducer), {
    selector: getOffline,
    dispatchFulfilledAction: mergedFulfilledHandlers,
    makeApiRequest: (apiData) => {
      return new Promise(resolve => {
        console.log('making fake request with data', apiData);
        window.setTimeout(() => {
          console.log('resolving response for request data', apiData);
          resolve('some data');
        }, 5000);
      });
    },
  });
  return {
    store,
    optimisticStore,
  };
};

export default configureStore;
