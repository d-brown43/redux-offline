import {RootState} from "./types";

export const getIsOnline = (state: RootState) => state.offline.isOnline;

export const getPendingActions = (state: RootState) => state.offline.offlineQueue.pendingActions;
export const hasPendingActions = (state: RootState) => state.offline.offlineQueue.pendingActions.length > 0;

export const getIsProcessing = (state: RootState) => state.offline.offlineQueue.isProcessing;
