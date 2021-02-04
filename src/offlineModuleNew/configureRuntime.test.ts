import {dispatchOfflineEvent, dispatchOnlineEvent, setOnlineStatusInitial} from "./test/utils";
import configureRuntime from "./configureRuntime";
import {combineReducers, createStore} from "redux";
import offlineReducer from "./offlineReducer";
import {getIsOnline} from "./selectors";

it('subscribes to offline/online events', () => {
  setOnlineStatusInitial(false);
  const rootReducer = combineReducers({
    offline: offlineReducer,
  });
  const store = createStore(rootReducer);
  configureRuntime(store);
  expect(getIsOnline(store.getState())).toEqual(false);

  dispatchOfflineEvent();
  expect(getIsOnline(store.getState())).toEqual(false);

  dispatchOnlineEvent();
  expect(getIsOnline(store.getState())).toEqual(true);

  dispatchOnlineEvent();
  expect(getIsOnline(store.getState())).toEqual(true);
});
