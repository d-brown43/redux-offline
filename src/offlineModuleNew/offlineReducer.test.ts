import offlineReducer from './offlineReducer';

it('adds offline actions to the queue', () => {
  const offlineAction = {
    type: 'SOME_ACTION',
    payload: {
      some: 'data',
    },
    offline: {
      networkEffect: {},
    },
  };

  expect(offlineReducer(undefined, offlineAction)).toEqual({
    offlineQueue: {
      pendingActions: [offlineAction],
    },
  });
});

it('ignores non-offline actions', () => {
  const action = {
    type: 'SOME_ACTION',
    payload: {
      some: 'data',
    },
  };

  expect(offlineReducer(undefined, action)).toEqual({
    offlineQueue: {
      pendingActions: [],
    },
  });
});
