/**
 * Zero-dependency, lightweight high-performance Canvas Confetti celebration engine.
 * Spawns colorful sparkling physics particles and ribbons at 60fps.
 */
export function triggerConfetti(options?: {
  particleCount?: number;
  origin?: { x: number; y: number };
  spread?: number;
  colors?: string[];
}) {
  if (typeof window === 'undefined') return;

  const count = options?.particleCount ?? 80;
  const originX = options?.origin?.x ?? window.innerWidth / 2;
  const originY = options?.origin?.y ?? window.innerHeight / 2;
  const spread = options?.spread ?? 70;
  const colors = options?.colors ?? [
    '#3F72AF',
    '#60A5FA',
    '#38BDF8',
    '#34D399',
    '#FBBF24',
    '#F472B6',
    '#A78BFA',
  ];

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
    shape: 'rect' | 'circle';
  }

  const particles: Particle[] = [];
  const radSpread = (spread * Math.PI) / 180;

  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * radSpread;
    const velocity = 8 + Math.random() * 14;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * velocity + (Math.random() - 0.5) * 4,
      vy: Math.sin(angle) * velocity - 3,
      size: 5 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
    });
  }

  let animationFrameId: number;
  const gravity = 0.35;
  const friction = 0.985;

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let activeParticles = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.opacity <= 0.02) continue;

      activeParticles++;
      p.vx *= friction;
      p.vy *= friction;
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.012;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (activeParticles > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }
  }

  render();
}
