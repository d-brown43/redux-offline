import { Action } from 'redux';
import { Node } from './types';
import DependencyGraph from './DependencyGraph';

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

const getAllDuplicates = <T>(
  input: T[],
  isEqual: (valueA: T, valueB: T) => boolean
) => {
  const isEqualCurried = (valueA: T) => (valueB: T) => isEqual(valueA, valueB);
  const nonUnique = input.filter(
    (value, index) => input.findIndex(isEqualCurried(value)) !== index
  );
  return nonUnique.flatMap((dupe) => input.filter(isEqualCurried(dupe)));
};

// Throws an error if there are dependency types defined in dependencies of nodes, which are
// not present in the node list
const validateMissingNodes = <ActionTypes extends Action = Action>(
  input: Node<ActionTypes>[]
) => {
  const missingNodeTypes = input.filter(
    (node) => getInvalidDependencies(input, node).length > 0
  );

  if (missingNodeTypes.length > 0) {
    throw new Error(
      missingNodeTypes
        .map(
          (missingDependencyType) =>
            `Node "${
              missingDependencyType.type
            }" has dependencies that reference missing node types: ${pluckTypes(
              getInvalidDependencies(input, missingDependencyType)
            )}`
        )
        .join(',')
    );
  }
};

// Throws an error if there are nodes with duplicate types
const validateDuplicateNodeTypes = <ActionTypes extends Action = Action>(
  input: Node<ActionTypes>[]
) => {
  const duplicateTypes = getAllDuplicates(
    input,
    (valueA, valueB) => valueA.type === valueB.type
  ).map((node) => node.type);

  if (duplicateTypes.length > 0) {
    throw new Error(`Found duplicate nodes: ${stringify(duplicateTypes)}`);
  }
};

// Throws an error if there are duplicate dependencies on a node - note will not throw
// if there are duplicate dependencies in the graph, which are dependencies of different nodes
const validateDuplicateDependencies = <ActionTypes extends Action = Action>(
  input: Node<ActionTypes>[]
) => {
  const duplicateDependencies = input.reduce<
    { node: any; duplicates: string[] }[]
  >((acc, node) => {
    const dupeDependencyTypes = getAllDuplicates(
      node.dependencies,
      (depA, depB) => depA.type === depB.type
    ).map((dupe) => dupe.type);

    if (dupeDependencyTypes.length > 0) {
      return acc.concat([
        {
          node,
          duplicates: dupeDependencyTypes,
        },
      ]);
    }

    return acc;
  }, []);

  if (duplicateDependencies.length > 0) {
    throw new Error(
      `Found nodes with duplicate dependencies: ${stringify(
        duplicateDependencies
      )}`
    );
  }
};

const createDependencyGraph = <ActionTypes extends Action = Action>(
  input: Node<ActionTypes>[]
): DependencyGraph<ActionTypes> => {
  validateMissingNodes(input);
  validateDuplicateNodeTypes(input);
  validateDuplicateDependencies(input);

  return new DependencyGraph(input);
};

export default createDependencyGraph;
