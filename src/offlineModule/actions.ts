import {AnyAction} from "redux";
import {OfflineAction, RootState} from './types';

const PREFIX = 'OFFLINE_QUEUE';

export const GO_ONLINE = `${PREFIX}:GO_ONLINE`;
export const GO_OFFLINE = `${PREFIX}:GO_OFFLINE`;
export const START_PROCESSING = `${PREFIX}:START_PROCESSING`;
export const STOP_PROCESSING = `${PREFIX}:STOP_PROCESSING`;
export const REPLACE_ROOT_STATE = `${PREFIX}:REPLACE_ROOT_STATE`;
export const REPLACE_PENDING_ACTIONS = `${PREFIX}:REPLACE_PENDING_ACTIONS`;
export const REBUILD_STORE = `${PREFIX}:REBUILD_STORE`;

export const isInternalAction = (action: AnyAction) => [
  GO_ONLINE,
  GO_OFFLINE,
  START_PROCESSING,
  STOP_PROCESSING,
  REPLACE_ROOT_STATE,
  REBUILD_STORE,
  REPLACE_PENDING_ACTIONS,
].includes(action.type);

export const goOnline = () => ({ type: GO_ONLINE });
export const goOffline = () => ({ type: GO_OFFLINE });

export const startProcessing = () => ({ type: START_PROCESSING });
export const stopProcessing = () => ({ type: STOP_PROCESSING });

export const replaceRootState = <ST extends RootState>(state: ST) => ({
  type: REPLACE_ROOT_STATE,
  payload: state,
});

export const replacePendingActions = (actions: OfflineAction[]) => ({
  type: REPLACE_PENDING_ACTIONS,
  payload: actions,
});

export const rebuildStore = () => ({ type: REBUILD_STORE });
