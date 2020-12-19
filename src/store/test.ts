import {v4 as uuidv4} from 'uuid';
import {AppAction, AppActionCreator, AppReducer} from "./types";
import {OfflineAction} from "./offline";
import {AnyAction} from "redux";

export type MyTestObject = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export type TestState = {
  entities: MyTestObject[]
}

const initialState: TestState = {
  entities: []
};

const CREATE_TEST_OBJECT = 'CREATE_TEST_OBJECT';
const CREATE_TEST_OBJECT_RESOLVED = 'CREATE_TEST_OBJECT_RESOLVED';

type CreateTestObjectArgs = { title: string };
type TestObjectAction = AppAction<MyTestObject> & OfflineAction;
type CreateTestObject = AppActionCreator<CreateTestObjectArgs, TestObjectAction>;

type AllActions = TestObjectAction;

const reducer: AppReducer<TestState, AllActions> = (state = initialState, action) => {
  switch (action.type) {
    case CREATE_TEST_OBJECT_RESOLVED:
      return {
        ...state,
        entities: state.entities.concat([action.payload]),
      };
  }
  return state;
};

export default reducer;

export const createTestObject: CreateTestObject = ({title}) => {
  const now = new Date().toISOString();
  const actionData = {
    payload: {
      id: uuidv4(),
      title,
      createdAt: now,
      updatedAt: now,
    }
  };
  return {
    type: CREATE_TEST_OBJECT,
    ...actionData,
    offline: {
      apiData: 'some-api-data',
      makeFulfilledAction: (apiResponse: any) => {
        console.log('Deriving the fulfilled action based on api response:', apiResponse);
        return {
          type: CREATE_TEST_OBJECT_RESOLVED,
          ...actionData,
        };
      }
    }
  };
};
