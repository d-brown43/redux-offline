import {OfflineQueueRuntimeConfig, RootState} from "./types";
import {getIsOnline, getIsProcessing, hasPendingActions} from "./selectors";
import {startProcessing} from "./actions";

const queueProcessor = <ST extends RootState>(config: OfflineQueueRuntimeConfig<ST>) => {
  const startIfReady = () => {
    const state = config.store.getState();

    if (
      getIsOnline(state)
      && hasPendingActions(state)
      && !getIsProcessing(state)
    ) {
      config.store.dispatch(startProcessing());
      // call processing function
    }
  };

  config.store.subscribe(() => startIfReady());
  startIfReady();
};

export default queueProcessor;
