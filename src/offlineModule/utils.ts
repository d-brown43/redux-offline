import { AnyAction } from 'redux';
import { OfflineAction } from './types';

export const isOfflineAction = (action: AnyAction): action is OfflineAction => {
  return typeof (action as OfflineAction).offline !== 'undefined';
};

export const DELETE_PENDING_ACTION = Symbol('DELETE_PENDING_ACTION');
