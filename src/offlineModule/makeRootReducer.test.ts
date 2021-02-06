import { Action, combineReducers } from 'redux';
import makeRootReducer from './makeRootReducer';
import offlineReducer from './offlineReducer';
import { OfflineAction, RootState } from './types';
import { getRealState } from './selectors';

const initialState = 0;

const otherReducer = (state = initialState, action: Action) => {
  switch (action.type) {
    case 'some_action':
    case 'some_offline_action':
      return (action as any).payload;
    default:
      return state;
  }
};

const myRootReducer = combineReducers({
  offline: offlineReducer,
  someState: otherReducer,
});

const rootReducer = makeRootReducer<RootState & { someState: number }>(
  myRootReducer
);

it('returns a root reducer', () => {
  const state = rootReducer(undefined as any, {
    type: 'some_action',
    payload: 1,
  });

  expect(state.someState).toEqual(1);
});

it('updates the real state if a non-optimistic action is dispatched', () => {
  const state = rootReducer(undefined as any, {
    type: 'some_action',
    payload: 1,
  });

  expect(getRealState(state)).toEqual({
    someState: 1,
  });
});

it('does not update the real state if an optimistic action is dispatched', () => {
  const offlineAction: OfflineAction = {
    type: 'some_offline_action',
    payload: 1,
    offline: {
      networkEffect: {},
    },
  };
  const state = rootReducer(
    rootReducer(undefined, { type: 'init dummy' }),
    offlineAction,
  );
  expect(getRealState(state)).toEqual({ someState: 0 });
});
