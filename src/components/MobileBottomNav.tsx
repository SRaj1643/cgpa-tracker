import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, BookOpen, Calendar, Calculator, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/semesters", label: "Semesters", icon: BookOpen, exact: false },
  { to: "/dashboard/timeline", label: "Timeline", icon: Calendar, exact: true },
  { to: "/dashboard/simulator", label: "Simulate", icon: Calculator, exact: true },
  { to: "/dashboard/settings", label: "Profile", icon: Settings, exact: true },
];

/**
 * Floating glass bottom nav, mobile/tablet only.
 * - Safe-area aware via env(safe-area-inset-bottom)
 * - Thumb-friendly (min 44px tap targets)
 * - Renders nothing on `lg` and up (desktop uses sidebar)
 */
export function MobileBottomNav() {
  const location = useLocation();
  const isActive = (to: string, exact: boolean) =>
    exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed inset-x-0 z-40 pointer-events-none"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto mx-auto max-w-md px-3">
        <div className="glass shadow-elegant rounded-2xl border-border/60 px-2 py-1.5 flex items-center justify-between">
          {tabs.map((t) => {
            const active = isActive(t.to, t.exact);
            return (
              <Link
                key={t.to}
                to={t.to}
                aria-label={t.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-[10px] font-medium min-h-11 transition-all duration-200 active:scale-95",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-1 rounded-xl bg-gradient-to-b from-primary/15 to-primary/5 ring-1 ring-primary/30"
                  />
                )}
                <t.icon className={cn("h-[18px] w-[18px] relative transition-transform", active && "scale-110")} />
                <span className="relative leading-none">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
