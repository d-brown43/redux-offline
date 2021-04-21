import createDependencyGraph from './dependencyGraphFactory';
import { Node } from './types';

it('throws an error if duplicate node types are found', () => {
  expect(() =>
    createDependencyGraph([
      { type: 'SOME_ACTION', dependencies: [] },
      { type: 'SOME_ACTION', dependencies: [] },
    ])
  ).toThrow();
});

it('throws an error if duplicate dependencies for a given node are found', () => {
  expect(() =>
    createDependencyGraph([
      { type: 'my_action', dependencies: [] },
      { type: 'my_other_action', dependencies: [] },
      {
        type: 'SOME_ACTION',
        dependencies: [
          {
            type: 'my_action',
            dependsOn: () => false,
            updateDependency: () => null,
          },
          {
            type: 'my_other_action',
            dependsOn: () => false,
            updateDependency: () => null,
          },
          {
            // Note the duplicate
            type: 'my_action',
            dependsOn: () => false,
            updateDependency: () => null,
          },
        ],
      },
    ])
  ).toThrow();
});

it('does not throw if duplicate dependencies on different nodes are found', () => {
  expect(() =>
    createDependencyGraph([
      { type: 'my_action', dependencies: [] },
      {
        type: 'SOME_ACTION',
        dependencies: [
          {
            type: 'my_action',
            dependsOn: () => false,
            updateDependency: () => null,
          },
          {
            type: 'my_other_action',
            dependsOn: () => false,
            updateDependency: () => null,
          },
        ],
      },
      {
        type: 'my_other_action',
        dependencies: [
          {
            // Note the duplicate dependency on a different node
            type: 'my_action',
            dependsOn: () => false,
            updateDependency: () => null,
          },
        ],
      },
    ])
  ).not.toThrow();
});
