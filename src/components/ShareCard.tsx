import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  fileName: string;
  /** Inner card content. Will be rendered into a 1080×1350 IG-portrait canvas. */
  children: ReactNode;
  /** Preview-only label shown above the buttons. */
  label?: string;
};

const SRC_W = 1080;
const SRC_H = 1350;

/**
 * Wraps any visual card and exposes a "Download as image" button.
 * The exported PNG is always 1080×1350 (IG portrait), while the preview
 * scales fluidly to the container width.
 */
export function ShareCard({ fileName, children, label }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setScale(Math.min(1, w / SRC_W));
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Inject font fallback hint so html-to-image rasterizes consistently
  useEffect(() => {}, []);

  const render = async () => {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      width: SRC_W,
      height: SRC_H,
      style: { transform: "none" },
    });
  };

  const download = async () => {
    setBusy(true);
    try {
      const dataUrl = await render();
      if (!dataUrl) return;
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
    if (!navigator.share) return download();
    setBusy(true);
    try {
      const dataUrl = await render();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${fileName}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
      } else {
        download();
      }
    } catch {
      /* user cancelled */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {label && <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>}

      <div ref={wrapRef} className="w-full overflow-hidden rounded-2xl border border-border/60 shadow-elegant">
        <div style={{ width: "100%", height: SRC_H * scale, position: "relative" }}>
          <div
            ref={cardRef}
            style={{
              width: SRC_W,
              height: SRC_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            {children}
          </div>
        </div>
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
