import { Action, AnyAction, combineReducers, createStore, Store } from 'redux';
import {
  MapDependentAction,
  NetworkEffectHandler,
  OfflineAction,
} from './types';
import {
  createTestStore,
  dispatchOfflineEvent,
  dispatchOnlineEvent,
  setOnlineStatusInitial,
  waitFor,
} from './test/utils';
import configureRuntime from './configureRuntime';
import { getIsProcessing, getPendingActions } from './selectors';
import offlineReducer from './offlineReducer';
import makeRootReducer from './makeRootReducer';
import { DELETE_PENDING_ACTION } from './utils';

describe('basic functionality', () => {
  const offlineAction: OfflineAction = {
    type: 'MY_ACTION',
    offline: {
      networkEffect: {},
    },
  };

  const fakeNetworkHandler = (): Promise<Action> =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          type: 'HANDLED_ACTION',
        });
      }, 100);
    });

  const initialiseWithAction = () => {
    setOnlineStatusInitial(false);
    const store = createTestStore();
    configureRuntime({
      networkEffectHandler: fakeNetworkHandler,
      store,
      mapDependentAction: () => null,
    });
    return store;
  };

  it('starts processing when online status detected and actions pending', () => {
    const store = initialiseWithAction();

    store.dispatch(offlineAction);

    expect(getPendingActions(store.getState()).length).toEqual(1);

    dispatchOnlineEvent();
    expect(getIsProcessing(store.getState())).toEqual(true);
  });

  it('stops processing when queue is empty', async () => {
    const store = initialiseWithAction();

    store.dispatch(offlineAction);
    store.dispatch(offlineAction);

    dispatchOnlineEvent();

    await waitFor(() => {
      expect(getPendingActions(store.getState()).length).toEqual(0);
      expect(getIsProcessing(store.getState())).toEqual(false);
    });
  });

  it('stops processing when offline status is detected', async () => {
    const store = initialiseWithAction();

    store.dispatch(offlineAction);
    store.dispatch(offlineAction);

    dispatchOnlineEvent();
    dispatchOfflineEvent();

    await waitFor(() => {
      expect(getIsProcessing(store.getState())).toEqual(false);
      expect(getPendingActions(store.getState()).length).toEqual(1);
    });
  });
});

describe('optimistic resolution', () => {
  const CREATE_NOTE = 'CREATE_NOTE';
  const CREATE_NOTE_FULFILLED = 'CREATE_NOTE_FULFILLED';
  const UPDATE_NOTE = 'UPDATE_NOTE';
  const UPDATE_NOTE_FULFILLED = 'UPDATE_NOTE_FULFILLED';
  const DELETE_NOTE = 'DELETE_NOTE';
  const DELETE_NOTE_FULFILLED = 'DELETE_NOTE_FULFILLED';
  const DEPENDENT_ACTION = 'DEPENDENT_ACTION';

  const networkHandler: NetworkEffectHandler = async (offlineAction) => {
    switch (offlineAction.type) {
      case CREATE_NOTE: {
        return {
          type: CREATE_NOTE_FULFILLED,
          payload: {
            ...offlineAction.payload,
            id: 'fulfilled_id',
          },
        };
      }
      case UPDATE_NOTE: {
        return {
          type: UPDATE_NOTE_FULFILLED,
          payload: offlineAction.payload,
        };
      }
      case DELETE_NOTE:
        return {
          type: DELETE_NOTE_FULFILLED,
          payload: offlineAction.payload,
        };
    }
  };

  const mapDependentActions: MapDependentAction<any> = (
    originalAction,
    fulfilledAction,
    pendingAction
  ) => {
    switch (originalAction.type) {
      case CREATE_NOTE: {
        if (
          pendingAction.type === UPDATE_NOTE &&
          pendingAction.payload.id === originalAction.payload.id
        ) {
          return {
            ...pendingAction,
            payload: {
              ...pendingAction.payload,
              id: fulfilledAction.payload.id,
            },
          };
        }
        if (
          pendingAction.type === DEPENDENT_ACTION &&
          pendingAction.payload === originalAction.payload.id
        ) {
          return {
            ...pendingAction,
            payload: fulfilledAction.payload.id,
          };
        }
        if (
          pendingAction.type === DELETE_NOTE &&
          pendingAction.payload.id === originalAction.payload.id
        ) {
          return {
            ...pendingAction,
            payload: {
              ...pendingAction.payload,
              id: fulfilledAction.payload.id,
            },
          };
        }
        return null;
      }
      case DELETE_NOTE:
        switch (pendingAction.type) {
          case DEPENDENT_ACTION:
            if (pendingAction.payload === originalAction.payload.id) {
              return DELETE_PENDING_ACTION;
            }
        }
        break;
    }
    return null;
  };

  const createNote = (name: string): OfflineAction => ({
    type: CREATE_NOTE,
    payload: {
      id: 'temp_id',
      name,
    },
    offline: {
      networkEffect: {},
    },
  });

  const createDependentAction = (noteId: string): OfflineAction => ({
    type: DEPENDENT_ACTION,
    payload: noteId,
    offline: {
      dependent: true,
    },
  });

  const updateNote = (id: string, name: string): OfflineAction => ({
    type: UPDATE_NOTE,
    payload: {
      id,
      name,
    },
    offline: {
      networkEffect: {},
    },
  });

  const deleteNote = (noteId: string): OfflineAction => ({
    type: DELETE_NOTE,
    payload: {
      id: noteId,
    },
    offline: {
      networkEffect: {},
    },
  });

  const initialState: {
    notes: { [k: string]: { id: string; name: string } };
    dependentId: null | string;
  } = {
    notes: {},
    dependentId: null,
  };

  const reducer = (state = initialState, action: AnyAction) => {
    switch (action.type) {
      case CREATE_NOTE:
      case CREATE_NOTE_FULFILLED:
        return {
          ...state,
          notes: {
            ...state.notes,
            [action.payload.id]: action.payload,
          },
        };
      case UPDATE_NOTE:
      case UPDATE_NOTE_FULFILLED:
        return {
          ...state,
          notes: {
            ...state.notes,
            [action.payload.id]: {
              ...state.notes[action.payload.id],
              ...action.payload,
            },
          },
        };
      case DEPENDENT_ACTION:
        return {
          ...state,
          dependentId: action.payload,
        };
      case DELETE_NOTE:
      case DELETE_NOTE_FULFILLED:
        return {
          ...state,
          dependentId:
            state.dependentId === action.payload.id ? null : state.dependentId,
          notes: Object.entries(state.notes).reduce((acc, [noteId, note]) => {
            if (noteId !== action.payload.id) {
              return {
                ...acc,
                [noteId]: note,
              };
            }
            return acc;
          }, {}),
        };
      default:
        return state;
    }
  };

  const rootReducer = combineReducers({
    notes: reducer,
    offline: offlineReducer,
  });

  const createTestStore = () => {
    const store = createStore(makeRootReducer(rootReducer));
    configureRuntime({
      store,
      networkEffectHandler: networkHandler,
      mapDependentAction: mapDependentActions,
    });
    return store;
  };

  const getNotes = (store: Store): any[] => {
    return Object.values(store.getState().notes.notes);
  };

  beforeEach(() => {
    setOnlineStatusInitial(false);
  });

  it('Applies fulfilled action to state', async () => {
    const store = createTestStore();

    store.dispatch(createNote('test note'));

    await waitFor(() => {
      const notes: any[] = getNotes(store);
      expect(notes.length).toEqual(1);
      expect(notes[0].id).toEqual('temp_id');
    });

    dispatchOnlineEvent();

    await waitFor(() => {
      const notes: any[] = getNotes(store);
      expect(notes.length).toEqual(1);
      expect(notes[0].id).toEqual('fulfilled_id');
    });
  });

  it('handles errors and does not dispatch action if non-action returned', async () => {
    const errorNetworkHandler: NetworkEffectHandler = async (offlineAction) => {
      switch (offlineAction.type) {
        case CREATE_NOTE:
          throw new Error('some error');
        default:
          return null;
      }
    };

    const store = createStore(makeRootReducer(rootReducer));
    configureRuntime({
      store,
      networkEffectHandler: errorNetworkHandler,
      mapDependentAction: mapDependentActions,
    });

    store.dispatch(createNote('test note'));

    await waitFor(() => {
      const notes: any[] = getNotes(store);
      expect(notes.length).toEqual(1);
      expect(notes[0].id).toEqual('temp_id');
    });

    dispatchOnlineEvent();

    await waitFor(() => {
      const notes = getNotes(store);
      expect(notes.length).toEqual(0);
    });
  });

  it('Updates references to dependent entities', async () => {
    const store = createTestStore();
    store.dispatch(createNote('test note'));

    const notes = getNotes(store);
    store.dispatch(updateNote(notes[0].id, 'updated name'));

    dispatchOnlineEvent();

    await waitFor(() => {
      const notes: any[] = getNotes(store);
      expect(notes.length).toEqual(1);
      expect(notes[0].name).toEqual('updated name');
      expect(notes[0].id).toEqual('fulfilled_id');
    });
  });

  it('Dispatches dependent actions', async () => {
    const store = createTestStore();
    store.dispatch(createNote('test'));
    const notes = getNotes(store);
    store.dispatch(createDependentAction(notes[0].id));

    dispatchOnlineEvent();

    await waitFor(() => {
      const notes: any[] = getNotes(store);
      expect(notes[0].id).toEqual('fulfilled_id');
      expect(store.getState().notes.dependentId).toEqual(notes[0].id);
    });
  });

  it('Deletes pending actions if the dependency has now disappeared', async () => {
    const store = createTestStore();
    store.dispatch(createNote('test'));

    const notes = getNotes(store);

    store.dispatch(createDependentAction(notes[0].id));
    store.dispatch(deleteNote(notes[0].id));

    dispatchOnlineEvent();

    await waitFor(() => {
      const notes = getNotes(store);
      expect(notes.length).toEqual(0);
      expect(store.getState().notes.dependentId).toBeNull();
    });
  });
});
