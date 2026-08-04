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

    // Sync Lenis scroll position with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Use GSAP ticker as the RAF loop — most performant approach
    const onRaf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onRaf);

    // Critical: disable GSAP's lag smoothing so Lenis RAF runs at full 60fps
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(onRaf);
    };
  }, []);

  return <>{children}</>;
}
