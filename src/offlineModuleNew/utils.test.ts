import { AnyAction } from 'redux';
import { isOfflineAction } from './utils';
import { OfflineAction } from './types';

describe('isOfflineAction', () => {
  it('returns true if action is offline action', () => {
    const action: AnyAction = {
      type: 'SOME_ACTION',
    };
    expect(isOfflineAction(action)).toEqual(false);
  });

  it('returns false if action is not offline action', () => {
    const offlineAction: OfflineAction = {
      type: 'SOME_ACTION',
      offline: {
        networkEffect: {},
      },
    };
    expect(isOfflineAction(offlineAction)).toEqual(true);
  });
});
