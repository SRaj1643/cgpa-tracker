import { Link, useLocation } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, BookOpen, Settings, LogOut, Menu, X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/semesters", label: "Semesters", icon: BookOpen, exact: false },
  { to: "/dashboard/settings", label: "Settings", icon: Settings, exact: true },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const isActive = (to: string, exact: boolean) =>
    exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + "/");

  const NavLinks = () => (
    <nav className="space-y-1">
      {nav.map((n) => {
        const active = isActive(n.to, n.exact);
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-sidebar-accent text-foreground shadow-card"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
            )}
          >
            <n.icon className="h-4 w-4" />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-sidebar border-r p-5">
        <div className="px-2"><Logo /></div>
        <div className="mt-8 flex-1"><NavLinks /></div>
        <div className="border-t pt-4">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user?.email}</div>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-background/80 backdrop-blur" onClick={() => setOpen(false)} />
          <aside className="relative w-72 bg-sidebar border-r p-5 flex flex-col">
            <div className="flex items-center justify-between">
              <Logo />
              <Button size="icon" variant="ghost" onClick={() => setOpen(false)}><X className="h-5 w-5" /></Button>
            </div>
            <div className="mt-8 flex-1"><NavLinks /></div>
            <Button variant="ghost" className="justify-start gap-3 text-muted-foreground" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 backdrop-blur bg-background/70 border-b">
          <div className="flex items-center justify-between px-4 sm:px-8 h-16">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="lg:hidden"><Logo /></div>
            <div className="hidden lg:block text-sm text-muted-foreground">
              Welcome back 👋
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="px-4 sm:px-8 py-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
