let audio = null;

export function playWinSound() {
  if (!audio) {
    audio = new Audio("/sounds/winner.mp3"); // public/sounds/win.mp3
    audio.loop = true;
    audio.volume = 0.8;
  }

  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function stopWinSound() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}
