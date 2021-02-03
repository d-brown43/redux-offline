import {QueueProcessorConfig} from "./types";
import networkDetector from "./networkDetector";

const queueProcessor = <StoreType>(config: QueueProcessorConfig<StoreType>) => {
  networkDetector(isOnline => {

  });

  config.store.subscribe(() => {

  });
};

export default queueProcessor;
