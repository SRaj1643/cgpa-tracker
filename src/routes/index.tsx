import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowRight, BarChart3, Sparkles, TrendingUp, Trophy, Zap,
  GraduationCap, LineChart, Shield, Star,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GradeFlow AI — Track your academic journey beautifully" },
      { name: "description", content: "Premium CGPA & SGPA tracker for IIT and college students. Smart analytics, beautiful charts, AI insights." },
    ],
  }),
  component: Landing,
});

function Navbar() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <div className="glass shadow-card rounded-2xl flex items-center justify-between px-4 sm:px-6 py-3">
          <Logo />
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#analytics" className="hover:text-foreground transition">Analytics</a>
            <a href="#testimonials" className="hover:text-foreground transition">Reviews</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button asChild size="sm" className="gradient-bg text-primary-foreground border-0">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="gradient-bg text-primary-foreground border-0 shadow-elegant">
                  <Link to="/signup">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-32 sm:pt-28">
      <div className="absolute inset-0 mesh-bg pointer-events-none" />
      <div className="absolute top-40 -right-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl animate-float" />
      <div className="absolute bottom-0 -left-10 h-72 w-72 rounded-full bg-primary-glow/20 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground mb-8">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          AI-powered academic insights
        </div>
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]">
          Track your academic
          <br />
          journey <span className="gradient-text">beautifully.</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          The premium CGPA tracker built for IIT and college students. Manage semesters, visualize progress, and unlock smart insights — all in one elegant dashboard.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="gradient-bg text-primary-foreground border-0 shadow-elegant text-base h-12 px-8">
            <Link to="/signup">Start tracking free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base glass">
            <a href="#features">See features</a>
          </Button>
        </div>

        <div className="mt-20 relative max-w-5xl mx-auto">
          <div className="glass shadow-elegant rounded-3xl p-2 border">
            <DashboardPreview />
          </div>
          <div className="absolute -inset-x-20 -top-10 -bottom-10 bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl -z-10" />
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="rounded-2xl bg-card overflow-hidden">
      <div className="border-b px-5 py-3 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-destructive/70" />
          <div className="h-3 w-3 rounded-full bg-warning/70" />
          <div className="h-3 w-3 rounded-full bg-success/70" />
        </div>
        <div className="ml-4 text-xs text-muted-foreground">gradeflow.ai/dashboard</div>
      </div>
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "CGPA", v: "9.24", icon: Trophy, color: "text-primary" },
          { label: "Current SGPA", v: "9.42", icon: TrendingUp, color: "text-success" },
          { label: "Total Credits", v: "186", icon: GraduationCap, color: "text-primary-glow" },
          { label: "Semesters", v: "6", icon: BarChart3, color: "text-warning" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-secondary/40 p-4">
            <s.icon className={`h-4 w-4 ${s.color}`} />
            <div className="mt-3 text-2xl font-bold font-display">{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="px-6 pb-6">
        <div className="rounded-xl border bg-secondary/30 p-5">
          <div className="text-sm font-medium mb-4">GPA Progression</div>
          <svg viewBox="0 0 400 100" className="w-full h-24">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.7 0.2 280)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="oklch(0.7 0.2 280)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,70 L66,60 L132,55 L198,42 L264,30 L330,25 L400,18 L400,100 L0,100 Z" fill="url(#g1)" />
            <path d="M0,70 L66,60 L132,55 L198,42 L264,30 L330,25 L400,18" stroke="oklch(0.7 0.2 280)" strokeWidth="2" fill="none" />
          </svg>
        </div>
      </div>
    </div>
  );
}

const features = [
  { icon: TrendingUp, title: "Auto SGPA & CGPA", desc: "Add subjects with credits and grades — calculations happen instantly using a weighted formula." },
  { icon: LineChart, title: "Beautiful analytics", desc: "Track GPA progression, grade distribution, and credits with interactive Recharts visualizations." },
  { icon: Sparkles, title: "AI insights", desc: "Get smart recommendations on which subjects need focus to hit your target CGPA." },
  { icon: Trophy, title: "Achievement streaks", desc: "Stay motivated with streaks, badges, and milestones every semester." },
  { icon: Shield, title: "Secure by default", desc: "Encrypted accounts. Your academic data is private and only ever visible to you." },
  { icon: Zap, title: "Lightning fast", desc: "Built on a modern stack — every interaction feels instant on any device." },
];

function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-sm font-medium gradient-text">Features</div>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight">
            Everything you need to ace every semester.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Designed with students in mind. Built like a premium product.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="group glass rounded-2xl p-6 hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
              <div className="h-11 w-11 rounded-xl gradient-bg flex items-center justify-center shadow-glow group-hover:scale-110 transition">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mt-5 font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Analytics() {
  return (
    <section id="analytics" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 mesh-bg opacity-50 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="text-sm font-medium gradient-text">Analytics that matter</div>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight">
            See your progress at a glance.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            GPA progression charts, semester comparison, grade distribution, credits visualization — every metric a student needs.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Real-time SGPA & CGPA recalculation",
              "Semester-by-semester comparison",
              "Grade distribution insights",
              "Credits completed tracker",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <div className="mt-1 h-5 w-5 rounded-full gradient-bg flex items-center justify-center shrink-0">
                  <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-foreground">{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-3xl p-6 shadow-elegant">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { quote: "Finally a CGPA tracker that doesn't look like a 2010 spreadsheet. Absolutely love the dark mode.", name: "Aarav S.", role: "IIT Bombay, CSE" },
    { quote: "The analytics helped me realize I was tanking electives. Bumped my CGPA by 0.4 in two semesters.", name: "Priya M.", role: "NIT Trichy, ECE" },
    { quote: "Cleanest UI I've seen for any student tool. Feels like Linear for academics.", name: "Rohan K.", role: "BITS Pilani" },
  ];
  return (
    <section id="testimonials" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-4xl sm:text-5xl font-bold">
          Loved by students at <span className="gradient-text">top colleges</span>.
        </h2>
        <div className="mt-16 grid md:grid-cols-3 gap-5">
          {items.map((t) => (
            <div key={t.name} className="glass rounded-2xl p-7 hover:shadow-elegant transition">
              <div className="flex gap-0.5 text-warning mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="text-foreground leading-relaxed">"{t.quote}"</p>
              <div className="mt-6">
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative glass rounded-3xl p-10 sm:p-16 text-center overflow-hidden shadow-elegant">
          <div className="absolute inset-0 mesh-bg opacity-60" />
          <div className="relative">
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
              Ready to track your CGPA <span className="gradient-text">beautifully?</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Free forever. No credit card. Set up in 60 seconds.
            </p>
            <Button asChild size="lg" className="mt-8 gradient-bg text-primary-foreground border-0 shadow-elegant h-12 px-8 text-base">
              <Link to="/signup">Create your account <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t py-10 mt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo />
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} GradeFlow AI. Built for students.</p>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Analytics />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
