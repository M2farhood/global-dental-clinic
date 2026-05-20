/* ───────────────────────────────────────────────
   Global Specialty Clinics — interactions
   Quiet motion. Heavy lifting in CSS.
   ─────────────────────────────────────────────── */

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Hero stagger on load ─────────────────────────────── */
window.addEventListener('load', () => {
  document.querySelectorAll('.hero [data-anim]').forEach(el => el.classList.add('in'));
});

/* ── Scroll reveal ─────────────────────────────────────── */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

document.querySelectorAll('[data-anim]').forEach(el => {
  if (el.closest('.hero')) return;
  io.observe(el);
});

/* ── Gallery stagger — set per-item delay ─────────────── */
document.querySelectorAll('.gallery [data-anim]').forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i * 90, 540)}ms`;
});

/* ── Stat strip count-up ──────────────────────────────── */
function animateCount(node) {
  const target = parseFloat(node.dataset.count);
  const decimals = parseInt(node.dataset.decimals || '0', 10);
  const suffix = node.dataset.suffix || '';
  const duration = 1600;
  const start = performance.now();
  const fromZero = 0;

  if (reduceMotion) {
    node.textContent = target.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
    return;
  }

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    // easeOutExpo
    const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    const v = fromZero + (target - fromZero) * eased;
    const text = decimals
      ? v.toFixed(decimals)
      : Math.floor(v).toLocaleString('en-US');
    node.textContent = text + suffix;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const statsIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const item = e.target;
    item.querySelectorAll('[data-count]').forEach(animateCount);
    statsIO.unobserve(item);
  });
}, { threshold: 0.4 });

document.querySelectorAll('.stats__item').forEach(el => statsIO.observe(el));

/* ── Departments: list ↔ diagram cross-highlight ─────── */
const list = document.getElementById('depts-list');
const svg = document.getElementById('depts-svg');

if (list && svg) {
  const nodes = svg.querySelectorAll('.depts__node');
  const items = list.querySelectorAll('li');

  function setActive(name, on) {
    nodes.forEach(n => {
      if (n.dataset.node === name) n.classList.toggle('is-active', on);
    });
    items.forEach(li => {
      if (li.dataset.node === name) li.classList.toggle('is-active', on);
    });
  }

  items.forEach(li => {
    const name = li.dataset.node;
    li.addEventListener('mouseenter', () => setActive(name, true));
    li.addEventListener('mouseleave', () => setActive(name, false));
    li.addEventListener('focus', () => setActive(name, true));
    li.addEventListener('blur', () => setActive(name, false));
    li.tabIndex = 0;
  });
  nodes.forEach(n => {
    const name = n.dataset.node;
    n.style.cursor = 'pointer';
    n.addEventListener('mouseenter', () => setActive(name, true));
    n.addEventListener('mouseleave', () => setActive(name, false));
  });
}

/* ── Subtle parallax on hero ──────────────────────────── */
const heroPhoto = document.querySelector('.hero__photo img');
if (heroPhoto && !reduceMotion) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const y = Math.min(window.scrollY, 600);
      heroPhoto.style.transform = `translateY(${y * 0.06}px) scale(1.04)`;
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
}
