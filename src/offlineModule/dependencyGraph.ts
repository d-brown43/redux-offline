export type Dependency<Types extends string> = {
  type: Types;
  fieldName: string;
};

export type Node<Types extends string> = {
  type: Types;
  dependencies: Dependency<Types>[];
};

class DependencyGraph<Types extends string> {
  nodes: Node<Types>[];

  constructor(nodes: Node<Types>[]) {
    this.nodes = nodes.map((node) => ({
      ...node,
      dependencies: node.dependencies ? node.dependencies : [],
    }));
  }

  getNode(type: Types) {
    return this.nodes.find((node) => node.type === type);
  }

  getDependenciesOf(type: Types) {
    return this.getNode(type)?.dependencies.map((dependency) =>
      this.getNode(dependency.type)
    );
  }

  getDependsOn(type: Types) {
    return this.nodes.filter((node) =>
      node.dependencies.some((dependency) => dependency.type === type)
    );
  }
}

const getInvalidDependencies = <Types extends string>(
  input: Node<Types>[],
  node: Node<string>
) => {
  const types = input.map((node) => node.type);
  return node.dependencies.filter(
    (dependency) => !types.includes(dependency.type as Types)
  );
};

const createDependencyGraph = <Types extends string>(input: Node<Types>[]) => {
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
            }" has dependencies that reference invalid types: ${getInvalidDependencies(
              input,
              missingDependencyType
            )
              .map((dependency) => `"${dependency.type}"`)
              .join(', ')}`
        )
        .join(',')
    );
  }

  return new DependencyGraph(input);
};

export default createDependencyGraph;
