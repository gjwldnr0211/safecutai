// Simple synth for UI sound effects to reduce cognitive load by providing auditory feedback
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const playSound = (type: 'click' | 'success' | 'hover') => {
  const ctx = getAudioContext();
  
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  const now = ctx.currentTime;

  if (type === 'click') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  } else if (type === 'success') {
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(300, now);
    oscillator.frequency.setValueAtTime(500, now + 0.1);
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  } else if (type === 'hover') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, now);
    gainNode.gain.setValueAtTime(0.02, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }
};