"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenis.on("scroll", ScrollTrigger.update);

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // Dynamic height observer to keep Lenis limit in sync when DOM resizes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && document.body) {
      resizeObserver = new ResizeObserver(() => {
        lenis.resize();
        ScrollTrigger.refresh();
      });
      resizeObserver.observe(document.body);
    }

    const handleResizeOrLoad = () => {
      lenis.resize();
      ScrollTrigger.refresh();
    };

    window.addEventListener("resize", handleResizeOrLoad);
    window.addEventListener("load", handleResizeOrLoad);

    // Staggered refreshes for async data/images rendering late
    const refreshTimer1 = setTimeout(handleResizeOrLoad, 300);
    const refreshTimer2 = setTimeout(handleResizeOrLoad, 1000);
    const refreshTimer3 = setTimeout(handleResizeOrLoad, 2500);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(refreshTimer1);
      clearTimeout(refreshTimer2);
      clearTimeout(refreshTimer3);
      window.removeEventListener("resize", handleResizeOrLoad);
      window.removeEventListener("load", handleResizeOrLoad);
      if (resizeObserver) resizeObserver.disconnect();
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return <>{children}</>;
}
