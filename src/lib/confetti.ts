// Dependency-free confetti burst using the Web Animations API. Respects
// reduced-motion. Used to celebrate task completion.
export function fireConfetti(originX?: number, originY?: number): void {
  if (typeof document === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const x = originX ?? window.innerWidth / 2;
  const y = originY ?? window.innerHeight / 3;
  const colors = ['#161513', '#b05c43', '#8a8377', '#ddd9d1', '#ff8a4d'];
  const count = 38;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const size = 6 + Math.random() * 7;
    p.style.cssText =
      `position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;` +
      `background:${colors[i % colors.length]};border-radius:${Math.random() > 0.5 ? '50%' : '2px'};` +
      `pointer-events:none;z-index:9999;will-change:transform,opacity;`;
    document.body.appendChild(p);

    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 170;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - (50 + Math.random() * 90);
    const rot = Math.random() * 720 - 360;

    const anim = p.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy + 240}px) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(0.2,0.6,0.3,1)' },
    );
    anim.onfinish = () => p.remove();
  }
}
