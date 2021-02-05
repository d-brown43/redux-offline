import offlineReducer from './offlineReducer';
import { MaybeOfflineAction, OfflineAction, OfflineState } from './types';
import {
  actionHandled,
  goOffline,
  goOnline,
  startProcessing,
  stopProcessing,
} from './actions';
import { getIsOnline, getIsProcessing, getPendingActions } from './selectors';
import { makeRootState } from './test/utils';

const offlineAction: OfflineAction = {
  type: 'SOME_ACTION',
  payload: {
    some: 'data',
  },
  offline: {
    networkEffect: {},
  },
};

it('adds offline actions to the queue', () => {
  const state = makeRootState(offlineReducer(undefined, offlineAction));
  expect(getPendingActions(state)).toEqual([offlineAction]);
});

it('ignores non-offline actions', () => {
  const action: MaybeOfflineAction = {
    type: 'SOME_ACTION',
    payload: {
      some: 'data',
    },
  };

  const state = makeRootState(offlineReducer(undefined, action));

  expect(getPendingActions(state)).toEqual([]);
});

it('updates online status when going online', () => {
  const initialState: OfflineState = {
    isOnline: false,
    offlineQueue: {
      isProcessing: false,
      pendingActions: [],
    },
  };

  const state = makeRootState(offlineReducer(initialState, goOnline()));

  expect(getIsOnline(state)).toEqual(true);
});

it('updates online status when going offline', () => {
  const initialState: OfflineState = {
    isOnline: true,
    offlineQueue: {
      isProcessing: false,
      pendingActions: [],
    },
  };

  const state = makeRootState(offlineReducer(initialState, goOffline()));

  expect(getIsOnline(state)).toEqual(false);
});

it('updates processing status when starting processing', () => {
  const state = makeRootState(offlineReducer(undefined, startProcessing()));
  expect(getIsProcessing(state)).toEqual(true);
});

it('updates processing status when stopping processing', () => {
  const state = makeRootState(offlineReducer(undefined, stopProcessing()));
  expect(getIsProcessing(state)).toEqual(false);
});

it('removes first action from pending actions when marked as handled', () => {
  const state = makeRootState(offlineReducer(undefined, offlineAction));
  expect(getPendingActions(state).length).toEqual(1);

  const nextState = makeRootState(
    offlineReducer(state.offline, actionHandled())
  );
  expect(getPendingActions(nextState).length).toEqual(0);
});
