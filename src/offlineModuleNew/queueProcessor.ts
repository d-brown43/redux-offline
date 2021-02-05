import {OfflineQueueRuntimeConfig, RootState} from "./types";
import {getIsOnline, getIsProcessing, getPendingActions, hasPendingActions} from "./selectors";
import {actionHandled, startProcessing, stopProcessing} from "./actions";
import networkEffectHandler from "./networkEffectHandler";

export const processQueue = async <ST extends RootState>(config: OfflineQueueRuntimeConfig<ST>): Promise<any> => {
  const state = config.store.getState();

  if (!hasPendingActions(state) || !getIsOnline(state)) {
    config.store.dispatch(stopProcessing());
  } else {
    const queue = getPendingActions(state);
    const firstAction = queue[0];

    await networkEffectHandler(config.networkEffectHandler, firstAction, config.store);
    config.store.dispatch(actionHandled());
    return processQueue(config);
  }
  return Promise.resolve();
};

const queueProcessor = <ST extends RootState>(config: OfflineQueueRuntimeConfig<ST>) => {
  const startIfReady = () => {
    const state = config.store.getState();

    if (
      getIsOnline(state)
      && hasPendingActions(state)
      && !getIsProcessing(state)
    ) {
      config.store.dispatch(startProcessing());
      processQueue(config);
    }
  };

  config.store.subscribe(() => startIfReady());
  startIfReady();
};

export default queueProcessor;
