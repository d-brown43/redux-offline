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

type CreateTestObjectArgs = { title: string };
type TestObjectAction = AppAction<MyTestObject> & OfflineAction;
type CreateTestObject = AppActionCreator<CreateTestObjectArgs, TestObjectAction>;

type NonOptimisticArgs = boolean;
type NonOptimisticToggleAction = AppAction<boolean>;
type CreateNonOptimisticToggle = AppActionCreator<NonOptimisticArgs, NonOptimisticToggleAction>;

type SetCurrentObjectArgs = string | null;
type SetCurrentObjectAction = AppAction<SetCurrentObjectArgs> & OfflineAction;
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
    case SET_CURRENT_OBJECT:
      return {
        ...state,
        currentObjectId: action.payload,
      };
    default:
      return state;
  }
};

export default reducer;

export const dispatchFulfilledActions: DispatchFulfilledAction = (dispatch, optimisticAction, apiResponse) => {
  console.log('handling fullfilled action', optimisticAction, apiResponse);
  switch (optimisticAction.type) {
    case CREATE_TEST_OBJECT:
      dispatch({
        type: CREATE_TEST_OBJECT_RESOLVED,
        payload: {
          ...optimisticAction.offline.apiData.data,
          id: apiResponse,
        },
      });
      break;
    case SET_CURRENT_OBJECT: {
      console.log('dispatching SET_CURRENT_OBJECT', apiResponse);
      dispatch({
        type: SET_CURRENT_OBJECT,
        payload: apiResponse,
      });
    }
      break;
  }
};

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
      id: `temp_id_${uuidv4()}`,
      ...payloadData,
    },
    offline: {
      apiData: {
        type: 'test_object',
        data: payloadData,
      },
      dependencyPath: 'payload.id'
    }
  };
};

export const nonOptimisticToggle: CreateNonOptimisticToggle = (isOn) => ({
  type: NON_OPTIMISTIC_TOGGLE,
  payload: isOn,
});

export const setCurrentObject: CreateSetCurrentObject = (entityId) => ({
  type: SET_CURRENT_OBJECT,
  payload: entityId,
  offline: {
    dependsOn: entityId,
  },
});
