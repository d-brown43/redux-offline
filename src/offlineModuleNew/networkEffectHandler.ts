import { NetworkEffectHandler, OfflineAction } from './types';

const networkEffectHandler = <Result>(
  effectHandler: NetworkEffectHandler<Result>,
  offlineAction: OfflineAction
) => {
  return effectHandler(offlineAction.offline.networkEffect)
    .then((result) => {
      // TODO Commit result to redux store

      return result;
    })
    .catch((error) => {
      // TODO Rollback result to redux store

      throw error;
    });
};

export default networkEffectHandler;
