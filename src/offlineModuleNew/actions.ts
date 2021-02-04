import {OfflineAction, RollbackRequiredAction} from "./types";

const PREFIX = 'OFFLINE_QUEUE';

export const GO_ONLINE = `${PREFIX}:GO_ONLINE`;
export const GO_OFFLINE = `${PREFIX}:GO_OFFLINE`;
export const START_PROCESSING = `${PREFIX}:START_PROCESSING`;
export const STOP_PROCESSING = `${PREFIX}:STOP_PROCESSING`;

export const goOnline = () => ({type: GO_ONLINE});
export const goOffline = () => ({type: GO_OFFLINE});

export const startProcessing = () => ({ type: START_PROCESSING });
export const stopProcessing = () => ({ type: STOP_PROCESSING });

export const commitAction = (offlineAction: OfflineAction) => offlineAction.offline.commitAction;
export const rollbackAction = (offlineAction: RollbackRequiredAction) => offlineAction.offline.rollbackAction;
