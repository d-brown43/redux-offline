import React, {useEffect, useState} from 'react';
import configureStore, {StoreType} from '../store';
import {Provider} from "react-redux";
import StoreState from "./StoreState";
import TestControls from "./TestControls";
import {TruthProvider} from "../offlineModule";

const TestHarness = () => {
  const [stores, setStores] = useState<{ store: StoreType, optimisticStore: StoreType } | null>(null);

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
        <h2>Optimistic State</h2>
        <StoreState store={stores.optimisticStore} />
        <h2>Real State</h2>
        <StoreState store={stores.store} />
      </TruthProvider>
    </Provider>
  )
};

export default TestHarness;
