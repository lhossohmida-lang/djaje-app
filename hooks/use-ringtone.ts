import { useEffect, useRef } from "react";

export function useRingtone(shouldRing: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const wakeLockRef = useRef<any>(null);
  
  // Oscillator alert reference for the piercing synthesized buzzer fallback
  const synthIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const synthNodesRef = useRef<{ oscillator: OscillatorNode; gain: GainNode }[]>([]);

  // Silent keep-alive reference to prevent browser suspending the tab
  const keepAliveSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // 1. Setup Screen Wake Lock to prevent the tablet/computer screen from sleeping
  useEffect(() => {
    async function requestWakeLock() {
      if (typeof window === "undefined" || !("wakeLock" in navigator)) return;
      try {
        if (wakeLockRef.current) return;
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        console.log("Screen Wake Lock activated successfully 🖥️");
      } catch (err) {
        console.warn("Screen Wake Lock request failed:", err);
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    }

    if (shouldRing) {
      requestWakeLock();
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
        }).catch(console.error);
      }
    };
  }, [shouldRing]);

  // 2. Initialize Web Audio Context, Silent Keep-Alive, and Alarm Sound
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load original watch alarm
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
    audio.crossOrigin = "anonymous";
    audio.loop = true;
    audioRef.current = audio;

    // Setup silent keep-alive buffer to prevent background suspension
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      try {
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;

        // Amplification Gain for the alarm file
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 80; // 80x volume amplification
        gainNodeRef.current = gainNode;

        const source = audioCtx.createMediaElementSource(audio);
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Create silent loop buffer to keep tab alive in background
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
        const silentSource = audioCtx.createBufferSource();
        silentSource.buffer = buffer;
        silentSource.loop = true;

        // Very small gain, virtually silent but tells browser we are actively playing media
        const silentGain = audioCtx.createGain();
        silentGain.gain.value = 0.001; 
        
        silentSource.connect(silentGain);
        silentGain.connect(audioCtx.destination);
        
        silentSource.start();
        keepAliveSourceRef.current = silentSource;
        console.log("Audio Keep-Alive active (preventing browser background sleep) 🎵");
      } catch (err) {
        console.error("Web Audio API keep-alive initialization error:", err);
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (keepAliveSourceRef.current) {
        try {
          keepAliveSourceRef.current.stop();
        } catch (e) {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, []);

  // 3. Play or stop the dual alarm system (Watch Alarm + Piercing Synth Buzzer)
  useEffect(() => {
    const audio = audioRef.current;
    const audioCtx = audioContextRef.current;
    if (!audio) return;

    // Helper to stop synthesized beeping
    const stopSynthAlert = () => {
      if (synthIntervalRef.current) {
        clearInterval(synthIntervalRef.current);
        synthIntervalRef.current = null;
      }
      synthNodesRef.current.forEach(({ oscillator, gain }) => {
        try {
          oscillator.stop();
          oscillator.disconnect();
          gain.disconnect();
        } catch (e) {}
      });
      synthNodesRef.current = [];
    };

    // Helper to trigger piercing beep
    const playSynthBeep = () => {
      if (!audioCtx) return;
      try {
        if (audioCtx.state === "suspended") {
          audioCtx.resume();
        }

        // We create a dual-tone extremely loud buzzer (impossible to miss)
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        const gain2 = audioCtx.createGain();

        // Piercing frequencies: A6 (1760Hz) and C7 (2093Hz)
        osc1.type = "sawtooth";
        osc1.frequency.value = 1760; 
        gain1.gain.setValueAtTime(0.6, audioCtx.currentTime); // high volume
        gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35); // fade out

        osc2.type = "square";
        osc2.frequency.value = 2093;
        gain2.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start();

        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();

        // Save refs to clean up if needed
        synthNodesRef.current.push({ oscillator: osc1, gain: gain1 }, { oscillator: osc2, gain: gain2 });

        // Cleanup completed nodes after 0.5s to free resources
        setTimeout(() => {
          try {
            osc1.stop();
            osc1.disconnect();
            gain1.disconnect();
            osc2.stop();
            osc2.disconnect();
            gain2.disconnect();
          } catch (e) {}
        }, 500);

      } catch (err) {
        console.error("Synthesizer beep error:", err);
      }
    };

    if (shouldRing) {
      // Resume context if browser suspended it
      if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      // 1. Play the original ogg alarm
      audio.play().catch((err) => {
        console.log("Audio autoplay restricted. Triggering offline synth alert fallback...", err);
      });

      // 2. Play the piercing synthesized buzzer periodically (every 700ms, beeping rhythmically)
      if (!synthIntervalRef.current) {
        playSynthBeep();
        synthIntervalRef.current = setInterval(playSynthBeep, 700);
      }
    } else {
      // Stop original watch alarm
      audio.pause();
      audio.currentTime = 0;

      // Stop synthesized beeps
      stopSynthAlert();
    }

    return () => {
      stopSynthAlert();
    };
  }, [shouldRing]);
}
