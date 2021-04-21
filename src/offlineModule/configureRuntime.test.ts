import {
  createTestStore,
  dispatchOfflineEvent,
  dispatchOnlineEvent,
  setOnlineStatusInitial,
} from './test/utils';
import configureRuntime from './configureRuntime';
import { getIsOnline, getIsProcessing } from './selectors';
import createDependencyGraph from './dependencyGraphFactory';

it('subscribes to offline/online events', () => {
  setOnlineStatusInitial(false);
  const store = createTestStore();

  configureRuntime({
    networkEffectHandler: () => Promise.resolve({ type: 'ACTION' }),
    store,
    dependencyGraph: createDependencyGraph([]),
  });
  expect(getIsOnline(store.getState())).toEqual(false);

  dispatchOfflineEvent();
  expect(getIsOnline(store.getState())).toEqual(false);

  dispatchOnlineEvent();
  expect(getIsOnline(store.getState())).toEqual(true);

  dispatchOnlineEvent();
  expect(getIsOnline(store.getState())).toEqual(true);
});

it('starts the queue processor', () => {
  setOnlineStatusInitial(false);
  const store = createTestStore();

  const networkHandler = () => new Promise<null>(() => {});

  configureRuntime({
    networkEffectHandler: networkHandler,
    store,
    dependencyGraph: createDependencyGraph([]),
  });

  store.dispatch({
    type: 'some_optimistic_action',
    payload: {},
    offline: {
      networkEffect: {},
    },
  });

  dispatchOnlineEvent();

  expect(getIsProcessing(store.getState())).toEqual(true);
});
