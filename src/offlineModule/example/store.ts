import { Action, createStore } from 'redux';
import configureRuntime from '../configureRuntime';
import makeRootReducer from '../makeRootReducer';
import networkHandler from './networkHandler';
import rootReducer from './redux';
import actionUpdater from './actionUpdater';

const configureStore = () => {
  const store = createStore<ReturnType<typeof rootReducer>, Action, any, any>(
    makeRootReducer(rootReducer),
    // @ts-ignore
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  );

  configureRuntime({
    store,
    networkEffectHandler: networkHandler,
    mapDependentAction: actionUpdater,
  });

  return store;
};

export default configureStore;
