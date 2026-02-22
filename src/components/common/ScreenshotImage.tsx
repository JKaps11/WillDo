import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

interface ScreenshotImageProps {
  src: string;
  caption: string;
  fallbackLabel?: string;
  aspectRatio?: 'auto' | 'video' | 'square' | 'wide';
  className?: string;
  imgClassName?: string;
}

const ASPECT_CLASSES: Record<string, string> = {
  video: 'aspect-video',
  square: 'aspect-square',
  wide: 'aspect-[21/9]',
};

export function ScreenshotImage({
  src,
  caption,
  fallbackLabel,
  aspectRatio = 'auto',
  className,
  imgClassName,
}: ScreenshotImageProps): React.ReactElement {
  const [errored, setErrored] = useState(false);

  useEffect(() => setErrored(false), [src]);

  const aspectClass = ASPECT_CLASSES[aspectRatio] ?? '';

  if (errored) {
    return (
      <div
        className={cn(
          'w-full rounded-xl overflow-hidden bg-muted/50 border-2 border-dashed border-muted-foreground/25 flex items-center justify-center p-8',
          aspectClass,
          className,
        )}
      >
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
          <div className="mb-2 text-4xl">{'\u{1F5BC}\uFE0F'}</div>
          <p className="text-sm font-medium">{caption}</p>
          {fallbackLabel && (
            <p className="text-xs text-muted-foreground/70">{fallbackLabel}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full rounded-xl overflow-hidden bg-muted/50',
        aspectClass,
        className,
      )}
    >
      <img
        src={src}
        alt={caption}
        className={cn('w-full h-auto', imgClassName)}
        loading="lazy"
        onError={() => setErrored(true)}
      />
    </div>
  );
}
