import {OfflineQueueRuntimeConfig, RootState} from "./types";
import {getIsOnline, getIsProcessing, getPendingActions, getRealState, hasPendingActions} from "./selectors";
import {actionHandled, rebuildStore, replaceRootState, startProcessing, stopProcessing} from "./actions";
import networkEffectHandler from "./networkEffectHandler";
import {AnyAction} from "redux";

export const processQueue = async <ST extends RootState>(config: OfflineQueueRuntimeConfig<ST>): Promise<any> => {
  const state = config.store.getState();

  if (!hasPendingActions(state) || !getIsOnline(state)) {
    config.store.dispatch(stopProcessing());
  } else {
    const queue = getPendingActions(state);
    const firstAction = queue[0];

    let result = null;
    try {
      result = await networkEffectHandler(config.networkEffectHandler, firstAction);
    } catch (e) {
      if (typeof (e as AnyAction).type !== 'undefined') {
        result = e;
      }
    }

    config.store.dispatch(actionHandled());
    config.store.dispatch(replaceRootState(getRealState(state)));
    if (result) {
      config.store.dispatch(result);
    }
    config.store.dispatch(rebuildStore());

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

  config.store.subscribe(() => {
    console.log('subscription on store', config.store.getState());
    startIfReady();
  });
  startIfReady();
};

export default queueProcessor;
