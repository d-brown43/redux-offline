import testReducer, {
  TestState,
  dispatchFulfilledActions,
  optimisticReducer as testOptimisticReducer,
  optimisticPassthrough
} from './test';
import {combineReducers} from "redux";
import {mergeFulfilledHandlers, mergePassthroughs, offlineReducer, OfflineState} from "../offlineModule";

export const mergedFulfilledHandlers = mergeFulfilledHandlers(
  dispatchFulfilledActions,
);

export const mergedPassthroughs = mergePassthroughs(
  optimisticPassthrough,
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
  offline: offlineReducer,
  test: testReducer,
});

export const getOffline = (state: State) => state.offline;

export default rootReducer;
