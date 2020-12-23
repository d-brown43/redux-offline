import { createOptimisticMiddleware } from "./middleware";
import { applyMiddleware, createStore, Store } from "redux";
import {
  createRootReducer,
  REPLACE_OFFLINE_STATE,
  setIsSyncing,
} from "./redux";
import { ApiAction, OfflineState } from "./types";

const reducer = (state: any = { seenActions: [] }, action: any) => {
  return { seenActions: state.seenActions.concat([action]) };
};

const rootReducer = createRootReducer(reducer);

const offlineState: OfflineState = {
  isSyncing: false,
  queue: [],
};
const getLast = (store: Store) =>
  store.getState().seenActions[store.getState().seenActions.length - 1];

const createStores = () => {
  const realStore = createStore(rootReducer);

  type PendingAction = {
    resolve: (value: any) => void;
  };

  const actions: PendingAction[] = [];

  const resolveActions = actions.forEach((a) => a.resolve(null));

  const middleware = createOptimisticMiddleware({
    store: realStore,
    config: {
      getRollbackAction: () => null,
      selector: (state) => state.offline,
      getFulfilledAction: () => null,
      rootReducer: (state) => state,
      makeApiRequest: () => {
        return new Promise((resolve) => {
          actions.push({
            resolve,
          });
        });
      },
      useBatching: false,
    },
    getState: () => offlineState,
  });

  const optimisticStore = createStore(rootReducer, applyMiddleware(middleware));

  return {
    realStore,
    optimisticStore,
    resolveActions,
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

  const action: ApiAction = {
    type: "SOME_API_ACTION",
    payload: {
      data: "stuff",
    },
    offline: {
      apiData: "the data",
      dependencyPaths: {
        path: "payload.data",
        type: "DATA_IDENTIFIER",
      },
    },
  };

  optimisticStore.subscribe(() => {
    expect(getLast(optimisticStore)).toEqual(action);
  });

  realStore.subscribe(() => {
    throw new Error("not expecting to receive a real action");
  });

  optimisticStore.dispatch(action);
});

it("passes action through if it is internal state management action", () => {
  const { optimisticStore, realStore } = createStores();

  const action = setIsSyncing(true);

  optimisticStore.subscribe(() => {
    expect(getLast(optimisticStore)).toEqual(action);
  });

  realStore.subscribe(() => {
    throw new Error("not expecting to receive a real action");
  });

  optimisticStore.dispatch(action);
});
