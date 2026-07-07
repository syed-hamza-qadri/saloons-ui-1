import { useEffect, useRef, useState } from "react";
import { FRAME_URLS } from "@/lib/frame-urls";

interface Props {
  /** External scroll progress 0..1 (raw, not eased). */
  progress: number;
}

/**
 * Fixed full-viewport canvas driven by scroll progress.
 *
 * Loading strategy (two phases):
 * 1. Fast start — fully decode a small initial batch of frames (high
 *    priority, high concurrency) and reveal the site the moment those are
 *    ready. This is what the loader bar (0→100%) tracks.
 * 2. Background stream — the remaining frames keep decoding quietly at a
 *    lower concurrency. If the user scrolls ahead of what's ready, we draw
 *    the nearest frame that IS ready instead of nothing.
 *
 * Why createImageBitmap instead of `new Image()` + onload:
 * `onload` only means the bytes have arrived — the browser still has to
 * decode the jpeg into pixels the first time it's drawn, and that decode
 * happens synchronously on the main thread mid-scroll, which is exactly
 * what caused the "hangs the first time, smooth after" symptom (once a
 * frame's been drawn once, it's decoded and cached). createImageBitmap()
 * decodes fully, off the main thread, before we ever call drawImage, so
 * there's no first-draw jank.
 */
const INITIAL_BATCH = 24; // enough for the first stretch of scroll; loads almost instantly
const INITIAL_CONCURRENCY = 16;
const BACKGROUND_CONCURRENCY = 4;

type Frame = ImageBitmap | HTMLImageElement;

function frameSize(img: Frame): { w: number; h: number } {
  if (img instanceof HTMLImageElement) {
    return { w: img.naturalWidth, h: img.naturalHeight };
  }
  return { w: img.width, h: img.height };
}

function findNearestLoaded(
  frames: (Frame | null)[],
  idx: number
): Frame | null {
  if (frames[idx]) return frames[idx];
  const max = frames.length;
  for (let r = 1; r < max; r++) {
    if (idx - r >= 0 && frames[idx - r]) return frames[idx - r];
    if (idx + r < max && frames[idx + r]) return frames[idx + r];
  }
  return null;
}

// Fetches + fully decodes a frame off the main thread. Falls back to a
// plain <img> + decode() for browsers without createImageBitmap support.
async function loadFrame(url: string, priority: boolean): Promise<Frame | null> {
  try {
    const res = await fetch(url, { priority: priority ? "high" : "low" } as RequestInit);
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    return await createImageBitmap(blob);
  } catch {
    try {
      return await new Promise<Frame | null>((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          if (typeof img.decode === "function") {
            img.decode().then(() => resolve(img)).catch(() => resolve(img));
          } else {
            resolve(img);
          }
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    } catch {
      return null;
    }
  }
}

export function ScrollFramesCanvas({ progress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<(Frame | null)[]>([]);
  const targetRef = useRef<number>(0);
  const currentRef = useRef<number>(0);
  const lastDrawnRef = useRef<number>(-1);
  const rafRef = useRef<number>(0);
  const [ready, setReady] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  const total = FRAME_URLS.length;

  // Preload: fast initial batch first (fully decoded), then stream the rest.
  useEffect(() => {
    framesRef.current = new Array(total).fill(null);
    let cancelled = false;

    const firstBatchSize = Math.min(INITIAL_BATCH, total);

    const runPool = (
      startIdx: number,
      endIdx: number,
      concurrency: number,
      priority: boolean,
      onEach?: () => void,
      onAllDone?: () => void
    ) => {
      let cursor = startIdx;
      let inFlight = 0;
      let done = 0;
      const total = endIdx - startIdx;
      const next = () => {
        if (cancelled) return;
        while (inFlight < concurrency && cursor < endIdx) {
          const idx = cursor++;
          inFlight++;
          loadFrame(FRAME_URLS[idx], priority).then((frame) => {
            if (cancelled) return;
            framesRef.current[idx] = frame;
            inFlight--;
            done++;
            onEach?.();
            if (done === total) onAllDone?.();
            next();
          });
        }
      };
      next();
    };

    let firstDone = 0;
    runPool(
      0,
      firstBatchSize,
      INITIAL_CONCURRENCY,
      true,
      () => {
        firstDone++;
        setLoadProgress(firstDone / firstBatchSize);
      },
      () => {
        setReady(true);
        // Phase 2: stream the rest quietly in the background.
        runPool(firstBatchSize, total, BACKGROUND_CONCURRENCY, false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [total]);

  // Lock the page while the initial batch is loading so the first scroll is smooth.
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

  // rAF loop: lerp current → target and paint, falling back to the nearest
  // already-decoded frame if the exact one hasn't streamed in yet.
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
        const img = findNearestLoaded(framesRef.current, idx);
        if (img) {
          const cw = canvas.width;
          const ch = canvas.height;
          const { w: iw, h: ih } = frameSize(img);
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
