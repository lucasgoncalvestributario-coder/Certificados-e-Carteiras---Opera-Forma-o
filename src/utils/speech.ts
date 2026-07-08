/**
 * Helper utility for Text-to-Speech (TTS) in Portuguese.
 */
export function speakText(text: string) {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.includes("pt-BR") || v.lang.includes("pt_BR"));
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech Synthesis failed:", e);
    }
  }
}

/**
 * Speaks a success notification when a document/documentation is generated.
 */
export function speakDocumentSuccess() {
  speakText("Documentação emitida com sucesso!");
}
