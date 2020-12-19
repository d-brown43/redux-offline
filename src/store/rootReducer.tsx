import testReducer, {TestState, dispatchFulfilledActions, optimisticReducer as testOptimisticReducer} from './test';
import {combineReducers} from "redux";
import {mergeFulfilledHandlers, offlineReducer, OfflineState} from "../offlineModule";

export const mergedFulfilledHandlers = mergeFulfilledHandlers(
  dispatchFulfilledActions,
);

export type State = {
  offline: OfflineState
  test: TestState
};

export const rootOptimisticReducer = combineReducers({
  offline: testOptimisticReducer,
});

const rootReducer = combineReducers({
  offline: offlineReducer,
  test: testReducer,
});

export const getOffline = (state: State) => state.offline;

export default rootReducer;
