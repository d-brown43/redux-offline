import { OfflineAction } from './types';
import {
  createTestStore, dispatchOfflineEvent,
  dispatchOnlineEvent,
  setOnlineStatusInitial, waitFor,
} from "./test/utils";
import configureRuntime from "./configureRuntime";
import {getIsProcessing, getPendingActions} from "./selectors";
import {Action} from "redux";

const offlineAction: OfflineAction = {
  type: 'MY_ACTION',
  offline: {
    networkEffect: {},
  },
};

const fakeNetworkHandler = (): Promise<Action> => new Promise(resolve => {
  setTimeout(() => {
    resolve({
      type: 'HANDLED_ACTION',
    });
  }, 100);
});

const initialiseWithAction = () => {
  setOnlineStatusInitial(false);
  const store = createTestStore();
  configureRuntime({
    networkEffectHandler: fakeNetworkHandler,
    store,
  });
  return store;
};

it('starts processing when online status detected and actions pending', () => {
  const store = initialiseWithAction();

  store.dispatch(offlineAction);

  expect(getPendingActions(store.getState()).length).toEqual(1);

  dispatchOnlineEvent();
  expect(getIsProcessing(store.getState())).toEqual(true);
});

it('stops processing when queue is empty', async () => {
  const store = initialiseWithAction();

  store.dispatch(offlineAction);
  store.dispatch(offlineAction);

  dispatchOnlineEvent();

  await waitFor(() => {
    expect(getPendingActions(store.getState()).length).toEqual(0);
    expect(getIsProcessing(store.getState())).toEqual(false);
  });
});

it('stops processing when offline status is detected', async () => {
  const store = initialiseWithAction();

  store.dispatch(offlineAction);
  store.dispatch(offlineAction);

  dispatchOnlineEvent();
  dispatchOfflineEvent();

  await waitFor(() => {
    expect(getIsProcessing(store.getState())).toEqual(false);
    expect(getPendingActions(store.getState()).length).toEqual(1);
  });
});
