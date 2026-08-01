"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const counterObj = { value: 0 };
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          onComplete(); // Trigger parent load completion immediately so Hero animations start sync'd with exit
          gsap.to(containerRef.current, {
            yPercent: -100,
            duration: 0.5,
            ease: "power4.inOut",
          });
        },
      });

      tl.to(counterObj, {
        value: 100,
        duration: 0.45,
        ease: "power2.out",
        onUpdate: () => {
          setProgress(Math.floor(counterObj.value));
        },
      });

      tl.to(
        textRef.current,
        {
          opacity: 0,
          y: -20,
          duration: 0.3,
          ease: "power2.in",
        },
        "-=0.2"
      );
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-100 flex flex-col justify-between p-8 md:p-16 bg-[#FAF9F6] text-[#0F0F11] select-none pointer-events-auto"
    >
      {/* Empty Top Space */}
      <div />

      {/* Main Center Display */}
      <div ref={textRef} className="flex flex-col items-center justify-center text-center my-auto">
        <h1 className="text-7xl md:text-[10rem] font-extrabold tracking-tighter uppercase font-sans mb-4 text-[#0F0F11]">
          LETSELLR
        </h1>
        <p className="text-zinc-600 text-sm md:text-lg font-serif italic max-w-md font-normal">
          Architectural living & direct verified property connections.
        </p>
      </div>

      {/* Bottom Counter Only (No line, No left text) */}
      <div className="flex justify-end items-end">
        <h2 ref={counterRef} className="text-6xl md:text-9xl font-light font-mono text-[#0F0F11]">
          {progress.toString().padStart(2, "0")}
          <span className="text-3xl md:text-4xl text-zinc-400 font-sans ml-1">%</span>
        </h2>
      </div>
    </div>
  );
}
