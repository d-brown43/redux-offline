import React, {createContext} from "react";
import {Store} from "redux";

const OptimisticStoreContext = createContext<Store | null>(null);

type ProviderProps = {
  store: Store,
  children: any
}

const Provider = ({store, children}: ProviderProps) => {
  return (
    <OptimisticStoreContext.Provider value={store}>
      {children}
    </OptimisticStoreContext.Provider>
  );
};

export default Provider;
