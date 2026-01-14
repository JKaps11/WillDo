import { cn } from '@/lib/utils';

interface DocsContentProps {
  docId: string;
  className?: string;
}

const DOCS_CONTENT: Record<
  string,
  { title: string; content: React.ReactNode }
> = {
  'getting-started': {
    title: 'Getting Started',
    content: (
      <>
        <p className="lead">
          Welcome to WillDo! This guide will help you get started with
          skill-based task management.
        </p>

        <h2>What is WillDo?</h2>
        <p>
          WillDo is a skill-building application that helps you break down
          complex skills into manageable sub-skills, track your progress through
          structured learning stages, and build consistent practice habits.
        </p>

        <h2>Core Concepts</h2>
        <h3>Skills</h3>
        <p>
          A skill is a high-level ability you want to develop. Examples: "Learn
          Piano", "Master React", "Improve Public Speaking".
        </p>

        <h3>Sub-Skills</h3>
        <p>
          Sub-skills are the building blocks of a skill. Each sub-skill
          progresses through three stages:
        </p>
        <ul>
          <li>
            <strong>Practice</strong> - Initial learning and repetition
          </li>
          <li>
            <strong>Evaluate</strong> - Testing and self-assessment
          </li>
          <li>
            <strong>Complete</strong> - Mastery achieved
          </li>
        </ul>

        <h3>Tasks</h3>
        <p>
          Tasks are linked to sub-skills and help you track practice sessions.
          Each task contributes to your sub-skill's progress metrics.
        </p>

        <h2>Quick Start</h2>
        <ol>
          <li>Create your first skill from the Skills Hub</li>
          <li>Use AI planning or manually add sub-skills</li>
          <li>Drag tasks to your daily todo list</li>
          <li>Complete tasks to progress through stages</li>
        </ol>
      </>
    ),
  },
  'dashboard-guide': {
    title: 'Dashboard Guide',
    content: (
      <>
        <p className="lead">
          The dashboard is your daily command center for tracking tasks and
          skill progress.
        </p>

        <h2>Today's Tasks</h2>
        <p>
          The left panel shows all tasks scheduled for today. Each task
          displays:
        </p>
        <ul>
          <li>Skill color indicator</li>
          <li>Task name and description</li>
          <li>Metric progress (e.g., 3/10 sessions)</li>
          <li>Recurring badge if applicable</li>
        </ul>

        <h2>Skills Overview</h2>
        <p>The right panel shows all your active skills with:</p>
        <ul>
          <li>Stage dots showing sub-skill progress</li>
          <li>Completion percentage</li>
          <li>Quick link to the skill planner</li>
        </ul>

        <h2>Completing Tasks</h2>
        <p>
          When you complete a task linked to a sub-skill, it automatically
          updates the sub-skill's metrics. Once metrics are filled, you can
          advance to the next stage.
        </p>
      </>
    ),
  },
  'skill-management': {
    title: 'Skill Management',
    content: (
      <>
        <p className="lead">
          Learn how to create, organize, and manage your skills effectively.
        </p>

        <h2>Creating a Skill</h2>
        <p>
          From the Skills Hub, click "New Skill" to start the creation wizard:
        </p>
        <ol>
          <li>
            <strong>Basic Info</strong> - Name, color, icon, and goal
            description
          </li>
          <li>
            <strong>AI Planning</strong> - Let AI generate sub-skills, or skip
            to add manually
          </li>
          <li>
            <strong>Review</strong> - Edit and customize the generated plan
          </li>
        </ol>

        <h2>AI-Powered Planning</h2>
        <p>
          The AI planner analyzes your skill goal and suggests sub-skills with:
        </p>
        <ul>
          <li>Logical learning progression</li>
          <li>Appropriate metrics for each sub-skill</li>
          <li>Dependencies between sub-skills</li>
        </ul>

        <h2>Skill Cards</h2>
        <p>Each skill card in the hub shows:</p>
        <ul>
          <li>Stage indicator dots for all sub-skills</li>
          <li>Overall progress percentage</li>
          <li>Quick actions (view planner, archive, delete)</li>
        </ul>
      </>
    ),
  },
  'skill-planner': {
    title: 'Skill Planner',
    content: (
      <>
        <p className="lead">
          The skill planner provides a visual flowchart of your learning
          journey.
        </p>

        <h2>Canvas Navigation</h2>
        <ul>
          <li>
            <strong>Pan</strong> - Click and drag the background
          </li>
          <li>
            <strong>Zoom</strong> - Scroll wheel or pinch gesture
          </li>
          <li>
            <strong>Fit View</strong> - Click the fit button to see all nodes
          </li>
        </ul>

        <h2>Sub-Skill Nodes</h2>
        <p>Each sub-skill appears as a node with:</p>
        <ul>
          <li>Stage color indicator (gray, blue, amber, purple, green)</li>
          <li>Name and current stage</li>
          <li>Metric progress bar</li>
          <li>Lock icon if dependencies aren't met</li>
        </ul>

        <h2>Stage Progression</h2>
        <p>Click a node to open the edit panel where you can:</p>
        <ul>
          <li>View and update metrics</li>
          <li>Advance to the next stage when metrics are filled</li>
          <li>Manually complete the sub-skill</li>
          <li>Create tasks for practice</li>
        </ul>

        <h2>Dependencies</h2>
        <p>
          Edges between nodes show dependencies. A sub-skill is locked until all
          its dependencies are complete.
        </p>
      </>
    ),
  },
  'best-practices': {
    title: 'Best Practices',
    content: (
      <>
        <p className="lead">
          Tips for getting the most out of WillDo's skill-building system.
        </p>

        <h2>Start Small</h2>
        <p>
          Begin with one or two skills. It's better to make consistent progress
          on fewer skills than to spread yourself too thin.
        </p>

        <h2>Set Realistic Metrics</h2>
        <p>When defining metrics, consider:</p>
        <ul>
          <li>How many practice sessions per week is realistic?</li>
          <li>What constitutes "enough" practice before feedback?</li>
          <li>How will you evaluate your progress?</li>
        </ul>

        <h2>Use Dependencies Wisely</h2>
        <p>
          Dependencies should reflect real prerequisites, not just preferred
          order. Over-using dependencies can block your progress unnecessarily.
        </p>

        <h2>Daily Practice</h2>
        <p>
          Use recurring tasks for skills that benefit from daily practice. Even
          15-30 minutes daily beats sporadic multi-hour sessions.
        </p>

        <h2>Review and Adjust</h2>
        <p>Periodically review your skill plans:</p>
        <ul>
          <li>Are metrics too easy or too hard?</li>
          <li>Do sub-skills need to be broken down further?</li>
          <li>Are dependencies blocking progress?</li>
        </ul>

        <h2>Celebrate Progress</h2>
        <p>
          Completing stages is an achievement! Take time to recognize your
          progress through each Practice → Evaluate → Complete cycle.
        </p>
      </>
    ),
  },
};

export function DocsContent({
  docId,
  className,
}: DocsContentProps): React.ReactElement {
  const doc = DOCS_CONTENT[docId] ?? DOCS_CONTENT['getting-started'];

  return (
    <main className={cn('flex-1 overflow-auto p-8', className)}>
      <article className="prose prose-slate mx-auto max-w-3xl dark:prose-invert">
        <h1>{doc.title}</h1>
        {doc.content}
      </article>
    </main>
  );
}
