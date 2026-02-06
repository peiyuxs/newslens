/**
 * Audio/Text-to-speech helper functions
 */

export const speak = (text) => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    // Stop previous playback first
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }
};
