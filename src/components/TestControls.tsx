import React from 'react';
import {useDispatch, useSelector} from "react-redux";
import {createTestObject, nonOptimisticToggle, setCurrentObject} from "../store/test";
import {State} from "../store/rootReducer";

const TestControls = () => {
  const dispatch = useDispatch();
  const isOn = useSelector<State>(state => state.test.toggleIsOn);
  const latestEntityId = useSelector<State, string | null>(
    state => state.test.entities.length > 0
      ? state.test.entities[state.test.entities.length - 1].id
      : null
  );

  const testAction = () => {
    dispatch(createTestObject({title: 'Test Object'}));
  };

  const testToggle = () => {
    dispatch(nonOptimisticToggle(!isOn));
  };

  const currentObject = () => {
    dispatch(setCurrentObject(latestEntityId));
  };

  return (
    <div>
      <button type="button" onClick={testAction}>Create Test Object</button>
      <button type="button" onClick={testToggle}>Toggle</button>
      <button type="button" onClick={currentObject}>Set Current</button>
    </div>
  )
};

export default TestControls;
