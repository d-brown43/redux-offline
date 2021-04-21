import React, { useMemo } from 'react';
// @ts-ignore
import Graph from 'react-graph-vis';
import DependencyGraph from './DependencyGraph';

const graphOptions = {};

const events = {};

type Props = {
  dependencyGraph: DependencyGraph<any>;
};

export const useGraph = (dependencyGraph: DependencyGraph<any>) => {
  return useMemo(
    () => ({
      nodes: dependencyGraph.nodes.map((node) => ({
        id: node.type,
        label: node.type,
      })),
      edges: dependencyGraph.nodes.reduce<{ from: string; to: string }[]>(
        (acc, node) => {
          return acc.concat(
            node.dependencies.map((dependency) => {
              return {
                from: dependency.type,
                to: node.type,
              };
            })
          );
        },
        []
      ),
    }),
    [dependencyGraph]
  );
};

const RenderGraph = ({ dependencyGraph }: Props) => {
  const graph = useGraph(dependencyGraph);
  return <Graph graph={graph} options={graphOptions} events={events} />;
};

export default RenderGraph;
