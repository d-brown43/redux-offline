import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createArrayTestObjects,
  createTestObject,
  MyTestObject,
  nonOptimisticToggle,
  setCurrentObject,
} from '../store/test';
import { State } from '../store/rootReducer';
import { getTempId } from '../utils';

const TestControls = () => {
  const dispatch = useDispatch();
  const isOn = useSelector<State>((state) => state.test.toggleIsOn);
  const latestEntity = useSelector<State, MyTestObject | null>((state) =>
    state.test.entities.length > 0
      ? state.test.entities[state.test.entities.length - 1]
      : null
  );
  const [testObjectCount, setTestObjectCount] = useState(0);

  const testAction = () => {
    dispatch(
      createTestObject({
        title: `Test Object ${testObjectCount}`,
        fails: false,
      })
    );
    setTestObjectCount((prevCount) => prevCount + 1);
  };

  const createFailTestAction = () => {
    dispatch(
      createTestObject({ title: `Test Object ${testObjectCount}`, fails: true })
    );
    setTestObjectCount((prevCount) => prevCount + 1);
  };

  const testToggle = () => {
    dispatch(nonOptimisticToggle(!isOn));
  };

  const currentObject = () => {
    dispatch(setCurrentObject(latestEntity));
  };

  const createArrayObjects = () => {
    const objects: MyTestObject[] = Array.from(Array(3)).map((_, i) => ({
      id: getTempId(),
      title: `test object ${i + 1}`,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    }));
    dispatch(createArrayTestObjects(objects));
  };

  return (
    <div>
      <button type="button" onClick={testAction}>
        Create Test Object
      </button>
      <button type="button" onClick={createFailTestAction}>
        Create Fail Test Object
      </button>
      <button type="button" onClick={testToggle}>
        Toggle
      </button>
      <button type="button" onClick={currentObject}>
        Set Current
      </button>
      <button type="button" onClick={createArrayObjects}>
        Create array objects
      </button>
    </div>
  );
};

export default TestControls;
