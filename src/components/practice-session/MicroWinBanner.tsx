import { Sparkles } from 'lucide-react';

interface MicroWinBannerProps {
  text: string;
}

export function MicroWinBanner({
  text,
}: MicroWinBannerProps): React.ReactElement {
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-500" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
            Your words from a previous session:
          </p>
          <p className="text-sm italic">&ldquo;{text}&rdquo;</p>
        </div>
      </div>
    </div>
  );
}
