import {QueueProcessorConfig, RootState} from "./types";


const queueProcessor = <ST extends RootState>(config: QueueProcessorConfig<ST>) => {
  config.store.subscribe(() => {

  });
};

export default queueProcessor;
