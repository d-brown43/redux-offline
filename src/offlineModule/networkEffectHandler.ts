import {
  NetworkEffectHandler,
  OfflineAction,
} from './types';

const networkEffectHandler = (
  effectHandler: NetworkEffectHandler,
  offlineAction: OfflineAction,
) => {
  return effectHandler(offlineAction);
};

export default networkEffectHandler;
