import { useState } from 'react';

import { EvaluationViewer } from './EvaluationViewer';
import { FolderTree } from './FolderTree';

export function PracticeLogPage(): React.ReactElement {
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<
    string | null
  >(null);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left panel: folder tree */}
      <div className="w-80 shrink-0 overflow-y-auto rounded-lg border bg-card">
        <div className="sticky top-0 border-b bg-card px-4 py-3">
          <h2 className="text-sm font-semibold">Practice Evaluations</h2>
        </div>
        <FolderTree
          selectedEvaluationId={selectedEvaluationId}
          onSelectEvaluation={setSelectedEvaluationId}
        />
      </div>

      {/* Right panel: evaluation viewer */}
      <div className="flex-1 overflow-y-auto">
        <EvaluationViewer evaluationId={selectedEvaluationId} />
      </div>
    </div>
  );
}
