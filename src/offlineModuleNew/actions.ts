import {OfflineAction, RollbackRequiredAction} from "./types";

const PREFIX = 'OFFLINE_QUEUE';

export const GO_ONLINE = `${PREFIX}:GO_ONLINE`;
export const GO_OFFLINE = `${PREFIX}:GO_OFFLINE`;

export const goOnline = () => ({type: GO_ONLINE});
export const goOffline = () => ({type: GO_OFFLINE});

export const commitAction = (offlineAction: OfflineAction) => offlineAction.offline.commitAction;
export const rollbackAction = (offlineAction: RollbackRequiredAction) => offlineAction.offline.rollbackAction;
