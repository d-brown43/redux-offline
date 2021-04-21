import { OfflineState, RootState } from '../types';
import { combineReducers, createStore, Store } from 'redux';
import offlineReducer from '../offlineReducer';

export const setOnlineStatusInitial = (isOnline: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    value: isOnline,
    configurable: true,
  });
};

export const dispatchOnlineEvent = () => {
  const event = new Event('online');
  window.dispatchEvent(event);
};

export const dispatchOfflineEvent = () => {
  const event = new Event('offline');
  window.dispatchEvent(event);
};

export const makeRootState = (state: OfflineState): RootState => ({
  offline: state,
});

export const createTestStore = () => {
  const rootReducer = combineReducers({
    offline: offlineReducer,
  });
  return createStore(rootReducer);
};

export const waitFor = (
  store: Store,
  assertion: () => void,
  timeout = 3000
) => {
  return new Promise((resolve, reject) => {
    let lastError: any = null;
    let timerId: NodeJS.Timeout;
    let unsubscribe: (() => void) | null = null;

    const doAssertion = () => {
      try {
        assertion();
        clearTimeout(timerId);
        if (unsubscribe) {
          unsubscribe();
        }
        resolve(null);
      } catch (e) {
        lastError = e;
      }
    };

    doAssertion();

    unsubscribe = store.subscribe(() => doAssertion());

    timerId = setTimeout(() => {
      if (unsubscribe) {
        unsubscribe();
      }
      reject(!lastError ? 'Timeout in waitFor reached' : lastError);
    }, timeout);
  });
};
