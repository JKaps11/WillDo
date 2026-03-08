import { Fragment, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { Separator } from '@/components/ui/separator';

export function withVerticalSeparators(
  nodes: Array<ReactNode>,
): Array<ReactNode> {
  if (nodes.length === 0) return nodes;

  return nodes
    .flatMap((node): Array<ReactNode> => {
      if (!isValidElement(node) || node.key == null) {
        // Contract violation: caller must pass keyed elements
        return [node];
      }

      return [
        <Separator
          key={`sep-${node.key}`}
          orientation="vertical"
          className="border-1"
        />,
        <Fragment key={node.key}>{node}</Fragment>,
      ];
    })
    .slice(1); // remove leading separator
}
