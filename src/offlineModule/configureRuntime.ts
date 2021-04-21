import { Action } from 'redux';
import {
  OfflineQueueRuntimeConfig,
  OfflineQueueRuntimeConfigInput,
  RootState,
  Optional,
} from './types';
import networkDetector from './networkDetector';
import { getIsOnline } from './selectors';
import { goOffline, goOnline } from './actions';
import queueProcessor from './queueProcessor';
import createMapDependentActions from './createDefaultActionMapper';

// Subscribe to the network detector and dispatch online states to the store
const mapNetworkToState = <ST extends RootState, ActionTypes extends Action>(
  config: OfflineQueueRuntimeConfig<ST, ActionTypes>
) => {
  config.networkDetector((isOnline) => {
    if (isOnline && !getIsOnline(config.store.getState())) {
      config.store.dispatch(goOnline());
    } else if (!isOnline && getIsOnline(config.store.getState())) {
      config.store.dispatch(goOffline());
    }
  });
};

const configureRuntime = <ST extends RootState, ActionTypes extends Action>(
  config: OfflineQueueRuntimeConfigInput<ST, ActionTypes>
) => {
  const intermediateConfig: Optional<
    OfflineQueueRuntimeConfig<ST, ActionTypes>,
    'mapDependentAction' | 'networkDetector'
  > = { ...config };

  if (!intermediateConfig.mapDependentAction) {
    intermediateConfig.mapDependentAction = createMapDependentActions(config);
  }
  if (!intermediateConfig.networkDetector) {
    intermediateConfig.networkDetector = networkDetector;
  }

  // We've just ensured these optional fields are now not optional
  const runtimeConfig: OfflineQueueRuntimeConfig<
    ST,
    ActionTypes
  > = intermediateConfig as OfflineQueueRuntimeConfig<ST, ActionTypes>;

  mapNetworkToState(runtimeConfig);
  queueProcessor(runtimeConfig);
};

export default configureRuntime;
