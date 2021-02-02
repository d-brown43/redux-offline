import { AppAction, AppActionCreator, AppReducer } from './types';
import { getTempId } from '../utils';
import {
  API_CREATE_MULTIPLE_TEST_OBJECTS,
  API_CREATE_TEST_OBJECT,
} from './api';
import {
  GetResolvedAction,
  GetRejectionAction,
  OfflineAction,
  ResourceIdentifier,
  createArrayDependencyPaths,
} from '../offlineModule';

export type MyTestObject = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type TestObjectArgs = Partial<MyTestObject>;

export type TestState = {
  entities: MyTestObject[];
  toggleIsOn: boolean;
  currentObjectId: string | null;
  errors: string[];
};

const initialState: TestState = {
  entities: [],
  toggleIsOn: false,
  currentObjectId: null,
  errors: [],
};

const CREATE_TEST_OBJECT = 'CREATE_TEST_OBJECT';
const CREATE_TEST_OBJECT_RESOLVED = 'CREATE_TEST_OBJECT_RESOLVED';
const CREATE_ARRAY_TEST_OBJECT = 'CREATE_ARRAY_TEST_OBJECT';
const CREATE_ARRAY_TEST_OBJECT_RESOLVED = 'CREATE_ARRAY_TEST_OBJECT_RESOLVED';
const NON_OPTIMISTIC_TOGGLE = 'NON_OPTIMISTIC_TOGGLE';
const SET_CURRENT_OBJECT = 'SET_CURRENT_OBJECT';
const CREATE_ERROR = 'CREATE_ERROR';

type CreateTestObjectArgs = {
  title: string;
  fails: boolean;
};
type TestObjectAction = AppAction<MyTestObject> & OfflineAction;
type CreateTestObject = AppActionCreator<
  CreateTestObjectArgs,
  TestObjectAction
>;

type ArrayTestObject = AppAction<TestObjectArgs[]> & OfflineAction;
type CreateArrayTestObject = AppActionCreator<
  TestObjectArgs[],
  ArrayTestObject
>;

type NonOptimisticArgs = boolean;
type NonOptimisticToggleAction = AppAction<boolean>;
type CreateNonOptimisticToggle = AppActionCreator<
  NonOptimisticArgs,
  NonOptimisticToggleAction
>;

type CreateErrorArgs = string;
type CreateErrorAction = AppAction<CreateErrorArgs>;
type CreateCreateErrorAction = AppActionCreator<
  CreateErrorArgs,
  CreateErrorAction
>;

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
    case CREATE_ARRAY_TEST_OBJECT:
      return {
        ...state,
        entities: state.entities.concat(action.payload),
      };
    case CREATE_ARRAY_TEST_OBJECT_RESOLVED:
      // As the resolved action is operating on the "real" state,
      // we don't need to do any state comparisons for when we create objects
      return {
        ...state,
        entities: state.entities.concat(action.payload.nested),
      };
    default:
      return state;
  }
};

const getMyObjectUniqueIdentifier = (fieldName: keyof MyTestObject) => (
  objectId: MyTestObject['id']
) => `${objectId}:${fieldName}`;

const getIdIdentifier = getMyObjectUniqueIdentifier('id');
const getTitleIdentifier = getMyObjectUniqueIdentifier('title');

export default reducer;

export const createTestObject: CreateTestObject = ({ title, fails }) => {
  const now = new Date().toISOString();
  const payloadData = {
    title,
    createdAt: now,
    updatedAt: now,
  };
  const id = getTempId();
  const dependencyPaths: ResourceIdentifier[] = [
    {
      path: 'payload.id',
      uniqueIdentifier: getIdIdentifier(id),
    },
  ];
  return {
    type: CREATE_TEST_OBJECT,
    payload: {
      id,
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
    },
  };
};

const createTestObjectResolved = (
  optimisticObject: MyTestObject,
  testObject: MyTestObject
) => {
  const resolvedDependencies: ResourceIdentifier[] = [
    {
      path: 'payload.nested.id',
      uniqueIdentifier: getIdIdentifier(optimisticObject.id),
    },
  ];
  return {
    type: CREATE_TEST_OBJECT_RESOLVED,
    payload: {
      nested: testObject,
    },
    offline: {
      // States the data that has changed from the original action to this one,
      // and where it changed from in the original action
      // E.g. if the API modifies the Id of an entity, and we are creating an action
      // to update this, we need to say where this new id can be found within this action,
      // and where the id field was in the original action
      resolvedDependencies,
    },
  };
};

export const createArrayTestObjects: CreateArrayTestObject = (testObjects) => {
  const dependencyPaths = [
    ...createArrayDependencyPaths({
      prefix: 'payload',
      data: testObjects,
      postfix: 'id',
      uniqueId: (testObject) =>
        getIdIdentifier(testObject.id as MyTestObject['id']),
    }),
    ...createArrayDependencyPaths({
      prefix: 'payload',
      data: testObjects,
      postfix: 'title',
      uniqueId: (testObject) =>
        getTitleIdentifier(testObject.id as MyTestObject['id']),
    }),
  ];
  return {
    type: CREATE_ARRAY_TEST_OBJECT,
    payload: testObjects,
    offline: {
      apiData: {
        type: API_CREATE_MULTIPLE_TEST_OBJECTS,
        data: testObjects,
        fails: false,
      },
      dependencyPaths,
    },
  };
};

export const createArrayTestObjectsResolved = (
  optimistic: MyTestObject[],
  updated: MyTestObject[]
) => ({
  type: CREATE_ARRAY_TEST_OBJECT_RESOLVED,
  payload: {
    nested: updated,
  },
  offline: {
    resolvedDependencies: [
      ...createArrayDependencyPaths({
        prefix: 'payload.nested',
        data: updated,
        postfix: 'id',
        uniqueId: (_, i) => getIdIdentifier(optimistic[i].id),
      }),
      ...createArrayDependencyPaths({
        prefix: 'payload.nested',
        data: updated,
        postfix: 'title',
        uniqueId: (_, i) => getTitleIdentifier(optimistic[i].id),
      }),
    ],
  },
});

export const nonOptimisticToggle: CreateNonOptimisticToggle = (isOn) => ({
  type: NON_OPTIMISTIC_TOGGLE,
  payload: isOn,
});

export const setCurrentObject = (object: MyTestObject | null) => ({
  type: SET_CURRENT_OBJECT,
  payload: object ? object.id : null,
  ...(!object
    ? {}
    : {
        offline: {
          dependsOn: {
            path: 'payload',
            uniqueIdentifier: getIdIdentifier(object.id),
          },
        },
      }),
});

export const addError: CreateCreateErrorAction = (error) => ({
  type: CREATE_ERROR,
  payload: error,
});

export const getFulfilledActions: GetResolvedAction = (
  optimisticAction,
  apiResponse
) => {
  switch (optimisticAction.type) {
    case CREATE_TEST_OBJECT:
      return createTestObjectResolved(optimisticAction.payload, apiResponse);
    case CREATE_ARRAY_TEST_OBJECT:
      return createArrayTestObjectsResolved(
        optimisticAction.payload,
        apiResponse
      );
    default:
      return null;
  }
};

export const getRollbackActions: GetRejectionAction = (
  optimisticAction,
  apiResponse
) => {
  switch (optimisticAction.type) {
    case CREATE_TEST_OBJECT:
      return addError(
        `Failed to create object: "${
          optimisticAction.payload.title
        }", found error: ${apiResponse.toString()}`
      );
    default:
      return null;
  }
};
