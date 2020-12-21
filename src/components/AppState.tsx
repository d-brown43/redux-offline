import React from 'react';
import {State} from "../store/rootReducer";
import {useSelector} from "react-redux";
import {MyTestObject} from "../store/test";

const AppState = () => {
  const entities = useSelector<State, MyTestObject[]>(state => state.test.entities);
  const selectedObject = useSelector<State, MyTestObject | null>(state => {
    const selectedEntityId = state.test.currentObjectId;
    if (selectedEntityId) {
      const result = state.test.entities.find(({id}) => id === selectedEntityId);
      if (result) return result;
    }
    return null;
  });
  const isToggled = useSelector<State, boolean>(state => state.test.toggleIsOn);
  const errors = useSelector<State, string[]>(state => state.test.errors);

  return (
    <div>
      <div>
        <label>Other state</label>
        <div>Toggled: {isToggled ? 'true' : 'false'}</div>
      </div>
      <div style={{marginTop: '32px'}}>
        <label>Selected: {selectedObject?.title}</label>
        <ul>
          {entities.map(entity => (
            <li key={entity.id}>
            <span>
              {entity.title}
            </span>
            </li>
          ))}
        </ul>
      </div>
      <div style={{marginTop: '32px'}}>
        {errors.map((error, i) => (
          <div key={i} style={{marginTop: '8px'}}>
            {error}
          </div>
        ))}
      </div>
    </div>
  )
};

export default AppState;
