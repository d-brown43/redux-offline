import { Action, AnyAction } from 'redux';
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
import { DELETE_PENDING_ACTION } from './utils';

const updateDependentActions = <
  ST extends RootState,
  ActionTypes extends Action
>(
  remainingActions: ActionTypes[],
  originalAction: ActionTypes,
  fulfilledAction: ActionTypes,
  config: OfflineQueueRuntimeConfig<ST, ActionTypes>
) => {
  return remainingActions.reduce<ActionTypes[]>((acc, pendingAction) => {
    const mappedAction =
      config.mapDependentAction === DELETE_PENDING_ACTION
        ? DELETE_PENDING_ACTION
        : config.mapDependentAction(
            originalAction,
            fulfilledAction,
            pendingAction
          );
    if (mappedAction !== DELETE_PENDING_ACTION) {
      return acc.concat([mappedAction ? mappedAction : pendingAction]);
    }
    return acc;
  }, []);
};

const isNetworkAction = (action: OfflineAction) => {
  return typeof action.offline.networkEffect !== 'undefined';
};

const isDependentAction = (action: OfflineAction) => {
  return action.offline.dependent === true;
};

export const processQueue = async <
  ST extends RootState,
  ActionTypes extends Action
>(
  config: OfflineQueueRuntimeConfig<ST, ActionTypes>
): Promise<any> => {
  const getState = () => config.store.getState();

  if (!hasPendingActions(getState()) || !getIsOnline(getState())) {
    config.store.dispatch(stopProcessing());
  } else {
    let result = null;
    try {
      const [firstAction] = getPendingActions(getState());
      if (isNetworkAction(firstAction)) {
        result = await config.networkEffectHandler(firstAction);
      } else if (isDependentAction(firstAction)) {
        const { offline, ...rest } = firstAction;
        // We need to dispatch the action as a real action, it depended
        // on an offline action before, but will have been
        // updated once the network action completed
        result = rest;
      }
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

const queueProcessor = <ST extends RootState, ActionTypes extends Action>(
  config: OfflineQueueRuntimeConfig<ST, ActionTypes>
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
