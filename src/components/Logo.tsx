import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="h-9 w-9 rounded-xl gradient-bg shadow-glow flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
      </div>
      <span className="font-display text-xl font-bold tracking-tight">
        Grade<span className="gradient-text">Flow</span>
      </span>
    </Link>
  );
}
