import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  GitBranch,
  GraduationCap,
  Repeat,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { SignInButton } from '@clerk/tanstack-react-start';
import { Link, createFileRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScreenshotImage } from '@/components/common/ScreenshotImage';
import { authStateFn } from '@/serverFunctions/auth';

export const Route = createFileRoute('/')({
  beforeLoad: async () => authStateFn(),
  component: LandingPage,
});

function LandingScreenshot({
  id,
  caption,
  aspectRatio = 'video',
}: {
  id: string;
  caption: string;
  aspectRatio?: 'video' | 'square' | 'wide';
}): ReactNode {
  return (
    <ScreenshotImage
      src={`/images/screenshots/landing-${id}.png`}
      caption={caption}
      fallbackLabel={`Image ID: ${id}`}
      aspectRatio={aspectRatio}
      imgClassName="h-full object-cover"
    />
  );
}

export default function LandingPage(): ReactNode {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="size-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Will Do</span>
          </Link>
          <div className="flex items-center gap-3">
            <SignInButton forceRedirectUrl="/app/dashboard">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </SignInButton>
            <SignInButton forceRedirectUrl="/app/dashboard">
              <Button size="sm">
                Start Free
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </SignInButton>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="size-4" />
              AI-Powered Skill Planning
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Master any skill with{' '}
              <span className="text-primary">structured practice</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Break down complex skills into manageable steps, track your
              progress through proven learning stages, and build habits that
              stick. Will Do helps you go from beginner to confident.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <SignInButton forceRedirectUrl="/app/dashboard">
                <Button size="lg" className="text-lg px-8">
                  Start Free — No Credit Card
                  <ArrowRight className="ml-2 size-5" />
                </Button>
              </SignInButton>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-500" />
                Free forever
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-500" />
                No credit card
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-500" />
                Setup in 2 minutes
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-2xl" />
            <div className="relative">
              <LandingScreenshot
                id="hero-dashboard"
                caption="Dashboard showing today's tasks and skill progress overview"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Learning new skills is hard
            </h2>
            <p className="text-xl text-muted-foreground">
              You start motivated, but then life gets in the way. Without a
              clear plan and consistent practice, most people give up before
              seeing results.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <ProblemCard
              title="No clear path"
              description="You don't know what to learn first, what to practice, or how to measure progress."
            />
            <ProblemCard
              title="Inconsistent practice"
              description="You practice intensely for a week, then forget about it for months. Sound familiar?"
            />
            <ProblemCard
              title="No feedback loop"
              description="Without tracking, you can't see improvement. Without improvement, you lose motivation."
            />
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Will Do gives you the system
          </h2>
          <p className="text-xl text-muted-foreground">
            A proven framework that breaks any skill into learnable pieces and
            guides you from practice to mastery.
          </p>
        </div>

        {/* Feature 1 */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center size-12 rounded-xl bg-blue-500/10 text-blue-500">
              <GitBranch className="size-6" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold">
              Visual skill trees that make sense
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              See your entire learning journey as an interactive flowchart.
              Break skills into sub-skills, set dependencies, and always know
              what to work on next.
            </p>
            <ul className="space-y-3">
              <FeatureListItem>
                AI generates a personalized learning path
              </FeatureListItem>
              <FeatureListItem>
                Drag and drop to reorganize your plan
              </FeatureListItem>
              <FeatureListItem>
                Track metrics for each sub-skill
              </FeatureListItem>
            </ul>
          </div>
          <LandingScreenshot
            id="feature-skill-planner"
            caption="Skill Planner showing visual flowchart of sub-skills with progress indicators"
          />
        </div>

        {/* Feature 2 */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div className="order-2 lg:order-1">
            <LandingScreenshot
              id="feature-stages"
              caption="Sub-skill card showing Practice → Evaluate → Complete stages with progress bar"
            />
          </div>
          <div className="space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center justify-center size-12 rounded-xl bg-amber-500/10 text-amber-500">
              <GraduationCap className="size-6" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold">
              Proven learning stages
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Each sub-skill progresses through Practice, Evaluate, and Complete
              stages. This ensures you don't just learn — you truly master each
              component.
            </p>
            <ul className="space-y-3">
              <FeatureListItem>
                Practice stage for repetition and building habits
              </FeatureListItem>
              <FeatureListItem>
                Evaluate stage for testing your understanding
              </FeatureListItem>
              <FeatureListItem>
                Complete when you've achieved real mastery
              </FeatureListItem>
            </ul>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center size-12 rounded-xl bg-green-500/10 text-green-500">
              <Repeat className="size-6" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold">
              Daily tasks that build consistency
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Schedule practice sessions on your todo list. Set recurring tasks
              to build daily habits. Drag and drop to reschedule when life
              happens.
            </p>
            <ul className="space-y-3">
              <FeatureListItem>
                Weekly and daily views to plan your practice
              </FeatureListItem>
              <FeatureListItem>
                Recurring tasks for consistent daily habits
              </FeatureListItem>
              <FeatureListItem>
                Auto-updates your skill progress when you complete tasks
              </FeatureListItem>
            </ul>
          </div>
          <LandingScreenshot
            id="feature-todolist"
            caption="Todo List weekly view showing tasks color-coded by skill with drag-and-drop"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Start in under 2 minutes
            </h2>
            <p className="text-xl text-muted-foreground">
              No complicated setup. Just tell us what you want to learn.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              icon={<Target className="size-6" />}
              title="Name your skill"
              description="What do you want to learn? Piano, coding, a new language — anything works."
            />
            <StepCard
              number="2"
              icon={<Sparkles className="size-6" />}
              title="AI builds your plan"
              description="Our AI breaks your skill into sub-skills with metrics and suggested practice schedules."
            />
            <StepCard
              number="3"
              icon={<BarChart3 className="size-6" />}
              title="Practice & progress"
              description="Complete daily tasks, track your progress, and watch your skill tree fill up with green."
            />
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      {/* <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Built for serious learners
          </h2>
          <p className="text-xl text-muted-foreground">
            Whether you're learning an instrument, a language, or a professional
            skill — Will Do adapts to your journey.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TestimonialCard
            quote="I finally finished learning Spanish after 3 failed attempts with other apps. The stage system kept me accountable."
            name="Placeholder Name"
            role="Language Learner"
          />
          <TestimonialCard
            quote="As a self-taught developer, I always struggled with what to learn next. Will Do's skill trees changed that completely."
            name="Placeholder Name"
            role="Software Developer"
          />
          <TestimonialCard
            quote="I use this for my piano practice. Seeing the progress bars fill up is incredibly motivating."
            name="Placeholder Name"
            role="Music Student"
          />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8">
          * Testimonials are placeholders — replace with real user feedback
        </p>
      </section> */}

      {/* Final CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-12 md:p-16 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
            <div className="relative space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
                Ready to master your next skill?
              </h2>
              <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
                Join thousands of learners who are building real skills with
                structured practice. Start your journey today.
              </p>
              <SignInButton forceRedirectUrl="/app/dashboard">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 mt-4"
                >
                  Start Free — No Credit Card
                  <ArrowRight className="ml-2 size-5" />
                </Button>
              </SignInButton>
              <p className="text-sm text-primary-foreground/60">
                Free forever for personal use
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="size-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Will Do</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <Link to="/app/help" className="hover:text-foreground transition">
                Help
              </Link>
              <a href="#" className="hover:text-foreground transition">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition">
                Terms
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Will Do. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ProblemCard({
  title,
  description,
}: {
  title: string;
  description: string;
}): ReactNode {
  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardContent className="p-6 space-y-3">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function FeatureListItem({ children }: { children: ReactNode }): ReactNode {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: ReactNode;
  title: string;
  description: string;
}): ReactNode {
  return (
    <div className="text-center space-y-4">
      <div className="relative mx-auto w-fit">
        <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 size-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
          {number}
        </div>
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function TestimonialCard({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role: string;
}): ReactNode {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <p className="text-muted-foreground italic">"{quote}"</p>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </CardContent>
    </Card>
  );
}
