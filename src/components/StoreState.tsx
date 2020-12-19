import React from "react";
import {useSelector} from "react-redux";

const StoreState = () => {
  const state = useSelector(state => state);

  return (
    <div>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
};

export default StoreState;
