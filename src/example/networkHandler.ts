import { NetworkEffectHandler } from '../offlineModule';
import {
  CREATE_FOLDER,
  CREATE_NOTE,
  createFolderResolved,
  createNoteResolved,
  DELETE_FOLDER,
  deleteFolderError,
  deleteFolderResolved,
} from './redux';
import { getNow, getRandomId } from './utils';

const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(value), 5000);
  });

type IdAndDateEntity = {
  id: string;
  createdAt: string;
};

const replaceIdAndDate = <T extends IdAndDateEntity>(entity: T): T => {
  return {
    ...entity,
    id: getRandomId(),
    createdAt: getNow(),
  };
};

const networkHandler: NetworkEffectHandler = async (offlineAction) => {
  console.log(
    `making fake network request for action: ${offlineAction.type}, with offline metadata:`,
    offlineAction.offline.networkEffect
  );
  switch (offlineAction.type) {
    case CREATE_NOTE:
      return delay(
        createNoteResolved({
          ...replaceIdAndDate(offlineAction.payload),
          name: offlineAction.payload.name + ' - hello from server',
        })
      );
    case CREATE_FOLDER:
      return delay(
        createFolderResolved({
          ...replaceIdAndDate(offlineAction.payload),
          name: offlineAction.payload.name + ' - hello from server',
        })
      );
    case DELETE_FOLDER: {
      if (Math.random() >= 0.5) {
        console.warn('Faking a network error for action', offlineAction);
        // Randomly fail to delete folders, like a real backend
        return delay(deleteFolderError(offlineAction.payload));
      } else {
        return delay(deleteFolderResolved(offlineAction.payload));
      }
    }
    default:
      return null;
  }
};

export default networkHandler;
