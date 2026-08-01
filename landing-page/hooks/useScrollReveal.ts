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
  /** scrub progress or just trigger once (default false = trigger once) */
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
    // Use 95% so it triggers earlier — more forgiving on mobile & fast scroll
    start = "top 95%",
    delay = 0,
    children = false,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = children ? Array.from(el.children) : [el];

    gsap.fromTo(
      targets,
      // Only animate Y — opacity stays 1 so content is always visible
      // even if the ScrollTrigger fires late or is skipped on mobile
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        stagger,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start,
          once: true,
          // If already past the trigger point when initialized, play immediately
          onEnter: () => {},
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
  }, []);

  return ref;
}
