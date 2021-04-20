import { Action } from 'redux';
import {MapDependentActionFunction, OfflineQueueRuntimeConfigInput} from './types';
import { DELETE_PENDING_ACTION } from './utils';
import { Dependency } from './dependencyGraph';

const createMapDependentActions = <ST, ActionTypes extends Action>(
  config: Omit<OfflineQueueRuntimeConfigInput<ST, ActionTypes>, 'store' | 'networkEffectHandler'>
): MapDependentActionFunction<ActionTypes> => {
  const graph = config.dependencyGraph;
  if (!graph) {
    throw new Error(
      'The default action mapper requires a dependency graph to be provided, none was given'
    );
  }

  return (originalAction, fulfilledAction, pendingAction) => {
    const node = graph.getNode(originalAction.type);
    const dependencyOf = graph.getDependenciesOf(
      originalAction.type,
      (dependency: Dependency<ActionTypes>) =>
        dependency.type === pendingAction.type
    )[0];
    if (
      dependencyOf &&
      node &&
      dependencyOf.dependsOn(originalAction, pendingAction)
    ) {
      return dependencyOf.updateDependency === DELETE_PENDING_ACTION
        ? DELETE_PENDING_ACTION
        : dependencyOf.updateDependency(
            originalAction,
            fulfilledAction,
            pendingAction
          );
    }
    return null;
  };
};

export default createMapDependentActions;
