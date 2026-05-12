import { Check, Loader2, AlertCircle } from "lucide-react";
import type { SaveStatus } from "@/hooks/use-autosave";

export function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-success">
        <Check className="h-3 w-3" /> Saved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-destructive">
      <AlertCircle className="h-3 w-3" /> Failed to save
    </span>
  );
}
