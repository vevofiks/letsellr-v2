import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface RevealOptions {
  /** y offset to animate from (default 40) */
  y?: number;
  /** animation duration in seconds (default 0.8) */
  duration?: number;
  /** stagger between children (default 0.12) */
  stagger?: number;
  /** ScrollTrigger start string (default "top 88%") */
  start?: string;
  /** delay before animation starts (default 0) */
  delay?: number;
  /** animate children individually (default false = animate wrapper) */
  children?: boolean;
}

/**
 * Returns a ref to attach to any element.
 * On scroll into view, the element (or its direct children) will fade+slide in.
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  options: RevealOptions = {}
) {
  const ref = useRef<T>(null);
  const {
    y = 40,
    duration = 0.8,
    stagger = 0.12,
    start = "top 88%",
    delay = 0,
    children = false,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = children ? Array.from(el.children) : [el];

    // Cleanup holder — populated inside rAF callback
    let rafId: number;
    let tween: gsap.core.Tween | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let triggers: ScrollTrigger[] = [];

    rafId = requestAnimationFrame(() => {
      // If element is already in the viewport, just make it visible immediately
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.99) {
        gsap.set(targets, { opacity: 1, y: 0, clearProps: "opacity,y" });
        return;
      }

      // Hide initially (only for off-screen elements)
      gsap.set(targets, { opacity: 0, y });

      tween = gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          stagger,
          ease: "power3.out",
          // Always clear inline styles when done so CSS takes over
          onComplete: () => gsap.set(targets, { clearProps: "opacity,y" }),
          scrollTrigger: {
            trigger: el,
            start,
            once: true,
            invalidateOnRefresh: true,
            // Fallback: if onEnter fires but animation hasn't started, force visible
            onEnter: () => {
              if (!tween?.isActive()) {
                gsap.set(targets, { opacity: 1, y: 0, clearProps: "opacity,y" });
              }
            },
          },
        }
      );

      // Collect trigger refs for cleanup
      triggers = ScrollTrigger.getAll().filter((t) => t.trigger === el);

      // Re-run refresh after a short delay to account for dynamic content shifts
      refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
    });

    return () => {
      // Cancel the rAF if it hasn't fired yet
      cancelAnimationFrame(rafId);
      if (refreshTimer !== null) clearTimeout(refreshTimer);
      tween?.kill();
      triggers.forEach((t) => t.kill());
      // Guarantee element is visible after unmount/cleanup
      gsap.set(targets, { clearProps: "opacity,y" });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}
