import {
  BookOpen,
  LayoutDashboard,
  Lightbulb,
  Sparkles,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocItem {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const DOCS: Array<DocItem> = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <BookOpen className="size-4" />,
  },
  {
    id: 'dashboard-guide',
    title: 'Dashboard Guide',
    icon: <LayoutDashboard className="size-4" />,
  },
  {
    id: 'skill-management',
    title: 'Skill Management',
    icon: <Lightbulb className="size-4" />,
  },
  {
    id: 'skill-planner',
    title: 'Skill Planner',
    icon: <Target className="size-4" />,
  },
  {
    id: 'best-practices',
    title: 'Best Practices',
    icon: <Sparkles className="size-4" />,
  },
];

interface DocsSidebarProps {
  selectedDoc: string;
  onSelectDoc: (doc: string) => void;
  className?: string;
}

export function DocsSidebar({
  selectedDoc,
  onSelectDoc,
  className,
}: DocsSidebarProps): React.ReactElement {
  return (
    <aside className={cn('w-64 shrink-0 border-r bg-muted/30 p-4', className)}>
      <h2 className="mb-4 px-2 text-sm font-semibold text-muted-foreground">
        Documentation
      </h2>
      <nav className="space-y-1">
        {DOCS.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => onSelectDoc(doc.id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
              selectedDoc === doc.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {doc.icon}
            {doc.title}
          </button>
        ))}
      </nav>
    </aside>
  );
}
