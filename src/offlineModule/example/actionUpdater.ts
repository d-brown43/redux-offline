import { MapDependentAction } from '../types';
import {
  CREATE_FOLDER,
  CREATE_NOTE,
  createNote,
  DELETE_FOLDER,
  deleteFolder,
  SET_CURRENT_FOLDER_ID,
  setCurrentFolderId,
} from './redux';
import { DELETE_PENDING_ACTION } from '../utils';

// This is most of the magic of the library
// Function to update pending optimistic actions based on the result of a fulfilled action
// Providing a more opinionated/built-in approach for doing this is in the roadmap, e.g. via
// describing how different entity types relate to each other instead of
// manually doing lots of if/else checks on action types
const actionUpdater: MapDependentAction = (
  originalAction,
  fulfilledAction,
  pendingAction
) => {
  switch (originalAction.type) {
    case CREATE_FOLDER:
      switch (pendingAction.type) {
        case SET_CURRENT_FOLDER_ID:
          if (pendingAction.payload === originalAction.payload.id) {
            return setCurrentFolderId(fulfilledAction.payload.id);
          }
          break;
        case CREATE_NOTE:
          // If we have a pending createNote action that depends on the
          // now-created folder, update the folder id for this action
          if (pendingAction.payload.folderId === originalAction.payload.id) {
            return createNote({
              ...pendingAction.payload,
              folderId: fulfilledAction.payload.id,
            });
          }
          break;
        case DELETE_FOLDER:
          if (pendingAction.payload.id === originalAction.payload.id) {
            return deleteFolder({
              ...pendingAction.payload,
              id: fulfilledAction.payload.id,
            });
          }
          break;
      }
      break;
    case DELETE_FOLDER:
      switch (pendingAction.type) {
        case SET_CURRENT_FOLDER_ID:
          // If we are deleting the folder which is currently selected, we need to remove
          // this pending action as it now references something invalid
          if (pendingAction.payload === originalAction.payload.id) {
            return DELETE_PENDING_ACTION;
          }
          break;
        case CREATE_NOTE: {
          if (pendingAction.payload.folderId === originalAction.payload.id) {
            // We were creating a note that depends on a now non-existent folder
            // In a real application we might map this note to no folder or a "special"
            // folder that contains all folderless notes
            return DELETE_PENDING_ACTION;
          }
        }
      }
  }
  return null;
};

export default actionUpdater;
