import { NetworkEffectHandler } from './types';
import networkEffectHandler from './networkEffectHandler';

const makeRequest = jest.fn();
const handleError = jest.fn();

afterEach(() => {
  jest.resetAllMocks();
});

it('makes network requests given a network interface', async () => {
  const handler = (networkEffect: any) => {
    makeRequest(networkEffect);
    return Promise.resolve(null);
  };

  await networkEffectHandler(handler, {
    offline: {
      commitAction: { type: 'COMMIT_ACTION' },
      rollbackAction: { type: 'ROLLBACK_ACTION' },
      networkEffect: {
        some: 'data',
      },
    },
    type: 'ACTION_TYPE',
  });

  expect(makeRequest).toHaveBeenCalledWith({
    some: 'data',
  });

  expect(handleError).not.toHaveBeenCalled();
});

it('rejects with errors', async () => {
  const handler: NetworkEffectHandler = async () => {
    throw new Error('test error');
  };

  await expect(
    networkEffectHandler(handler, {
      offline: {
        commitAction: { type: 'COMMIT_ACTION' },
        rollbackAction: { type: 'ROLLBACK_ACTION' },
        networkEffect: {
          some: 'data',
        },
      },
      type: 'ACTION_TYPE',
    })
  ).rejects.toThrowError('test error');
});
