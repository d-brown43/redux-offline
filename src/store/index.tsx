import {AnyAction, applyMiddleware, createStore, Store} from "redux";
import rootReducer, {
  getOffline,
  State,
  mergedGetFulfilledAction
} from './rootReducer';
import configure, {createRootReducer} from "../offlineModule";
import api from "./api";

export type StoreType = Store<State, AnyAction>;

const configureStore = () => {
  const {run, optimisticMiddleware, store} = configure({
    selector: getOffline,
    getFulfilledAction: mergedGetFulfilledAction,
    makeApiRequest: api,
    rootReducer,
  });

  const optimisticStore: StoreType = createStore(
    createRootReducer(rootReducer),
    applyMiddleware(optimisticMiddleware)
  );

  run(optimisticStore);

  return {
    store,
    optimisticStore,
  };
};

export default configureStore;
