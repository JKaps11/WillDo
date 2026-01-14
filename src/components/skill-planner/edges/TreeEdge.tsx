import { BaseEdge, getSmoothStepPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import type { TreeEdgeType } from '../types';

export function TreeEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<TreeEdgeType>): React.ReactElement {
  const [edgePath]: [string] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const isActive: boolean = data?.isActive ?? false;

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        strokeWidth: selected ? 3 : 2,
        stroke: isActive ? 'var(--stage-complete)' : 'var(--stage-not-started)',
      }}
    />
  );
}
