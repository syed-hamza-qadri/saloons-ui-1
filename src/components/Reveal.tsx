import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fades + slides children in when they scroll into view. One-shot — the
 * animation runs the first time the element is at least partially visible.
 */
export function Reveal({
  children,
  as: As = "div",
  className = "",
  delay = 0,
  y = 24,
}: {
  children: ReactNode;
  as?: "div" | "section" | "span" | "li" | "article";
  className?: string;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const style = {
    transform: visible ? "translate3d(0,0,0)" : `translate3d(0,${y}px,0)`,
    opacity: visible ? 1 : 0,
    transition: `transform 900ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, opacity 900ms ease-out ${delay}ms`,
    willChange: "transform, opacity",
  } as const;

  const Cmp = As as "div";
  return (
    <Cmp ref={ref as never} className={className} style={style}>
      {children}
    </Cmp>
  );
}
