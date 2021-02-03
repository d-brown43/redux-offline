import offlineReducer from './offlineReducer';
import {MaybeOfflineAction, OfflineAction, OfflineState, RootState} from './types';
import { goOffline, goOnline } from './actions';
import {getIsOnline, getPendingActions} from "./selectors";

const makeRootState = (state: OfflineState): RootState => ({ offline: state });

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
      pendingActions: [],
    },
  };

  const state = makeRootState(offlineReducer(initialState, goOffline()));

  expect(getIsOnline(state)).toEqual(false);
});
