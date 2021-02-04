import offlineReducer from './offlineReducer';
import {MaybeOfflineAction, OfflineAction, OfflineState} from './types';
import {goOffline, goOnline, startProcessing, stopProcessing} from './actions';
import {getIsOnline, getIsProcessing, getPendingActions} from "./selectors";
import {makeRootState} from "./test/utils";

it('adds offline actions to the queue', () => {
  const offlineAction: OfflineAction = {
    type: 'SOME_ACTION',
    payload: {
      some: 'data',
    },
    offline: {
      commitAction: {
        type: 'COMMIT_ACTION',
      },
      networkEffect: {},
    },
  };

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
