import React from 'react';
import {useDispatch} from "react-redux";
import {createTestObject} from "../store/test";

const TestControls = () => {
  const dispatch = useDispatch();

  const testAction = () => {
    dispatch(createTestObject({title: 'Test Object'}));
  };

  return (
    <div>
      <button type="button" onClick={testAction}>Create Test Object</button>
    </div>
  )
};

export default TestControls;
