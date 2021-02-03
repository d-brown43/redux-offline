import {RootState} from "./types";

export const getIsOnline = (state: RootState) => state.offline.isOnline;
export const getPendingActions = (state: RootState) => state.offline.offlineQueue.pendingActions;
