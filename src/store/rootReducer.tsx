import testReducer, {
  TestState,
  getFulfilledActions,
} from './test';
import {combineReducers} from "redux";
import {mergeGetFulfilledActions, offlineReducer, OfflineState} from "../offlineModule";

export const mergedGetFulfilledAction = mergeGetFulfilledActions(
  getFulfilledActions,
);

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
