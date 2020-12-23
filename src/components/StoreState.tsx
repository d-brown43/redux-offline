import React, { useEffect, useState } from "react";
import { Store } from "redux";

type StoreStateProps = {
  store: Store;
};

const StoreState = ({ store }: StoreStateProps) => {
  const [state, setState] = useState();

  useEffect(() => {
    setState(store.getState());
    return store.subscribe(() => {
      setState(store.getState());
    });
  }, [store]);

  return (
    <div>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
};

export default StoreState;
