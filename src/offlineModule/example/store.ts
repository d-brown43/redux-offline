import {Action, createStore} from 'redux';
import configureRuntime from '../configureRuntime';
import makeRootReducer from '../makeRootReducer';
import networkHandler from './networkHandler';
import rootReducer from './redux';

const configureStore = () => {
  const store = createStore<
    ReturnType<typeof rootReducer>,
    Action,
    any,
    any
  >(
    makeRootReducer(rootReducer),
    // @ts-ignore
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  );

  configureRuntime({
    store,
    networkEffectHandler: networkHandler,
    mapDependentAction: () => null,
  });

  return store;
};

export default configureStore;
