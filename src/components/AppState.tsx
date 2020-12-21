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

  return (
    <div>
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
  )
};

export default AppState;
