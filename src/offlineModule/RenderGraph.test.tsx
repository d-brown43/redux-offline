import createDependencyGraph from './dependencyGraphFactory';
import { useGraph } from './RenderGraph';
import { render } from '@testing-library/react';

it('generates a graph from a dependency graph', () => {
  const dependencyGraph = createDependencyGraph([
    {
      type: 'some_dependent_action',
      dependencies: [],
    },
    {
      type: 'some_other_action',
      dependencies: [
        {
          type: 'some_dependent_action',
          dependsOn: () => true,
          updateDependency: () => null,
        },
      ],
    },
  ]);

  const Component = () => {
    const graph = useGraph(dependencyGraph);
    return <span>{JSON.stringify(graph)}</span>;
  };

  const { container } = render(<Component />);
  const graph = JSON.parse(container.textContent as string);
  expect(graph).toEqual({
    nodes: [
      { id: 'some_dependent_action', label: 'some_dependent_action' },
      { id: 'some_other_action', label: 'some_other_action' },
    ],
    edges: [{ from: 'some_dependent_action', to: 'some_other_action' }],
  });
});
