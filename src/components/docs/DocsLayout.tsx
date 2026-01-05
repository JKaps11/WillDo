import { DocsSidebar } from './DocsSidebar';
import { DocsContent } from './DocsContent';
import { cn } from '@/lib/utils';

interface DocsLayoutProps {
  selectedDoc: string;
  onSelectDoc: (doc: string) => void;
  className?: string;
}

export function DocsLayout({
  selectedDoc,
  onSelectDoc,
  className,
}: DocsLayoutProps): React.ReactElement {
  return (
    <div className={cn('flex h-full', className)}>
      <DocsSidebar selectedDoc={selectedDoc} onSelectDoc={onSelectDoc} />
      <DocsContent docId={selectedDoc} />
    </div>
  );
}
