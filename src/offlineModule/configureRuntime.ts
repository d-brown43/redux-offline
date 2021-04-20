import { Action } from 'redux';
import {
  OfflineQueueRuntimeConfig,
  OfflineQueueRuntimeConfigInput,
  RootState,
} from './types';
import networkDetector from './networkDetector';
import { getIsOnline } from './selectors';
import { goOffline, goOnline } from './actions';
import queueProcessor from './queueProcessor';
import createMapDependentActions from './createDefaultActionMapper';

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
  const intermediateConfig: Omit<
    OfflineQueueRuntimeConfig<ST, ActionTypes>,
    'mapDependentAction' | 'networkDetector'
  > &
    Partial<
      Pick<
        OfflineQueueRuntimeConfig<ST, ActionTypes>,
        'mapDependentAction' | 'networkDetector'
      >
    > = config;

  if (!intermediateConfig.mapDependentAction) {
    intermediateConfig.mapDependentAction = createMapDependentActions(config);
  }
  if (!intermediateConfig.networkDetector) {
    intermediateConfig.networkDetector = networkDetector;
  }

  const runtimeConfig: OfflineQueueRuntimeConfig<
    ST,
    ActionTypes
  > = intermediateConfig as OfflineQueueRuntimeConfig<ST, ActionTypes>;

  mapNetworkToState(runtimeConfig);
  queueProcessor(runtimeConfig);
};

export default configureRuntime;
