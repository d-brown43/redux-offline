import { createArrayDependencyPaths } from './externalUtils';

it('creates an array of resource identifiers based on array of data', () => {
  expect(
    createArrayDependencyPaths({
      data: [{ id: 'some-id-1' }, { id: 'some-id-2' }],
      uniqueId: (value) => value.id,
      path: 'payload.$index.id',
    })
  ).toEqual([
    {
      uniqueIdentifier: 'some-id-1',
      path: 'payload[0].id',
    },
    {
      uniqueIdentifier: 'some-id-2',
      path: 'payload[1].id',
    },
  ]);

  expect(
    createArrayDependencyPaths({
      data: [{ id: 'some-id-1' }, { id: 'some-id-2' }],
      uniqueId: (value) => value.id,
      path: '$index.id',
    })
  ).toEqual([
    {
      uniqueIdentifier: 'some-id-1',
      path: '[0].id',
    },
    {
      uniqueIdentifier: 'some-id-2',
      path: '[1].id',
    },
  ]);

  expect(
    createArrayDependencyPaths({
      data: ['some-id-1', 'some-id-2'],
      uniqueId: (value) => value,
      path: 'payload.$index',
    })
  ).toEqual([
    {
      uniqueIdentifier: 'some-id-1',
      path: 'payload[0]',
    },
    {
      uniqueIdentifier: 'some-id-2',
      path: 'payload[1]',
    },
  ]);
});
