import { useRef, useState, type ReactNode } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  fileName: string;
  /** Inner card content. Will be rendered into a 1080×1350 IG-portrait canvas off-screen. */
  children: ReactNode;
  /** Preview-only label shown above the buttons. */
  label?: string;
};

/**
 * Wraps any visual card and exposes a "Download as image" button.
 * The visible preview is fluid; the export renders at a fixed 1080×1350
 * via inline width/height for crisp social-share output.
 */
export function ShareCard({ fileName, children, label }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    if (!previewRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: undefined,
      });
      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Image downloaded");
    } catch {
      toast.error("Could not generate image");
    } finally {
      setBusy(false);
    }
  };

  const shareNative = async () => {
    if (!previewRef.current) return;
    if (!navigator.share) return download();
    setBusy(true);
    try {
      const dataUrl = await toPng(previewRef.current, { cacheBust: true, pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${fileName}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
      } else {
        download();
      }
    } catch {
      // user cancelled or unsupported
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {label && <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>}
      <div className="overflow-hidden rounded-2xl border border-border/60 shadow-elegant">
        <div
          ref={previewRef}
          className="origin-top-left"
          style={{
            width: 1080,
            height: 1350,
            // scale to fit container — keeps 1080x1350 layout but shrinks to viewport
            transform: "scale(var(--share-scale, 0.32))",
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
        {/* spacer to reserve scaled height */}
        <ScaleSpacer />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={download} disabled={busy} className="gradient-bg text-primary-foreground border-0">
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Download image
        </Button>
        <Button onClick={shareNative} disabled={busy} variant="outline">
          <Share2 className="h-4 w-4 mr-2" /> Share
        </Button>
      </div>
    </div>
  );
}

/**
 * Reserves vertical space proportional to the scaled card.
 * Uses a ResizeObserver-less trick: an inline-block sized via aspect-ratio.
 */
function ScaleSpacer() {
  return (
    <div
      aria-hidden
      className="w-full"
      style={{ aspectRatio: "1080 / 1350", marginTop: "calc(-1350px * var(--share-scale, 0.32))" }}
    />
  );
}
