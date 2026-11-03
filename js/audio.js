/**
 * audio.js
 * Sintetizador retro de 8 bits usando Web Audio API nativo.
 * No requiere archivos externos (.mp3 / .wav) y evita problemas de CORS.
 */

window.AudioEngine = (function () {
  let ctx = null;
  let muted = false;
  let bgmInterval = null;

  function getContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  function playTone(freq, type, duration, vol = 0.08, delay = 0, slideTo = null) {
    if (muted) return;
    const c = getContext();
    if (!c) return;

    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  return {
    isMuted: function () {
      return muted;
    },

    toggleMute: function () {
      muted = !muted;
      if (!muted) {
        this.playSelect();
      }
      return muted;
    },

    // Bip de texto estilo EarthBound
    playTextBlip: function (speaker) {
      if (muted) return;
      let baseFreq = 340;
      if (speaker === 'jtp') baseFreq = 240;
      else if (speaker === 'ayudante') baseFreq = 410;
      else if (speaker === 'alerta') baseFreq = 520;

      const jitter = (Math.random() - 0.5) * 45;
      playTone(baseFreq + jitter, 'square', 0.032, 0.035);
    },

    // Sonido al elegir opción o botón RPG
    playSelect: function () {
      playTone(440, 'square', 0.06, 0.07, 0);
      playTone(660, 'square', 0.09, 0.07, 0.05);
    },

    // Sonido de rotación de la perilla del polarímetro
    playDialTick: function (fine = true) {
      const freq = fine ? 720 : 480;
      playTone(freq, 'triangle', 0.025, 0.06, 0);
    },

    // Sonido de error o advertencia del JTP
    playError: function () {
      playTone(190, 'sawtooth', 0.14, 0.09, 0, 130);
      playTone(145, 'sawtooth', 0.22, 0.09, 0.14, 95);
    },

    // Sonido de burbuja / alerta de combate EarthBound
    playBubbleAlert: function () {
      playTone(300, 'sawtooth', 0.09, 0.09, 0, 620);
      playTone(320, 'sawtooth', 0.09, 0.09, 0.10, 680);
      playTone(680, 'square', 0.22, 0.09, 0.20, 260);
    },

    // Sonido de líquido vertiéndose (durante el cronómetro de mezcla)
    playPourTick: function (progress) {
      const freq = 220 + Math.min(progress * 60, 400);
      playTone(freq, 'sine', 0.05, 0.05, 0);
    },

    // Sonido de servo / medición automática rápida
    playMeasureServo: function (isZeroCross = false) {
      if (isZeroCross) {
        // Alerta histórica de cruce por cero
        playTone(523.25, 'square', 0.10, 0.09, 0);
        playTone(659.25, 'square', 0.10, 0.09, 0.10);
        playTone(783.99, 'square', 0.12, 0.09, 0.20);
        playTone(1046.5, 'square', 0.30, 0.10, 0.32);
      } else {
        playTone(380, 'triangle', 0.05, 0.06, 0);
        playTone(540, 'square', 0.07, 0.06, 0.05);
      }
    },

    // Fanfarria retro de victoria (Calibración de alfa_0 o fin del TP)
    playFanfare: function () {
      const notes = [
        { f: 523.25, d: 0.11, t: 0.00 }, // C5
        { f: 523.25, d: 0.11, t: 0.12 }, // C5
        { f: 523.25, d: 0.11, t: 0.24 }, // C5
        { f: 523.25, d: 0.26, t: 0.36 }, // C5
        { f: 415.30, d: 0.24, t: 0.64 }, // G#4
        { f: 466.16, d: 0.24, t: 0.90 }, // A#4
        { f: 523.25, d: 0.16, t: 1.16 }, // C5
        { f: 466.16, d: 0.10, t: 1.36 }, // A#4
        { f: 523.25, d: 0.50, t: 1.48 }  // C5
      ];
      notes.forEach(n => playTone(n.f, 'square', n.d, 0.08, n.t));
    }
  };
})();
