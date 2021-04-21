import { Action } from 'redux';
import { Dependency, Node } from './types';

class DependencyGraph<ActionTypes extends Action = Action> {
  nodes: Node<ActionTypes>[];

  constructor(nodes: Node<ActionTypes>[]) {
    this.nodes = nodes;
  }

  getNode(type: ActionTypes['type']) {
    return this.nodes.find((node) => node.type === type);
  }

  getDependenciesOf(
    type: ActionTypes['type'],
    dependencyFilter: (dependency: Dependency<ActionTypes>) => boolean = () =>
      true
  ) {
    return this.getNode(type)?.dependencies.filter(dependencyFilter) || [];
  }

  getFirstDependencyOfWithType(
    type: ActionTypes['type'],
    dependentType: ActionTypes['type']
  ) {
    return this.getDependenciesOf(
      type,
      (dependency) => dependency.type === dependentType
    )[0];
  }
}

export default DependencyGraph;
