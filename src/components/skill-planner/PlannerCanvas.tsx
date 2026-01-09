import {
  Background,
  BackgroundVariant,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo } from 'react';
import { DependencyEdge } from './edges/DependencyEdge';
import { SkillRootNode } from './nodes/SkillRootNode';
import { SubSkillNode } from './nodes/SubSkillNode';
import { PlannerControls } from './PlannerControls';
import type { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { SkillMetric } from '@/db/schemas/skill_metric.schema';
import type { SkillRootNodeData } from './nodes/SkillRootNode';
import type { SubSkill } from '@/db/schemas/sub_skill.schema';
import type { SubSkillNodeData } from './nodes/SubSkillNode';
import type { Skill } from '@/db/schemas/skill.schema';

type EnrichedSubSkill = SubSkill & {
  metrics: Array<SkillMetric>;
  isLocked: boolean;
};

interface PlannerCanvasProps {
  skill: Skill & { subSkills: Array<EnrichedSubSkill> };
  onNodeSelect: (nodeId: string | null) => void;
}

const nodeTypes = {
  skillRoot: SkillRootNode,
  subSkill: SubSkillNode,
};

const edgeTypes = {
  dependency: DependencyEdge,
};

function calculateNodeDepths(
  subSkills: Array<EnrichedSubSkill>,
): Map<string, number> {
  const depths = new Map<string, number>();
  const subSkillMap = new Map(subSkills.map((ss) => [ss.id, ss]));

  function getDepth(id: string, visited: Set<string> = new Set()): number {
    if (depths.has(id)) return depths.get(id)!;
    if (visited.has(id)) return 1; // Circular reference fallback

    const subSkill = subSkillMap.get(id);
    if (!subSkill || !subSkill.parentSubSkillId) {
      // Root-level sub-skills (no parent) are at depth 1
      depths.set(id, 1);
      return 1;
    }

    visited.add(id);
    const parentDepth = getDepth(subSkill.parentSubSkillId, visited);
    const depth = parentDepth + 1;
    depths.set(id, depth);
    return depth;
  }

  subSkills.forEach((ss) => getDepth(ss.id));
  return depths;
}

function buildNodesAndEdges(
  skill: Skill & { subSkills: Array<EnrichedSubSkill> },
): { nodes: Array<Node>; edges: Array<Edge> } {
  const nodes: Array<Node> = [];
  const edges: Array<Edge> = [];

  // Root node
  nodes.push({
    id: 'root',
    type: 'skillRoot',
    position: { x: 400, y: 0 },
    data: { skill } satisfies SkillRootNodeData,
    draggable: true,
  });

  if (skill.subSkills.length === 0) {
    return { nodes, edges };
  }

  // Calculate depth for each node based on dependency chain
  const depths = calculateNodeDepths(skill.subSkills);

  // Group sub-skills by their depth level
  const levelGroups = new Map<number, Array<EnrichedSubSkill>>();
  skill.subSkills.forEach((subSkill) => {
    const depth = depths.get(subSkill.id) ?? 1;
    if (!levelGroups.has(depth)) {
      levelGroups.set(depth, []);
    }
    levelGroups.get(depth)!.push(subSkill);
  });

  const horizontalSpacing = 240;
  const verticalSpacing = 160;

  // Create sub-skill nodes positioned by level
  levelGroups.forEach((subSkillsAtLevel, level) => {
    const levelWidth = (subSkillsAtLevel.length - 1) * horizontalSpacing;
    const startX = 400 - levelWidth / 2;

    subSkillsAtLevel.forEach((subSkill, indexInLevel) => {
      nodes.push({
        id: `subskill-${subSkill.id}`,
        type: 'subSkill',
        position: {
          x: startX + indexInLevel * horizontalSpacing,
          y: level * verticalSpacing,
        },
        data: {
          subSkill,
          metrics: subSkill.metrics,
          isLocked: subSkill.isLocked,
        } satisfies SubSkillNodeData,
        draggable: true,
      });
    });
  });

  // Create edges based on parentSubSkillId
  skill.subSkills.forEach((subSkill) => {
    if (!subSkill.parentSubSkillId) {
      // Connect to root if no parent
      edges.push({
        id: `edge-root-${subSkill.id}`,
        source: 'root',
        target: `subskill-${subSkill.id}`,
        type: 'dependency',
        data: { isActive: true },
      });
    } else {
      // Connect to parent sub-skill
      const parent = skill.subSkills.find(
        (ss) => ss.id === subSkill.parentSubSkillId,
      );
      edges.push({
        id: `edge-${subSkill.parentSubSkillId}-${subSkill.id}`,
        source: `subskill-${subSkill.parentSubSkillId}`,
        target: `subskill-${subSkill.id}`,
        type: 'dependency',
        data: { isActive: parent?.stage === 'complete' },
      });
    }
  });

  return { nodes, edges };
}

export function PlannerCanvas({
  skill,
  onNodeSelect,
}: PlannerCanvasProps): React.ReactElement {
  const initialLayout = useMemo(() => buildNodesAndEdges(skill), [skill]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialLayout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayout.edges);

  // Update nodes when skill data changes
  useEffect(() => {
    const newLayout = buildNodesAndEdges(skill);
    setNodes(newLayout.nodes);
    setEdges(newLayout.edges);
  }, [skill, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id.startsWith('subskill-')) {
        const subSkillId = node.id.replace('subskill-', '');
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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'dependency',
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <PlannerControls />
      </ReactFlow>
    </div>
  );
}
