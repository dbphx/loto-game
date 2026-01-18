export function speak(text) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);

  u.lang = "vi-VN";
  u.rate = 1.25;   // tốc độ đọc
  u.pitch = 1;
  u.volume = 1;

  const voices = window.speechSynthesis.getVoices();

  const viVoice =
    voices.find((v) => v.lang === "vi-VN") ||
    voices.find((v) => v.lang.startsWith("vi"));

  if (viVoice) {
    u.voice = viVoice;
  }

  window.speechSynthesis.speak(u);
}
