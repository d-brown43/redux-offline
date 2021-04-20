import createDependencyGraph from './dependencyGraph';

const someActionNode = {
  type: 'SOME_ACTION',
  dependencies: [
    {
      type: 'SOME_ACTION',
      fieldName: 'someField',
    },
  ],
};

const otherActionNode = {
  type: 'OTHER_ACTION',
  dependencies: [
    {
      type: 'SOME_ACTION',
      fieldName: 'something',
    },
    {
      type: 'THIRD_ACTION',
      fieldName: 'something',
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
  expect(graph.getDependenciesOf('SOME_ACTION')).toEqual([someActionNode]);
  expect(graph.getDependenciesOf('OTHER_ACTION')).toEqual([
    someActionNode,
    thirdAction,
  ]);
});

it('returns dependencies for a given type', () => {
  expect(graph.getDependsOn('SOME_ACTION')).toEqual([
    someActionNode,
    otherActionNode,
  ]);
  expect(graph.getDependsOn('OTHER_ACTION')).toEqual([]);
});
