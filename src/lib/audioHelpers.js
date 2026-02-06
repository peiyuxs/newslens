/**
 * Audio/Text-to-speech helper functions
 */

export const speak = (text, lang = 'en-US') => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    // Stop previous playback first
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  }
};
