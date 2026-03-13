import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';

import { ConfidenceComparison } from '@/components/practice-session/ConfidenceComparison';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTRPC } from '@/integrations/trpc/react';
import { parseLocalDate } from '@/lib/utils';

interface SessionViewerProps {
  sessionId: string | null;
}

export function SessionViewer({
  sessionId,
}: SessionViewerProps): React.ReactElement {
  const trpc = useTRPC();

  const { data: session, isLoading } = useQuery({
    ...trpc.practiceSession.get.queryOptions({ id: sessionId ?? '' }),
    enabled: !!sessionId,
  });

  if (!sessionId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <FileText className="size-12 opacity-30" />
        <p className="text-sm">Select a session to view it</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">Session not found</p>
      </div>
    );
  }

  const dateStr = parseLocalDate(session.occurrenceDate).toLocaleDateString();

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg">{session.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {dateStr} &middot; Session #{session.iterationNumber}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Confidence comparison */}
        {session.postConfidence !== null && (
          <ConfidenceComparison
            preConfidence={session.preConfidence}
            postConfidence={session.postConfidence}
          />
        )}

        {/* Reflection prompt/response pairs */}
        {session.reflections.map((reflection) => (
          <div key={reflection.id} className="space-y-1.5">
            <h4 className="text-sm font-medium text-muted-foreground">
              {reflection.promptText}
            </h4>
            <p className="text-sm">{reflection.responseText}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
