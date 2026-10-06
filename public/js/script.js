// Mobile menu toggle
const menuBtn = document.querySelector('.menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

function setMenu(open) {
  mobileMenu.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

menuBtn.addEventListener('click', () => setMenu(mobileMenu.hidden));
mobileMenu.addEventListener('click', (e) => {
  if (e.target.closest('a')) setMenu(false);
});
window.matchMedia('(min-width: 721px)').addEventListener('change', (e) => {
  if (e.matches) setMenu(false);
});

// Until the real images are dropped into /assets, hide broken ones so the gradient placeholder shows
document.querySelectorAll('.project__thumb img, .portrait img').forEach((img) => {
  const hide = () => { img.style.display = 'none'; };
  if (img.complete && img.naturalWidth === 0) hide();
  else img.addEventListener('error', hide);
});

// Keep the headline gradient continuous across the "blur" / "reality" spans
const blurWord = document.querySelector('.blur-word');
const blurRest = document.querySelector('.blur-word__rest');

document.fonts.ready.then(() => {
  const fontSize = parseFloat(getComputedStyle(blurWord).fontSize);
  blurRest.style.setProperty('--o', `${-(blurWord.offsetWidth / fontSize).toFixed(3)}em`);
});

// ---------- Motion ----------
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scroll progress line + nav state
const nav = document.querySelector('.nav');
let ticking = false;

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  nav.style.setProperty('--progress', max > 0 ? window.scrollY / max : 0);
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(onScroll);
  }
}, { passive: true });
onScroll();

// Highlight the nav link of the section in view
const navLinks = [...document.querySelectorAll('.nav__links a')];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });

document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));

// Count a stat up from 0, keeping its suffix ("60+", "6 yrs")
function countUp(el) {
  const match = el.textContent.match(/^(\d+)(.*)$/);
  if (!match) return;
  const target = Number(match[1]);
  const suffix = match[2];
  const duration = 1400;
  const start = performance.now();

  function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (!reduceMotion) {
  // Reveal on scroll, staggered between siblings
  const revealTargets = document.querySelectorAll([
    '.tools__label',
    '.tools__list li',
    '.section-head > *',
    '.card',
    '.project',
    '.portrait',
    '.about__text > *',
    '.contact__panel',
  ].join(','));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      revealObserver.unobserve(el);
      el.classList.add('is-visible');
      el.querySelectorAll('.stat strong').forEach(countUp);

      // Drop the reveal classes afterwards so hover transitions behave normally again
      el.addEventListener('transitionend', function done(e) {
        if (e.target !== el || e.propertyName !== 'opacity') return;
        el.removeEventListener('transitionend', done);
        el.classList.remove('reveal', 'is-visible');
        el.style.removeProperty('--delay');
      });
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  revealTargets.forEach((el) => {
    const index = [...el.parentElement.children].indexOf(el);
    el.style.setProperty('--delay', `${Math.min(index, 6) * 90}ms`);
    el.classList.add('reveal');
    revealObserver.observe(el);
  });

  if (window.matchMedia('(hover: hover)').matches) {
    // Hero parallax
    const hero = document.querySelector('.hero');
    const visual = document.querySelector('.hero-visual');

    const chips = [...visual.querySelectorAll('.chip')];
    const CHIP_REACH = 160; // distance (px) at which a chip is pulled the most
    const CHIP_PULL = 22; // strongest pull (px)

    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      visual.style.setProperty('--px', (((e.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3));
      visual.style.setProperty('--py', (((e.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3));

      // Each chip leans toward the pointer on its own: the closer the pointer, the stronger the pull
      const origin = visual.getBoundingClientRect();
      chips.forEach((chip) => {
        const dx = e.clientX - (origin.left + chip.offsetLeft + chip.offsetWidth / 2);
        const dy = e.clientY - (origin.top + chip.offsetTop + chip.offsetHeight / 2);
        const pull = (CHIP_PULL / CHIP_REACH) * Math.exp(1 - Math.hypot(dx, dy) / CHIP_REACH);
        chip.style.setProperty('--tx', `${(dx * pull).toFixed(1)}px`);
        chip.style.setProperty('--ty', `${(dy * pull).toFixed(1)}px`);
      });
    });
    hero.addEventListener('pointerleave', () => {
      visual.style.setProperty('--px', 0);
      visual.style.setProperty('--py', 0);
      chips.forEach((chip) => {
        chip.style.setProperty('--tx', '0px');
        chip.style.setProperty('--ty', '0px');
      });
    });

    // Card spotlight
    document.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
    });
  }
}
