import {Action} from "redux";
import {
  OfflineQueueRuntimeConfig,
  OfflineQueueRuntimeConfigInput,
  RootState,
  StoreType,
} from './types';
import networkDetector from './networkDetector';
import { getIsOnline } from './selectors';
import { goOffline, goOnline } from './actions';
import queueProcessor from './queueProcessor';
import createMapDependentActions from './createDefaultActionMapper';

const mapNetworkToState = <ST extends RootState>(store: StoreType<ST>) => {
  networkDetector((isOnline) => {
    if (isOnline && !getIsOnline(store.getState())) {
      store.dispatch(goOnline());
    } else if (!isOnline && getIsOnline(store.getState())) {
      store.dispatch(goOffline());
    }
  });
};

const configureRuntime = <
  ST extends RootState,
  ActionTypes extends Action
>(
  config: OfflineQueueRuntimeConfigInput<ST, ActionTypes>
) => {
  const intermediateConfig: Omit<
    OfflineQueueRuntimeConfig<ST, ActionTypes>,
    'mapDependentAction'
  > &
    Partial<Pick<OfflineQueueRuntimeConfig<ST, ActionTypes>, 'mapDependentAction'>> = config;

  if (!intermediateConfig.mapDependentAction) {
    intermediateConfig.mapDependentAction = createMapDependentActions(config);
  }

  const runtimeConfig: OfflineQueueRuntimeConfig<ST, ActionTypes> = intermediateConfig as OfflineQueueRuntimeConfig<ST, ActionTypes>;

  mapNetworkToState(config.store);
  queueProcessor(runtimeConfig);
};

export default configureRuntime;
