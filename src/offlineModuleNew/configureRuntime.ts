import {RootState, StoreType} from "./types";
import networkDetector from "./networkDetector";
import {getIsOnline} from "./selectors";
import {goOffline, goOnline} from "./actions";

const mapNetworkToState = <ST extends RootState>(store: StoreType<ST>) => {
  networkDetector(isOnline => {
    if (isOnline && !getIsOnline(store.getState())) {
      store.dispatch(goOnline());
    } else if (!isOnline && getIsOnline(store.getState())) {
      store.dispatch(goOffline());
    }
  });
};

const configureRuntime = <ST extends RootState>(store: StoreType<ST>) => {
  mapNetworkToState(store);
};

export default configureRuntime;
