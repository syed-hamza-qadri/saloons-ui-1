import { useEffect, useRef, useState } from "react";
import { FRAME_URLS } from "@/lib/frame-urls";

interface Props {
  /** External scroll progress 0..1 (raw, not eased). */
  progress: number;
}

/**
 * Fixed full-viewport canvas driven by scroll progress.
 *
 * Loading strategy:
 * - We block the page (lock body scroll) and display a branded loader until
 *   EVERY frame is decoded. Only then do we reveal the site — this guarantees
 *   the first scroll is silky, since no frame is ever missing.
 * - After ready, we lerp `current` toward `target` on every rAF tick so quick
 *   scroll input translates into a smooth camera glide.
 */
export function ScrollFramesCanvas({ progress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const targetRef = useRef<number>(0);
  const currentRef = useRef<number>(0);
  const lastDrawnRef = useRef<number>(-1);
  const rafRef = useRef<number>(0);
  const [ready, setReady] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  const total = FRAME_URLS.length;

  // Preload every frame in parallel batches; only ready when 100% decoded.
  useEffect(() => {
    imagesRef.current = new Array(total).fill(null);

    let cancelled = false;
    let cursor = 0;
    const CONCURRENCY = 32;
    let inFlight = 0;
    let loadedCount = 0;

    const loadNext = () => {
      if (cancelled) return;
      while (inFlight < CONCURRENCY && cursor < total) {
        const idx = cursor++;
        inFlight++;
        const img = new Image();
        img.decoding = "async";
        img.src = FRAME_URLS[idx];
        const done = () => {
          if (cancelled) return;
          inFlight--;
          loadedCount++;
          setLoadProgress(loadedCount / total);
          if (loadedCount === total) setReady(true);
          loadNext();
        };
        img.onload = () => {
          imagesRef.current[idx] = img;
          done();
        };
        img.onerror = done;
      }
    };
    loadNext();

    return () => {
      cancelled = true;
    };
  }, [total]);

  // Lock the page while frames are loading so the first scroll is smooth.
  useEffect(() => {
    if (ready) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [ready]);

  // Canvas sizing (only mutate when needed).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        lastDrawnRef.current = -1;
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Update target on incoming progress.
  useEffect(() => {
    targetRef.current = Math.min(1, Math.max(0, progress));
  }, [progress]);

  // rAF loop: lerp current → target and paint.
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const tick = () => {
      const t = targetRef.current;
      const c = currentRef.current;
      const next = c + (t - c) * 0.18;
      currentRef.current = Math.abs(next - t) < 0.0005 ? t : next;

      const idx = Math.round(currentRef.current * (total - 1));

      if (idx !== lastDrawnRef.current && idx >= 0) {
        const img = imagesRef.current[idx];
        if (img) {
          const cw = canvas.width;
          const ch = canvas.height;
          const iw = img.naturalWidth;
          const ih = img.naturalHeight;
          const scale = Math.max(cw / iw, ch / ih);
          const dw = iw * scale;
          const dh = ih * scale;
          const dx = (cw - dw) / 2;
          const dy = (ch - dh) / 2;
          ctx.fillStyle = "#0a0a0a";
          ctx.fillRect(0, 0, cw, ch);
          ctx.drawImage(img, dx, dy, dw, dh);
          lastDrawnRef.current = idx;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [total, ready]);

  // Choreograph a soft handoff: hold at 100% for a beat, fade the loader,
  // then unmount so the site reveals with a gentle transition rather than a cut.
  useEffect(() => {
    if (!ready) return;
    const t1 = window.setTimeout(() => setFadeOut(true), 250);
    const t2 = window.setTimeout(() => setShowLoader(false), 1150);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [ready]);

  const pct = Math.round(loadProgress * 100);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 h-screen w-screen transition-opacity duration-[900ms] ease-out"
        style={{ zIndex: 0, willChange: "transform", opacity: ready ? 1 : 0 }}
      />
      {showLoader && (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-background px-6 transition-opacity duration-[900ms] ease-out"
          style={{ opacity: fadeOut ? 0 : 1 }}
        >
          <div className="font-display text-3xl tracking-[0.5em] text-gold-gradient sm:text-4xl">
            LUXÉ
          </div>
          <div className="mt-3 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            Hair Atelier
          </div>
          <div className="mt-10 h-px w-48 overflow-hidden bg-gold/15 sm:w-56">
            <div
              className="h-full bg-gold transition-[width] duration-200 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-4 font-display text-sm tabular-nums text-gold/80">
            {pct}%
          </div>
          <div className="mt-2 text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
            Preparing the atelier
          </div>
        </div>
      )}
    </>
  );
}

