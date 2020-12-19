import {AnyAction, Store} from "redux";

type MakeFulfilledAction = AnyAction | ((apiResponse: any) => AnyAction);

type OfflineMetadata = {
  apiData?: any
  makeFulfilledAction?: MakeFulfilledAction
}

export interface OfflineAction extends AnyAction {
  offline: OfflineMetadata
}

export type OfflineState = {
  queue: AnyAction[]
  isSyncing: boolean
}

export type OfflineConfig = {
  selector: (state: any) => OfflineState
}

const isOfflineAction = (action: AnyAction): action is OfflineAction => 'offline' in action;

const initialState: OfflineState = {
  queue: [],
  isSyncing: false,
};

const SET_IS_SYNCING = 'SET_IS_SYNCING';
const MARK_ACTION_AS_PROCESSED = 'MARK_ACTION_AS_PROCESSED';

const reducer = (state = initialState, action: AnyAction) => {
  if (isOfflineAction(action)) {
    return {
      ...state,
      queue: [
        ...state.queue,
        action,
      ]
    }
  }
  switch (action.type) {
    case SET_IS_SYNCING:
      return {
        ...state,
        isSyncing: action.payload,
      };
    case MARK_ACTION_AS_PROCESSED:
      return {
        ...state,
        queue: state.queue.filter(a => a !== action.payload),
      };
    default:
      return state;
  }
};

export default reducer;

const setIsSyncing = (isSyncing: boolean) => ({
  type: SET_IS_SYNCING,
  payload: isSyncing,
});

const markActionAsProcessed = (action: OfflineAction) => {
  console.log('marking action as processed');
  return {
    type: MARK_ACTION_AS_PROCESSED,
    payload: action,
  };
};

type GetOfflineState = () => OfflineState;

const makeHasOptionalField = (fieldName: keyof OfflineMetadata) => (action: OfflineAction) => {
  return fieldName in action.offline;
};

const actionHasSideEffect = makeHasOptionalField('apiData');

const dispatchFulfilledAction = (
  store: Store,
  makeFulfilledAction: MakeFulfilledAction,
  apiResponse: any,
) => {
  console.log('dispatching fulfilled action');
  if (typeof makeFulfilledAction === 'function') {
    return store.dispatch(makeFulfilledAction(apiResponse));
  } else {
    store.dispatch(makeFulfilledAction);
  }
};

const fakeSuccessApi = (apiData: any) => {
  return new Promise(resolve => {
    console.log('making fake request with data', apiData);
    window.setTimeout(() => {
      console.log('resolving response for request data', apiData);
      resolve('some data');
    }, 1000);
  });
};

const startSyncing = (store: Store, getOfflineState: GetOfflineState) => {
  const state = getOfflineState();
  if (state.queue.length > 0) {
    const action = state.queue[0];
    if (isOfflineAction(action)) {
      return Promise.resolve()
        .then(() => {
          if (actionHasSideEffect(action)) {
            return fakeSuccessApi(action.offline.apiData);
          }
          return null;
        })
        .then((response) => {
          store.dispatch(markActionAsProcessed(action));
          if (action.offline.makeFulfilledAction) {
            dispatchFulfilledAction(store, action.offline.makeFulfilledAction, response);
          }
        });
    }
  }
};

const makeGetOfflineState = (store: Store, config: OfflineConfig) => () => {
  const state = store.getState();
  return config.selector(state);
};

const makeHasActionsToProcess = (getOfflineState: GetOfflineState) => () => {
  return getOfflineState().queue.length > 0;
};

const makeIsSyncing = (getOfflineState: GetOfflineState) => () => {
  return getOfflineState().isSyncing;
};

export const run = (store: Store, config: OfflineConfig) => {
  const getOfflineState = makeGetOfflineState(store, config);
  const hasActionsToProcess = makeHasActionsToProcess(getOfflineState);
  const isSyncing = makeIsSyncing(getOfflineState);

  const setSyncing = (isSyncing: boolean) => store.dispatch(setIsSyncing(isSyncing));

  store.subscribe(() => {
    if (hasActionsToProcess() && !isSyncing()) {
      setSyncing(true);
      startSyncing(store, getOfflineState);
    } else if (!hasActionsToProcess() && isSyncing()) {
      setSyncing(false);
    }
  });
};
