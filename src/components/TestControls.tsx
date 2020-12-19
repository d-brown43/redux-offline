import React from 'react';
import {useDispatch, useSelector} from "react-redux";
import {createTestObject, nonOptimisticToggle} from "../store/test";
import {State} from "../store/rootReducer";

const TestControls = () => {
  const dispatch = useDispatch();
  const isOn = useSelector<State>(state => state.test.toggleIsOn);

  const testAction = () => {
    dispatch(createTestObject({title: 'Test Object'}));
  };

  const testToggle = () => {
    dispatch(nonOptimisticToggle(!isOn));
  };

  return (
    <div>
      <button type="button" onClick={testAction}>Create Test Object</button>
      <button type="button" onClick={testToggle}>Toggle</button>
    </div>
  )
};

export default TestControls;
