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
  const getState = () => config.store.getState();

  if (!hasPendingActions(getState()) || !getIsOnline(getState())) {
    config.store.dispatch(stopProcessing());
  } else {
    let result = null;
    try {
      const [firstAction] = getPendingActions(getState());
      result = await config.networkEffectHandler(firstAction);
    } catch (e) {
      if (typeof (e as AnyAction).type !== 'undefined') {
        result = e;
      }
    }

    const [firstAction, ...remainingQueue] = getPendingActions(getState());
    const updatedQueue = updateDependentActions(
      remainingQueue,
      firstAction,
      result,
      config
    );

    config.store.dispatch(replacePendingActions(updatedQueue));
    config.store.dispatch(replaceRootState(getRealState(getState())));
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
