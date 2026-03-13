import { TrendingUp } from 'lucide-react';

interface MomentumFrameProps {
  text: string;
}

export function MomentumFrame({
  text,
}: MomentumFrameProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <TrendingUp className="size-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
