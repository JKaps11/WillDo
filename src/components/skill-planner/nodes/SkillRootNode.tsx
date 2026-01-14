import { Handle, Position } from '@xyflow/react';
import { NODE_HEIGHT, NODE_WIDTH } from '../constants';
import type { Skill } from '@/db/schemas/skill.schema';
import type { Node, NodeProps } from '@xyflow/react';

export interface SkillRootNodeData extends Record<string, unknown> {
  skill: Skill;
}

export type SkillRootNodeType = Node<SkillRootNodeData, 'skillRoot'>;

export function SkillRootNode({
  data,
}: NodeProps<SkillRootNodeType>): React.ReactElement {
  const { skill } = data;

  return (
    <div
      className="flex flex-col justify-center rounded-lg border-2 bg-card px-4 py-3 shadow-lg"
      style={{
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        borderColor: skill.color,
      }}
    >
      <div className="flex items-center gap-2">
        {skill.icon && <span className="text-2xl">{skill.icon}</span>}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{skill.name}</h3>
          {skill.goal && (
            <p className="truncate text-xs text-muted-foreground">
              {skill.goal}
            </p>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-3 !border-2 !border-background !bg-primary"
      />
    </div>
  );
}
