import {
  HORIZONTAL_GAP,
  NODE_HEIGHT,
  NODE_WIDTH,
  SUBSKILL_NODE_PREFIX,
  VERTICAL_GAP,
} from './constants';
import type {
  EnrichedSubSkill,
  LayoutNode,
  SkillWithEnrichedSubSkills,
} from './types';
import type { Edge, Node } from '@xyflow/react';
import type { SkillRootNodeData } from './nodes/SkillRootNode';
import type { SubSkillNodeData } from './nodes/SubSkillNode';
import type { Skill } from '@/db/schemas/skill.schema';

function buildLayoutTree(skill: SkillWithEnrichedSubSkills): LayoutNode {
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
      id: `${SUBSKILL_NODE_PREFIX}${subSkill.id}`,
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

// Calculate the height of each subtree (for vertical stacking of siblings)
function calculateSubtreeHeights(node: LayoutNode): number {
  if (node.children.length === 0) {
    node.width = NODE_HEIGHT; // Using width field to store height for layout
    return NODE_HEIGHT;
  }

  const childrenHeight: number = node.children.reduce(
    (sum: number, child: LayoutNode) => sum + calculateSubtreeHeights(child),
    0,
  );
  const gapsHeight: number = (node.children.length - 1) * VERTICAL_GAP;
  node.width = Math.max(NODE_HEIGHT, childrenHeight + gapsHeight);
  return node.width;
}

// Position nodes horizontally: root on right, children on left
function positionNodes(node: LayoutNode, x: number, y: number): void {
  node.x = x;
  node.y = y;

  if (node.children.length === 0) return;

  const childrenTotalHeight: number =
    node.children.reduce(
      (sum: number, child: LayoutNode) => sum + child.width,
      0,
    ) +
    (node.children.length - 1) * VERTICAL_GAP;

  let currentY: number = y - childrenTotalHeight / 2;
  const childX: number = x - NODE_WIDTH - HORIZONTAL_GAP; // Children go to the left

  node.children.forEach((child: LayoutNode) => {
    const childCenterY: number = currentY + child.width / 2;
    positionNodes(child, childX, childCenterY);
    currentY += child.width + VERTICAL_GAP;
  });
}

function createFlowNode(layoutNode: LayoutNode): Node {
  const position = {
    x: layoutNode.x - NODE_WIDTH / 2,
    y: layoutNode.y - NODE_HEIGHT / 2,
  };

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
  skill: SkillWithEnrichedSubSkills,
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
            (ss: EnrichedSubSkill) =>
              `${SUBSKILL_NODE_PREFIX}${ss.id}` === parentId,
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

export function buildNodesAndEdges(skill: SkillWithEnrichedSubSkills): {
  nodes: Array<Node>;
  edges: Array<Edge>;
} {
  const tree: LayoutNode = buildLayoutTree(skill);
  calculateSubtreeHeights(tree);
  // Start root on the right side, centered vertically
  positionNodes(tree, 600, 300);

  const nodes: Array<Node> = [];
  const edges: Array<Edge> = [];
  flattenTree(tree, skill, null, nodes, edges);

  return { nodes, edges };
}
