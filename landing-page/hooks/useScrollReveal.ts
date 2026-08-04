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
  /** ScrollTrigger start string (default "top 90%") */
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
    start = "top 90%",
    delay = 0,
    children = false,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const targets = children ? Array.from(el.children) : [el];
      if (targets.length === 0) return;

      // Check if the element is already visible in viewport on mount
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92) {
        gsap.set(targets, { opacity: 1, y: 0, clearProps: "opacity,y,transform" });
        return;
      }

      // Smooth scroll reveal animation
      gsap.fromTo(
        targets,
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
          },
          onComplete: () => {
            gsap.set(targets, { clearProps: "opacity,y,transform" });
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}
