export async function requestBrowserNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  if (Notification.permission === "default") {
    return Notification.requestPermission();
  }

  return Notification.permission;
}

export async function notify(title: string, body: string) {
  const permission = await requestBrowserNotificationPermission();
  if (permission !== "granted") {
    return;
  }

  new Notification(title, { body });
}

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext) {
    audioContext = new Ctx();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => undefined);
  }
  return audioContext;
}

export function primeAudio() {
  getAudioContext();
}

export function playOrderAlarm(repeatCount: number = 2) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const cycleDuration = 1.4;
  const now = ctx.currentTime;

  for (let cycle = 0; cycle < repeatCount; cycle++) {
    const cycleStart = now + cycle * cycleDuration;
    const pattern = [
      { freq: 1320, start: 0.0, dur: 0.18 },
      { freq: 990, start: 0.22, dur: 0.18 },
      { freq: 1320, start: 0.44, dur: 0.18 },
      { freq: 990, start: 0.66, dur: 0.18 },
      { freq: 1500, start: 0.92, dur: 0.42 }
    ];

    pattern.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      const startAt = cycleStart + start;
      const peakAt = startAt + 0.012;
      const endAt = startAt + dur;

      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.85, peakAt);
      gain.gain.linearRampToValueAtTime(0, endAt);

      osc.connect(gain).connect(ctx.destination);
      osc.start(startAt);
      osc.stop(endAt + 0.04);
    });
  }

  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([200, 80, 200, 80, 400]);
    } catch {
      // no-op
    }
  }
}

export async function notifyOrderArrival(title: string, body: string, repeatCount: number = 2) {
  playOrderAlarm(repeatCount);
  await notify(title, body);
}
