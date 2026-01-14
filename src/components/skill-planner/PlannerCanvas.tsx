import {
  Background,
  BackgroundVariant,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo } from 'react';
import { TreeEdge } from './edges';
import { SkillRootNode } from './nodes/SkillRootNode';
import { SubSkillNode } from './nodes/SubSkillNode';
import { PlannerControls } from './PlannerControls';
import { buildNodesAndEdges } from './SkillTreeUtils';
import type { SkillWithSubSkills } from './types';
import type { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface PlannerCanvasProps {
  skill: SkillWithSubSkills;
  onNodeSelect: (nodeId: string | null) => void;
}

const nodeTypes = {
  skillRoot: SkillRootNode,
  subSkill: SubSkillNode,
};

const edgeTypes = {
  tree: TreeEdge,
};

export function PlannerCanvas({
  skill,
  onNodeSelect,
}: PlannerCanvasProps): React.ReactElement {
  const initialLayout: { nodes: Array<Node>; edges: Array<Edge> } = useMemo(
    () => buildNodesAndEdges(skill),
    [skill],
  );

  const [nodes, setNodes] = useNodesState(initialLayout.nodes);
  const [edges, setEdges] = useEdgesState(initialLayout.edges);

  useEffect(() => {
    const newLayout: { nodes: Array<Node>; edges: Array<Edge> } =
      buildNodesAndEdges(skill);
    setNodes(newLayout.nodes);
    setEdges(newLayout.edges);
  }, [skill, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id.startsWith('subskill-')) {
        const subSkillId: string = node.id.replace('subskill-', '');
        onNodeSelect(subSkillId);
      } else {
        onNodeSelect(null);
      }
    },
    [onNodeSelect],
  );

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        proOptions={{ hideAttribution: true }}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'tree',
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <PlannerControls />
      </ReactFlow>
    </div>
  );
}
