// ─── SMART TTS ENGINE ──────────────────────────────────────────────────────
// Returns a Promise<void> that resolves ONLY when speech finishes or is stopped.
// This ensures isPlaying state in the UI stays correct.

let isSpeaking = false;
let resolveCurrentSpeech: (() => void) | null = null;

// Detect if text is predominantly Hindi/Urdu
function detectLanguage(text: string): 'hi' | 'en' {
  const hindiUnicodePattern = /[\u0900-\u097F\u0600-\u06FF]/;
  const romanUrduWords = /\b(hai|hain|kya|nahi|acha|theek|dost|yaar|bhai|kaisi|ho|mujhe|tumhe|woh|ab|phir|bhi|toh|aur|lekin|matlab|bilkul|shukriya|arre)\b/i;
  if (hindiUnicodePattern.test(text)) return 'hi';
  if (romanUrduWords.test(text)) return 'hi';
  return 'en';
}

// Get best voice for language
function selectVoice(lang: 'hi' | 'en'): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // User's saved preference takes priority
  const savedUri = localStorage.getItem('nl_ai_voice');
  if (savedUri) {
    const saved = voices.find(v => v.voiceURI === savedUri);
    if (saved) return saved;
  }

  if (lang === 'hi') {
    return (
      voices.find(v => v.lang === 'hi-IN' && v.name.includes('Google')) ||
      voices.find(v => v.lang === 'hi-IN') ||
      voices.find(v => v.lang.startsWith('hi')) ||
      voices.find(v => v.lang === 'ur-PK') ||
      null
    );
  }
  return (
    voices.find(v => v.name.includes('Google UK English Female')) ||
    voices.find(v => v.name.includes('Samantha')) ||
    voices.find(v => v.name.includes('Zira')) ||
    voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
    voices.find(v => v.lang === 'en-IN') ||
    voices.find(v => v.lang.startsWith('en')) ||
    null
  );
}

// Split text into sentences, deduplicated
function splitIntoSentences(text: string): string[] {
  const clean = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[*_#~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const parts = clean.match(/[^.!?।]+[.!?।]+/g) || [clean];
  const seen = new Set<string>();
  return parts.filter(p => {
    const n = p.trim().toLowerCase();
    if (!n || seen.has(n)) return false;
    seen.add(n);
    return true;
  });
}

export function stopSpeech(): void {
  isSpeaking = false;
  window.speechSynthesis.cancel();
  // Resolve the pending promise so .finally() fires in the UI
  if (resolveCurrentSpeech) {
    resolveCurrentSpeech();
    resolveCurrentSpeech = null;
  }
}

export function generateHumanSpeech(text: string): Promise<void> {
  return new Promise<void>((resolve) => {
    if (!text || !('speechSynthesis' in window)) { resolve(); return; }

    // Cancel any previous speech first and resolve its promise
    stopSpeech();

    isSpeaking = true;
    resolveCurrentSpeech = resolve;

    const lang = detectLanguage(text);
    const sentences = splitIntoSentences(text);
    let index = 0;

    const speakNext = () => {
      // Stop condition — either all done or cancelled
      if (!isSpeaking || index >= sentences.length) {
        isSpeaking = false;
        resolveCurrentSpeech = null;
        resolve();
        return;
      }

      const sentence = sentences[index].trim();
      index++;

      if (!sentence) { speakNext(); return; }

      const utterance = new SpeechSynthesisUtterance(sentence);
      const voice = selectVoice(lang);
      if (voice) utterance.voice = voice;

      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = lang === 'hi' ? 0.95 : 1.0;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      utterance.onend = () => {
        // Only continue if still supposed to be speaking
        if (isSpeaking) speakNext();
        else {
          resolveCurrentSpeech = null;
          resolve();
        }
      };

      utterance.onerror = (e) => {
        // 'interrupted' means we called cancel() — don't restart
        if (e.error === 'interrupted' || e.error === 'canceled') {
          resolveCurrentSpeech = null;
          resolve();
          return;
        }
        // For other errors, skip to next sentence
        if (isSpeaking) speakNext();
        else resolve();
      };

      window.speechSynthesis.speak(utterance);
    };

    // Voices might not be loaded yet on first call
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => speakNext();
    } else {
      speakNext();
    }
  });
}
