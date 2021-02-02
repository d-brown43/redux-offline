import { InternalConfig } from './internalTypes';
import { createStore, Reducer } from 'redux';
import {
  ApiAction,
  DependentAction,
  DependentApiAction,
  OfflineAction,
  OfflineConfig,
  OfflineQueue,
  OfflineState,
  ResolvedAction,
  ResourceIdentifier,
} from './types';
import {
  getExpandedDependentActions,
  getUpdatedDependentActions,
  resolvePath,
  updateDependencies,
  updateValuesIn,
} from './expandActions';
import { configureInternalConfig } from './configureInternal';

const createConfig = (queue: OfflineAction[]) => {
  const initialState = {
    offline: {
      queue,
      isSyncing: false,
    },
  };

  const reducer: Reducer = (state = initialState) => state;
  const store = createStore(reducer, initialState);
  const optimisticStore = createStore(reducer, initialState);
  const result: InternalConfig = {
    store,
    getState: (store) => store.getState().offline,
    optimisticStore,
    config: {
      getRollbackAction: () => null,
      getFulfilledAction: () => null,
      makeApiRequest: () => Promise.resolve(),
      rootReducer: reducer,
      selector: (state) => state.offline,
    },
  };
  return result;
};

describe('get dependent actions', () => {
  const apiActionIdentifier = 'my-temp-id';
  const apiAction: ApiAction = {
    type: 'SOME_ACTION',
    data: {
      id: 'my-temp-id',
      title: 'the title',
      otherField: 'something',
    },
    offline: {
      apiData: 'api-data',
      dependencyPaths: [
        {
          uniqueIdentifier: `${apiActionIdentifier}:id`,
          path: 'data.id',
        },
        {
          uniqueIdentifier: `${apiActionIdentifier}:title`,
          path: 'data.title',
        },
      ],
    },
  };

  const apiActionBIdentifier = 'temp-id';
  const apiActionB: ApiAction = {
    type: 'SOME_OTHER_ACTION',
    data: {
      id: 'temp-id',
      dateField: '2020-sucks',
    },
    offline: {
      apiData: 'the data',
      dependencyPaths: {
        path: 'data.id',
        uniqueIdentifier: `${apiActionBIdentifier}:id`,
      },
    },
  };

  const dependentA: DependentAction = {
    type: 'SET_SOME_TOGGLE',
    data: apiAction.data.id,
    offline: {
      dependsOn: {
        path: 'data',
        uniqueIdentifier: `${apiActionIdentifier}:id`,
      },
    },
  };

  const dependentB: DependentAction = {
    type: 'SET_SOME_TITLE',
    data: {
      id: apiAction.data.id,
      title: apiAction.data.title,
    },
    offline: {
      dependsOn: [
        {
          uniqueIdentifier: `${apiActionIdentifier}:id`,
          path: 'data.id',
        },
        {
          uniqueIdentifier: `${apiActionIdentifier}:title`,
          path: 'data.title',
        },
      ],
    },
  };

  const nonDependentIdentifier = 'non-dependent-identifier';
  const nonDependent: DependentAction = {
    type: 'SET_SOME_OTHER_STUFF',
    data: {
      field: 'with data',
    },
    offline: {
      dependsOn: {
        uniqueIdentifier: `${nonDependentIdentifier}:field`,
        path: 'data.field',
      },
    },
  };

  const newDataIdentifier = 'new-data-identifier';
  const apiDependent: DependentApiAction = {
    type: 'SETS_OTHER_DATA',
    data: {
      refersTo: apiAction.data.id,
      introduces: 'new data',
    },
    offline: {
      dependsOn: {
        uniqueIdentifier: `${apiActionIdentifier}:id`,
        path: 'data.refersTo',
      },
      dependencyPaths: {
        uniqueIdentifier: `${newDataIdentifier}:title`,
        path: 'data.introduces',
      },
      apiData: 'the api data',
    },
  };

  const nextDependent: DependentAction = {
    type: 'SETS_MORE_DATA',
    data: {
      nextRefersTo: apiDependent.data.introduces,
    },
    offline: {
      dependsOn: {
        uniqueIdentifier: `${newDataIdentifier}:title`,
        path: 'data.nextRefersTo',
      },
    },
  };

  const multiDependent: DependentAction = {
    type: 'SETS_COMPLEX_DATA',
    data: {
      refersTo: apiAction.data.id,
      refersToB: apiActionB.data.id,
    },
    offline: {
      dependsOn: [
        {
          uniqueIdentifier: `${apiActionBIdentifier}:id`,
          path: 'data.refersToB',
        },
        {
          uniqueIdentifier: `${apiActionIdentifier}:id`,
          path: 'data.refersTo',
        },
      ],
    },
  };

  it('returns all dependent actions', () => {
    const queue: OfflineAction[] = [
      apiAction,
      dependentA,
      nonDependent,
      dependentB,
    ];

    const internalConfig = createConfig(queue);

    expect(
      getExpandedDependentActions(queue, internalConfig, apiAction)
    ).toEqual([apiAction, dependentA, dependentB]);
  });

  it('returns all dependent actions including additional api actions', () => {
    const queue: OfflineAction[] = [
      apiAction,
      dependentA,
      apiDependent,
      nonDependent,
    ];

    const config = createConfig(queue);

    expect(getExpandedDependentActions(queue, config, apiAction)).toEqual([
      apiAction,
      dependentA,
      apiDependent,
    ]);
  });

  it('returns dependent actions which depend on action depending on other action', () => {
    const queue: OfflineAction[] = [
      apiAction,
      dependentA,
      apiDependent,
      nonDependent,
      nextDependent,
    ];

    const config = createConfig(queue);

    expect(getExpandedDependentActions(queue, config, apiAction)).toEqual([
      apiAction,
      dependentA,
      apiDependent,
      nextDependent,
    ]);

    expect(getExpandedDependentActions(queue, config, apiDependent)).toEqual([
      apiDependent,
      nextDependent,
    ]);
  });

  it('returns dependent actions which depend on multiple actions', () => {
    const queue = [
      apiAction,
      dependentA,
      apiActionB,
      nonDependent,
      multiDependent,
    ];

    const config = createConfig(queue);

    expect(getExpandedDependentActions(queue, config, apiAction)).toEqual([
      apiAction,
      dependentA,
      multiDependent,
    ]);

    expect(getExpandedDependentActions(queue, config, apiActionB)).toEqual([
      apiActionB,
      multiDependent,
    ]);
  });
});

describe("get updated dependent action 'updateDependencies'", () => {
  describe('regular objects', () => {
    const apiActionIdentifier = 'api-action-identifier';
    const apiActionDependencies: ResourceIdentifier[] = [
      {
        path: 'payload.id',
        uniqueIdentifier: `${apiActionIdentifier}:id`,
      },
      {
        path: 'payload.title',
        uniqueIdentifier: `${apiActionIdentifier}:title`,
      },
    ];

    const apiAction: ApiAction = {
      type: 'API_ACTION',
      payload: {
        id: 'temporary id',
        title: 'temporary title',
        otherField: 'non changing',
      },
      offline: {
        dependencyPaths: apiActionDependencies,
        apiData: {},
      },
    };

    const dependentAction: DependentAction = {
      type: 'SOME_DEPENDENT_ACTION',
      payload: apiAction.payload.id,
      offline: {
        dependsOn: {
          uniqueIdentifier: `${apiActionIdentifier}:id`,
          path: 'payload',
        },
      },
    };

    const resolvedApiAction: ResolvedAction = {
      type: 'API_ACTION_RESOLVED',
      payload: {
        id: 'updated id',
        title: 'updated title',
      },
      offline: {
        resolvedDependencies: apiActionDependencies,
      },
    };

    it('returns updated dependent action with multiple fields', () => {
      const dependentAction: DependentAction = {
        type: 'SOME_DEPENDENT_ACTION',
        payload: {
          id: apiAction.payload.id,
          title: apiAction.payload.title,
        },
        offline: {
          dependsOn: apiActionDependencies,
        },
      };

      expect(
        updateDependencies(dependentAction, apiAction, resolvedApiAction)
      ).toEqual({
        ...dependentAction,
        payload: {
          id: resolvedApiAction.payload.id,
          title: resolvedApiAction.payload.title,
        },
      });
    });

    it('returns updated dependent action with single field', () => {
      expect(
        updateDependencies(dependentAction, apiAction, resolvedApiAction)
      ).toEqual({
        ...dependentAction,
        payload: resolvedApiAction.payload.id,
      });
    });

    it('throws error if resolved action refers to incorrect type', () => {
      const resolvedAction: ResolvedAction = {
        ...resolvedApiAction,
        offline: {
          ...resolvedApiAction,
          resolvedDependencies: [
            {
              path: 'payload.id',
              // Note we're referring to the title for an id
              uniqueIdentifier: `${apiActionIdentifier}:title`,
            },
            {
              path: 'payload.title',
              uniqueIdentifier: `${apiActionIdentifier}:title`,
            },
          ],
        },
      };

      expect(() =>
        updateDependencies(dependentAction, apiAction, resolvedAction)
      ).toThrow();
    });

    it('returns updated action when only one field to update', () => {
      const apiActionIdentifier = 'api-action-identifier';
      const apiAction: ApiAction = {
        type: 'API_ACTION',
        payload: {
          id: 'temporary id',
          title: 'non changing title',
        },
        offline: {
          apiData: {},
          dependencyPaths: {
            uniqueIdentifier: `${apiActionIdentifier}:id`,
            path: 'payload.id',
          },
        },
      };

      const resolvedAction: ResolvedAction = {
        type: 'API_ACTION_RESOLVED',
        payload: {
          id: 'updated id',
          title: apiAction.payload.title,
        },
        offline: {
          resolvedDependencies: {
            uniqueIdentifier: `${apiActionIdentifier}:id`,
            path: 'payload.id',
          },
        },
      };

      expect(
        updateDependencies(dependentAction, apiAction, resolvedAction)
      ).toEqual({
        ...dependentAction,
        payload: resolvedAction.payload.id,
      });
    });
  });

  describe('payload with arrays', () => {
    it('returns updated data for arrays', () => {
      const apiActionIdentifier = 'api-action-identifier';
      const apiAction: ApiAction = {
        type: 'API_ACTION',
        payload: [{ id: 'temp id 1' }, { id: 'temp id 2' }],
        offline: {
          apiData: {},
          dependencyPaths: [
            {
              uniqueIdentifier: `${apiActionIdentifier}:[0]id`,
              path: 'payload[0].id',
            },
            {
              uniqueIdentifier: `${apiActionIdentifier}:[1]id`,
              path: 'payload[1].id',
            },
          ],
        },
      };

      const dependentAction: DependentAction = {
        type: 'DEPENDENT_ACTION',
        payload: apiAction.payload[0].id,
        offline: {
          dependsOn: {
            uniqueIdentifier: `${apiActionIdentifier}:[0]id`,
            path: 'payload',
          },
        },
      };

      const resolvedAction: ResolvedAction = {
        type: 'RESOLVED_ACTION',
        payload: [{ id: 'updated id 1' }, { id: 'updated id 2' }],
        offline: {
          resolvedDependencies: [
            {
              uniqueIdentifier: `${apiActionIdentifier}:[0]id`,
              path: 'payload[0].id',
            },
            {
              uniqueIdentifier: `${apiActionIdentifier}:[1]id`,
              path: 'payload[1].id',
            },
          ],
        },
      };

      expect(
        updateDependencies(dependentAction, apiAction, resolvedAction)
      ).toEqual({
        type: 'DEPENDENT_ACTION',
        payload: resolvedAction.payload[0].id,
        offline: {
          dependsOn: {
            uniqueIdentifier: `${apiActionIdentifier}:[0]id`,
            path: 'payload',
          },
        },
      });
    });
  });
});

describe('returns updated dependent actions "getUpdatedDependentActions"', () => {
  const apiActionIdentifier = 'api-action';
  const apiAction: ApiAction = {
    type: 'API_ACTION',
    payload: {
      id: 'temp id',
      title: 'temp title',
    },
    offline: {
      dependencyPaths: [
        { path: 'payload.id', uniqueIdentifier: `${apiActionIdentifier}:id` },
        { path: 'payload.title', uniqueIdentifier: `${apiActionIdentifier}:title` },
      ],
      apiData: {},
    },
  };

  const idDependentAction: DependentAction = {
    type: 'ID_DEPENDENT_ACTION',
    payload: apiAction.payload.id,
    offline: {
      dependsOn: { path: 'payload', uniqueIdentifier: `${apiActionIdentifier}:id` },
    },
  };

  const titleDependentAction: DependentAction = {
    type: 'TITLE_DEPENDENT_ACTION',
    payload: apiAction.payload.title,
    offline: {
      dependsOn: { path: 'payload', uniqueIdentifier: `${apiActionIdentifier}:title` },
    },
  };

  const multiDependentAction: DependentAction = {
    type: 'MULTI_DEPENDENT_ACTION',
    payload: {
      idField: apiAction.payload.id,
      titleField: apiAction.payload.title,
    },
    offline: {
      dependsOn: [
        { path: 'payload.titleField', uniqueIdentifier: `${apiActionIdentifier}:title` },
        { path: 'payload.idField', uniqueIdentifier: `${apiActionIdentifier}:id` },
      ],
    },
  };

  const resolvedAction: ResolvedAction = {
    type: 'API_ACTION_RESOLVED',
    payload: {
      id: 'updated title',
      title: 'updated title',
    },
    offline: {
      resolvedDependencies: [
        { path: 'payload.id', uniqueIdentifier: `${apiActionIdentifier}:id` },
        { path: 'payload.title', uniqueIdentifier: `${apiActionIdentifier}:title` },
      ],
    },
  };

  it('updates actions in queue', () => {
    const queue: OfflineQueue = [
      apiAction,
      idDependentAction,
      multiDependentAction,
      titleDependentAction,
    ];

    const state: OfflineState = {
      isSyncing: false,
      queue,
    };

    const config: OfflineConfig = {
      rootReducer: (state) => state,
      makeApiRequest: () => Promise.resolve(),
      getFulfilledAction: () => null,
      getRollbackAction: () => null,
      useBatching: true,
      selector: (state) => state,
    };

    const internalConfig = configureInternalConfig(config);
    // @ts-ignore
    const optimisticStore = createStore((state) => state, state);

    const result = getUpdatedDependentActions(
      { ...internalConfig, optimisticStore },
      apiAction,
      resolvedAction
    );
    expect(result[0]).toEqual({
      original: idDependentAction,
      updated: {
        ...idDependentAction,
        payload: resolvedAction.payload.id,
      },
    });
    expect(result[1]).toEqual({
      original: multiDependentAction,
      updated: {
        ...multiDependentAction,
        payload: {
          ...multiDependentAction.payload,
          idField: resolvedAction.payload.id,
          titleField: resolvedAction.payload.title,
        },
      },
    });
    expect(result[2]).toEqual({
      original: titleDependentAction,
      updated: {
        ...titleDependentAction,
        payload: resolvedAction.payload.title,
      },
    });
  });

  it('updates actions in queue if it is last optimistic action it can depend on', () => {});
});

describe('resolves the path', () => {
  it('resolves the path', () => {
    expect(
      resolvePath('my.path', {
        my: {
          other: 'k',
          path: 'value',
        },
      })
    ).toEqual('value');
  });

  it("returns undefined if path doesn't exist", () => {
    expect(
      resolvePath('my.path', {
        my: {
          otherField: 'value',
          other: 'dsadsaa',
        },
      })
    ).toBeUndefined();
  });

  it('returns object part', () => {
    expect(
      resolvePath('my.long', {
        my: {
          long: {
            path: 'value',
            other: 'dngjfkd',
          },
        },
      })
    ).toEqual({
      path: 'value',
      other: 'dngjfkd',
    });
  });

  it('returns undefined if path too long', () => {
    expect(
      resolvePath('my.long.path', {
        my: {
          long: 'value',
          other: 'adsadagfdgfd',
        },
      })
    ).toBeUndefined();
  });

  it('returns all values for an array', () => {
    expect(
      resolvePath('my.path', {
        my: [
          {
            path: 'a',
            other: 'adsadagfdngf',
          },
          {
            path: 'b',
            other: 'adsadahgff',
          },
        ],
      })
    ).toEqual(['a', 'b']);
  });

  it('returns values for a nested array', () => {
    expect(
      resolvePath('my.long.path', {
        my: [
          {
            long: [
              {
                path: 'a',
                other: 'adsadagfgfd',
              },
              {
                path: 'c',
                other: 'adsadadsd',
              },
            ],
          },
          {
            long: [
              {
                path: 'b',
                other: 'adsada',
              },
            ],
          },
        ],
      })
    ).toEqual(['a', 'c', 'b']);
  });

  it('returns undefined if invalid path', () => {
    expect(
      resolvePath('my..path', {
        my: {
          path: 'value',
        },
      })
    ).toBeUndefined();
  });

  it('returns undefined if different object shapes', () => {
    expect(
      resolvePath('my.path', {
        my: [
          {
            path: 'a',
          },
          [
            {
              path: 'b',
            },
          ],
        ],
      })
    ).toBeUndefined();
  });

  it('returns undefined for mismatched object shapes', () => {
    expect(
      resolvePath('my.path', {
        my: [
          [
            [
              {
                path: 'a',
              },
            ],
          ],
          [
            {
              path: 'b',
            },
          ],
        ],
      })
    ).toBeUndefined();
  });
});

describe('update values', () => {
  it('updates a value in an object', () => {
    expect(
      updateValuesIn(
        'my.path',
        {
          my: {
            path: 'a',
          },
        },
        ['b']
      )
    ).toEqual({
      my: {
        path: 'b',
      },
    });
  });

  it('updates deep values', () => {
    expect(
      updateValuesIn(
        'my.path.to.thing',
        {
          my: {
            path: {
              to: {
                thing: 'a',
              },
            },
          },
        },
        ['b']
      )
    ).toEqual({
      my: {
        path: {
          to: {
            thing: 'b',
          },
        },
      },
    });
  });

  it('preserves other values', () => {
    expect(
      updateValuesIn(
        'my.path.to.thing',
        {
          my: {
            mcakndsa: 'dsabsa',
            path: {
              something: 'dbfd',
              to: {
                thing: 'a',
                other: 'agfd',
              },
            },
          },
        },
        ['b']
      )
    ).toEqual({
      my: {
        mcakndsa: 'dsabsa',
        path: {
          something: 'dbfd',
          to: {
            other: 'agfd',
            thing: 'b',
          },
        },
      },
    });
  });

  it('updates values in arrays', () => {
    expect(
      updateValuesIn(
        'my.path',
        {
          my: [
            {
              other: 'k',
              path: 'a',
            },
            {
              other: 'kdsa',
              path: 'b',
            },
          ],
        },
        ['a-updated', 'b-updated']
      )
    ).toEqual({
      my: [
        {
          other: 'k',
          path: 'a-updated',
        },
        {
          other: 'kdsa',
          path: 'b-updated',
        },
      ],
    });
  });

  it('returns undefined if too many values', () => {
    expect(
      updateValuesIn(
        'my.path',
        {
          my: {
            path: 'a',
          },
        },
        ['adsa', 'sadsa']
      )
    ).toBeUndefined();
  });

  it('returns undefined if too few values', () => {
    expect(
      updateValuesIn(
        'my.path',
        {
          my: [
            {
              path: 'a',
            },
            {
              path: 'b',
            },
          ],
        },
        ['adsa']
      )
    ).toBeUndefined();
  });

  it('updates values in deep nested arrays', () => {
    expect(
      updateValuesIn(
        'my.deep.path',
        {
          my: [
            {
              deep: [
                {
                  path: 'a',
                },
              ],
            },
            {
              deep: [
                {
                  path: 'b',
                },
              ],
            },
            {
              deep: [
                {
                  path: 'c',
                },
              ],
            },
          ],
        },
        ['a-updated', 'b-updated', 'c-updated']
      )
    ).toEqual({
      my: [
        {
          deep: [
            {
              path: 'a-updated',
            },
          ],
        },
        {
          deep: [
            {
              path: 'b-updated',
            },
          ],
        },
        {
          deep: [
            {
              path: 'c-updated',
            },
          ],
        },
      ],
    });
  });
});
