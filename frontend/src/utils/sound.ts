// ✅ Variable global para guardar la única instancia del AudioContext
let audioContextInstance: AudioContext | null = null;

export const playSound = (type: 'success' | 'error') => {
  try {
    // Si no existe la instancia, la creamos una sola vez
    if (!audioContextInstance) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextInstance = new AudioContext();
    }

    const audioContext = audioContextInstance;

    // Reanudar el contexto si el navegador lo tiene suspendido (políticas de autoplay)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'success') {
      // Sonido de Éxito: Tres notas ascendentes (Do-Mi-Sol)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    } else {
      // Sonido de Error: Tono grave y continuo tipo alarma
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(196.0, audioContext.currentTime); // G3
      oscillator.frequency.setValueAtTime(174.61, audioContext.currentTime + 0.2); // F3
    }

    // Control de volumen y desvanecimiento
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.error('Audio playback failed:', e);
  }
};