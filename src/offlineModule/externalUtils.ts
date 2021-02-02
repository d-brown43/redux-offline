import { ResourceIdentifier, UniqueIdentifier } from './types';

type CreateIdentifierArgs<T> = {
  path: string;
  data: T[];
  uniqueId: (value: T, index: number) => UniqueIdentifier;
};

export type CreateArrayDependencyPaths = <T>(
  config: CreateIdentifierArgs<T>
) => ResourceIdentifier[];

export const createArrayDependencyPaths: CreateArrayDependencyPaths = ({
  path,
  data,
  uniqueId,
}) =>
  data.map((ob, i) => ({
    uniqueIdentifier: uniqueId(ob, i),
    path: path
      .replace(/\.?\$index\./, `[${i}].`)
      .replace(/\.?\$index/, `[${i}]`),
  }));
