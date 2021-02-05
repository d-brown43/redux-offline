import { RootState } from './types';
import {AnyAction} from "redux";

const PREFIX = 'OFFLINE_QUEUE';

export const GO_ONLINE = `${PREFIX}:GO_ONLINE`;
export const GO_OFFLINE = `${PREFIX}:GO_OFFLINE`;
export const START_PROCESSING = `${PREFIX}:START_PROCESSING`;
export const STOP_PROCESSING = `${PREFIX}:STOP_PROCESSING`;
export const ACTION_HANDLED = `${PREFIX}:ACTION_HANDLED`;
export const REPLACE_ROOT_STATE = `${PREFIX}:REPLACE_ROOT_STATE`;
export const REBUILD_STORE = `${PREFIX}:REBUILD_STORE`;
export const INITIALISE_STATE = `${PREFIX}:INITIALISE_STATE`;

export const isInternalAction = (action: AnyAction) => [
  GO_ONLINE,
  GO_OFFLINE,
  START_PROCESSING,
  STOP_PROCESSING,
  ACTION_HANDLED,
  REPLACE_ROOT_STATE,
  REBUILD_STORE,
].includes(action.type);

export const goOnline = () => ({ type: GO_ONLINE });
export const goOffline = () => ({ type: GO_OFFLINE });

export const startProcessing = () => ({ type: START_PROCESSING });
export const stopProcessing = () => ({ type: STOP_PROCESSING });

export const replaceRootState = <ST extends RootState>(state: ST) => ({
  type: REPLACE_ROOT_STATE,
  payload: state,
});

export const rebuildStore = () => ({ type: REBUILD_STORE });

export const actionHandled = () => ({ type: ACTION_HANDLED });
