export function mountFireworks({ canvas, form, input, intro, experience, messageLayer }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileLayout = window.matchMedia('(max-width: 600px)');

  let width = 0;
  let height = 0;
  let dpr = 1;
  let lastFrame = 0;
  let nextAmbient = 0;
  let introTimer;
  let leaveTimer;
  let frameId;
  let viewportFrameId;
  let revealFrameId;
  let disposed = false;
  let activeMessage;
  let mobileHeight = 0;
  let mobileWidth = 0;
  let viewportUpdateQueued = false;
  let stars = [];
  let rockets = [];
  let particles = [];
  let rings = [];

  const palettes = [
    ['#ff8ec6', '#ffd2a9', '#fff4dd', '#c9a5ff'],
    ['#a8a7ff', '#e7b7ff', '#fff1e2', '#ff9eb6'],
    ['#ffb07c', '#ff77b1', '#ffecbc', '#d7a4ff'],
    ['#8edcf8', '#bda6ff', '#fff3f7', '#fba9da'],
  ];

  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (array) => array[Math.floor(Math.random() * array.length)];

  function resize() {
    const nextWidth = experience.clientWidth;
    const nextHeight = experience.clientHeight;
    if (nextWidth === width && nextHeight === height) return;
    width = nextWidth;
    height = nextHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.min(125, Math.floor(width * height / 8000)) }, () => ({
      x: rand(0, width), y: rand(0, height * .84), size: Math.random() < .14 ? 2 : 1,
      alpha: rand(.16, .7), phase: rand(0, Math.PI * 2), speed: rand(.0005, .0022),
    }));
  }

  function syncViewport() {
    if (!mobileLayout.matches) {
      mobileHeight = 0;
      mobileWidth = 0;
      experience.style.removeProperty('--mobile-height');
      experience.style.removeProperty('--visual-top');
      experience.style.removeProperty('--visible-height-loss');
      experience.classList.remove('is-keyboard-open');
      resize();
      return;
    }

    const visualViewport = window.visualViewport;
    const currentWidth = window.innerWidth;
    const currentHeight = Math.max(window.innerHeight, document.documentElement.clientHeight);
    if (!mobileWidth || Math.abs(currentWidth - mobileWidth) > 80) {
      mobileWidth = currentWidth;
      mobileHeight = currentHeight;
    } else {
      mobileHeight = Math.max(mobileHeight, currentHeight);
    }

    const visibleHeight = visualViewport ? visualViewport.height : window.innerHeight;
    const visibleTop = visualViewport ? visualViewport.offsetTop : 0;
    const heightLoss = Math.max(0, mobileHeight - visibleHeight);
    const keyboardOpen = document.activeElement === input && heightLoss > 120;
    experience.style.setProperty('--mobile-height', `${mobileHeight}px`);
    experience.style.setProperty('--visual-top', `${visibleTop}px`);
    experience.style.setProperty('--visible-height-loss', `${heightLoss}px`);
    experience.classList.toggle('is-keyboard-open', keyboardOpen);
    resize();
  }

  function queueViewportSync() {
    if (viewportUpdateQueued) return;
    viewportUpdateQueued = true;
    viewportFrameId = requestAnimationFrame(() => {
      viewportUpdateQueued = false;
      if (disposed) return;
      syncViewport();
    });
  }

  function square(x, y, size, color, alpha = 1, glow = 0) {
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
    ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  function createRocket({ ambient = false, x, targetX, targetY, message } = {}) {
    const palette = pick(palettes);
    const quietMobileSky = ambient && width <= 600;
    const launchX = x ?? rand(width * .23, width * .77);
    const destX = targetX ?? (quietMobileSky
      ? width * (Math.random() < .5 ? rand(.12, .25) : rand(.75, .88))
      : ambient ? rand(width * .12, width * .88) : width * .5);
    const destY = targetY ?? (quietMobileSky
      ? rand(height * .1, height * .18)
      : ambient ? rand(height * .19, height * .58) : height * .38);
    rockets.push({
      x: launchX, y: height + 12, startX: launchX, startY: height + 12,
      targetX: destX, targetY: destY, progress: 0,
      duration: ambient ? rand(950, 1350) : 1150,
      palette, ambient, message, trailClock: 0,
    });
  }

  function burst(x, y, palette, ambient, message) {
    const quietMobileSky = ambient && width <= 600;
    const count = quietMobileSky ? 36 : ambient ? 72 : 165;
    const radius = quietMobileSky ? rand(45, 68) : ambient ? rand(70, 115) : Math.min(220, Math.max(130, width * .2));
    rings.push({ x, y, radius: 3, maxRadius: radius * .82, alpha: .48, color: palette[0] });
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rand(-.07, .07);
      const speed = rand(.045, .11) * radius;
      const life = rand(950, 1750);
      particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        age: 0, life, color: pick(palette), size: Math.random() < .2 ? 4 : Math.random() < .55 ? 3 : 2,
        drag: rand(.956, .971), gravity: rand(.012, .026), flicker: rand(0, 6),
      });
    }
    if (message) revealMessage(message);
  }

  function revealMessage(text) {
    if (activeMessage) activeMessage.remove();
    window.clearTimeout(leaveTimer);
    const element = document.createElement('div');
    element.className = 'sky-message';
    element.textContent = text;
    messageLayer.appendChild(element);
    activeMessage = element;
    revealFrameId = requestAnimationFrame(() => element.classList.add('is-visible'));
    window.clearTimeout(introTimer);
    introTimer = window.setTimeout(() => {
      element.classList.add('is-leaving');
      leaveTimer = window.setTimeout(() => {
        if (activeMessage === element) {
          element.remove();
          activeMessage = null;
          intro.classList.remove('is-hidden');
        }
      }, 850);
    }, 6500);
  }

  function launchMessage(text) {
    intro.classList.add('is-hidden');
    rockets = rockets.filter((rocket) => rocket.ambient);
    if (activeMessage) {
      activeMessage.remove();
      activeMessage = null;
    }
    window.clearTimeout(introTimer);
    window.clearTimeout(leaveTimer);
    if (reduceMotion.matches) {
      revealMessage(text);
      return;
    }
    createRocket({ message: text, x: width * .5, targetX: width * .5, targetY: height * .38 });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    launchMessage(text);
    if (mobileLayout.matches) input.blur();
    else input.focus({ preventScroll: true });
  }

  function frame(now) {
    const dt = Math.min(34, now - (lastFrame || now));
    lastFrame = now;
    ctx.clearRect(0, 0, width, height);

    for (const star of stars) {
      const shimmer = reduceMotion.matches ? 1 : .75 + Math.sin(now * star.speed + star.phase) * .25;
      square(star.x, star.y, star.size, '#d9ceff', star.alpha * shimmer, star.size > 1 ? 6 : 0);
    }

    if (!reduceMotion.matches && now > nextAmbient && !rockets.some((r) => !r.ambient)) {
      const volleySize = 1 + Math.floor(Math.random() * 4);
      for (let i = 0; i < volleySize; i++) createRocket({ ambient: true });
      nextAmbient = now + rand(3800, 6000);
    }

    rockets = rockets.filter((rocket) => {
      rocket.progress += dt / rocket.duration;
      const t = Math.min(1, rocket.progress);
      const eased = 1 - Math.pow(1 - t, 2.6);
      rocket.x = rocket.startX + (rocket.targetX - rocket.startX) * eased + Math.sin(t * 8) * 3 * (1 - t);
      rocket.y = rocket.startY + (rocket.targetY - rocket.startY) * eased;
      rocket.trailClock += dt;
      while (rocket.trailClock > 12) {
        rocket.trailClock -= 12;
        particles.push({
          x: rocket.x + rand(-2, 2), y: rocket.y + rand(3, 10),
          vx: rand(-.6, .6), vy: rand(.4, 1.8), age: 0, life: rand(260, 550),
          color: pick(rocket.palette), size: Math.random() < .3 ? 3 : 2,
          drag: .93, gravity: .02, flicker: rand(0, 6), trail: true,
        });
      }
      square(rocket.x, rocket.y, rocket.ambient ? 4 : 6, '#fff8e8', 1, 22);
      square(rocket.x, rocket.y, rocket.ambient ? 2 : 3, '#ffffff', 1, 0);
      if (t >= 1) {
        burst(rocket.x, rocket.y, rocket.palette, rocket.ambient, rocket.message);
        return false;
      }
      return true;
    });

    rings = rings.filter((ring) => {
      ring.radius += dt * .15;
      ring.alpha *= Math.pow(.954, dt / 16);
      if (ring.radius >= ring.maxRadius || ring.alpha < .01) return false;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = ring.alpha;
      ctx.shadowColor = ring.color;
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      return true;
    });

    particles = particles.filter((p) => {
      p.age += dt;
      if (p.age >= p.life) return false;
      const step = dt / 16;
      p.x += p.vx * step;
      p.y += p.vy * step;
      p.vx *= Math.pow(p.drag, step);
      p.vy = p.vy * Math.pow(p.drag, step) + p.gravity * step;
      const fade = 1 - p.age / p.life;
      const twinkle = .72 + Math.sin(p.age * .035 + p.flicker) * .28;
      square(p.x, p.y, p.size, p.color, fade * twinkle, p.trail ? 7 : 12);
      return true;
    });

    frameId = requestAnimationFrame(frame);
  }

  form.addEventListener('submit', handleSubmit);
  window.addEventListener('resize', queueViewportSync, { passive: true });
  window.visualViewport?.addEventListener('resize', queueViewportSync, { passive: true });
  window.visualViewport?.addEventListener('scroll', queueViewportSync, { passive: true });
  input.addEventListener('focus', queueViewportSync);
  input.addEventListener('blur', queueViewportSync);
  syncViewport();
  nextAmbient = performance.now() + 1250;
  frameId = requestAnimationFrame(frame);

  return () => {
    disposed = true;
    form.removeEventListener('submit', handleSubmit);
    window.removeEventListener('resize', queueViewportSync);
    window.visualViewport?.removeEventListener('resize', queueViewportSync);
    window.visualViewport?.removeEventListener('scroll', queueViewportSync);
    input.removeEventListener('focus', queueViewportSync);
    input.removeEventListener('blur', queueViewportSync);
    cancelAnimationFrame(frameId);
    cancelAnimationFrame(viewportFrameId);
    cancelAnimationFrame(revealFrameId);
    window.clearTimeout(introTimer);
    window.clearTimeout(leaveTimer);
    activeMessage?.remove();
    intro.classList.remove('is-hidden');
    experience.classList.remove('is-keyboard-open');
    experience.style.removeProperty('--mobile-height');
    experience.style.removeProperty('--visual-top');
    experience.style.removeProperty('--visible-height-loss');
  };
}
