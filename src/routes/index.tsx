import {
  Calendar,
  CheckCircle2,
  GripVertical,
  Inbox,
  LayoutGrid,
  Settings,
  Tag,
  Zap,
} from 'lucide-react';
import { SignInButton } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authStateFn } from '@/utils/auth';

export const Route = createFileRoute('/')({
  beforeLoad: async () => authStateFn(),
  component: App,
});

export default function App(): ReactNode {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-20">
        <div className="grid gap-12 md:grid-cols-2 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Will Do
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              A developer-first task manager with calendar integration. Fast,
              minimal, and designed for people who live in their editor.
            </p>
            <div className="flex gap-4">
              <SignInButton forceRedirectUrl={'/app/todolist'}>
                <Button size="lg">Get Started</Button>
              </SignInButton>
              <SignInButton forceRedirectUrl={'/app/todolist'}>
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </SignInButton>
            </div>
            <p className="text-sm text-muted-foreground">
              Free to use • No credit card required
            </p>
          </div>

          {/* Mock preview */}
          <Card className="rounded-2xl shadow-sm border-2">
            <CardContent className="p-0">
              <div className="border-b px-4 py-3 flex items-center gap-2 bg-muted/30">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  Todo List — Week View
                </span>
              </div>
              <div className="p-4 space-y-3 font-mono text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Today
                  </span>
                  <span className="text-xs">3/5 done</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground line-through">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Fix Vite config</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground line-through">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Push migration</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground line-through">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Write tests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border-2" />
                    <span>Review PR #214</span>
                    <span className="text-xs bg-orange-500/20 text-orange-600 px-1.5 py-0.5 rounded">
                      High
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border-2" />
                    <span>Deploy to prod</span>
                    <span className="text-xs bg-blue-500/20 text-blue-600 px-1.5 py-0.5 rounded">
                      backend
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-2xl font-semibold mb-8 text-center">
          Everything you need, nothing you don&apos;t
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={<LayoutGrid className="h-5 w-5" />}
            title="Day & Week Views"
            description="Toggle between focused daily view or see your entire week at a glance with the 7-day grid."
          />
          <Feature
            icon={<Calendar className="h-5 w-5" />}
            title="Calendar Integration"
            description="Built-in calendar with month, week, and day views. Sync with Google Calendar."
          />
          <Feature
            icon={<GripVertical className="h-5 w-5" />}
            title="Drag & Drop"
            description="Effortlessly move tasks between days or reschedule by dragging to the calendar."
          />
          <Feature
            icon={<Tag className="h-5 w-5" />}
            title="Tags & Priorities"
            description="Color-coded tags and priority levels keep your tasks organized and visible."
          />
          <Feature
            icon={<Inbox className="h-5 w-5" />}
            title="Unassigned Inbox"
            description="Capture tasks without dates. Sort by priority or alphabetically, assign when ready."
          />
          <Feature
            icon={<Settings className="h-5 w-5" />}
            title="Customizable"
            description="Choose your default view, theme, week start day, and how tasks are sorted."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-2xl font-semibold mb-8">How it works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <Step
            number="01"
            title="Sign in"
            description="Quick authentication with Clerk. No lengthy onboarding."
          />
          <Step
            number="02"
            title="Add tasks"
            description="Create tasks with priorities and tags. Assign to dates or leave unassigned."
          />
          <Step
            number="03"
            title="Get it done"
            description="Drag tasks around, check them off, and watch your progress grow."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Stop tracking. Start doing.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Will Do stays out of your way so you can focus on what matters.
            Simple, fast, and built for developers.
          </p>
          <SignInButton forceRedirectUrl={'/app/todolist'}>
            <Button size="lg">Get Started for Free</Button>
          </SignInButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="font-medium text-foreground">Will Do</span>
          </div>
          <p>Auth by Clerk • UI by shadcn • Built with TanStack</p>
        </div>
      </footer>
    </main>
  );
}

interface FeatureProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function Feature({ icon, title, description }: FeatureProps): ReactNode {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 space-y-3">
        <div className="flex items-center gap-2 text-primary">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

interface StepProps {
  number: string;
  title: string;
  description: string;
}

function Step({ number, title, description }: StepProps): ReactNode {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="text-sm font-mono text-primary font-bold">{number}</div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="font-medium">{title}</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground pl-10">{description}</p>
    </div>
  );
}
