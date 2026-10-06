// Projects page: loads assets/projects/index.json, renders the grid, filters and detail modal.
// Self-contained on purpose: the home page's script.js is not loaded here.

const DATA_URL = '../assets/projects/index.json'; // relative to html/projects.html
const PREVIEW_DELAY = 250; // ms of hover before a card video starts loading

// Filters shown on the page. `tag` is the value to look for in each project's "tags".
// The `category` query parameter (e.g. html/projects.html?category=VR) must be one of the keys.
const FILTERS = [
  { key: 'All', tag: null },
  { key: 'AR', tag: 'AR' },
  { key: 'VR', tag: 'VR' },
  { key: 'MR', tag: 'MR' },
  { key: 'Game', tag: 'Games' },
];

const $ = (id) => document.getElementById(id);
const els = {
  filters: $('filters'),
  search: $('search'),
  count: $('result-count'),
  grid: $('grid'),
  state: $('state'),
  modal: $('modal'),
  modalClose: $('modal-close'),
  modalMedia: $('modal-media'),
  modalTags: $('modal-tags'),
  modalTitle: $('modal-title'),
  modalDesc: $('modal-desc'),
  modalActions: $('modal-actions'),
};

let projects = [];
let category = 'All';
let query = '';
let lastFocused = null;

/* ---------- Helpers ---------- */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Label + dot colour of the chip shown on each card
function kindOf(project) {
  const tags = project.tags;
  if (tags.includes('AR')) {
    return tags.includes('Tiktok')
      ? { label: 'TikTok Effect', dot: 'cyan' }
      : { label: 'Snapchat Lens', dot: 'yellow' };
  }
  if (tags.includes('MR')) return { label: 'MR experience', dot: 'pink' };
  if (tags.includes('VR')) return { label: 'VR experience', dot: 'orange' };
  if (tags.includes('Games')) return { label: 'Game', dot: 'green' };
  return { label: 'Interactive', dot: 'violet' };
}

// Tags that are not already expressed by the chip, e.g. "Unity · Games"
function secondaryTags(project) {
  const skip = new Set(['AR', 'VR', 'MR', 'Social Media', 'Others']);
  return project.tags.filter((tag) => !skip.has(tag));
}

// Only http(s) links are rendered; a stray trailing "." (present in the data) is dropped
function safeUrl(url) {
  try {
    const parsed = new URL(url.replace(/\.$/, ''));
    return /^https?:$/.test(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function matches(project) {
  const filter = FILTERS.find((f) => f.key === category);
  if (filter && filter.tag && !project.tags.includes(filter.tag)) return false;
  if (!query) return true;
  const haystack = `${project.name} ${project.tags.join(' ')}`.toLowerCase();
  return haystack.includes(query);
}

/* ---------- Filters ---------- */

function countFor(filter) {
  return filter.tag ? projects.filter((p) => p.tags.includes(filter.tag)).length : projects.length;
}

function renderFilters() {
  els.filters.replaceChildren();
  FILTERS.forEach((filter) => {
    const button = el('button', 'filter');
    button.type = 'button';
    button.dataset.key = filter.key;
    button.append(el('span', null, filter.key));
    button.append(el('span', 'filter__count', String(countFor(filter))));
    els.filters.append(button);
  });
  syncFilters();
}

function syncFilters() {
  els.filters.querySelectorAll('.filter').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.key === category));
  });
}

function setCategory(next) {
  category = next;
  syncFilters();

  const url = new URL(window.location.href);
  if (category === 'All') url.searchParams.delete('category');
  else url.searchParams.set('category', category);
  history.replaceState(null, '', url);

  renderGrid();
}

/* ---------- Grid ---------- */

function card(project, index) {
  const kind = kindOf(project);
  const extra = secondaryTags(project).join(' · ');

  const button = el('button', 'pcard');
  button.type = 'button';
  button.dataset.id = project.id;
  button.style.setProperty('--i', Math.min(index, 12));
  button.setAttribute('aria-label', `${project.name} — open details`);

  const thumb = el('span', 'pcard__thumb');
  const img = el('img');
  img.src = project.logoUrl;
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.addEventListener('error', () => img.remove());

  const chip = el('span', 'chip');
  chip.append(el('span', `dot dot--${kind.dot}`), kind.label);

  thumb.append(img, chip, el('span', 'pcard__view', '↗'));

  const body = el('span', 'pcard__body');
  body.append(el('span', 'pcard__name', project.name));
  if (project.description) body.append(el('span', 'pcard__meta pcard__meta--desc', project.description));
  else if (extra) body.append(el('span', 'pcard__meta', extra));

  button.append(thumb, body);
  return button;
}

function renderGrid() {
  const list = projects.filter(matches);

  els.grid.replaceChildren(...list.map(card));
  els.count.textContent = `${list.length} ${list.length === 1 ? 'project' : 'projects'}`;

  if (list.length === 0) {
    els.state.replaceChildren('No project matches your search.');
    const reset = el('button', 'btn btn--outline btn--sm', 'Clear filters');
    reset.type = 'button';
    reset.addEventListener('click', () => {
      els.search.value = '';
      query = '';
      setCategory('All');
    });
    els.state.append(document.createElement('br'), reset);
    els.state.hidden = false;
  } else {
    els.state.hidden = true;
  }
}

/* ---------- Hover preview (desktop only) ---------- */

const canHover = window.matchMedia('(hover: hover)').matches;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canHover && !reduceMotion) {
  const timers = new WeakMap();

  els.grid.addEventListener('pointerover', (e) => {
    const cardEl = e.target.closest('.pcard');
    if (!cardEl || cardEl.contains(e.relatedTarget)) return;

    timers.set(cardEl, setTimeout(() => {
      const project = projects.find((p) => p.id === cardEl.dataset.id);
      if (!project || !project.videoUrl) return;

      const thumb = cardEl.querySelector('.pcard__thumb');
      const video = el('video');
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.setAttribute('aria-hidden', 'true');
      video.src = project.videoUrl;
      video.addEventListener('playing', () => video.classList.add('is-playing'));
      thumb.insertBefore(video, thumb.querySelector('.chip'));
      video.play().catch(() => video.remove());
    }, PREVIEW_DELAY));
  });

  els.grid.addEventListener('pointerout', (e) => {
    const cardEl = e.target.closest('.pcard');
    if (!cardEl || cardEl.contains(e.relatedTarget)) return;

    clearTimeout(timers.get(cardEl));
    const video = cardEl.querySelector('video');
    if (video) {
      // Dropping the source cancels the download of these large files
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.remove();
    }
  });
}

/* ---------- Modal ---------- */

function openModal(project, trigger) {
  lastFocused = trigger;

  els.modalTitle.textContent = project.name;
  els.modalDesc.textContent = project.description || '';

  els.modalTags.replaceChildren(...project.tags.map((tag) => el('span', 'tag', tag)));

  els.modalMedia.replaceChildren();
  if (project.videoUrl) {
    const video = el('video');
    video.controls = true;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.poster = project.logoUrl;
    video.src = project.videoUrl;
    video.setAttribute('aria-label', `${project.name} preview`);
    els.modalMedia.append(video);
  } else {
    const img = el('img');
    img.src = project.logoUrl;
    img.alt = project.name;
    els.modalMedia.append(img);
  }

  els.modalActions.replaceChildren();
  const demo = project.links && safeUrl(project.links.demo || '');
  if (demo) {
    const link = el('a', 'btn btn--primary');
    link.href = demo;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.append('See it live ', el('span', 'arrow', '↗'));
    els.modalActions.append(link);
  }
  const contact = el('a', 'btn btn--outline', 'Start a project');
  contact.href = '../index.html#contact';
  els.modalActions.append(contact);

  document.body.classList.add('is-locked');
  els.modal.showModal();
}

function closeModal() {
  if (els.modal.open) els.modal.close();
}

els.modal.addEventListener('close', () => {
  // Stop the video and cancel its download
  const video = els.modalMedia.querySelector('video');
  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
  els.modalMedia.replaceChildren();
  document.body.classList.remove('is-locked');
  if (lastFocused && document.contains(lastFocused)) lastFocused.focus({ preventScroll: true });
});

els.modalClose.addEventListener('click', closeModal);
els.modal.addEventListener('click', (e) => {
  // A click on the backdrop targets the <dialog> itself
  if (e.target === els.modal) closeModal();
});

els.grid.addEventListener('click', (e) => {
  const cardEl = e.target.closest('.pcard');
  if (!cardEl) return;
  const project = projects.find((p) => p.id === cardEl.dataset.id);
  if (project) openModal(project, cardEl);
});

/* ---------- Controls ---------- */

els.filters.addEventListener('click', (e) => {
  const button = e.target.closest('.filter');
  if (button) setCategory(button.dataset.key);
});

let searchTimer;
els.search.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    query = els.search.value.trim().toLowerCase();
    renderGrid();
  }, 120);
});

/* ---------- Nav (same behaviour as the home page) ---------- */

const nav = document.querySelector('.nav');
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

/* ---------- Boot ---------- */

async function init() {
  const requested = new URLSearchParams(window.location.search).get('category');
  if (FILTERS.some((f) => f.key === requested)) category = requested;

  els.count.textContent = 'Loading projects…';

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    projects = Array.isArray(data.projects) ? data.projects : [];
  } catch (error) {
    console.error('Could not load the projects:', error);
    els.count.textContent = '';
    els.state.textContent = window.location.protocol === 'file:'
      ? 'The projects could not be loaded. Open this page through a local web server instead of directly from the file system.'
      : 'The projects could not be loaded. Please try again later.';
    els.state.hidden = false;
    return;
  }

  renderFilters();
  renderGrid();
}

init();
