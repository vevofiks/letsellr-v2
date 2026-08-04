"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // lenis.dev config — lerp-based smooth scroll, same as their own site
    const lenis = new Lenis({
      lerp: 0.1,           // silky smooth linear interpolation (lenis.dev default)
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    // Sync Lenis scroll position with GSAP ScrollTrigger on every frame
    lenis.on("scroll", ScrollTrigger.update);

    // Use GSAP ticker as the RAF loop — most performant approach
    const onRaf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onRaf);

    // Critical: disable GSAP's lag smoothing so Lenis RAF runs at full 60fps
    gsap.ticker.lagSmoothing(0);

    // Refresh ScrollTrigger after a short delay so all section positions
    // are calculated correctly once the DOM has fully rendered.
    // This prevents bottom sections from staying invisible when their
    // ScrollTrigger never fires due to stale position calculations.
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 300);

    // Second refresh pass — catches sections that rendered late (e.g. after
    // async data fetches like EditorialSection's property cards).
    const refreshTimer2 = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 1500);

    return () => {
      clearTimeout(refreshTimer);
      clearTimeout(refreshTimer2);
      lenis.destroy();
      gsap.ticker.remove(onRaf);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return <>{children}</>;
}
