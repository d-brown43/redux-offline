import { createOptimisticMiddleware } from "./middleware";
import { applyMiddleware, createStore, Store } from "redux";
import { createRootReducer, REPLACE_OFFLINE_STATE } from "./redux";
import { OfflineState } from "./types";

const reducer = (state: any = { seenActions: [] }, action: any) => {
  return { seenActions: state.seenActions.concat([action]) };
};

const rootReducer = createRootReducer(reducer);

const offlineState: OfflineState = {
  isSyncing: false,
  queue: [],
};
const getLast = (store: Store) =>
  store.getState().seenactions[store.getState().seenactions.length - 1];

const createStores = () => {
  const realStore = createStore(rootReducer);

  const middleware = createOptimisticMiddleware({
    store: realStore,
    config: {
      getRollbackAction: () => null,
      selector: (state) => state.offline,
      getFulfilledAction: () => null,
      rootReducer: (state) => state,
      makeApiRequest: () => Promise.resolve(),
      useBatching: false,
    },
    getState: () => offlineState,
  });

  const optimisticStore = createStore(rootReducer, applyMiddleware(middleware));

  return {
    realStore,
    optimisticStore,
  };
};

it("updates real state if no offline metadata", () => {
  const { optimisticStore, realStore } = createStores();

  const action = {
    type: "some_app_action",
    payload: {
      field: "data",
    },
  };

  optimisticStore.dispatch(action);

  realStore.subscribe(() => {
    expect(getLast(realStore)).toEqual(action);
  });

  // Use a promise due to actions being dispatched to the real store before
  // rebuilding the optimistic store
  let promise = new Promise<undefined>((resolve) => {
    optimisticStore.subscribe(() => {
      try {
        expect(getLast(optimisticStore).type).toEqual(REPLACE_OFFLINE_STATE);
        resolve(undefined);
      } catch (e) {}
    });
  });

  optimisticStore.dispatch(action);

  return promise;
});

it("passes action through if an optimistic action", () => {
  const { optimisticStore, realStore } = createStores();
});

it.todo("passes action through if it is internal state management action");
