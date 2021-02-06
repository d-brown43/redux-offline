import { AnyAction } from 'redux';
import { OfflineAction, OfflineQueueRuntimeConfig, RootState } from './types';
import {
  getIsOnline,
  getIsProcessing,
  getPendingActions,
  getRealState,
  hasPendingActions,
} from './selectors';
import {
  rebuildStore,
  replacePendingActions,
  replaceRootState,
  startProcessing,
  stopProcessing,
} from './actions';
import networkEffectHandler from './networkEffectHandler';

const updateDependentActions = <ST extends RootState>(
  remainingActions: OfflineAction[],
  originalAction: OfflineAction,
  fulfilledAction: AnyAction,
  config: OfflineQueueRuntimeConfig<ST>
) => {
  return remainingActions.map((pendingAction) => {
    const mappedAction = config.mapDependentAction(
      originalAction,
      fulfilledAction,
      pendingAction
    );
    return mappedAction ? mappedAction : pendingAction;
  });
};

export const processQueue = async <ST extends RootState>(
  config: OfflineQueueRuntimeConfig<ST>
): Promise<any> => {
  const state = config.store.getState();

  if (!hasPendingActions(state) || !getIsOnline(state)) {
    config.store.dispatch(stopProcessing());
  } else {
    const [firstAction, ...remainingQueue] = getPendingActions(state);
    let updatedQueue = remainingQueue;

    let result = null;
    try {
      result = await networkEffectHandler(
        config.networkEffectHandler,
        firstAction
      );
      if (result) {
        updatedQueue = updateDependentActions(
          remainingQueue,
          firstAction,
          result,
          config
        );
      }
    } catch (e) {
      if (typeof (e as AnyAction).type !== 'undefined') {
        result = e;
      }
    }

    config.store.dispatch(replacePendingActions(updatedQueue));
    config.store.dispatch(replaceRootState(getRealState(state)));
    if (result) {
      config.store.dispatch(result);
    }
    config.store.dispatch(rebuildStore());

    return processQueue(config);
  }
  return Promise.resolve();
};

const queueProcessor = <ST extends RootState>(
  config: OfflineQueueRuntimeConfig<ST>
) => {
  const startIfReady = () => {
    const state = config.store.getState();

    if (
      getIsOnline(state) &&
      hasPendingActions(state) &&
      !getIsProcessing(state)
    ) {
      config.store.dispatch(startProcessing());
      processQueue(config);
    }
  };

  config.store.subscribe(() => {
    startIfReady();
  });
  startIfReady();
};

export default queueProcessor;
