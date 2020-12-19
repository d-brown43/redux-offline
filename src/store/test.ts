import {v4 as uuidv4} from 'uuid';
import {AppAction, AppActionCreator, AppReducer} from "./types";
import {DispatchFulfilledAction, OfflineAction} from "../offlineModule";

export type MyTestObject = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export type TestState = {
  entities: MyTestObject[]
  toggleIsOn: boolean
}

const initialState: TestState = {
  entities: [],
  toggleIsOn: false,
};

const CREATE_TEST_OBJECT = 'CREATE_TEST_OBJECT';
const CREATE_TEST_OBJECT_RESOLVED = 'CREATE_TEST_OBJECT_RESOLVED';
const NON_OPTIMISTIC_TOGGLE = 'NON_OPTIMISTIC_TOGGLE';

type CreateTestObjectArgs = { title: string };
type TestObjectAction = AppAction<MyTestObject> & OfflineAction;
type CreateTestObject = AppActionCreator<CreateTestObjectArgs, TestObjectAction>;

type NonOptimisticArgs = boolean;
type NonOptimisticToggleAction = AppAction<boolean>;
type CreateNonOptimisticToggle = AppActionCreator<NonOptimisticArgs, NonOptimisticToggleAction>;

export const optimisticReducer: AppReducer<TestState> = (state = initialState, action) => {
  switch (action.type) {
    case CREATE_TEST_OBJECT:
      return {
        ...state,
        entities: state.entities.concat([action.payload]),
      };
    default:
      return state;
  }
};

const reducer: AppReducer<TestState> = (state = initialState, action) => {
  switch (action.type) {
    case CREATE_TEST_OBJECT_RESOLVED:
      return {
        ...state,
        entities: state.entities.concat([action.payload]),
      };
    case NON_OPTIMISTIC_TOGGLE:
      return {
        ...state,
        toggleIsOn: action.payload,
      };
    default:
      return state;
  }
};

export default reducer;

export const dispatchFulfilledActions: DispatchFulfilledAction = (dispatch, optimisticAction, apiResponse) => {
  switch (optimisticAction.type) {
    case CREATE_TEST_OBJECT: {
      dispatch({
        type: CREATE_TEST_OBJECT_RESOLVED,
        payload: optimisticAction.payload,
      });
    }
  }
};

export const createTestObject: CreateTestObject = ({title}) => {
  const now = new Date().toISOString();
  return {
    type: CREATE_TEST_OBJECT,
    payload: {
      id: uuidv4(),
      title,
      createdAt: now,
      updatedAt: now,
    },
    offline: {
      apiData: 'some-api-data',
    }
  };
};

export const nonOptimisticToggle: CreateNonOptimisticToggle = (isOn) => ({
  type: NON_OPTIMISTIC_TOGGLE,
  payload: isOn,
});
