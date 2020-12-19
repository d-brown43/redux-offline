import {AnyAction} from "redux";
import {OfflineAction, OfflineMetadata} from "./types";

export const isOfflineAction = (action: AnyAction): action is OfflineAction => 'offline' in action;

const makeHasOptionalField = (fieldName: keyof OfflineMetadata) => (action: OfflineAction) => {
  return fieldName in action.offline;
};

export const actionHasSideEffect = makeHasOptionalField('apiData');
