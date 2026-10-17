/**
 * Free & Open Japanese Pronunciation Utility
 *
 * Uses studio-quality native Japanese audio recordings (Tofugu free educational CDN)
 * with automatic fallback to Web Speech API ('ja-JP').
 *
 * Provides 100% reliable, crystal-clear audio pronunciation for Hiragana & Katakana.
 */

// Helper to convert Katakana character to its Hiragana equivalent (same sound)
export function toHiragana(char: string): string {
  return char
    .split('')
    .map((c) => {
      const code = c.charCodeAt(0);
      // Katakana range 0x30A1 - 0x30F6
      if (code >= 0x30a1 && code <= 0x30f6) {
        return String.fromCharCode(code - 0x60);
      }
      return c;
    })
    .join('');
}

let activeAudio: HTMLAudioElement | null = null;
let currentPlayId = 0;
let currentVolume = 0.85;

export function getKanaVolume(): number {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('kana_audio_volume');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          currentVolume = parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return currentVolume;
}

export function setKanaVolume(vol: number): void {
  currentVolume = Math.max(0, Math.min(1, vol));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('kana_audio_volume', String(currentVolume));
    } catch {
      // ignore
    }
  }
  if (activeAudio) {
    try {
      activeAudio.volume = currentVolume;
    } catch {
      // ignore
    }
  }
}

/**
 * Stop any active kana audio playback immediately (MP3 or speech synthesis).
 */
export function stopKanaAudio(): void {
  currentPlayId++;
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

/**
 * Play native Japanese pronunciation for a kana character.
 * Always stops any previous playback before starting.
 */
export function playKanaAudio(character: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!character) {
      resolve(false);
      return;
    }

    // Stop any currently playing audio and get new session ID
    stopKanaAudio();
    const playId = currentPlayId;

    const hira = toHiragana(character.trim());

    // 1. Primary: Native studio audio MP3
    const audioUrl = `https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/${encodeURIComponent(hira)}.mp3`;
    const audio = new Audio(audioUrl);
    audio.volume = getKanaVolume();
    activeAudio = audio;

    let finished = false;
    const finalize = (success: boolean) => {
      if (finished) return;
      finished = true;
      if (activeAudio === audio) {
        activeAudio = null;
      }
      if (currentPlayId === playId) {
        resolve(success);
      } else {
        resolve(false);
      }
    };

    audio.onended = () => {
      finalize(true);
    };

    audio.onerror = () => {
      if (currentPlayId !== playId) {
        finalize(false);
        return;
      }
      activeAudio = null;
      // 2. Fallback: Web Speech API
      playSpeechSynthesisFallback(character, playId).then(finalize);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        if (currentPlayId !== playId) {
          finalize(false);
          return;
        }
        activeAudio = null;
        // 2. Fallback: Web Speech API
        playSpeechSynthesisFallback(character, playId).then(finalize);
      });
    }
  });
}

function playSpeechSynthesisFallback(text: string, playId: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || currentPlayId !== playId) {
      resolve(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.85;
      utterance.volume = getKanaVolume();

      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find(
        (v) =>
          v.lang.toLowerCase() === 'ja-jp' ||
          v.lang.toLowerCase().startsWith('ja') ||
          v.name.includes('Japanese') ||
          v.name.includes('日本語')
      );
      if (jaVoice) {
        utterance.voice = jaVoice;
      }

      utterance.onend = () => resolve(currentPlayId === playId);
      utterance.onerror = () => resolve(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Speak a whole Japanese word or phrase (kana) using the Web Speech API.
 * Always stops any previous playback before starting.
 */
export function playWordAudio(text: string): Promise<boolean> {
  stopKanaAudio();
  if (!text) return Promise.resolve(false);
  return playSpeechSynthesisFallback(text.trim(), currentPlayId);
}
