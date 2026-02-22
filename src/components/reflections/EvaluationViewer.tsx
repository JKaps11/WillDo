import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';

import { ConfidenceRating } from '@/components/practice-evaluation/ConfidenceRating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTRPC } from '@/integrations/trpc/react';

interface EvaluationViewerProps {
  evaluationId: string | null;
}

function AnswerList({ items }: { items: Array<string> }): React.ReactElement {
  if (items.length === 1) {
    return <p className="text-sm">{items[0]}</p>;
  }
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm">
          {item}
        </li>
      ))}
    </ul>
  );
}

interface QuestionSectionProps {
  label: string;
  answers: Array<string>;
}

function QuestionSection({
  label,
  answers,
}: QuestionSectionProps): React.ReactElement {
  return (
    <div className="space-y-1.5">
      <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
      <AnswerList items={answers} />
    </div>
  );
}

export function EvaluationViewer({
  evaluationId,
}: EvaluationViewerProps): React.ReactElement {
  const trpc = useTRPC();

  const { data: evaluation, isLoading } = useQuery({
    ...trpc.practiceEvaluation.get.queryOptions({ id: evaluationId ?? '' }),
    enabled: !!evaluationId,
  });

  if (!evaluationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <FileText className="size-12 opacity-30" />
        <p className="text-sm">Select an evaluation to view it</p>
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

  if (!evaluation) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-sm">Evaluation not found</p>
      </div>
    );
  }

  const dateStr =
    evaluation.occurrenceDate instanceof Date
      ? evaluation.occurrenceDate.toLocaleDateString()
      : new Date(evaluation.occurrenceDate).toLocaleDateString();

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg">{evaluation.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{dateStr}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <QuestionSection
          label="What went well during practice?"
          answers={evaluation.wentWell}
        />
        <QuestionSection
          label="What did you struggle with?"
          answers={evaluation.struggled}
        />
        <QuestionSection
          label="What do you understand better now?"
          answers={evaluation.understandBetter}
        />
        <QuestionSection
          label="What feelings did you experience?"
          answers={evaluation.feelings}
        />
        <QuestionSection
          label="What will you focus on next time?"
          answers={evaluation.focusNextTime}
        />
        <div className="space-y-1.5">
          <h4 className="text-sm font-medium text-muted-foreground">
            Confidence Level
          </h4>
          <ConfidenceRating
            value={evaluation.confidenceLevel}
            onChange={() => {}}
          />
        </div>
      </CardContent>
    </Card>
  );
}
