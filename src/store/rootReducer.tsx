import testReducer, {
  TestState,
  getFulfilledActions,
  optimisticReducer as testOptimisticReducer,
  optimisticPassThrough as testOptimisticPassThrough
} from './test';
import {combineReducers} from "redux";
import {mergeGetFulfilledActions, mergePassthroughs, offlineReducer, OfflineState} from "../offlineModule";

export const mergedGetFulfilledAction = mergeGetFulfilledActions(
  getFulfilledActions,
);

export const mergedPassthroughs = mergePassthroughs(
  testOptimisticPassThrough,
);

export type State = {
  offline: OfflineState
  test: TestState
};

export const rootOptimisticReducer = combineReducers({
  offline: offlineReducer,
  test: testOptimisticReducer,
});

const rootReducer = combineReducers({
  test: testReducer,
});

export const getOffline = (state: State) => state.offline;

export default rootReducer;
