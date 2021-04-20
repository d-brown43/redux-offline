import React, { useMemo } from 'react';
// @ts-ignore
import Graph from 'react-graph-vis';
import { DependencyGraph } from './dependencyGraph';

const graphOptions = {};

const events = {};

type Props = {
  dependencyGraph: DependencyGraph<any>;
};

const RenderGraph = ({ dependencyGraph }: Props) => {
  const graph = useMemo(
    () => ({
      nodes: dependencyGraph.nodes.map((node, i) => ({
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

  return <Graph graph={graph} options={graphOptions} events={events} />;
};

export default RenderGraph;
