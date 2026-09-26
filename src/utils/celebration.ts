/**
 * Custom image-based celebration animation.
 * Spawns floating/falling copies of an image based on round accuracy.
 *
 * Images expected in /public/:
 *   - /0progress.png   (sad emoji, for < 50% accuracy)
 *   - /50progress.png  (serious emoji, for 50-99% accuracy)
 *   - /100progress.png (happy emoji, for 100% accuracy)
 *
 * All images should be 120×120 px.
 */

export function playCelebration(accuracy: number): void {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  let imageName: string;
  let fallbackEmoji: string;

  if (accuracy === 100) {
    imageName = '100progress';
    fallbackEmoji = '😊';
  } else if (accuracy >= 50) {
    imageName = '50progress';
    fallbackEmoji = '😐';
  } else {
    imageName = '0progress';
    fallbackEmoji = '😢';
  }

  const imageSrc = `${base}/${imageName}.png`;

  // Number of particles based on performance
  const count = accuracy === 100 ? 15 : accuracy >= 50 ? 10 : 6;

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(overlay);

  for (let i = 0; i < count; i++) {
    const size = 38 + Math.random() * 26; // 38-64px display size
    const left = 6 + Math.random() * 88; // 6-94% horizontal position
    const duration = 2.4 + Math.random() * 1.5; // 2.4-3.9s fall duration
    const delay = Math.random() * 0.45; // 0-0.45s stagger
    const drift = -50 + Math.random() * 100; // horizontal drift in px
    const rotation = -180 + Math.random() * 360; // rotation degrees

    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = imageName;
    img.draggable = false;

    // Graceful fallback if user removes or renames image
    img.onerror = () => {
      img.style.display = 'none';
      const fallbackSpan = document.createElement('span');
      fallbackSpan.textContent = fallbackEmoji;
      fallbackSpan.style.cssText = `
        position: absolute;
        font-size: ${size}px;
        top: -80px;
        left: ${left}%;
        opacity: 0;
        pointer-events: none;
        user-select: none;
        --drift: ${drift}px;
        --rotation: ${rotation}deg;
        animation: celebFall ${duration}s ease-in ${delay}s forwards;
      `;
      overlay.appendChild(fallbackSpan);
    };

    img.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      top: -80px;
      left: ${left}%;
      opacity: 0;
      pointer-events: none;
      user-select: none;
      object-fit: contain;
      --drift: ${drift}px;
      --rotation: ${rotation}deg;
      animation: celebFall ${duration}s ease-in ${delay}s forwards;
    `;

    overlay.appendChild(img);
  }

  // Clean up after all animations finish
  const maxDuration = 4500;
  setTimeout(() => {
    overlay.remove();
  }, maxDuration);
}
