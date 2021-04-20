import { combineReducers } from 'redux';
import offlineReducer from '../offlineReducer';
import { DataOfflineAction, OfflineAction, OfflineState } from '../types';
import { getNow, getRandomId } from './utils';
import { Folder, Note } from './types';
import createDependencyGraph from '../dependencyGraph';
import { DELETE_PENDING_ACTION } from '../utils';

export const CREATE_NOTE = 'CREATE_NOTE';
export const CREATE_NOTE_RESOLVED = 'CREATE_NOTE_RESOLVED';
export const CREATE_FOLDER = 'CREATE_FOLDER';
export const CREATE_FOLDER_RESOLVED = 'CREATE_FOLDER_RESOLVED';
export const DELETE_FOLDER = 'DELETE_FOLDER';
export const DELETE_FOLDER_RESOLVED = 'DELETE_FOLDER_RESOLVED';
export const DELETE_FOLDER_ERROR = 'DELETE_FOLDER_ERROR';
export const SET_CURRENT_FOLDER_ID = 'SET_CURRENT_FOLDER_ID';

type ActionTypes =
  | ReturnType<typeof createNote>
  | ReturnType<typeof createNoteResolved>
  | ReturnType<typeof createFolder>
  | ReturnType<typeof createFolderResolved>
  | ReturnType<typeof deleteFolder>
  | ReturnType<typeof deleteFolderResolved>
  | ReturnType<typeof deleteFolderError>
  | ReturnType<typeof setCurrentFolderId>;

const isPayloadEqual = <
  PA extends ActionTypes['payload'],
  PB extends ActionTypes['payload']
>(
  condition: (originalPayload: PA, pendingPayload: PB) => boolean
) => {
  return (action: ActionTypes, pendingAction: ActionTypes) =>
    condition(action.payload, pendingAction.payload);
};

const noteDependsOnFolder = (folder: Folder, note: Note) =>
  note.folderId === folder.id;

const isFoldersEqual = (folderA: Folder, folderB: Folder) =>
  folderA.id === folderB.id;

export const dependencyGraph = createDependencyGraph<ActionTypes>([
  { type: SET_CURRENT_FOLDER_ID, dependencies: [] },
  { type: CREATE_NOTE, dependencies: [] },
  {
    type: CREATE_FOLDER,
    dependencies: [
      {
        type: CREATE_NOTE,
        dependsOn: isPayloadEqual(noteDependsOnFolder),
        updateDependency: (originalAction, fulfilledAction, pendingAction) =>
          createNote({
            ...pendingAction.payload,
            folderId: fulfilledAction.payload.id,
          }),
      },
      {
        type: DELETE_FOLDER,
        dependsOn: isPayloadEqual(isFoldersEqual),
        updateDependency: (originalAction, fulfilledAction, pendingAction) =>
          deleteFolder({
            ...pendingAction.payload,
            id: fulfilledAction.payload.id,
          }),
      },
      {
        type: SET_CURRENT_FOLDER_ID,
        dependsOn: (action, pendingAction) =>
          pendingAction.payload === action.payload.id,
        updateDependency: (originalAction, fulfilledAction) =>
          setCurrentFolderId(fulfilledAction.payload.id),
      },
    ],
  },
  {
    type: DELETE_FOLDER,
    dependencies: [
      {
        type: SET_CURRENT_FOLDER_ID,
        dependsOn: (action, pendingAction) =>
          pendingAction.payload === action.payload.id,
        updateDependency: DELETE_PENDING_ACTION,
      },
      {
        type: CREATE_NOTE,
        dependsOn: (action, pendingAction) =>
          pendingAction.payload.folderId === action.payload.id,
        updateDependency: DELETE_PENDING_ACTION,
      },
    ],
  },
]);

type State = {
  notes: { [k: string]: Note };
  folders: { [k: string]: Folder };
  latestError: null | string;
  currentFolderId: null | string;
};

export type RootState = {
  myState: State;
  offline: OfflineState;
};

const initialState: State = {
  notes: {},
  folders: {},
  latestError: null,
  currentFolderId: null,
};

const mergeEntity = <T extends { id: string }>(
  state: { [k: string]: T },
  entity: T
) => ({
  ...state,
  [entity.id]: entity,
});

const reducer = (state = initialState, action: ActionTypes) => {
  switch (action.type) {
    case CREATE_NOTE:
    case CREATE_NOTE_RESOLVED:
      return {
        ...state,
        notes: mergeEntity(state.notes, action.payload),
      };
    case CREATE_FOLDER:
    case CREATE_FOLDER_RESOLVED:
      return {
        ...state,
        folders: mergeEntity(state.folders, action.payload),
      };
    case DELETE_FOLDER:
    case DELETE_FOLDER_RESOLVED:
      return {
        ...state,
        latestError: null,
        notes: Object.values(state.notes).reduce((acc, note) => {
          if (note.folderId !== action.payload.id) {
            return mergeEntity(acc, note);
          }
          return acc;
        }, {}),
        folders: Object.values(state.folders).reduce((acc, folder) => {
          if (folder.id !== action.payload.id) {
            return mergeEntity(acc, folder);
          }
          return acc;
        }, {}),
        currentFolderId:
          state.currentFolderId === action.payload.id
            ? null
            : state.currentFolderId,
      };
    case DELETE_FOLDER_ERROR:
      return {
        ...state,
        latestError: action.payload,
      };
    case SET_CURRENT_FOLDER_ID:
      return {
        ...state,
        currentFolderId: action.payload,
      };
    default:
      return state;
  }
};

export const createNote = (
  note: Omit<Note, 'id' | 'createdAt'>
): DataOfflineAction<Note> => ({
  type: CREATE_NOTE,
  payload: {
    id: getRandomId(),
    // For the sake of argument say we also have a createdAt timestamp which gets replaced
    // by our "backend"
    createdAt: getNow(),
    ...note,
  },
  offline: {
    networkEffect: {
      note: 'metadata',
      // Data to map your optimistic action to a network request for example
      // This gets passed as JSON to allow serialising optimistic state
    },
  },
});

export const createNoteResolved = (note: Note) => ({
  type: CREATE_NOTE_RESOLVED,
  payload: note,
});

export const createFolder = (
  folder: Omit<Folder, 'id' | 'createdAt'>
): DataOfflineAction<Folder> => ({
  type: CREATE_FOLDER,
  payload: {
    id: getRandomId(),
    createdAt: getNow(),
    ...folder,
  },
  offline: {
    networkEffect: {
      folder: 'metadata',
    },
  },
});

export const createFolderResolved = (folder: Folder) => ({
  type: CREATE_FOLDER_RESOLVED,
  payload: folder,
});

export const deleteFolder = (folder: Folder): OfflineAction => ({
  type: DELETE_FOLDER,
  payload: folder,
  offline: {
    networkEffect: {
      delete: 'folder metadata',
    },
  },
});

export const deleteFolderResolved = (folder: Folder) => ({
  type: DELETE_FOLDER_RESOLVED,
  payload: folder,
});

export const deleteFolderError = (folder: Folder) => ({
  type: DELETE_FOLDER_ERROR,
  payload: `Unable to delete folder: ${folder.name}`,
});

export const setCurrentFolderId = (id: string): OfflineAction => ({
  type: SET_CURRENT_FOLDER_ID,
  payload: id,
  offline: {
    dependent: true,
  },
  // TODO this is a dependent action, mark it as such
});

const sortByDateStrings = (
  valueA: { createdAt: string },
  valueB: { createdAt: string }
) => {
  const dateA = new Date(valueA.createdAt);
  const dateB = new Date(valueB.createdAt);
  return dateA.valueOf() - dateB.valueOf();
};

export const getNotes = (state: RootState) =>
  Object.values(state.myState.notes).sort(sortByDateStrings);
export const getFolders = (state: RootState) =>
  Object.values(state.myState.folders).sort(sortByDateStrings);

export const getCurrentFolderId = (state: RootState) =>
  state.myState.currentFolderId;

export const getLastError = (state: RootState) => state.myState.latestError;

const rootReducer = combineReducers({
  myState: reducer,
  offline: offlineReducer,
});

export default rootReducer;
