import { createFileRoute } from '@tanstack/react-router';
import { CheckCircle2, Code2, ShieldCheck, Zap } from 'lucide-react';
import { SignInButton } from '@clerk/tanstack-react-start';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { authStateFn } from '@/utils/auth';

export const Route = createFileRoute('/')({
  beforeLoad: async () => authStateFn(),
  component: App
});

export default function App() {
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
              A developer-first todo app. Fast, minimal, and designed for people
              who live in their editor and terminal.
            </p>
            <div className="flex gap-4">
              {/* <Link to="app/todolist">Get Started</Link> */}
              <SignInButton forceRedirectUrl={'/app/todolist'}>
                <Button size="lg">Sign In</Button>
              </SignInButton>
              <Button asChild size="lg" variant="outline">
                {/* <Link to="/docs">Docs</Link> */}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Auth powered by Clerk • UI built with shadcn
            </p>
          </div>

          {/* Mock preview */}
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <pre className="text-sm leading-relaxed font-mono">
                {`✔ Fix Vite config
✔ Push migration
▢ Write tests
▢ Review PR #214
▢ Deploy to prod`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <Feature
            icon={<Zap className="h-5 w-5" />}
            title="Instant"
            description="Zero friction. Open the app and start typing. No setup, no clutter."
          />
          <Feature
            icon={<Code2 className="h-5 w-5" />}
            title="Developer-first"
            description="Keyboard-driven UX, predictable state, clean mental model."
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Secure by default"
            description="Authentication and session management handled by Clerk."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-2xl font-semibold mb-8">How it works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Step number="01" text="Sign in with Clerk" />
          <Step number="02" text="Create todos instantly" />
          <Step number="03" text="Ship what matters" />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Stop tracking. Start doing.</h2>
          <p className="text-muted-foreground mb-8">
            Will Do stays out of your way so you can focus on execution.
          </p>
          <Button asChild size="lg">
            {/* <Link to="/sign-up">Create your first list</Link> */}
          </Button>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
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

function Step({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="text-sm font-mono text-muted-foreground">{number}</div>
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <span>{text}</span>
      </div>
    </div>
  );
}
