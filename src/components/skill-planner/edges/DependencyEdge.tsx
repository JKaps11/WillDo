import { BaseEdge, getSmoothStepPath } from '@xyflow/react';
import type { Edge, EdgeProps } from '@xyflow/react';

export interface DependencyEdgeData extends Record<string, unknown> {
  isActive: boolean;
}

export type DependencyEdgeType = Edge<DependencyEdgeData, 'dependency'>;

export function DependencyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<DependencyEdgeType>): React.ReactElement {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const isActive = data?.isActive ?? false;

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        strokeWidth: selected ? 3 : 2,
        stroke: isActive ? 'var(--stage-complete)' : 'var(--stage-not-started)',
        strokeDasharray: isActive ? undefined : '5,5',
      }}
    />
  );
}
