import { createStore, Store } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import rootReducer, {
  getOffline,
  State,
  mergedGetFulfilledAction,
  mergedGetRollbackAction,
} from './rootReducer';
import configure, { createRootReducer } from '../offlineModule';
import api from './api';

export type StoreType = Store<State>;

const configureStore = () => {
  const { run, storeEnhancer, store } = configure({
    selector: getOffline,
    getFulfilledAction: mergedGetFulfilledAction,
    getRollbackAction: mergedGetRollbackAction,
    makeApiRequest: api,
    rootReducer,
  });

  const optimisticStore: StoreType = createStore(
    createRootReducer(rootReducer),
    composeWithDevTools(storeEnhancer)
  );

  run(optimisticStore);

  return {
    store,
    optimisticStore,
  };
};

export default configureStore;
