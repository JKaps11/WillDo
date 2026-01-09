import { Lightbulb, Plus } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SkillsOverviewProps {
  className?: string;
}

export function SkillsOverview({
  className,
}: SkillsOverviewProps): React.ReactElement {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Skills Overview</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" asChild>
              <Link to="/app/skills/new">
                <Plus className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <div className="py-8 text-center text-sm text-muted-foreground">
          Skills overview coming soon
        </div>
      </CardContent>
    </Card>
  );
}
