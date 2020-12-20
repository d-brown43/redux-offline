import {AnyAction, createStore, Store} from "redux";
import rootReducer, {
  rootOptimisticReducer,
  getOffline,
  State,
  mergedPassthroughs,
  mergedGetFulfilledAction
} from './rootReducer';
import {run} from "../offlineModule";
import api from "./api";

export type StoreType = Store<State, AnyAction>;

const configureStore = () => {
  const store: StoreType = createStore(rootReducer);
  const optimisticStore = run(store, rootOptimisticReducer, {
    selector: getOffline,
    getFulfilledAction: mergedGetFulfilledAction,
    optimisticPassthrough: mergedPassthroughs,
    makeApiRequest: api,
  });
  return {
    store,
    optimisticStore,
  };
};

export default configureStore;
