import { Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

export function PlannerControls(): React.ReactElement {
  const { zoomIn, zoomOut, fitView, setViewport } = useReactFlow();

  const handleReset = (): void => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 });
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 flex gap-1 rounded-lg border bg-background p-1 shadow-md">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => zoomIn({ duration: 200 })}
          >
            <ZoomIn className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom In</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => zoomOut({ duration: 200 })}
          >
            <ZoomOut className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom Out</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => fitView({ duration: 300, padding: 0.2 })}
          >
            <Maximize2 className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Fit View</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={handleReset}
          >
            <RotateCcw className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Reset View</TooltipContent>
      </Tooltip>
    </div>
  );
}
