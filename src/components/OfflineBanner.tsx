import { WifiOff } from "lucide-react";
import { useOnline } from "@/hooks/use-online";

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="glass shadow-elegant rounded-full px-4 py-2 flex items-center gap-2 text-sm border border-warning/40">
        <WifiOff className="h-4 w-4 text-warning" />
        <span>You're offline — changes will retry when you reconnect.</span>
      </div>
    </div>
  );
}
