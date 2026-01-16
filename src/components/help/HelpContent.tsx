import {
  BookOpen,
  CheckSquare,
  LayoutDashboard,
  Lightbulb,
  Sparkles,
  Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface HelpContentProps {
  topicId: string;
  className?: string;
}

export interface HelpTopic {
  id: string;
  title: string;
  icon: LucideIcon;
}

export const HELP_TOPICS: Array<HelpTopic> = [
  { id: 'getting-started', title: 'Getting Started', icon: BookOpen },
  { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { id: 'skills-hub', title: 'Skills Hub', icon: Target },
  { id: 'skill-planner', title: 'Skill Planner', icon: Lightbulb },
  { id: 'todo-list', title: 'Todo List', icon: CheckSquare },
  { id: 'tips', title: 'Tips & Best Practices', icon: Sparkles },
];

function ImagePlaceholder({
  caption,
}: {
  caption: string;
}): React.ReactElement {
  return (
    <div className="my-6 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8">
      <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
        <div className="mb-2 text-4xl">🖼️</div>
        <p className="text-sm font-medium">{caption}</p>
        <p className="text-xs">Image placeholder</p>
      </div>
    </div>
  );
}

const HELP_CONTENT: Record<
  string,
  { title: string; content: React.ReactNode }
> = {
  'getting-started': {
    title: 'Getting Started with Will Do',
    content: (
      <>
        <p className="lead">
          Welcome to Will Do — your personal skill-building companion. This
          guide will help you understand the core concepts and get you up and
          running quickly.
        </p>

        <ImagePlaceholder caption="Will Do Dashboard Overview" />

        <h2>What is Will Do?</h2>
        <p>
          Will Do is a skill-building application designed to help you master
          new abilities through structured practice. Unlike traditional to-do
          apps, Will Do focuses on <strong>deliberate skill development</strong>{' '}
          by breaking complex skills into manageable sub-skills, tracking your
          progress through learning stages, and helping you build consistent
          practice habits.
        </p>

        <h2>Core Concepts</h2>

        <h3>🎯 Skills</h3>
        <p>
          A <strong>skill</strong> is a high-level ability you want to develop.
          Think of it as your learning goal. Examples include:
        </p>
        <ul>
          <li>Learn to play piano</li>
          <li>Master React development</li>
          <li>Improve public speaking</li>
          <li>Learn a new language</li>
        </ul>

        <h3>🧩 Sub-Skills</h3>
        <p>
          Sub-skills are the building blocks of a skill. Each skill is broken
          down into smaller, focused components that you can practice
          individually. For example, "Learn Piano" might include sub-skills like
          "Read Sheet Music", "Practice Scales", and "Learn Chord Progressions".
        </p>

        <h3>📊 Stages</h3>
        <p>Each sub-skill progresses through four stages:</p>
        <ul>
          <li>
            <strong>Not Started</strong> (Gray) — Haven't begun working on this
            yet
          </li>
          <li>
            <strong>Practice</strong> (Blue) — Actively learning and repeating
          </li>
          <li>
            <strong>Evaluate</strong> (Amber) — Testing your understanding
          </li>
          <li>
            <strong>Complete</strong> (Green) — Mastery achieved!
          </li>
        </ul>

        <ImagePlaceholder caption="Sub-skill stages visualization" />

        <h3>📋 Tasks</h3>
        <p>
          Tasks are the daily actions you take to practice your sub-skills. Each
          task is linked to a sub-skill and contributes to your progress
          metrics. When you complete a task, it automatically updates your
          sub-skill's metrics.
        </p>

        <h2>Quick Start Guide</h2>
        <ol>
          <li>
            <strong>Create your first skill</strong> — Go to the Skills Hub and
            click "New Skill"
          </li>
          <li>
            <strong>Set up sub-skills</strong> — Use AI planning to generate a
            learning path, or add sub-skills manually
          </li>
          <li>
            <strong>Schedule tasks</strong> — Drag tasks from the Assign Tasks
            panel to your Todo List
          </li>
          <li>
            <strong>Practice daily</strong> — Complete tasks to progress through
            stages
          </li>
          <li>
            <strong>Track your progress</strong> — Use the Dashboard to monitor
            your daily tasks and skill progress
          </li>
        </ol>

        <ImagePlaceholder caption="Quick start workflow diagram" />
      </>
    ),
  },
  dashboard: {
    title: 'Dashboard',
    content: (
      <>
        <p className="lead">
          The Dashboard is your daily command center — see what you need to work
          on today and track your overall skill progress at a glance.
        </p>

        <ImagePlaceholder caption="Dashboard full view" />

        <h2>Today's Tasks</h2>
        <p>
          The left side of the dashboard shows all tasks scheduled for today.
          Each task card displays:
        </p>
        <ul>
          <li>
            <strong>Skill color indicator</strong> — A colored line on the left
            showing which skill this task belongs to
          </li>
          <li>
            <strong>Task name</strong> — What you need to do
          </li>
          <li>
            <strong>Skill and sub-skill info</strong> — Shows the parent skill
            name
          </li>
          <li>
            <strong>Metric progress</strong> — Shows your current progress
            (e.g., "3/10 sessions")
          </li>
          <li>
            <strong>Recurring badge</strong> — Indicates if this is a recurring
            task
          </li>
        </ul>

        <ImagePlaceholder caption="Task card anatomy" />

        <h2>Completing Tasks</h2>
        <p>
          Click the checkbox next to a task to mark it complete. When you
          complete a task linked to a sub-skill:
        </p>
        <ol>
          <li>The task is marked as done</li>
          <li>The sub-skill's metrics are automatically updated</li>
          <li>Your progress is saved</li>
        </ol>
        <p>
          Once all metrics for a sub-skill are filled, you can advance to the
          next stage from the Skill Planner.
        </p>

        <h2>Skills Overview</h2>
        <p>
          The right side shows your active skills with quick progress
          indicators:
        </p>
        <ul>
          <li>
            <strong>Stage dots</strong> — Each dot represents a sub-skill,
            colored by its current stage
          </li>
          <li>
            <strong>Progress percentage</strong> — Overall completion of the
            skill
          </li>
          <li>
            <strong>Quick links</strong> — Click to jump to the Skill Planner or
            create new skills
          </li>
        </ul>

        <ImagePlaceholder caption="Skills overview panel" />
      </>
    ),
  },
  'skills-hub': {
    title: 'Skills Hub',
    content: (
      <>
        <p className="lead">
          The Skills Hub is where you create, organize, and manage all your
          skills. Think of it as your personal learning library.
        </p>

        <ImagePlaceholder caption="Skills Hub overview" />

        <h2>Creating a New Skill</h2>
        <p>
          Click the "New Skill" button to start the skill creation wizard.
          You'll go through three steps:
        </p>

        <h3>Step 1: Basic Info</h3>
        <p>Set up the fundamentals of your skill:</p>
        <ul>
          <li>
            <strong>Skill Name</strong> — A clear, descriptive name (e.g.,
            "Learn Spanish")
          </li>
          <li>
            <strong>Goal</strong> — What you want to achieve (helps AI generate
            better sub-skills)
          </li>
          <li>
            <strong>Description</strong> — Optional additional context
          </li>
          <li>
            <strong>Color</strong> — Choose a color to identify this skill
            throughout the app
          </li>
          <li>
            <strong>Icon</strong> — Pick an emoji to represent your skill
          </li>
        </ul>

        <ImagePlaceholder caption="Skill creation - Basic Info step" />

        <h3>Step 2: AI Planning (Optional)</h3>
        <p>
          Let AI analyze your goal and generate a structured learning path with
          sub-skills and metrics. You can:
        </p>
        <ul>
          <li>Use the AI-generated plan as-is</li>
          <li>Edit the suggestions before creating</li>
          <li>Skip AI planning and add sub-skills manually later</li>
        </ul>

        <ImagePlaceholder caption="AI Planning interface" />

        <h3>Step 3: Review & Create</h3>
        <p>
          Review your skill setup and make any final adjustments before
          creating.
        </p>

        <h2>Skill Cards</h2>
        <p>Each skill in the hub is displayed as a card showing:</p>
        <ul>
          <li>
            <strong>Skill icon and name</strong>
          </li>
          <li>
            <strong>Stage indicator dots</strong> — Visual representation of all
            sub-skills and their stages
          </li>
          <li>
            <strong>Progress percentage</strong> — How much of the skill is
            complete
          </li>
        </ul>

        <ImagePlaceholder caption="Skill card anatomy" />

        <h2>Skill Actions</h2>
        <p>
          Click the three-dot menu on any skill card to access these options:
        </p>
        <ul>
          <li>
            <strong>View Planner</strong> — Open the visual skill planner
          </li>
          <li>
            <strong>Edit</strong> — Modify the skill's name, description, goal,
            color, or icon
          </li>
          <li>
            <strong>Archive</strong> — Hide the skill without deleting it
          </li>
          <li>
            <strong>Delete</strong> — Permanently remove the skill and all its
            data
          </li>
        </ul>

        <h2>Viewing Archived Skills</h2>
        <p>
          Click "Show Archived" in the header to see skills you've archived. You
          can unarchive them at any time.
        </p>
      </>
    ),
  },
  'skill-planner': {
    title: 'Skill Planner',
    content: (
      <>
        <p className="lead">
          The Skill Planner gives you a visual flowchart of your learning
          journey, showing all sub-skills and how they connect.
        </p>

        <ImagePlaceholder caption="Skill Planner canvas view" />

        <h2>Canvas Navigation</h2>
        <p>The planner uses an interactive canvas. Here's how to navigate:</p>
        <ul>
          <li>
            <strong>Pan</strong> — Click and drag on the background
          </li>
          <li>
            <strong>Zoom</strong> — Use scroll wheel or pinch gesture
          </li>
          <li>
            <strong>Fit View</strong> — Click the fit button in the controls to
            see all nodes
          </li>
          <li>
            <strong>Mini Map</strong> — Use the mini map in the corner for quick
            navigation
          </li>
        </ul>

        <h2>Understanding Nodes</h2>
        <p>Each sub-skill appears as a node on the canvas:</p>
        <ul>
          <li>
            <strong>Color</strong> — Indicates the current stage (gray = not
            started, blue = practice, amber = evaluate, green = complete)
          </li>
          <li>
            <strong>Name</strong> — The sub-skill title
          </li>
          <li>
            <strong>Stage label</strong> — Current stage name
          </li>
          <li>
            <strong>Progress bar</strong> — Shows metric completion
          </li>
          <li>
            <strong>Lock icon</strong> — Appears if the sub-skill is locked due
            to incomplete dependencies
          </li>
        </ul>

        <ImagePlaceholder caption="Sub-skill node anatomy" />

        <h2>The Edit Panel</h2>
        <p>Click any sub-skill node to open the edit panel where you can:</p>

        <h3>View & Update Metrics</h3>
        <p>
          Each sub-skill can have metrics that track your progress. For example,
          a "Practice Scales" sub-skill might have a "Practice Sessions" metric
          with a target of 10. Complete tasks to increment these metrics.
        </p>

        <h3>Advance Stages</h3>
        <p>
          When all metrics are filled (or you feel ready), click "Advance Stage"
          to move to the next stage:
        </p>
        <ul>
          <li>Not Started → Practice</li>
          <li>Practice → Evaluate</li>
          <li>Evaluate → Complete</li>
        </ul>

        <ImagePlaceholder caption="Sub-skill edit panel" />

        <h3>Create Tasks</h3>
        <p>
          From the edit panel, you can create new tasks linked to the sub-skill.
          These tasks will appear in the Assign Tasks sheet where you can drag
          them to your Todo List.
        </p>

        <h2>Adding Sub-Skills</h2>
        <p>
          Click "Create Sub-skill" in the header to add new sub-skills to your
          plan. You can set:
        </p>
        <ul>
          <li>Name and description</li>
          <li>Parent sub-skill (for creating hierarchies)</li>
          <li>Metrics with target values</li>
        </ul>

        <ImagePlaceholder caption="Create sub-skill modal" />
      </>
    ),
  },
  'todo-list': {
    title: 'Todo List',
    content: (
      <>
        <p className="lead">
          The Todo List is where you manage your daily and weekly tasks. See
          what's scheduled, drag to reschedule, and track your completions.
        </p>

        <ImagePlaceholder caption="Todo List weekly view" />

        <h2>Views</h2>
        <p>Switch between two view modes using the settings:</p>
        <ul>
          <li>
            <strong>Day View</strong> — Focus on today's tasks only
          </li>
          <li>
            <strong>Week View</strong> — See the full week at a glance with
            tasks organized by day
          </li>
        </ul>

        <h2>Task Cards</h2>
        <p>Each task in the list shows:</p>
        <ul>
          <li>
            <strong>Skill color line</strong> — Quick visual indicator of which
            skill this belongs to
          </li>
          <li>
            <strong>Checkbox</strong> — Click to mark complete
          </li>
          <li>
            <strong>Task name</strong>
          </li>
          <li>
            <strong>Priority badge</strong> — Shows task priority level
          </li>
          <li>
            <strong>Edit button</strong> — Opens the schedule modal
          </li>
        </ul>

        <ImagePlaceholder caption="Task card in todo list" />

        <h2>Scheduling Tasks</h2>

        <h3>Assigning Unassigned Tasks</h3>
        <p>
          Click "Assign Tasks" in the header to open the assignment panel. This
          shows all tasks that haven't been scheduled yet. Simply drag a task
          and drop it onto any day to schedule it.
        </p>

        <ImagePlaceholder caption="Assign Tasks panel" />

        <h3>Rescheduling Tasks</h3>
        <p>
          Drag any task from one day to another to reschedule it. When you drop
          a task, a schedule modal appears where you can:
        </p>
        <ul>
          <li>
            <strong>Change the date</strong> — Pick a different date if needed
          </li>
          <li>
            <strong>Set up recurrence</strong> — Make this a recurring task
          </li>
        </ul>

        <h3>Recurring Tasks</h3>
        <p>Set tasks to repeat on a schedule. Options include:</p>
        <ul>
          <li>
            <strong>Daily</strong> — Every day or every X days
          </li>
          <li>
            <strong>Weekly</strong> — Specific days of the week
          </li>
        </ul>
        <p>
          You can also set when the recurrence ends: never, after X occurrences,
          or on a specific date.
        </p>

        <ImagePlaceholder caption="Schedule modal with recurrence options" />

        <h2>Navigation</h2>
        <p>Use the arrow buttons in the header to navigate:</p>
        <ul>
          <li>
            <strong>Day view</strong> — Move forward/back one day at a time
          </li>
          <li>
            <strong>Week view</strong> — Move forward/back one week at a time
          </li>
        </ul>

        <h2>Settings</h2>
        <p>Click the settings icon to configure:</p>
        <ul>
          <li>
            <strong>View mode</strong> — Day or Week
          </li>
          <li>
            <strong>Sort by</strong> — Date, Priority, or Alphabetical
          </li>
          <li>
            <strong>Show completed</strong> — Toggle visibility of completed
            tasks
          </li>
        </ul>
      </>
    ),
  },
  tips: {
    title: 'Tips & Best Practices',
    content: (
      <>
        <p className="lead">
          Get the most out of Will Do with these tips for effective
          skill-building.
        </p>

        <h2>🎯 Start Small</h2>
        <p>
          Begin with one or two skills. It's better to make consistent progress
          on fewer skills than to spread yourself too thin. Once you've built
          momentum with your first skill, add more.
        </p>

        <h2>📊 Set Realistic Metrics</h2>
        <p>When defining metrics for your sub-skills, consider:</p>
        <ul>
          <li>
            <strong>How many practice sessions per week is realistic?</strong> —
            Don't set targets you can't maintain
          </li>
          <li>
            <strong>What constitutes "enough" practice?</strong> — Quality
            matters more than quantity
          </li>
          <li>
            <strong>How will you evaluate progress?</strong> — Make sure your
            metrics are measurable
          </li>
        </ul>

        <h2>🔄 Use Recurring Tasks</h2>
        <p>
          For skills that benefit from daily practice, set up recurring tasks.
          Even 15-30 minutes of daily practice is more effective than sporadic
          multi-hour sessions. Consistency beats intensity.
        </p>

        <ImagePlaceholder caption="Example of recurring task setup" />

        <h2>🧩 Break It Down</h2>
        <p>
          If a sub-skill feels too large or overwhelming, break it down further.
          The AI planner is great for initial suggestions, but don't hesitate to
          add more granular sub-skills as you learn.
        </p>

        <h2>📈 Progress Through Stages</h2>
        <p>Don't rush through stages. Each stage serves a purpose:</p>
        <ul>
          <li>
            <strong>Practice</strong> — Focus on repetition and building muscle
            memory
          </li>
          <li>
            <strong>Evaluate</strong> — Test yourself, get feedback, identify
            gaps
          </li>
          <li>
            <strong>Complete</strong> — Only mark complete when you're truly
            confident
          </li>
        </ul>

        <h2>📅 Review Weekly</h2>
        <p>Set aside time each week to review your progress:</p>
        <ul>
          <li>Are your metrics too easy or too hard?</li>
          <li>Do any sub-skills need to be broken down further?</li>
          <li>Are you spending time on the right priorities?</li>
        </ul>

        <h2>🎉 Celebrate Progress</h2>
        <p>
          Completing stages is an achievement! Take time to recognize your
          progress. Learning new skills is hard work — every completed sub-skill
          is a win worth celebrating.
        </p>

        <ImagePlaceholder caption="Completed skill celebration" />

        <h2>💡 Pro Tips</h2>
        <ul>
          <li>
            <strong>Use colors strategically</strong> — Assign similar colors to
            related skills for quick visual grouping
          </li>
          <li>
            <strong>Write clear task names</strong> — Future you will thank
            present you
          </li>
          <li>
            <strong>Check your dashboard daily</strong> — Make it part of your
            morning routine
          </li>
          <li>
            <strong>Don't over-plan</strong> — Start practicing early rather
            than perfecting your plan
          </li>
        </ul>
      </>
    ),
  },
};

export function HelpContent({
  topicId,
  className,
}: HelpContentProps): React.ReactElement {
  const topic = HELP_CONTENT[topicId] ?? HELP_CONTENT['getting-started'];

  return (
    <main className={cn('flex-1 p-8', className)}>
      <article className="prose prose-slate mx-auto max-w-3xl dark:prose-invert">
        <h1>{topic.title}</h1>
        {topic.content}
      </article>
    </main>
  );
}
