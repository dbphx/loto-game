// src/utils/speak.js
export function speak(text) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = "vi-VN";
  u.rate = 1,25;
  u.pitch = 1;
  u.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const vi = voices.find((v) => v.lang === "vi-VN");
  if (vi) u.voice = vi;

  window.speechSynthesis.speak(u);
}
