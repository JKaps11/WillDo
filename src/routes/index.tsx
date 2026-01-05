import {
  Calendar,
  Cog,
  MessageSquare,
  Repeat,
  RotateCcw,
  Target,
  Trophy,
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
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            It&apos;s time to make a change
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get on the path to success
          </p>
          <div className="flex gap-4 justify-center">
            <SignInButton forceRedirectUrl={'/app/dashboard'}>
              <Button size="lg">Get Started</Button>
            </SignInButton>
            <SignInButton forceRedirectUrl={'/app/dashboard'}>
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </SignInButton>
          </div>
          <p className="text-sm text-muted-foreground">
            Free to use • No credit card required
          </p>
        </div>
      </section>

      {/* What We Do */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">What is Will Do?</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your all-in-one platform for planning and building skills
          </p>
        </div>
      </section>

      {/* Section 1: What is required to build a skill */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-2xl font-semibold mb-12 text-center">
          What is required to build a skill?
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <SkillStep
            number="1"
            icon={<Target className="h-6 w-6" />}
            title="Plan"
            items={[
              'Where are you now',
              'What is your skill goal and metric for it',
              'What are things that are missing',
            ]}
          />
          <SkillStep
            number="2"
            icon={<Repeat className="h-6 w-6" />}
            title="Volume of Repetition"
            items={['Repeat and practice and learn']}
          />
          <SkillStep
            number="3"
            icon={<MessageSquare className="h-6 w-6" />}
            title="Feedback Loop"
            items={[
              'Analysis and evaluation of your repetitions in relation to your goal metric',
            ]}
          />
          <SkillStep
            number="4"
            icon={<RotateCcw className="h-6 w-6" />}
            title="Re-apply"
            items={['Take your feedback and do more repetitions']}
          />
        </div>
      </section>

      {/* Section 2: How do we facilitate */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-2xl font-semibold mb-12 text-center">
          How do we facilitate this?
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <FacilitateCard
            icon={<Calendar className="h-8 w-8" />}
            title="Plan with Organization"
            description="Powerful organization tools to help you map out your journey and track your progress."
          />
          <FacilitateCard
            icon={<Cog className="h-8 w-8" />}
            title="Maintain with Automation"
            description="Automation features that keep you on track without the mental overhead."
          />
          <FacilitateCard
            icon={<Trophy className="h-8 w-8" />}
            title="Celebrate Success"
            description="Recognition and tracking of your wins to keep you motivated on your journey."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to build your skills?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Start your journey today with Will Do.
          </p>
          <SignInButton forceRedirectUrl={'/app/dashboard'}>
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

interface SkillStepProps {
  number: string;
  icon: ReactNode;
  title: string;
  items: Array<string>;
}

function SkillStep({ number, icon, title, items }: SkillStepProps): ReactNode {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
            {number}
          </div>
          <div className="text-primary">{icon}</div>
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="text-sm text-muted-foreground">
              • {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface FacilitateCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function FacilitateCard({
  icon,
  title,
  description,
}: FacilitateCardProps): ReactNode {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-8 text-center space-y-4">
        <div className="flex justify-center text-primary">{icon}</div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
