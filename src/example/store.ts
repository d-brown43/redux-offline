import { Action, createStore } from 'redux';
import { configureRuntime, makeRootReducer } from '../offlineModule';
import networkHandler from './networkHandler';
import rootReducer, { dependencyGraph } from './redux';

const configureStore = () => {
  const store = createStore<ReturnType<typeof rootReducer>, Action, any, any>(
    makeRootReducer(rootReducer),
    // @ts-ignore
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  );

  configureRuntime({
    store,
    networkEffectHandler: networkHandler,
    dependencyGraph,
  });

  return store;
};

export default configureStore;
