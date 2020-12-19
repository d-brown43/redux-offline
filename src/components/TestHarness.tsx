import React, {useEffect, useState} from 'react';
import configureStore, {StoreType} from '../store';
import {Provider} from "react-redux";
import StoreState from "./StoreState";
import TestControls from "./TestControls";

const TestHarness = () => {
  const [store, setStore] = useState<StoreType | null>(null);

  useEffect(() => {
    const store = configureStore();
    setStore(store);
  }, []);

  if (!store) {
    return null;
  }

  return (
    <Provider store={store}>
      <TestControls />
      <StoreState />
    </Provider>
  )
};

export default TestHarness;
