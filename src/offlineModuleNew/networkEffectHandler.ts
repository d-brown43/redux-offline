import {NetworkEffectHandler, OfflineAction, RollbackRequiredAction, RootState, StoreType} from './types';
import {actionHandled, commitAction, errorAction, rollbackAction} from "./actions";

const isRollbackAction = (action: OfflineAction): action is RollbackRequiredAction => {
  return typeof (action as RollbackRequiredAction).offline.rollbackAction !== 'undefined';
};

const networkEffectHandler = <ST extends RootState>(
  effectHandler: NetworkEffectHandler,
  offlineAction: OfflineAction,
  store: StoreType<ST>
) => {
  return effectHandler(offlineAction.offline.networkEffect)
    .then((result) => {
      // Queue management does not happen here
      store.dispatch(commitAction(offlineAction));
      store.dispatch(actionHandled());

      return result;
    })
    .catch((err) => {
      // Queue management does not happen here
      if (isRollbackAction(offlineAction)) {
        // Rollback is optional
        store.dispatch(rollbackAction(offlineAction));

        // TODO Handle dependent actions
      } else {
        // We notify with a default error action otherwise
        store.dispatch(errorAction(err));
      }
      store.dispatch(actionHandled());
    });
};

export default networkEffectHandler;
