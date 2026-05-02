"use client";

import { useEffect, useState } from "react";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"show" | "fadeout">("show");

  useEffect(() => {
    // After 2.8s start fading out
    const fadeTimer = setTimeout(() => setPhase("fadeout"), 2800);
    // After 3.5s notify parent it's done
    const doneTimer = setTimeout(() => onDone(), 3500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <>
      <style>{`
        /* ---- Splash wrapper ---- */
        .splash-wrap {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #1a0a00;
          transition: opacity 0.7s ease;
        }
        .splash-wrap.out {
          opacity: 0;
          pointer-events: none;
        }

        /* ---- Background image ---- */
        .splash-bg {
          position: absolute;
          inset: -5%; /* allow room to float without showing edges */
          background: url('/splash-image.png') center/cover no-repeat;
          animation: floatBg 4s ease-in-out infinite;
        }

        @keyframes floatBg {
          0%, 100% { transform: translateY(0px) scale(1.02); }
          50% { transform: translateY(-15px) scale(1.02); }
        }

        /* ---- Dark gradient overlay ---- */
        .splash-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to top,   rgba(15,5,0,0.85) 0%, transparent 55%),
            linear-gradient(to bottom, rgba(15,5,0,0.55) 0%, transparent 40%);
        }

        /* ---- Gold shimmer layer ---- */
        .splash-gold {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 120% 60% at 50% 90%,
            rgba(200,130,20,0.18) 0%,
            transparent 70%
          );
        }

        /* ---- Smoke particles ---- */
        .smoke-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .smoke-puff {
          position: absolute;
          bottom: -10%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(200,200,200,0.3) 0%, transparent 60%);
          filter: blur(20px);
          animation: smokeRise var(--dur, 4s) ease-in-out var(--delay, 0s) infinite;
          opacity: 0;
          mix-blend-mode: screen;
        }
        @keyframes smokeRise {
          0%   { opacity: 0;   transform: translateY(0) scale(0.5); }
          30%  { opacity: 0.5; }
          70%  { opacity: 0.4; }
          100% { opacity: 0;   transform: translateY(-50vh) scale(2.5); }
        }



        /* ---- Bottom glow line ---- */
        .splash-glow-line {
          position: absolute;
          bottom: 18%;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(255,190,50,0.7), transparent);
          border-radius: 99px;
          animation: glowPulse 2s ease-in-out infinite;
          z-index: 2;
        }
        @keyframes glowPulse {
          0%,100% { opacity: 0.4; width: 40%; }
          50%      { opacity: 1;   width: 65%; }
        }
      `}</style>

      <div className={`splash-wrap ${phase === "fadeout" ? "out" : ""}`}>
        {/* Background */}
        <div className="splash-bg" />
        <div className="splash-overlay" />
        <div className="splash-gold" />

        {/* Smoke puffs */}
        <div className="smoke-container">
          {[
            { left: "10%", size: 150, dur: "4s",   delay: "0s" },
            { left: "40%", size: 200, dur: "5s",   delay: "1s" },
            { left: "70%", size: 180, dur: "4.5s", delay: "2s" },
            { left: "25%", size: 160, dur: "5.5s", delay: "0.5s" },
            { left: "60%", size: 220, dur: "4.2s", delay: "1.5s" },
            { left: "80%", size: 140, dur: "4.8s", delay: "0.8s" },
          ].map((p, i) => (
            <div
              key={i}
              className="smoke-puff"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                "--dur": p.dur,
                "--delay": p.delay,
              } as React.CSSProperties}
            />
          ))}
        </div>



        {/* Bottom glow line */}
        <div className="splash-glow-line" />
      </div>
    </>
  );
}
