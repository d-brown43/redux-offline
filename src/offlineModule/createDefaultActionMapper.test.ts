import createMapDependentActions from './createDefaultActionMapper';
import createDependencyGraph from './dependencyGraphFactory';

it('returns null if no dependency found', () => {
  const mapper = createMapDependentActions({
    dependencyGraph: createDependencyGraph([
      { type: 'DEPENDENT_ACTION', dependencies: [] },
      { type: 'OTHER_DEPENDENT_ACTION', dependencies: [] },
      {
        type: 'SOME_ACTION',
        dependencies: [
          {
            type: 'DEPENDENT_ACTION',
            updateDependency: (value) => value,
            dependsOn: () => false,
          },
          {
            type: 'OTHER_DEPENDENT_ACTION',
            updateDependency: (value) => value,
            dependsOn: () => false,
          },
        ],
      },
    ]),
  });

  const originalAction = {
    type: 'SOME_ACTION',
  };

  const fulfilledAction = {
    type: 'ARBITRARY_TYPE',
  };

  const pendingAction = {
    type: 'DEPENDENT_ACTION',
  };

  expect(mapper(originalAction, fulfilledAction, pendingAction)).toBeNull();
});

it('returns the updated dependency if dependencies are found', () => {
  const mapper = createMapDependentActions({
    dependencyGraph: createDependencyGraph([
      { type: 'DEPENDENT_ACTION', dependencies: [] },
      { type: 'OTHER_DEPENDENT_ACTION', dependencies: [] },
      {
        type: 'SOME_ACTION',
        dependencies: [
          {
            type: 'DEPENDENT_ACTION',
            updateDependency: (value) => ({
              ...value,
              updated: true,
            }),
            dependsOn: () => true,
          },
          {
            type: 'OTHER_DEPENDENT_ACTION',
            updateDependency: (value) => value,
            dependsOn: () => true,
          },
        ],
      },
    ]),
  });

  const originalAction = {
    type: 'SOME_ACTION',
  };

  const fulfilledAction = {
    type: 'ARBITRARY_TYPE',
  };

  const pendingAction = {
    type: 'DEPENDENT_ACTION',
  };

  expect(mapper(originalAction, fulfilledAction, pendingAction)).toEqual(
    expect.objectContaining({
      updated: true,
    })
  );
});
