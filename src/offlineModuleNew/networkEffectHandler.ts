import { Action } from 'redux';
import {
  NetworkEffectHandler,
  OfflineAction,
  RootState,
  StoreType,
} from './types';
import { actionHandled } from './actions';

const isAction = (action: any): action is Action => {
  return typeof (action as Action).type !== 'undefined';
};

const networkEffectHandler = <ST extends RootState>(
  effectHandler: NetworkEffectHandler,
  offlineAction: OfflineAction,
  store: StoreType<ST>
) => {
  return effectHandler(offlineAction)
    .then((result) => {
      // TODO Add action verification here and warn if it doesn't look like a redux action
      store.dispatch(result);
      // Queue management does not happen here
      store.dispatch(actionHandled());

      return result;
    })
    .catch((err) => {
      // Queue management does not happen here
      if (err && isAction(err)) {
        store.dispatch(err);
      }
      store.dispatch(actionHandled());
    });
};

export default networkEffectHandler;
