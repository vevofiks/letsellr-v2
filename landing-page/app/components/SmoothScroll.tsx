"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * How closely the page tracks your input, 0-1.
 *
 * Lenis eases toward the real scroll position by this fraction each frame, so
 * a low value means the page keeps travelling after you stop — which reads as
 * "heavy" or "laggy" even when the frame rate is perfect. 1 disables smoothing
 * entirely. The previous 0.1 was Lenis's default and the floatiest usable
 * setting; 0.15 keeps the glide but lets the page settle noticeably sooner.
 * This is the one number to turn if it still feels off.
 */
const SCROLL_LERP = 0.15;

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    // ScrollTrigger.refresh() forces a synchronous layout pass over every
    // trigger on the page, so it must never run on a raw resize callback.
    // A ResizeObserver on <body> used to call it on every observed change, and
    // because the reveal animations mutate styles (clearProps on complete,
    // gsap.set inside onRefresh) each refresh could itself resize the body — a
    // feedback loop that showed up as jank between sections.
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let lastHeight = document.body.scrollHeight;

    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        ScrollTrigger.refresh();
        lastHeight = document.body.scrollHeight;
      }, 250);
    };

    // Users who ask their OS for reduced motion get plain native scrolling.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let lenis: Lenis | null = null;
    let removeTicker: (() => void) | null = null;

    if (!prefersReducedMotion) {
      lenis = new Lenis({
        lerp: SCROLL_LERP,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
        infinite: false,
      });

      lenis.on("scroll", ScrollTrigger.update);

      // Drive Lenis from GSAP's ticker instead of a second requestAnimationFrame
      // loop. Two independent loops meant Lenis and ScrollTrigger could run in
      // either order within a frame, so triggers sometimes read a scroll
      // position one frame stale — visible as the animations lagging the scroll.
      const tick = (time: number) => lenis!.raf(time * 1000);
      gsap.ticker.add(tick);
      // GSAP's lag smoothing pauses animation after a slow frame to "catch up",
      // which fights Lenis's own interpolation and causes a visible hitch.
      gsap.ticker.lagSmoothing(0);

      removeTicker = () => {
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33); // restore GSAP's default
      };
    }

    // Only height changes move trigger positions. Width-only changes and the
    // sub-pixel noise from transforms are ignored, which keeps the reveal
    // animations from re-entering this path.
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        if (Math.abs(document.body.scrollHeight - lastHeight) > 1) {
          lenis?.resize();
          scheduleRefresh();
        }
      });
      resizeObserver.observe(document.body);
    }

    // Images and API-driven sections land after first paint; a couple of
    // settling refreshes cover them without polling. `load` and `resize` are
    // already in ScrollTrigger's default autoRefreshEvents, so listening for
    // them here as well would just double every refresh.
    const lateRefresh1 = setTimeout(scheduleRefresh, 800);
    const lateRefresh2 = setTimeout(scheduleRefresh, 2500);

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      clearTimeout(lateRefresh1);
      clearTimeout(lateRefresh2);
      resizeObserver?.disconnect();
      removeTicker?.();

      lenis?.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return <>{children}</>;
}
