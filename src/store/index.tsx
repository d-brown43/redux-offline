import {AnyAction, createStore, Store} from "redux";
import rootReducer, {mergedFulfilledHandlers, getOffline, State} from './rootReducer';
import {run} from "../offlineModule";

export type StoreType = Store<State, AnyAction>;

const configureStore = () => {
  const store: StoreType = createStore(rootReducer);
  run(store, {
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
  return store;
};

export default configureStore;
