import createDependencyGraph from './dependencyGraph';
import { Node } from './dependencyGraph';

const someActionNode: Node = {
  type: 'SOME_ACTION',
  dependencies: [
    {
      type: 'SOME_ACTION',
      dependsOn: () => true,
      updateDependency: () => null,
    },
  ],
};

const otherActionNode: Node = {
  type: 'OTHER_ACTION',
  dependencies: [
    {
      type: 'SOME_ACTION',
      dependsOn: () => true,
      updateDependency: () => null,
    },
    {
      type: 'THIRD_ACTION',
      dependsOn: () => true,
      updateDependency: () => null,
    },
  ],
};

const thirdAction = {
  type: 'THIRD_ACTION',
  dependencies: [],
};

const graph = createDependencyGraph([
  someActionNode,
  otherActionNode,
  thirdAction,
]);

it('throws an error if duplicate node types are found', () => {
  expect(() => createDependencyGraph([
    { type: 'SOME_ACTION', dependencies: [] },
    { type: 'SOME_ACTION', dependencies: [] },
  ])).toThrow();
});

it('returns dependencies of a given type', () => {
  expect(graph.getDependenciesOf('SOME_ACTION')).toEqual(
    someActionNode.dependencies
  );
  expect(graph.getDependenciesOf('OTHER_ACTION')).toEqual(
    otherActionNode.dependencies
  );
});

it('returns dependencies for a given type', () => {
  expect(graph.getDependsOn('SOME_ACTION')).toEqual([
    someActionNode,
    otherActionNode,
  ]);
  expect(graph.getDependsOn('OTHER_ACTION')).toEqual([]);
});
