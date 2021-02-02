import React, { useEffect, useState } from 'react';
import configureStore, { StoreType } from '../store';
import { Provider } from 'react-redux';
import TestControls from './TestControls';
import { TruthProvider } from '../offlineModule';
import AppState from './AppState';

const TestHarness = () => {
  const [stores, setStores] = useState<{
    store: StoreType;
    optimisticStore: StoreType;
  } | null>(null);

  useEffect(() => {
    setStores(configureStore());
  }, []);

  if (!stores) {
    return null;
  }

  return (
    <Provider store={stores.optimisticStore}>
      <TruthProvider store={stores.store}>
        <TestControls />
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            marginTop: '32px',
          }}
        >
          <div style={{ flexGrow: 1 }}>
            <h2>Optimistic State</h2>
            <Provider store={stores.optimisticStore}>
              <AppState />
            </Provider>
          </div>
          <div style={{ marginLeft: '32px', flexGrow: 1 }}>
            <h2>Real State</h2>
            <Provider store={stores.store}>
              <AppState />
            </Provider>
          </div>
        </div>
      </TruthProvider>
    </Provider>
  );
};

export default TestHarness;
