import { OptimisticConfig } from './internalTypes';
import { applyMiddleware, compose, Store } from 'redux';
import { Configure } from './types';
import { createOptimisticMiddleware } from './middleware';
import { reduxBatch } from '@manaflair/redux-batch';
import subscribeToQueue from './processQueue';
import { configureInternalConfig } from './configureInternal';

const makeRun = (configuredConfig: OptimisticConfig) => (
  optimisticStore: Store
) => {
  subscribeToQueue({ ...configuredConfig, optimisticStore });
};

const configure: Configure = (config) => {
  const internalConfig = configureInternalConfig(config);
  const optimisticMiddleware = createOptimisticMiddleware(internalConfig);

  const { useBatching = true } = config;

  const storeEnhancer = useBatching
    ? compose(reduxBatch, applyMiddleware(optimisticMiddleware), reduxBatch)
    : applyMiddleware(optimisticMiddleware);

  const run = makeRun(internalConfig);

  return {
    storeEnhancer,
    run,
    store: internalConfig.store,
  };
};

export default configure;
