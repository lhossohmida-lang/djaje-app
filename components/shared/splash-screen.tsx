"use client";

import { useEffect, useState } from "react";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"show" | "fadeout">("show");

  useEffect(() => {
    // Safety auto-transition after 6.5 seconds of playback
    const autoTimer = setTimeout(() => {
      setPhase("fadeout");
    }, 6500);

    return () => {
      clearTimeout(autoTimer);
    };
  }, []);

  useEffect(() => {
    if (phase === "fadeout") {
      const doneTimer = setTimeout(() => {
        onDone();
      }, 700); // matches the 0.7s opacity transition
      return () => clearTimeout(doneTimer);
    }
  }, [phase, onDone]);

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
          background: #080300;
          transition: opacity 0.7s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .splash-wrap.out {
          opacity: 0;
          pointer-events: none;
        }

        /* ---- Video background ---- */
        .splash-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
          pointer-events: none;
        }

        /* ---- Premium vignette and overlay ---- */
        .splash-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at center,
            rgba(8, 3, 0, 0.15) 0%,
            rgba(8, 3, 0, 0.75) 70%,
            rgba(8, 3, 0, 0.95) 100%
          );
          z-index: 1;
        }

        /* ---- Gold glow filter ---- */
        .splash-gold {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 100% 50% at 50% 100%,
            rgba(255, 140, 0, 0.1) 0%,
            transparent 75%
          );
          z-index: 1;
          pointer-events: none;
        }

        /* ---- Interactive Skip Button ---- */
        .splash-skip-btn {
          position: absolute;
          top: 24px;
          right: 24px;
          z-index: 10;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #ffffff;
          padding: 8px 24px;
          border-radius: 99px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
          direction: rtl;
        }
        .splash-skip-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 140, 0, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 140, 0, 0.2);
        }
        .splash-skip-btn:active {
          transform: translateY(0) scale(0.96);
        }

        /* ---- Content Container ---- */
        .splash-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 32px;
          max-width: 90%;
          animation: fadeInContent 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .splash-logo-container {
          position: relative;
          margin-bottom: 20px;
        }

        .splash-logo {
          width: 110px;
          height: 110px;
          object-fit: contain;
          filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.5));
          animation: logoPulse 3s ease-in-out infinite;
        }

        .splash-logo-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(255, 140, 0, 0.4) 0%, transparent 70%);
          filter: blur(15px);
          animation: glowPulse 3s ease-in-out infinite;
          pointer-events: none;
          z-index: -1;
        }

        .splash-title {
          font-size: 3.2rem;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: 6px;
          margin: 0;
          text-shadow: 
            0 2px 10px rgba(0, 0, 0, 0.9),
            0 0 30px rgba(255, 100, 0, 0.4);
          text-transform: uppercase;
        }

        .splash-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.95);
          margin-top: 10px;
          font-weight: 500;
          letter-spacing: 1px;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.9);
        }

        .splash-divider {
          width: 50px;
          height: 3px;
          background: linear-gradient(90deg, transparent, #ff8c00, transparent);
          margin: 16px 0;
          border-radius: 99px;
        }

        /* ---- Smoke particles ---- */
        .smoke-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }
        .smoke-puff {
          position: absolute;
          bottom: -15%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 140, 0, 0.08) 0%, rgba(200, 200, 200, 0.03) 40%, transparent 70%);
          filter: blur(25px);
          animation: smokeRise var(--dur, 5s) ease-in-out var(--delay, 0s) infinite;
          opacity: 0;
          mix-blend-mode: screen;
        }

        /* ---- Keyframes ---- */
        @keyframes fadeInContent {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes logoPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.04);
          }
        }

        @keyframes glowPulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(0.9);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        @keyframes smokeRise {
          0% { 
            opacity: 0;   
            transform: translateY(0) scale(0.6) rotate(0deg); 
          }
          30% { 
            opacity: 0.6; 
          }
          60% { 
            opacity: 0.4; 
          }
          100% { 
            opacity: 0;   
            transform: translateY(-60vh) scale(2.2) rotate(45deg); 
          }
        }
      `}</style>

      <div className={`splash-wrap ${phase === "fadeout" ? "out" : ""}`}>
        {/* Cinematic Video Background */}
        <video
          className="splash-video"
          src="/intro.mp4"
          autoPlay
          muted
          playsInline
          loop
          onEnded={() => setPhase("fadeout")}
        />

        {/* Overlays */}
        <div className="splash-overlay" />
        <div className="splash-gold" />

        {/* Skip button in Arabic */}
        <button 
          className="splash-skip-btn" 
          onClick={() => setPhase("fadeout")}
          aria-label="تخطي المقدمة"
        >
          تخطي
        </button>

        {/* Center branding content */}
        <div className="splash-content">
          <div className="splash-logo-container">
            <div className="splash-logo-glow" />
            <img src="/logo.png" alt="Doudou Logo" className="splash-logo" />
          </div>
          <h1 className="splash-title">DOUDOU</h1>
          <div className="splash-divider" />
          <p className="splash-subtitle">المذاق الأصيل للدجاج المشوي</p>
        </div>

        {/* Premium ambient smoke layer */}
        <div className="smoke-container">
          {[
            { left: "8%", size: 180, dur: "5.5s", delay: "0s" },
            { left: "38%", size: 240, dur: "6.5s", delay: "1.2s" },
            { left: "68%", size: 210, dur: "6s", delay: "2.4s" },
            { left: "22%", size: 190, dur: "7s", delay: "0.6s" },
            { left: "55%", size: 260, dur: "5.8s", delay: "1.8s" },
            { left: "82%", size: 160, dur: "6.2s", delay: "0.9s" },
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
      </div>
    </>
  );
}
