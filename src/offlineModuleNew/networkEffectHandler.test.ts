import { NetworkEffectHandler } from './types';
import networkEffectHandler from './networkEffectHandler';

const makeRequest = jest.fn();
const handleError = jest.fn();

afterEach(() => {
  jest.resetAllMocks();
});

it('makes network requests given a network interface', async () => {
  const handler: NetworkEffectHandler<any> = (networkEffect) => {
    makeRequest(networkEffect);
    return Promise.resolve();
  };

  await networkEffectHandler(handler, {
    offline: {
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
  const handler: NetworkEffectHandler<any> = async () => {
    throw new Error('test error');
  };

  await expect(
    networkEffectHandler(handler, {
      offline: {
        networkEffect: {
          some: 'data',
        },
      },
      type: 'ACTION_TYPE',
    })
  ).rejects.toThrowError('test error');
});
