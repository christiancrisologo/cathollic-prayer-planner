
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  },
  set: (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

let currentUtterance: SpeechSynthesisUtterance | null = null;

export const speech = {
  speak: (text: string, onStart: () => void, onEnd: () => void) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) || voices[0];
    
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.85;
    utterance.pitch = 1;
    
    utterance.onstart = onStart;
    utterance.onend = onEnd;
    utterance.onerror = () => onEnd();

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  },
  stop: () => {
    window.speechSynthesis.cancel();
  }
};
