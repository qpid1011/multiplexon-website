/**
 * MultiplexON Lab Official Website — Core SPA Router, Language/Theme Controller & Recruiting Analytics
 * Department of Electronic Engineering, Kyung Hee University (Prof. Wook Park)
 *
 * View contract:   render*(data, subRoute, appState) -> HTML string   (data.lang is always 'ko' | 'en')
 * Binder contract: bind*(rootEl, ctx)  with ctx = { state, data, route, subRoute, rerender, navigate, track, toast, openLightbox }
 * Styling rule:    state is expressed ONLY through classList / attributes (no inline style mutation).
 */

import { renderJoin, bindJoinEvents } from './views_recruiting.js';
import { renderHome, renderResearch, renderNotice } from './views_home_research.js';
import { renderMembers, bindMembersEvents, renderPublications, bindPublicationsEvents } from './views_people_pubs.js';
import { renderLife, renderMedia, renderFaq, renderBlog, renderRights, renderGallery, renderNewsAll, renderClass, renderContact, bindDocsGalleryEvents } from './views_docs_gallery.js';

const THEME_STORAGE_KEY = 'multiplexon_theme';
const LANG_STORAGE_KEY = 'multiplexon_lang';
const BASE_TITLE_KO = '박욱 교수 연구실 (MultiplexON Lab) | 경희대학교 전자공학과 Prof. Wook Park';
const BASE_TITLE_EN = 'Prof. Wook Park (박욱 교수) | MultiplexON Lab · Kyung Hee University Electronic Engineering';
const TITLE_SUFFIX_KO = '박욱 교수 연구실 (MultiplexON Lab · 경희대 전자공학과)';
const TITLE_SUFFIX_EN = 'Prof. Wook Park · MultiplexON Lab (KHU EE)';

const DATA_ENDPOINTS = [
  ['meta', './data/site_meta.json'],
  ['research', './data/research.json'],
  ['members', './data/members.json'],
  ['publications', './data/publications.json'],
  ['news', './data/news.json'],
  ['documents', './data/documents.json'],
  ['gallery', './data/gallery.json'],
  ['recruiting', './data/recruiting.json'],
];

const VIEWS = {
  home: renderHome, join: renderJoin, research: renderResearch, notice: renderNotice,
  members: renderMembers, life: renderLife, publications: renderPublications,
  media: renderMedia, faq: renderFaq, blog: renderBlog, rights: renderRights,
  gallery: renderGallery, news: renderNewsAll, class: renderClass, contact: renderContact,
};

const ROUTE_TITLES = {
  join: ['지원 안내', 'Join Us'], research: ['연구', 'Research'], notice: ['공지사항', 'Announcements'],
  members: ['사람과 진로', 'People & Careers'], life: ['연구실 생활', 'Lab Life'],
  publications: ['연구성과', 'Publications & Patents'], media: ['언론 보도', 'Media Coverage'],
  faq: ['자주 묻는 질문', 'Lab FAQ'], blog: ['Blog from W.P.', 'Blog from W.P.'],
  rights: ['인권 헌장', 'Human Rights Charter'], gallery: ['사진 갤러리', 'Photo Gallery'],
  news: ['연구실 소식', 'Lab News Archive'], class: ['강의', 'Courses & Teaching'], contact: ['오시는 길', 'Contact & Directions'],
};

const RECRUITING_ROUTES = ['home', 'join', 'research', 'members', 'life'];
const LIFE_GROUP_ROUTES = new Set(['life', 'gallery', 'rights', 'blog', 'faq', 'news', 'media']);
const DOCS_GALLERY_ROUTES = new Set(['life', 'media', 'faq', 'blog', 'rights', 'gallery', 'news', 'class', 'contact']);
const NAV_ROUTES = new Set(['home', 'join', 'research', 'members', 'life', 'publications']);
const ROUTE_BINDERS = { join: bindJoinEvents, members: bindMembersEvents, publications: bindPublicationsEvents };

const LEGACY_PATHS = {
  '/member_1/current': '#members/current',
  '/member_1/alumni': '#members/alumni',
  '/member_1/professor': '#members/professor',
  '/research/optical-applications': '#research/optical-applications',
  '/research/security-applications': '#research/security-applications',
  '/research/bio-applications': '#research/bio-applications',
  '/notice_research-intern': '#notice/research-intern',
  '/publications_1/journals': '#publications/journals',
  '/document_1/gallery': '#life/gallery',
};

const SEARCH_SOURCES = [['research', '#research'], ['members', '#members'], ['publications', '#publications'], ['news', '#news'], ['documents', '#life']];
const SAFE_PARAM = /^[a-z0-9][a-z0-9_-]{0,47}$/i;
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const appState = {
  theme: 'light',
  lang: 'ko',
  loaded: false,
  currentRoute: '',
  lastTrackedPath: '',
  lastPubSubRoute: 'journals',
  pubFilter: { query: '', year: 'ALL' },
  composerState: { track: '', topics: [] },
  data: { lang: 'ko', meta: {}, research: {}, members: {}, publications: {}, news: {}, documents: {}, gallery: {}, recruiting: {} },
  searchIndex: [],
};

function escHtml(value) {
  return String(value ?? '').normalize('NFC')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function normalizeNfcDeep(input) {
  if (typeof input === 'string') return input.normalize('NFC');
  if (Array.isArray(input)) return input.map(normalizeNfcDeep);
  if (input && typeof input === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(input)) out[k.normalize('NFC')] = normalizeNfcDeep(v);
    return out;
  }
  return input;
}

/** Localized pick: accepts a plain string/number or a { ko, en } pair. */
function L(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value[appState.lang] ?? value.ko ?? value.en ?? '';
  return value ?? '';
}

function setText(selector, text) {
  const el = document.querySelector(selector);
  if (el && text) el.textContent = text;
}

function storageGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
function storageSet(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* private mode / quota */ } }

/* --------------------------------------------------------------------------
   1. Privacy-Safe Analytics (route + language only — zero PII, no free-text)
   -------------------------------------------------------------------------- */
export const trackRecruitEvent = (name, params = {}) => { if (typeof window.gtag === 'function') window.gtag('event', name, params); };
window.trackRecruitEvent = trackRecruitEvent;

/* --------------------------------------------------------------------------
   2. Dual-Theme Manager (classList only)
   -------------------------------------------------------------------------- */
function syncThemeToggleLabel() {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  const isDark = appState.theme === 'dark';
  const actions = appState.data.recruiting?.ui?.actions || {};
  const fallback = appState.lang === 'ko'
    ? (isDark ? '밝은 테마' : '다크 테마')
    : (isDark ? 'Light' : 'Dark');
  const label = L(isDark ? actions.theme_to_light : actions.theme_to_dark) || fallback;
  const iconEl = btn.querySelector('.theme-toggle-icon');
  const labelEl = btn.querySelector('.theme-toggle-label');
  if (iconEl) iconEl.textContent = isDark ? '☀️' : '🌙';
  if (labelEl) labelEl.textContent = label; else btn.textContent = `${isDark ? '☀️' : '🌙'} ${label}`;
  btn.setAttribute('aria-label', label);
  btn.setAttribute('title', label);
  btn.setAttribute('aria-pressed', String(isDark));
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  appState.theme = isDark ? 'dark' : 'light';
  for (const el of [document.documentElement, document.body]) {
    el?.classList.toggle('dark-theme', isDark);
    el?.classList.toggle('light-theme', !isDark);
  }
  syncThemeToggleLabel();
  storageSet(THEME_STORAGE_KEY, appState.theme);
}

/* --------------------------------------------------------------------------
   3. Language State (URL ?lang -> localStorage -> deterministic 'ko' default for SEO parity)
   -------------------------------------------------------------------------- */
function detectInitialLanguage() {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (fromUrl === 'ko' || fromUrl === 'en') { storageSet(LANG_STORAGE_KEY, fromUrl); return fromUrl; }
  const stored = storageGet(LANG_STORAGE_KEY);
  if (stored === 'ko' || stored === 'en') return stored;
  return 'ko';
}

function applyLanguage(lang, { rerender = true } = {}) {
  appState.lang = lang === 'en' ? 'en' : 'ko';
  appState.data.lang = appState.lang;
  document.documentElement.lang = appState.lang;
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    const isOn = btn.dataset.lang === appState.lang;
    btn.classList.toggle('is-active', isOn);
    btn.setAttribute('aria-pressed', String(isOn));
  });

  const ui = appState.data.recruiting?.ui || {};
  const nav = ui.nav || {};
  const ribbon = ui.ribbon || {};
  const actions = ui.actions || {};
  const footer = ui.footer || {};

  document.querySelectorAll('.nav-link[data-route], [data-i18n-nav]').forEach((el) => {
    const label = L(nav[el.dataset.route || el.dataset.i18nNav]);
    if (label) el.textContent = label;
  });
  setText('#intern-notice-badge', L(ribbon.badge));
  setText('#ribbon-intern-link .notice-link-text', L(ribbon.intern_link));
  setText('#ribbon-gradproj-link .notice-link-text', L(ribbon.grad_proj_link));
  setText('#ribbon-dept-label', L(ribbon.dept_label));

  const searchLabel = L(actions.search);
  setText('#search-btn-label', searchLabel);
  setText('#search-modal-title', searchLabel);
  if (searchLabel) document.getElementById('global-search-btn')?.setAttribute('aria-label', searchLabel);
  const placeholder = L(actions.search_placeholder);
  if (placeholder) document.getElementById('search-input')?.setAttribute('placeholder', placeholder);

  setText('#mobile-join-btn', L(actions.mobile_join));
  setText('#mobile-chat-btn', L(actions.mobile_chat));
  setText('#header-recruit-cta', L(nav.cta_chat));
  setText('#footer-col-explore', L(footer.col_explore));
  setText('#footer-col-join', L(footer.col_join));
  setText('#footer-col-contact', L(footer.col_contact));
  setText('#footer-copyright-note', L(footer.copyright_note));
  setText('#footer-directions-link', L(footer.directions_label) || (appState.lang === 'en' ? 'Directions · Official Press & Brand Kit' : '오시는 길 · 프레스킷'));
  const ytTalks = appState.data?.recruiting?.youtube_talks || {};
  setText('#footer-youtube-link', L(ytTalks.footer_link) || (appState.lang === 'en' ? 'YouTube · Korean Talks (@꽁대교수) ↗' : 'YouTube · @꽁대교수 (공대교수 몰래녹화본) ↗'));
  setText('#lightbox-close-btn', L(actions.close_dialog) || (appState.lang === 'en' ? '✕ Close' : '✕ 닫기'));
  setText('#video-close-btn', L(actions.close_dialog) || (appState.lang === 'en' ? '✕ Close' : '✕ 닫기'));
  setText('#search-close-btn', L(actions.esc_close) || (appState.lang === 'en' ? 'ESC · Close' : 'ESC · 닫기'));
  const addrEl = document.getElementById('footer-address-lines');
  if (addrEl) {
    addrEl.innerHTML = appState.lang === 'en'
      ? 'Room 403, College of Electronics &amp; Information, 1732 Deogyeong-daero,<br>Giheung-gu, Yongin-si, Gyeonggi-do 17104, Republic of Korea'
      : '경기도 용인시 기흥구 덕영대로 1732 (17104)<br>경희대학교 국제캠퍼스 전자정보대학관 403호 · 전자공학과';
  }
  syncThemeToggleLabel();

  appState.searchIndex = buildGlobalSearchIndex(appState.data);
  const searchInput = document.getElementById('search-input');
  if (searchInput && document.getElementById('search-modal')?.open) runSearch(searchInput.value);
  // Re-render in place: the active route, scroll position and composer draft (appState.composerState) all survive.
  if (rerender && appState.loaded) renderRoute(window.location.hash, { preserveScroll: true });
}

/* --------------------------------------------------------------------------
   4. Parallel Data Loader & Header Brand Sync
   -------------------------------------------------------------------------- */
async function fetchJsonSafe(url) {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return {};
    const parsed = await res.json();
    return parsed && typeof parsed === 'object' ? normalizeNfcDeep(parsed) : {};
  } catch (_) {
    return {};
  }
}

async function loadAllSiteData() {
  const entries = await Promise.all(DATA_ENDPOINTS.map(async ([key, url]) => [key, await fetchJsonSafe(url)]));
  for (const [key, payload] of entries) appState.data[key] = payload;
  appState.data.lang = appState.lang;
  appState.loaded = true;
  syncHeaderBrand(appState.data.meta);
}

function syncHeaderBrand(meta = {}) {
  const logoLightEl = document.getElementById('header-logo');
  const logoDarkEl = document.getElementById('header-logo-dark');
  const brandTextEl = document.querySelector('.brand-text');
  const logoPath = meta?.logo_path || meta?.logo || '';
  if (logoLightEl) {
    logoLightEl.onerror = () => {
      logoLightEl.classList.add('is-hidden');
      logoDarkEl?.classList.add('is-hidden');
      brandTextEl?.classList.remove('is-hidden');
    };
    if (logoPath && !logoLightEl.getAttribute('src')) logoLightEl.src = logoPath;
    if (logoDarkEl && !logoDarkEl.getAttribute('src')) logoDarkEl.src = meta?.logo_dark_path || logoPath;
  }
  setText('#footer-year', String(new Date().getFullYear()));
}

/* --------------------------------------------------------------------------
   5. Global Search (shape-tolerant index, rebuilt on every language change)
   -------------------------------------------------------------------------- */
function harvestSearchItems(node, hash, type, out, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 6 || out.length > 2000) return;
  if (Array.isArray(node)) { node.forEach((child) => harvestSearchItems(child, hash, type, out, depth + 1)); return; }
  const title = L(node.title ?? node.name ?? node.name_en ?? node.question);
  if (typeof title === 'string' && title.trim()) {
    const sub = [node.name_ko, node.authors, node.journal, node.venue, node.role, node.position, node.affiliation, node.year, node.date, node.summary]
      .map(L).filter((v) => typeof v === 'string' || typeof v === 'number').join(' · ').slice(0, 180);
    out.push({ title: title.trim(), sub, hash, type, text: `${title} ${sub}`.toLowerCase() });
  }
  for (const value of Object.values(node)) if (value && typeof value === 'object') harvestSearchItems(value, hash, type, out, depth + 1);
}

function buildGlobalSearchIndex(data = {}) {
  const nav = data.recruiting?.ui?.nav || {};
  const out = [];
  for (const route of NAV_ROUTES) {
    const title = L(nav[route]) || document.querySelector(`.nav-link[data-route="${route}"]`)?.textContent || route;
    out.push({ title, sub: '', hash: `#${route}`, type: 'page', text: `${title} ${route}`.toLowerCase() });
  }
  const chatTitle = L(nav.cta_chat) || '커피챗·지원 문의';
  out.push({ title: chatTitle, sub: 'parkwook@khu.ac.kr', hash: '#join/chat', type: 'page', text: `${chatTitle} coffee chat 커피챗 지원 문의 contact`.toLowerCase() });
  for (const [key, hash] of SEARCH_SOURCES) harvestSearchItems(data[key], hash, key, out);
  return out;
}

function runSearch(query) {
  const box = document.getElementById('search-results');
  if (!box) return;
  const tokens = String(query || '').normalize('NFC').toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) { box.innerHTML = ''; return; }
  const hits = appState.searchIndex.filter((item) => tokens.every((tk) => item.text.includes(tk))).slice(0, 14);
  box.innerHTML = hits.length
    ? hits.map((h) => `<a class="search-result-item" href="${escHtml(h.hash)}"><span class="search-result-type">${escHtml(h.type)}</span><span class="search-result-title">${escHtml(h.title)}</span>${h.sub ? `<span class="search-result-sub">${escHtml(h.sub)}</span>` : ''}</a>`).join('')
    : `<p class="search-empty">${appState.lang === 'ko' ? '검색 결과가 없습니다.' : 'No results found.'}</p>`;
}

/* --------------------------------------------------------------------------
   6. Dialogs, Lightbox & Toast
   -------------------------------------------------------------------------- */
function syncDialogState() {
  document.body.classList.toggle('is-dialog-open', Boolean(document.querySelector('dialog[open]')));
}

function openDialog(dialog) {
  if (!dialog || dialog.open) return;
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  syncDialogState();
}

function teardownVideoModal() {
  document.getElementById('video-modal-stage')?.replaceChildren();
}

function closeDialog(dialog) {
  if (!dialog) return;
  if (dialog.id === 'video-modal') teardownVideoModal();
  if (dialog.open && typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
  syncDialogState();
}

function openVideoModal(ytId, title = '', isShorts = false) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(String(ytId || ''))) return;
  const dialog = document.getElementById('video-modal');
  const stage = document.getElementById('video-modal-stage');
  const ext = document.getElementById('video-modal-ext');
  if (!dialog || !stage) return;
  const modalTitle = title || '박욱 교수 토크 (@꽁대교수)';
  setText('#video-modal-title', modalTitle);
  stage.classList.toggle('is-shorts', Boolean(isShorts));
  ext?.setAttribute('href', isShorts ? `https://www.youtube.com/shorts/${ytId}` : `https://youtu.be/${ytId}`);
  const iframe = document.createElement('iframe');
  iframe.id = 'video-modal-iframe';
  iframe.className = 'video-modal-iframe';
  iframe.title = modalTitle;
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.allowFullscreen = true;
  iframe.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&playsinline=1`;
  stage.replaceChildren(iframe);
  openDialog(dialog);
}

function openLightbox(src, caption = '') {
  const img = document.getElementById('lightbox-image');
  if (!img || !src) return;
  img.src = src;
  img.alt = caption;
  setText('#lightbox-caption', caption || ' ');
  openDialog(document.getElementById('lightbox-modal'));
}

function openSearch() {
  const input = document.getElementById('search-input');
  openDialog(document.getElementById('search-modal'));
  if (input) { input.value = ''; runSearch(''); input.focus(); }
  trackRecruitEvent('search_open', { lang: appState.lang });
}

let toastTimer = 0;
function showToast(message) {
  const toast = document.getElementById('copy-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(appState.lang === 'ko' ? '복사되었습니다' : 'Copied to clipboard');
  } catch (_) {
    showToast(text);
  }
}

/* --------------------------------------------------------------------------
   7. Router (legacy Google Sites paths, hash sub-routes, hash query params)
   -------------------------------------------------------------------------- */
function redirectLegacyPath() {
  let path = window.location.pathname;
  try { path = decodeURIComponent(path); } catch (_) { /* keep raw path */ }
  const target = LEGACY_PATHS[path.replace(/\/+$/, '').toLowerCase()];
  if (!target) return false;
  window.location.replace(`/${window.location.search}${target}`);
  return true;
}

function parseHash(hash) {
  const raw = String(hash || '').replace(/^#\/?/, '');
  const queryAt = raw.indexOf('?');
  const pathPart = queryAt >= 0 ? raw.slice(0, queryAt) : raw;
  const segments = pathPart.split('/').filter(Boolean).map((seg) => {
    try { return decodeURIComponent(seg); } catch (_) { return seg; }
  });
  return {
    route: (segments[0] || 'home').toLowerCase(),
    subRoute: segments.slice(1).join('/'),
    params: new URLSearchParams(queryAt >= 0 ? raw.slice(queryAt + 1) : ''),
  };
}

function applyComposerParams(params) {
  const track = params.get('track');
  const topic = params.get('topic');
  if (track && SAFE_PARAM.test(track)) appState.composerState.track = track;
  if (!Array.isArray(appState.composerState.topics)) appState.composerState.topics = [];
  if (topic && SAFE_PARAM.test(topic) && !appState.composerState.topics.includes(topic)) appState.composerState.topics.push(topic);
}

function navigate(hash) {
  const next = hash.startsWith('#') ? hash : `#${hash}`;
  if (window.location.hash === next) renderRoute(next); else window.location.hash = next;
}

function renderRoute(hash, { preserveScroll = false } = {}) {
  const main = document.getElementById('app-main');
  if (!main || !appState.loaded) return;
  let { route, subRoute, params } = parseHash(hash);
  // Plain in-page anchors (e.g. the skip link "#app-main") must not trigger a re-route.
  if (!VIEWS[route] && appState.currentRoute && document.getElementById(route)) return;
  const knownRoute = VIEWS[route] ? route : 'home';
  if (knownRoute !== route) subRoute = '';

  const hashLang = params.get('lang');
  if ((hashLang === 'ko' || hashLang === 'en') && hashLang !== appState.lang) {
    storageSet(LANG_STORAGE_KEY, hashLang);
    applyLanguage(hashLang, { rerender: false });
  }
  if (knownRoute === 'join') applyComposerParams(params);
  if (knownRoute === 'publications') {
    subRoute = subRoute || appState.lastPubSubRoute;
    appState.lastPubSubRoute = subRoute;
  }

  document.body.classList.toggle('recruiting-mode', ['home', 'join', 'research', 'members', 'life'].includes(knownRoute));
  if (knownRoute !== 'join') document.body.classList.remove('is-composing');
  const activeNav = LIFE_GROUP_ROUTES.has(knownRoute) ? 'life' : (NAV_ROUTES.has(knownRoute) ? knownRoute : '');
  document.querySelectorAll('.nav-link[data-route]').forEach((link) => {
    const isOn = link.dataset.route === activeNav;
    link.classList.toggle('is-active', isOn);
    if (isOn) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  closeMobileNav();
  if (!preserveScroll) document.querySelectorAll('dialog[open]').forEach(closeDialog);

  const isKo = appState.lang === 'ko';
  const canonicalEl = document.getElementById('canonical-link');
  if (canonicalEl) {
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    canonicalEl.setAttribute('href', urlLang === 'en' ? 'https://www.multiplexon.com/?lang=en' : 'https://www.multiplexon.com/');
  }
  const titlePair = ROUTE_TITLES[knownRoute];
  document.title = titlePair
    ? `${titlePair[isKo ? 0 : 1]} | ${isKo ? TITLE_SUFFIX_KO : TITLE_SUFFIX_EN}`
    : (isKo ? BASE_TITLE_KO : BASE_TITLE_EN);

  const ctx = {
    state: appState, data: appState.data, route: knownRoute, subRoute,
    rerender: () => renderRoute(window.location.hash, { preserveScroll: true }),
    navigate, track: trackRecruitEvent, toast: showToast, openLightbox,
  };

  const draw = () => {
    try {
      main.innerHTML = VIEWS[knownRoute](appState.data, subRoute, appState) || '';
      ROUTE_BINDERS[knownRoute]?.(main, ctx);
      if (DOCS_GALLERY_ROUTES.has(knownRoute)) bindDocsGalleryEvents(main, ctx);
    } catch (err) {
      console.error('[MultiplexON] route render failed:', knownRoute, err);
      main.innerHTML = `<section class="container route-error"><h1>${appState.lang === 'ko' ? '페이지를 표시하지 못했습니다' : 'This page could not be displayed'}</h1><p><a href="#home">MultiplexON Lab Home</a> · <a href="mailto:parkwook@khu.ac.kr">parkwook@khu.ac.kr</a></p></section>`;
    }
    main.dataset.route = knownRoute;
    main.setAttribute('aria-busy', 'false');
    appState.currentRoute = knownRoute;
    if (preserveScroll) return;
    const composer = knownRoute === 'join' && subRoute === 'chat' ? document.getElementById('composer-section') : null;
    if (composer) composer.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    else window.scrollTo(0, 0);
  };

  if (!preserveScroll && typeof document.startViewTransition === 'function' && !prefersReducedMotion()) document.startViewTransition(draw);
  else draw();

  const safeSub = subRoute.replace(/[^a-z0-9/_-]/gi, '').slice(0, 80);
  const pagePath = '/' + knownRoute + (safeSub ? '/' + safeSub : '');
  if (pagePath !== appState.lastTrackedPath) {
    appState.lastTrackedPath = pagePath;
    trackRecruitEvent('page_view', { page_path: pagePath, page_title: document.title, lang: appState.lang });
  }
}

/* --------------------------------------------------------------------------
   8. Global Event Wiring (delegated)
   -------------------------------------------------------------------------- */
function closeMobileNav() {
  document.getElementById('site-nav')?.classList.remove('is-open');
  document.getElementById('mobile-nav-toggle')?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('is-nav-open');
}

function handleGlobalClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const langBtn = target.closest('.lang-btn[data-lang]');
  if (langBtn) {
    if (langBtn.dataset.lang !== appState.lang) {
      storageSet(LANG_STORAGE_KEY, langBtn.dataset.lang === 'en' ? 'en' : 'ko');
      applyLanguage(langBtn.dataset.lang);
      trackRecruitEvent('language_switch', { lang: appState.lang });
    }
    return;
  }
  if (target.closest('#theme-toggle-btn')) { applyTheme(appState.theme === 'dark' ? 'light' : 'dark'); return; }
  if (target.closest('#global-search-btn')) { openSearch(); return; }
  if (target.closest('#mobile-nav-toggle')) {
    const isOpen = document.getElementById('site-nav')?.classList.toggle('is-open') ?? false;
    document.getElementById('mobile-nav-toggle')?.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('is-nav-open', isOpen);
    return;
  }
  const closeBtn = target.closest('[data-dialog-close]');
  if (closeBtn) { closeDialog(closeBtn.closest('dialog')); return; }
  if (target instanceof HTMLDialogElement) { closeDialog(target); return; } // backdrop click

  const copyEl = target.closest('[data-copy]');
  if (copyEl) { event.preventDefault(); copyText(copyEl.dataset.copy || ''); return; }
  const lightboxEl = target.closest('[data-lightbox-src]');
  if (lightboxEl) {
    event.preventDefault();
    openLightbox(lightboxEl.dataset.lightboxSrc, lightboxEl.dataset.lightboxCaption || lightboxEl.getAttribute('alt') || '');
    return;
  }
  const ytPlayEl = target.closest('[data-yt-id]');
  if (ytPlayEl) {
    event.preventDefault();
    openVideoModal(ytPlayEl.dataset.ytId, ytPlayEl.dataset.ytTitle || '', ytPlayEl.dataset.ytShorts === 'true');
    trackRecruitEvent('youtube_talk_play', {
      video_id: ytPlayEl.dataset.ytId, talk_id: ytPlayEl.dataset.talkId || '', route: appState.currentRoute, lang: appState.lang,
    });
    return;
  }

  const trackEl = target.closest('[data-track]');
  if (trackEl) trackRecruitEvent(trackEl.dataset.track, { route: appState.currentRoute, lang: appState.lang });

  const link = target.closest('a[href^="#"]');
  if (link) {
    if (link.closest('#search-modal')) closeDialog(document.getElementById('search-modal'));
    // Re-clicking the current hash fires no hashchange: re-run the route (e.g. scroll back to the composer).
    if (link.getAttribute('href') === window.location.hash && VIEWS[parseHash(window.location.hash).route]) {
      event.preventDefault();
      renderRoute(window.location.hash);
    }
  }
}

function bindGlobalEvents() {
  document.addEventListener('click', handleGlobalClick);
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('close', () => {
      if (dialog.id === 'video-modal') teardownVideoModal();
      syncDialogState();
    });
    dialog.addEventListener('cancel', () => window.setTimeout(syncDialogState, 0));
  });

  const searchInput = document.getElementById('search-input');
  searchInput?.addEventListener('input', () => runSearch(searchInput.value));
  searchInput?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.isComposing) return;
    const first = document.querySelector('#search-results .search-result-item');
    if (first) { event.preventDefault(); first.click(); }
  });

  document.addEventListener('keydown', (event) => {
    const el = event.target instanceof HTMLElement ? event.target : null;
    const isTyping = Boolean(el && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName)));
    const isShortcut = ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') || (event.key === '/' && !isTyping);
    if (isShortcut && !document.querySelector('dialog[open]')) { event.preventDefault(); openSearch(); }
    if (event.key === 'Escape') closeMobileNav();
  });

  const header = document.getElementById('site-header');
  const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  window.addEventListener('hashchange', () => renderRoute(window.location.hash));
}

/* --------------------------------------------------------------------------
   9. Boot
   -------------------------------------------------------------------------- */
async function boot() {
  if (redirectLegacyPath()) return;
  applyTheme(storageGet(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light');
  applyLanguage(detectInitialLanguage(), { rerender: false });
  bindGlobalEvents();
  await loadAllSiteData();
  applyLanguage(appState.lang, { rerender: false }); // second pass: labels from recruiting.json + search index
  renderRoute(window.location.hash);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
