/* ───────────────────────────────────────────────
   Global Specialty Clinics — interactions
   Quiet motion. Heavy lifting in CSS.
   ─────────────────────────────────────────────── */

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Hero stagger on load ─────────────────────────────── */
window.addEventListener('load', () => {
  document.querySelectorAll('.hero [data-anim]').forEach(el => el.classList.add('in'));
});

/* ── Compare-slider entrance hint ─────────────────────── */
function runCompareHint(compare) {
  if (compare._hintDone || compare._touched || reduceMotion) return;
  compare._hintDone = true;
  // Slide left → right → center; CSS transitions on clip-path/left do the smoothing
  setTimeout(() => compare.style.setProperty('--x', '22%'), 700);
  setTimeout(() => compare.style.setProperty('--x', '78%'), 1800);
  setTimeout(() => compare.style.setProperty('--x', '50%'), 2900);
}

/* ── Scroll reveal ─────────────────────────────────────── */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
      // Fire compare hint when a case card enters the viewport
      const compare = e.target.querySelector?.('.compare');
      if (compare) runCompareHint(compare);
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

/* ── Departments: list ↔ feature panel ─────────────────── */
const list = document.getElementById('depts-list');
const panel = document.querySelector('.depts__panel');

const deptData = {
  fillings:  { num: '٠١', name: 'قسم الحشوات',  en: 'Fillings',     desc: 'بأنواعها — تجميلية بتقنية البايوميمتك',       doctor: 'د. محمد باقر' },
  surgery:   { num: '٠٢', name: 'قسم الجراحة',  en: 'Surgery',      desc: 'زراعة الأسنان',                                doctor: 'فريق كلوبل'   },
  ortho:     { num: '٠٣', name: 'قسم التقويم',   en: 'Orthodontics', desc: 'معدني · شفّاف · ثابت · متحرّك · للأطفال',     doctor: 'د. دينا حامد'  },
  prosth:    { num: '٠٤', name: 'قسم التعويض',  en: 'Prosthetics',  desc: 'تغليفات ثابتة · أطقم ثابتة ومتحرّكة · جزئية', doctor: 'د. جعفر رحيم' },
  pediatric: { num: '٠٥', name: 'قسم الأطفال',  en: 'Pediatric',    desc: 'غرفة الحلزون — غرفة الأطفال المخصّصة',         doctor: 'د. محمد باقر' },
};

if (list && panel) {
  const items  = list.querySelectorAll('li');
  const body   = panel.querySelector('.depts__panel-body');
  const ghost  = panel.querySelector('.depts__panel-ghost');
  const enTag  = panel.querySelector('.depts__panel-en-tag');
  const nameEl = panel.querySelector('.depts__panel-name');
  const descEl = panel.querySelector('.depts__panel-desc');
  const docEl  = panel.querySelector('.depts__panel-doctor');
  let tid;

  function fill(data) {
    [body, ghost, enTag].forEach(el => el.classList.add('is-fading'));
    clearTimeout(tid);
    tid = setTimeout(() => {
      ghost.textContent = data.num;
      enTag.textContent = data.en;
      nameEl.textContent = data.name;
      descEl.textContent = data.desc;
      docEl.textContent  = data.doctor;
      [body, ghost, enTag].forEach(el => el.classList.remove('is-fading'));
    }, 200);
  }

  function setActive(name, on) {
    items.forEach(li => li.classList.toggle('is-active', on && li.dataset.node === name));
    fill(on && deptData[name] ? deptData[name] : deptData.fillings);
  }

  items.forEach(li => {
    const name = li.dataset.node;
    li.addEventListener('mouseenter', () => setActive(name, true));
    li.addEventListener('mouseleave', () => setActive(name, false));
    li.addEventListener('focus',      () => setActive(name, true));
    li.addEventListener('blur',       () => setActive(name, false));
    li.tabIndex = 0;
  });
}

/* ── Before/After compare slider ──────────────────────── */
document.querySelectorAll('.compare').forEach((compare) => {
  let pid = null;
  let rafId = 0;
  let pendingX = 50;

  function applyX() {
    compare.style.setProperty('--x', pendingX + '%');
    compare.setAttribute('aria-valuenow', Math.round(pendingX));
    rafId = 0;
  }

  function setFromPointer(clientX) {
    const rect = compare.getBoundingClientRect();
    // RTL-aware: right edge = "before" (0%), left edge = "after" (100%)
    // BUT clip-path inset(0 0 0 var(--x)) clips from left, so we want:
    //   x=0%   → before fully shown (right side stays, top covers all but left strip)
    //   x=100% → after fully shown
    // The handle's `left: var(--x)` works left-to-right in CSS regardless of dir.
    // We want pulling LEFT (toward "after") to reveal more after — natural in RTL.
    const px = Math.min(rect.right, Math.max(rect.left, clientX));
    pendingX = ((px - rect.left) / rect.width) * 100;
    if (!rafId) rafId = requestAnimationFrame(applyX);
  }

  compare.addEventListener('pointerdown', (e) => {
    compare._touched = true;
    pid = e.pointerId;
    compare.setPointerCapture(pid);
    compare.classList.add('is-grabbing');
    setFromPointer(e.clientX);
    e.preventDefault();
  });
  compare.addEventListener('pointermove', (e) => {
    if (pid === null) return;
    setFromPointer(e.clientX);
  });
  const release = (e) => {
    if (pid === null) return;
    try { compare.releasePointerCapture(pid); } catch {}
    pid = null;
    compare.classList.remove('is-grabbing');
  };
  compare.addEventListener('pointerup', release);
  compare.addEventListener('pointercancel', release);

  // Keyboard control
  compare.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 10 : 4;
    if (e.key === 'ArrowLeft')  { pendingX = Math.min(100, pendingX + step); applyX(); e.preventDefault(); }
    if (e.key === 'ArrowRight') { pendingX = Math.max(0,   pendingX - step); applyX(); e.preventDefault(); }
    if (e.key === 'Home') { pendingX = 0;   applyX(); e.preventDefault(); }
    if (e.key === 'End')  { pendingX = 100; applyX(); e.preventDefault(); }
  });

  // Initial state
  compare.style.setProperty('--x', '50%');
});

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
