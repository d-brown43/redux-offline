import {AnyAction, createStore, Store} from "redux";
import rootReducer, {getOffline, State} from './rootReducer';
import {run} from "./offline";

export type StoreType = Store<State, AnyAction>;

const configureStore = () => {
  const store: StoreType = createStore(rootReducer);
  run(store, {
    selector: getOffline,
  });
  return store;
};

export default configureStore;
