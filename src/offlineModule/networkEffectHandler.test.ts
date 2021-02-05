import { OfflineAction } from './types';
import networkEffectHandler from './networkEffectHandler';
import { createTestStore } from './test/utils';

const makeRequest = jest.fn();
const handleError = jest.fn();

afterEach(() => {
  jest.resetAllMocks();
});

it('makes network requests given a network interface', async () => {
  const handler = (action: OfflineAction): any => {
    makeRequest(action.offline.networkEffect);
    return Promise.resolve({
      type: 'COMMIT_ACTION',
    });
  };

  const action = {
    offline: {
      networkEffect: {
        some: 'data',
      },
    },
    type: 'ACTION_TYPE',
  };

  const store = createTestStore();

  await networkEffectHandler(handler, action, store);

  expect(makeRequest).toHaveBeenCalledWith({
    some: 'data',
  });

  expect(handleError).not.toHaveBeenCalled();
});
