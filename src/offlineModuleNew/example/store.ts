import rootReducer, {
  DECREASE_CLICK_COUNT,
  INCREASE_CLICK_COUNT,
} from './redux';
import { createStore } from 'redux';
import configureRuntime from '../configureRuntime';
import makeRootReducer from "../makeRootReducer";

const configureStore = () => {
  const store = createStore(
    makeRootReducer(rootReducer),
    // @ts-ignore
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  );

  configureRuntime({
    store,
    networkEffectHandler: (action) => {
      switch (action.type) {
        case INCREASE_CLICK_COUNT:
        case DECREASE_CLICK_COUNT: {
          console.log('Making network request for action', action);
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                type: `${action.type}_RESOLVED`,
              });
            }, 5000);
          });
        }
        default:
          return Promise.resolve();
      }
    },
  });

  return store;
};

export default configureStore;
