import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

export function PlannerControls(): React.ReactElement {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute bottom-4 left-4 z-10 flex gap-1 rounded-lg border bg-background p-1 shadow-md">
      <Tooltip>
        <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-8" onClick={() => zoomIn({ duration: 200 })} />}>
            <ZoomIn className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Zoom In</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-8" onClick={() => zoomOut({ duration: 200 })} />}>
            <ZoomOut className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Zoom Out</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-8" onClick={() => fitView({ duration: 300, padding: 0.2 })} />}>
            <RotateCcw className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Reset View</TooltipContent>
      </Tooltip>
    </div>
  );
}
