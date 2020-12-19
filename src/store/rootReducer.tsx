import offlineReducer, {OfflineState} from './offline';
import testReducer, {TestState} from './test';
import {combineReducers} from "redux";

export type State = {
  offline: OfflineState
  test: TestState
};

const rootReducer = combineReducers({
  offline: offlineReducer,
  test: testReducer,
});

export const getOffline = (state: State) => state.offline;

export default rootReducer;
