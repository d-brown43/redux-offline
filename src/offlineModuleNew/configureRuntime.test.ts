import {createTestStore, dispatchOfflineEvent, dispatchOnlineEvent, setOnlineStatusInitial} from "./test/utils";
import configureRuntime from "./configureRuntime";
import {getIsOnline} from "./selectors";

it('subscribes to offline/online events', () => {
  setOnlineStatusInitial(false);
  const store = createTestStore();

  configureRuntime(store);
  expect(getIsOnline(store.getState())).toEqual(false);

  dispatchOfflineEvent();
  expect(getIsOnline(store.getState())).toEqual(false);

  dispatchOnlineEvent();
  expect(getIsOnline(store.getState())).toEqual(true);

  dispatchOnlineEvent();
  expect(getIsOnline(store.getState())).toEqual(true);
});
