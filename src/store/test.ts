import {AppAction, AppActionCreator, AppReducer} from "./types";
import {
  GetFulfilledAction, GetRollbackAction,
  OfflineAction, ResolvedDependencies, ResourceIdentifier,
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
  errors: string[],
}

const initialState: TestState = {
  entities: [],
  toggleIsOn: false,
  currentObjectId: null,
  errors: [],
};

const CREATE_TEST_OBJECT = 'CREATE_TEST_OBJECT';
const CREATE_TEST_OBJECT_RESOLVED = 'CREATE_TEST_OBJECT_RESOLVED';
const NON_OPTIMISTIC_TOGGLE = 'NON_OPTIMISTIC_TOGGLE';
const SET_CURRENT_OBJECT = 'SET_CURRENT_OBJECT';
const CREATE_ERROR = 'CREATE_ERROR';

const ApiResourceTypes = {
  TEST_OBJECT_ID: 'TEST_OBJECT:id',
};

type CreateTestObjectArgs = { title: string, fails: boolean };
type TestObjectAction = AppAction<MyTestObject> & OfflineAction;
type CreateTestObject = AppActionCreator<CreateTestObjectArgs, TestObjectAction>;

type NonOptimisticArgs = boolean;
type NonOptimisticToggleAction = AppAction<boolean>;
type CreateNonOptimisticToggle = AppActionCreator<NonOptimisticArgs, NonOptimisticToggleAction>;

type SetCurrentObjectArgs = string | null;
type SetCurrentObjectAction = AppAction<SetCurrentObjectArgs>;
type CreateSetCurrentObject = AppActionCreator<SetCurrentObjectArgs, SetCurrentObjectAction>;

type CreateErrorArgs = string;
type CreateErrorAction = AppAction<CreateErrorArgs>;
type CreateCreateErrorAction = AppActionCreator<CreateErrorArgs, CreateErrorAction>;

const reducer: AppReducer<TestState> = (state = initialState, action) => {
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
    case CREATE_TEST_OBJECT_RESOLVED:
      return {
        ...state,
        entities: state.entities.concat([action.payload.nested]),
      };
    case NON_OPTIMISTIC_TOGGLE:
      return {
        ...state,
        toggleIsOn: action.payload,
      };
    case CREATE_ERROR:
      return {
        ...state,
        errors: state.errors.concat([action.payload]),
      };
    default:
      return state;
  }
};

export default reducer;

export const createTestObject: CreateTestObject = ({title, fails}) => {
  const now = new Date().toISOString();
  const payloadData = {
    title,
    createdAt: now,
    updatedAt: now,
  };
  const dependencyPaths: ResourceIdentifier[] = [
    {
      path: 'payload.id',
      type: ApiResourceTypes.TEST_OBJECT_ID,
    }
  ];
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
        fails,
      },
      // States what the API will change
      dependencyPaths,
    }
  };
};

const createTestObjectResolved = (testObject: MyTestObject) => {
  const resolvedDependencies: ResolvedDependencies = [
    [
      // TODO Do I need the original location?
      // Not sure I do?
      {
        path: 'payload.id',
        type: ApiResourceTypes.TEST_OBJECT_ID,
      },
      {
        path: 'payload.nested.id',
        type: ApiResourceTypes.TEST_OBJECT_ID,
      }
    ]
  ];
  return ({
    type: CREATE_TEST_OBJECT_RESOLVED,
    payload: {
      nested: testObject
    },
    offline: {
      // States the data that has changed from the original action to this one,
      // and where it changed from in the original action
      // E.g. if the API modifies the Id of an entity, and we are creating an action
      // to update this, we need to say where this new id can be found within this action,
      // and where the id field was in the original action
      resolvedDependencies,
    }
  });
};

export const nonOptimisticToggle: CreateNonOptimisticToggle = (isOn) => ({
  type: NON_OPTIMISTIC_TOGGLE,
  payload: isOn,
});

export const setCurrentObject: CreateSetCurrentObject = (objectId) => ({
  type: SET_CURRENT_OBJECT,
  payload: objectId,
  offline: {
    dependsOn: {
      path: 'payload',
      type: ApiResourceTypes.TEST_OBJECT_ID
    },
  }
});

export const addError: CreateCreateErrorAction = (error) => ({
  type: CREATE_ERROR,
  payload: error,
});

export const getFulfilledActions: GetFulfilledAction = (optimisticAction, apiResponse) => {
  switch (optimisticAction.type) {
    case CREATE_TEST_OBJECT:
      return createTestObjectResolved(apiResponse);
    default:
      return null;
  }
};

export const getRollbackActions: GetRollbackAction = (optimisticAction, apiResponse) => {
  switch (optimisticAction.type) {
    case CREATE_TEST_OBJECT:
      return addError(`Failed to create object: "${optimisticAction.payload.title}", found error: ${apiResponse.toString()}`);
    default:
      return null;
  }
};
