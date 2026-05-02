import { useEffect, useRef } from "react";

export function useRingtone(shouldRing: boolean) {
  const audioInitialized = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
      // Required to use Web Audio API on an external URL
      audio.crossOrigin = "anonymous";
      audio.loop = true;
      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (shouldRing) {
      if (!audioInitialized.current) {
        try {
          // Initialize Web Audio API to amplify volume by 10x
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass && !audioContextRef.current) {
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;

            const source = audioCtx.createMediaElementSource(audio);
            const gainNode = audioCtx.createGain();
            
            // Set volume multiplier to 80
            gainNode.gain.value = 80;
            
            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            audioInitialized.current = true;
          }
        } catch (e) {
          console.error("Web Audio API error:", e);
        }
      }

      // Resume AudioContext if suspended by browser policy
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }

      audio.play().catch((err) => console.log("Auto-play prevented until user interact:", err));
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [shouldRing]);
}
