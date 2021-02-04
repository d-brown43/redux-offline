import { OfflineAction } from './types';
import {createTestStore, dispatchOnlineEvent, setOnlineStatusInitial} from "./test/utils";
import configureRuntime from "./configureRuntime";
import {getIsProcessing, getPendingActions} from "./selectors";

it('starts processing when online status detected and actions pending', () => {
  setOnlineStatusInitial(false);
  const store = createTestStore();
  configureRuntime({
    networkEffectHandler: () => Promise.resolve(null),
    store,
  });

  const action: OfflineAction = {
    type: 'MY_ACTION',
    offline: {
      commitAction: { type: 'COMMIT_ACTION' },
      rollbackAction: { type: 'ROLLBACK_ACTION' },
      networkEffect: {},
    },
  };

  store.dispatch(action);

  expect(getPendingActions(store.getState()).length).toEqual(1);

  dispatchOnlineEvent();
  expect(getIsProcessing(store.getState())).toEqual(true);
});

it.todo('stops processing when queue is empty');
it.todo('stops processing when offline status is detected');
