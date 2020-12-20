import {AppAction, AppActionCreator, AppReducer} from "./types";
import {
  ApiAction,
  GetFulfilledAction,
  OfflineAction,
  OptimisticPassThrough
} from "../offlineModule";
import {getTempId} from "../utils";
import {API_CREATE_TEST_OBJECT} from "./api";

export type MyTestObject = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export type TestState = {
  entities: MyTestObject[]
  toggleIsOn: boolean
  currentObjectId: string | null,
}

const initialState: TestState = {
  entities: [],
  toggleIsOn: false,
  currentObjectId: null,
};

const CREATE_TEST_OBJECT = 'CREATE_TEST_OBJECT';
const CREATE_TEST_OBJECT_RESOLVED = 'CREATE_TEST_OBJECT_RESOLVED';
const NON_OPTIMISTIC_TOGGLE = 'NON_OPTIMISTIC_TOGGLE';
const SET_CURRENT_OBJECT = 'SET_CURRENT_OBJECT';
const SET_CURRENT_OBJECT_RESOLVED = 'SET_CURRENT_OBJECT_RESOLVED';

type CreateTestObjectArgs = { title: string };
type TestObjectAction = AppAction<MyTestObject> & OfflineAction;
type CreateTestObject = AppActionCreator<CreateTestObjectArgs, TestObjectAction>;

type NonOptimisticArgs = boolean;
type NonOptimisticToggleAction = AppAction<boolean>;
type CreateNonOptimisticToggle = AppActionCreator<NonOptimisticArgs, NonOptimisticToggleAction>;

type SetCurrentObjectArgs = string | null;
type SetCurrentObjectAction = AppAction<SetCurrentObjectArgs>;
type CreateSetCurrentObject = AppActionCreator<SetCurrentObjectArgs, SetCurrentObjectAction>;

export const optimisticReducer: AppReducer<TestState> = (state = initialState, action) => {
  switch (action.type) {
    case CREATE_TEST_OBJECT:
      return {
        ...state,
        entities: state.entities.concat([action.payload]),
      };
    case SET_CURRENT_OBJECT:
      return {
        ...state,
        currentObjectId: action.payload,
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
    case SET_CURRENT_OBJECT_RESOLVED:
      return {
        ...state,
        currentObjectId: action.payload,
      };
    default:
      return state;
  }
};

export default reducer;

export const createTestObject: CreateTestObject = ({title}) => {
  const now = new Date().toISOString();
  const payloadData = {
    title,
    createdAt: now,
    updatedAt: now,
  };
  return {
    type: CREATE_TEST_OBJECT,
    payload: {
      id: getTempId(),
      ...payloadData,
    },
    offline: {
      apiData: {
        type: API_CREATE_TEST_OBJECT,
        data: payloadData,
      },
      dependencyPath: 'payload.id'
    }
  };
};

const createTestObjectResolved = (testObject: MyTestObject) => ({
  type: CREATE_TEST_OBJECT_RESOLVED,
  payload: testObject,
  offline: {
    dependencyPath: 'payload.id',
  }
});

export const nonOptimisticToggle: CreateNonOptimisticToggle = (isOn) => ({
  type: NON_OPTIMISTIC_TOGGLE,
  payload: isOn,
});

export const setCurrentObject: CreateSetCurrentObject = (objectId) => ({
  type: SET_CURRENT_OBJECT,
  payload: objectId,
  offline: {
    dependsOn: 'payload',
  }
});

const setCurrentObjectResolved = (objectId: string) => ({
  type: SET_CURRENT_OBJECT_RESOLVED,
  payload: objectId,
  offline: {
    dependencyPath: 'payload',
  }
});

export const getFulfilledActions: GetFulfilledAction = (optimisticAction, apiResponse) => {
  switch (optimisticAction.type) {
    case CREATE_TEST_OBJECT:
      return createTestObjectResolved(apiResponse);
    case SET_CURRENT_OBJECT:
      return setCurrentObjectResolved(apiResponse.id);
    default:
      return null;
  }
};

export const optimisticPassThrough: OptimisticPassThrough = (optimisticAction) => {
  switch (optimisticAction.type) {
    case SET_CURRENT_OBJECT:
      return setCurrentObjectResolved(optimisticAction.payload);
    default:
      return null;
  }
};
