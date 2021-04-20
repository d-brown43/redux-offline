import { Action } from 'redux';
import { MapDependentAction } from './types';

export type Dependency<ActionTypes extends Action = Action> = {
  type: ActionTypes['type'];
  dependsOn: <A extends ActionTypes, B extends ActionTypes>(
    action: A,
    pendingAction: B
  ) => boolean;
  updateDependency: MapDependentAction<ActionTypes>;
};

export type Node<
  ActionTypes extends Action = Action,
  T extends ActionTypes['type'] = string
> = {
  type: T;
  dependencies: Dependency<ActionTypes>[];
};

export class DependencyGraph<ActionTypes extends Action = Action> {
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

  getDependsOn(
    type: ActionTypes['type'],
    dependencyFilter: (dependency: Dependency<ActionTypes>) => boolean = () =>
      true
  ) {
    return this.nodes.filter((node) =>
      node.dependencies.some(
        (dependency) => dependency.type === type && dependencyFilter(dependency)
      )
    );
  }
}

const getInvalidDependencies = <ActionTypes extends Action = Action>(
  input: Node<ActionTypes>[],
  node: Node<ActionTypes>
) => {
  const types = input.map((node) => node.type);
  return node.dependencies.filter(
    (dependency) => !types.includes(dependency.type)
  );
};

const pluckTypes = (input: { type: string }[]) =>
  input.map((value) => `"${value.type}"`).join(', ');

const stringify = (input: any[]) =>
  input.map((i) => JSON.stringify(i, null, 2)).join(', ');

const createDependencyGraph = <ActionTypes extends Action = Action>(
  input: Node<ActionTypes>[]
): DependencyGraph<ActionTypes> => {
  const missingDependencyTypes = input.filter(
    (node) => getInvalidDependencies(input, node).length > 0
  );

  if (missingDependencyTypes.length > 0) {
    throw new Error(
      missingDependencyTypes
        .map(
          (missingDependencyType) =>
            `Node "${
              missingDependencyType.type
            }" has dependencies that reference invalid types: ${pluckTypes(
              getInvalidDependencies(input, missingDependencyType)
            )}`
        )
        .join(',')
    );
  }

  const duplicateTypes = input
    .filter(
      (node, index) => input.findIndex((n) => n.type === node.type) !== index
    )
    .map((node) => node.type);
  if (duplicateTypes.length > 0) {
    const allDuplicatesOfTypes = input.filter((node) =>
      duplicateTypes.includes(node.type)
    );
    throw new Error(
      `Found duplicate nodes: ${stringify(allDuplicatesOfTypes)}`
    );
  }

  return new DependencyGraph(input);
};

export default createDependencyGraph;
