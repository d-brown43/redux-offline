import offlineReducer from './offlineReducer';
import { MaybeOfflineAction, OfflineAction, OfflineState } from './types';
import {
  goOffline,
  goOnline,
  replacePendingActions,
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
    realState: null,
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
    realState: null,
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

it('replaces pending actions', () => {
  const state = makeRootState(offlineReducer(undefined, offlineAction));

  const updatedAction = {
    type: 'SOME_ACTION',
    payload: { some: 'updated data' },
    offline: { networkEffect: {} },
  };

  const nextState = makeRootState(
    offlineReducer(state.offline, replacePendingActions([updatedAction]))
  );
  expect(getPendingActions(nextState).length).toEqual(1);
  expect(getPendingActions(nextState)[0]).toEqual(updatedAction);
});
