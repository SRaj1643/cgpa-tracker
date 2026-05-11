import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { type ReactNode } from "react";

export function AuthLayout({
  title, subtitle, children, footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col mesh-bg">
      <header className="px-6 py-5 flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="glass rounded-3xl shadow-elegant p-8 sm:p-10">
            <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>
      <footer className="text-center py-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">← Back to home</Link>
      </footer>
    </div>
  );
}
