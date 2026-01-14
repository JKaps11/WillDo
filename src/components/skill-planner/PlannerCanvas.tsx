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
import {
  HORIZONTAL_GAP,
  NODE_HEIGHT,
  NODE_WIDTH,
  VERTICAL_GAP,
} from './constants';
import type { EnrichedSubSkill, LayoutNode, SkillWithSubSkills } from './types';
import type { Edge, Node } from '@xyflow/react';
import type { SkillRootNodeData } from './nodes/SkillRootNode';
import type { SubSkillNodeData } from './nodes/SubSkillNode';
import type { Skill } from '@/db/schemas/skill.schema';
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

function buildLayoutTree(skill: SkillWithSubSkills): LayoutNode {
  const childrenMap: Map<string | null, Array<EnrichedSubSkill>> = new Map();

  skill.subSkills.forEach((ss: EnrichedSubSkill) => {
    const parentId: string | null = ss.parentSubSkillId;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(ss);
  });

  function buildSubSkillNode(subSkill: EnrichedSubSkill): LayoutNode {
    const children: Array<LayoutNode> = (
      childrenMap.get(subSkill.id) ?? []
    ).map((child: EnrichedSubSkill) => buildSubSkillNode(child));

    return {
      id: `subskill-${subSkill.id}`,
      type: 'subSkill',
      data: subSkill,
      children,
      width: 0,
      x: 0,
      y: 0,
    };
  }

  const rootChildren: Array<LayoutNode> = (childrenMap.get(null) ?? []).map(
    (child: EnrichedSubSkill) => buildSubSkillNode(child),
  );

  return {
    id: 'root',
    type: 'skill',
    data: skill,
    children: rootChildren,
    width: 0,
    x: 0,
    y: 0,
  };
}

function calculateSubtreeWidths(node: LayoutNode): number {
  if (node.children.length === 0) {
    node.width = NODE_WIDTH;
    return NODE_WIDTH;
  }

  const childrenWidth: number = node.children.reduce(
    (sum: number, child: LayoutNode) => sum + calculateSubtreeWidths(child),
    0,
  );
  const gapsWidth: number = (node.children.length - 1) * HORIZONTAL_GAP;
  node.width = Math.max(NODE_WIDTH, childrenWidth + gapsWidth);
  return node.width;
}

function positionNodes(node: LayoutNode, x: number, y: number): void {
  node.x = x;
  node.y = y;

  if (node.children.length === 0) return;

  const childrenTotalWidth: number =
    node.children.reduce(
      (sum: number, child: LayoutNode) => sum + child.width,
      0,
    ) +
    (node.children.length - 1) * HORIZONTAL_GAP;

  let currentX: number = x - childrenTotalWidth / 2;
  const childY: number = y + NODE_HEIGHT + VERTICAL_GAP;

  node.children.forEach((child: LayoutNode) => {
    const childCenterX: number = currentX + child.width / 2;
    positionNodes(child, childCenterX, childY);
    currentX += child.width + HORIZONTAL_GAP;
  });
}

function createFlowNode(layoutNode: LayoutNode): Node {
  const position = { x: layoutNode.x - NODE_WIDTH / 2, y: layoutNode.y };

  if (layoutNode.type === 'skill') {
    return {
      id: layoutNode.id,
      type: 'skillRoot',
      position,
      data: { skill: layoutNode.data as Skill } satisfies SkillRootNodeData,
      draggable: true,
    };
  }

  const subSkill: EnrichedSubSkill = layoutNode.data as EnrichedSubSkill;
  return {
    id: layoutNode.id,
    type: 'subSkill',
    position,
    data: {
      subSkill,
      metrics: subSkill.metrics,
      isLocked: subSkill.isLocked,
    } satisfies SubSkillNodeData,
    draggable: true,
  };
}

function flattenTree(
  node: LayoutNode,
  skill: SkillWithSubSkills,
  parentId: string | null,
  nodes: Array<Node>,
  edges: Array<Edge>,
): void {
  nodes.push(createFlowNode(node));

  if (parentId !== null) {
    const parentSubSkill: EnrichedSubSkill | undefined =
      parentId === 'root'
        ? undefined
        : skill.subSkills.find(
            (ss: EnrichedSubSkill) => `subskill-${ss.id}` === parentId,
          );

    const isActive: boolean =
      parentId === 'root' || parentSubSkill?.stage === 'complete';

    edges.push({
      id: `edge-${parentId}-${node.id}`,
      source: parentId,
      target: node.id,
      type: 'tree',
      data: { isActive },
    });
  }

  node.children.forEach((child: LayoutNode) => {
    flattenTree(child, skill, node.id, nodes, edges);
  });
}

function buildNodesAndEdges(skill: SkillWithSubSkills): {
  nodes: Array<Node>;
  edges: Array<Edge>;
} {
  const tree: LayoutNode = buildLayoutTree(skill);
  calculateSubtreeWidths(tree);
  positionNodes(tree, 400, 0);

  const nodes: Array<Node> = [];
  const edges: Array<Edge> = [];
  flattenTree(tree, skill, null, nodes, edges);

  return { nodes, edges };
}

export function PlannerCanvas({
  skill,
  onNodeSelect,
}: PlannerCanvasProps): React.ReactElement {
  const initialLayout: { nodes: Array<Node>; edges: Array<Edge> } = useMemo(
    () => buildNodesAndEdges(skill),
    [skill],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialLayout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayout.edges);

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
          type: 'tree',
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <PlannerControls />
      </ReactFlow>
    </div>
  );
}
