import {OfflineState, RootState} from "../types";
import {combineReducers, createStore} from "redux";
import offlineReducer from "../offlineReducer";

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

export const makeRootState = (state: OfflineState): RootState => ({ offline: state });

export const createTestStore = () => {
  const rootReducer = combineReducers({
    offline: offlineReducer,
  });
  return createStore(rootReducer);
};

export const waitFor = (assertion: () => void, intervalLength = 100, timeout = 3000) => {
  return new Promise((resolve, reject) => {
    let timerId: NodeJS.Timeout;
    let lastError: any = null;

    const intervalId = setInterval(() => {
      try {
        assertion();
        clearTimeout(timerId);
        resolve(null);
      } catch (e) {
        lastError = e;
      }
    }, intervalLength);

    timerId = setTimeout(() => {
      clearInterval(intervalId);
      reject(!lastError ? 'Timeout in waitFor reached' : lastError);
    }, timeout);
  });
};
