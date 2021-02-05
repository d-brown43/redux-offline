import { AnyAction, combineReducers } from 'redux';
import offlineReducer from '../offlineReducer';
import { OfflineAction } from '../types';

export const INCREASE_CLICK_COUNT = 'INCREASE_CLICK_COUNT';
export const DECREASE_CLICK_COUNT = 'DECREASE_CLICK_COUNT';
export const INCREASE_CLICK_COUNT_RESOLVED = 'INCREASE_CLICK_COUNT_RESOLVED';
export const DECREASE_CLICK_COUNT_RESOLVED = 'DECREASE_CLICK_COUNT_RESOLVED';

const initialState = {
  clickCount: 0,
};

const reducer = (state = initialState, action: AnyAction) => {
  switch (action.type) {
    case INCREASE_CLICK_COUNT:
    case INCREASE_CLICK_COUNT_RESOLVED:
      return {
        ...state,
        clickCount: state.clickCount + 1,
      };
    case DECREASE_CLICK_COUNT:
    case DECREASE_CLICK_COUNT_RESOLVED:
      return {
        ...state,
        clickCount: state.clickCount - 1,
      };
    default:
      return state;
  }
};

export const increaseClickCount = (): OfflineAction => ({
  type: INCREASE_CLICK_COUNT,
  offline: {
    networkEffect: {},
  },
});

export const decreaseClickCount = (): OfflineAction => ({
  type: DECREASE_CLICK_COUNT,
  offline: {
    networkEffect: {},
  },
});

const rootReducer = combineReducers({
  myState: reducer,
  offline: offlineReducer,
});

export default rootReducer;
