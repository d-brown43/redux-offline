import { Node } from './types';
import createDependencyGraph from './dependencyGraphFactory';

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

it('returns dependencies of a given type', () => {
  expect(graph.getDependenciesOf('SOME_ACTION')).toEqual(
    someActionNode.dependencies
  );
  expect(graph.getDependenciesOf('OTHER_ACTION')).toEqual(
    otherActionNode.dependencies
  );
});

it('returns the first dependency', () => {
  expect(
    graph.getFirstDependencyOfWithType('OTHER_ACTION', 'SOME_ACTION')
  ).toEqual(otherActionNode.dependencies[0]);
  expect(
    graph.getFirstDependencyOfWithType('OTHER_ACTION', 'THIRD_ACTION')
  ).toEqual(otherActionNode.dependencies[1]);
});
