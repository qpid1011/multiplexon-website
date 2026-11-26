/**
 * MultiplexON Lab — Lab Life Hub, Gallery, Rights, Blog, News, Media, FAQ, Class & Contact Views
 * Department of Electronic Engineering, Kyung Hee University (경희대학교 전자공학과)
 * Pure ES module: render*(data, subRoute, appState) -> HTML string, bindDocsGalleryEvents(rootEl, ctx).
 * Styling rule: zero inline styles — state lives only in classList / attributes.
 */

const AFF = { ko: '경희대학교 전자공학과', en: 'Department of Electronic Engineering, Kyung Hee University' };
const DEFAULT_EMAIL = 'parkwook@khu.ac.kr';
const DEFAULT_LAT = 37.240039;
const DEFAULT_LNG = 127.083874;
const LIFE_TABS = [
  { id: 'gallery', ko: '사진 갤러리', en: 'Gallery' },
  { id: 'rights', ko: '학생 권리장전', en: 'Bill of Rights' },
  { id: 'blog', ko: 'Blog from W.P.', en: 'Blog from W.P.' },
  { id: 'news', ko: '연구실 소식', en: 'News' },
  { id: 'media', ko: '언론 보도', en: 'Media' },
];

/* ---------- helpers ---------- */
function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const langOf = (data) => (data?.lang === 'en' ? 'en' : 'ko');
const tr = (lang, ko, en) => (lang === 'en' ? en : ko);
const arr = (v) => (Array.isArray(v) ? v : []);
function pick(value, lang) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value[lang] ?? value.ko ?? value.en ?? '';
  return value ?? '';
}
function safeUrl(url) {
  const u = String(url ?? '').trim();
  return /^(https?:\/\/|mailto:|tel:|#|\.{0,2}\/)/i.test(u) ? u : '';
}
function hashSegments() {
  try {
    return String(window.location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map((s) => decodeURIComponent(s));
  } catch (_) { return []; }
}
function routeParts(routeName, subRoute) {
  let parts = String(subRoute ?? '').split('/').map((s) => s.trim()).filter(Boolean);
  const hash = hashSegments();
  if (hash[0] === routeName && hash.length - 1 > parts.length) parts = hash.slice(1);
  return parts;
}
function splitParagraphs(value) {
  const out = [];
  (Array.isArray(value) ? value : [value]).forEach((chunk) => {
    String(chunk ?? '').replace(/Copyright\s*©.*$/gim, '').split(/\n+/).map((p) => p.trim()).filter(Boolean)
      .forEach((p) => out.push(p));
  });
  return out;
}
function renderParagraphs(value, className = 'prose-p') {
  return splitParagraphs(value).map((p) => (p.startsWith('▶')
    ? `<h3 class="card-title">${esc(p.replace(/^▶\s*/, ''))}</h3>`
    : `<p class="${className}">${esc(p)}</p>`)).join('');
}
function normalizeImage(entry, fallbackCaption = '') {
  if (!entry) return null;
  if (typeof entry === 'string') return entry.trim() ? { src: entry.trim(), caption: fallbackCaption } : null;
  const src = String(entry.src || entry.image || entry.url || '').trim();
  if (!src) return null;
  return { src, caption: String(entry.caption || entry.title || entry.alt || fallbackCaption || '').trim() };
}
function renderLightboxImg(img, cls = 'card-img lightbox-img') {
  if (!img?.src) return '';
  return `<img src="${esc(img.src)}" alt="${esc(img.caption)}" class="${cls}" loading="lazy" decoding="async" data-lightbox-src="${esc(img.src)}" data-lightbox-caption="${esc(img.caption)}">`;
}
function toYoutubeEmbedUrl(rawUrl) {
  const url = String(rawUrl ?? '').trim();
  if (!url) return '';
  if (/youtube(-nocookie)?\.com\/embed\//i.test(url)) return url;
  const m = url.match(/[?&]v=([A-Za-z0-9_-]{6,})/) || url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : safeUrl(url);
}
function renderVideoEmbed(rawUrl, title = 'MultiplexON Lab Video') {
  const embedUrl = toYoutubeEmbedUrl(rawUrl);
  if (!embedUrl) return '';
  return `<div class="video-embed-wrap"><iframe src="${esc(embedUrl)}" title="${esc(title)}" class="video-frame" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
}
function chatCta(lang) {
  return `
    <aside class="cta-band card" aria-label="${tr(lang, '커피챗 안내', 'Coffee chat')}">
      <div class="cta-band-text">
        <h2 class="card-title">${tr(lang, '궁금한 점은 직접 물어보세요', 'Curious? Ask us directly')}</h2>
        <p class="card-text">${tr(lang, '연구실 분위기, 연구 주제, 진로까지 — 부담 없는 커피챗으로 편하게 이야기 나눠요.', 'Lab culture, research topics, career paths — let’s talk over a casual coffee chat.')}</p>
      </div>
      <a href="#join/chat" class="btn btn-recruit" data-track="life_coffee_chat_cta">${tr(lang, '☕ 커피챗 신청하기', '☕ Book a Coffee Chat')}</a>
    </aside>`;
}
function pageShell(lang, view, { title, subtitle = '', body = '', cta = true }) {
  return `
    <section class="section docs-page" data-docs-view="${esc(view)}">
      <div class="container">
        <header class="page-header">
          <span class="bento-kicker">${esc(AFF[lang])}</span>
          <h1 class="page-title">${esc(title)}</h1>
          ${subtitle ? `<p class="page-subtitle">${esc(subtitle)}</p>` : ''}
          <p class="page-back"><a href="#life" class="btn btn-sm btn-outline">← ${tr(lang, '연구실 문화 & 일상', 'Lab Life & Culture')}</a></p>
        </header>
        ${body}
        ${cta ? chatCta(lang) : ''}
      </div>
    </section>`;
}
const emptyNote = (lang, ko, en) => `<p class="empty-note">${tr(lang, ko, en)}</p>`;

/* ---------- gallery ---------- */
function galleryBody(data, selectedYear, base, lang) {
  const years = arr(data?.gallery?.years).filter((y) => y && y.year != null)
    .slice().sort((a, b) => Number(b.year) - Number(a.year));
  if (!years.length) return emptyNote(lang, '등록된 사진이 없습니다.', 'No photos have been posted yet.');
  const wanted = (String(selectedYear ?? '').match(/\d{4}/) || [''])[0];
  const active = years.some((y) => String(y.year) === wanted) ? wanted : '';
  const pill = (href, label, on) => `<a href="${esc(href)}" class="filter-pill${on ? ' is-active' : ''}"${on ? ' aria-current="true"' : ''}>${esc(label)}</a>`;
  const pills = [pill(base, tr(lang, '전체', 'All'), !active)]
    .concat(years.map((y) => pill(`${base}/${y.year}`, String(y.year), String(y.year) === active))).join('');

  const yearsHtml = years.filter((y) => !active || String(y.year) === active).map((y) => {
    const eventsHtml = arr(y.events).map((ev) => {
      const title = String(pick(ev?.title, lang) || '').trim();
      const figures = arr(ev?.images).map((raw) => normalizeImage(raw, title)).filter(Boolean).map((img) => {
        const caption = img.caption || title || `MultiplexON Lab ${y.year}`;
        return `
          <figure class="gallery-item" tabindex="0" role="button" aria-label="${esc(`${tr(lang, '사진 크게 보기', 'Enlarge photo')}: ${caption}`)}" data-lightbox-src="${esc(img.src)}" data-lightbox-caption="${esc(caption)}">
            ${renderLightboxImg({ src: img.src, caption }, 'gallery-img lightbox-img')}
            <figcaption class="gallery-caption">${esc(caption)}</figcaption>
          </figure>`;
      }).join('');
      if (!figures) return '';
      return `
        <section class="gallery-event">
          <header class="gallery-event-header">
            <h3 class="card-title">${esc(title || tr(lang, '연구실 일상', 'Lab moments'))}</h3>
            ${ev?.date ? `<span class="badge badge-year">${esc(ev.date)}</span>` : ''}
          </header>
          <div class="gallery-grid">${figures}</div>
        </section>`;
    }).join('');
    return eventsHtml ? `<section class="gallery-year"><h2 class="section-title gallery-year-title">${esc(y.year)}</h2>${eventsHtml}</section>` : '';
  }).join('');

  return `
    <nav class="filter-pills gallery-year-filter" aria-label="${tr(lang, '연도별 보기', 'Filter by year')}">${pills}</nav>
    ${yearsHtml || emptyNote(lang, '해당 연도의 사진이 없습니다.', 'No photos for this year.')}`;
}

/* ---------- rights ---------- */
function rightsBody(data, lang) {
  const charter = arr(data?.recruiting?.charter_ko);
  const rights = data?.documents?.rights || {};
  const cards = charter.map((c, i) => `
    <article class="charter-card card">
      <span class="charter-num">${esc(c.num || String(i + 1).padStart(2, '0'))}</span>
      <h3 class="card-title">${esc(pick(c.heading, lang))}</h3>
      <p class="card-text">${esc(pick(c.body, lang))}</p>
    </article>`).join('');
  const articles = arr(rights.articles).map((a) => `
    <article class="rights-article">
      <h3 class="card-title">${esc(pick(a?.heading, lang))}</h3>
      ${renderParagraphs(pick(a?.body, lang))}
    </article>`).join('');
  const appendix = pick(rights.appendix, lang);
  return `
    ${cards ? `
      <section class="charter-section">
        <h2 class="section-title">${tr(lang, '학생 권리장전 5개 조항 — 한눈에 보기', 'Student Bill of Rights — 5 Articles at a Glance')}</h2>
        <p class="section-lead">${tr(lang, 'MultiplexON 연구실이 모든 구성원에게 약속하는 다섯 가지 원칙입니다.', 'Five commitments MultiplexON Lab makes to every member.')}</p>
        <div class="charter-grid-5">${cards}</div>
      </section>` : ''}
    ${articles || rights.intro ? `
      <section class="rights-full card prose">
        <h2 class="section-title">${esc(pick(rights.title, lang) || tr(lang, '연구실 인권 헌장 전문', 'Full Human Rights Charter'))}</h2>
        ${renderParagraphs(pick(rights.intro, lang), 'prose-p prose-lead')}
        ${articles}
        ${splitParagraphs(appendix).length ? `<footer class="rights-appendix"><h3 class="card-title">${tr(lang, '부칙', 'Appendix')}</h3>${renderParagraphs(appendix)}</footer>` : ''}
      </section>` : ''}
    ${!cards && !articles && !rights.intro ? emptyNote(lang, '헌장 내용을 준비 중입니다.', 'The charter is being prepared.') : ''}`;
}

/* ---------- blog ---------- */
function blogPosts(data) {
  return arr(data?.documents?.blog).filter((p) => p && p.id != null).slice().sort((a, b) => Number(a.id) - Number(b.id));
}
function blogTitles(post, koMap, lang) {
  const ko = koMap?.[String(post.id)] || {};
  const en = String(post.title || '').trim();
  const koTitle = String(ko.title_ko || '').trim();
  return { ko, primary: (lang === 'ko' ? koTitle || en : en || koTitle), secondary: (lang === 'ko' ? (koTitle ? en : '') : koTitle) };
}
function blogListHtml(data, base, lang) {
  const posts = blogPosts(data);
  const koMap = data?.recruiting?.blog_ko || {};
  if (!posts.length) return emptyNote(lang, '등록된 에세이가 없습니다.', 'No essays have been posted yet.');
  const cards = posts.map((post) => {
    const { ko, primary, secondary } = blogTitles(post, koMap, lang);
    const sumMain = lang === 'ko' ? ko.summary_ko || ko.summary_en : ko.summary_en || ko.summary_ko;
    const sumAlt = lang === 'ko' ? ko.summary_en : ko.summary_ko;
    const href = `${base}/${encodeURIComponent(post.id)}`;
    return `
      <article class="bento-cell span-4 blog-card">
        <div class="cv-stack">
          <div class="media-meta-row">
            <span class="badge badge-domain">Essay ${esc(String(post.id).padStart(2, '0'))}</span>
            ${post.date ? `<span class="badge badge-year">${esc(post.date)}</span>` : ''}
          </div>
          <h3 class="card-title"><a href="${esc(href)}" class="card-link">${esc(primary)}</a></h3>
          ${secondary ? `<p class="blog-card-subtitle" lang="${lang === 'ko' ? 'en' : 'ko'}">${esc(secondary)}</p>` : ''}
          ${sumMain ? `<p class="card-text">${esc(sumMain)}</p>` : ''}
          ${sumAlt && sumAlt !== sumMain ? `<p class="card-text card-text-alt" lang="${lang === 'ko' ? 'en' : 'ko'}">${esc(sumAlt)}</p>` : ''}
        </div>
        <div class="card-actions"><a href="${esc(href)}" class="btn btn-sm btn-outline">${tr(lang, '에세이 읽기 →', 'Read essay →')}</a></div>
      </article>`;
  }).join('');
  return `
    <section class="blog-index">
      <h2 class="section-title">Blog from W.P.</h2>
      <p class="section-lead">${tr(lang, '박욱 교수가 학생들에게 전하는 연구·성장·진로에 관한 9편의 에세이. 원문은 영어이며, 한국어 핵심 요약을 함께 제공합니다.', 'Nine essays from Prof. Wook Park on research, growth and careers — each with a Korean key-message summary.')}</p>
      <div class="bento-grid blog-grid">${cards}</div>
    </section>`;
}
function blogReaderHtml(data, postId, base, lang) {
  const posts = blogPosts(data);
  const idx = posts.findIndex((p) => String(p.id) === String(postId));
  if (idx < 0) {
    return `${emptyNote(lang, '요청하신 에세이를 찾을 수 없습니다. 아래 목록에서 선택해 주세요.', 'That essay could not be found. Please choose one below.')}${blogListHtml(data, base, lang)}`;
  }
  const post = posts[idx];
  const { ko } = blogTitles(post, data?.recruiting?.blog_ko || {}, lang);
  const paragraphs = splitParagraphs(arr(post.paragraphs).length ? post.paragraphs : post.content);
  const navLink = (p, dir) => {
    if (!p) return `<span class="essay-nav-link is-disabled" aria-hidden="true"></span>`;
    const t = blogTitles(p, data?.recruiting?.blog_ko || {}, lang).primary;
    return `<a href="${esc(`${base}/${encodeURIComponent(p.id)}`)}" class="essay-nav-link essay-nav-${dir} card" rel="${dir}">
      <span class="essay-nav-label">${dir === 'prev' ? tr(lang, '← 이전 에세이', '← Previous essay') : tr(lang, '다음 에세이 →', 'Next essay →')}</span>
      <span class="essay-nav-title">${esc(t)}</span></a>`;
  };
  return `
    <article class="essay-reader prose">
      <p class="essay-back"><a href="${esc(base)}" class="btn btn-sm btn-outline">← ${tr(lang, '에세이 목록', 'All essays')}</a></p>
      <header class="essay-header">
        <div class="media-meta-row">
          <span class="badge badge-domain">Blog from W.P. · ${esc(String(post.id).padStart(2, '0'))} / ${esc(String(posts.length).padStart(2, '0'))}</span>
          ${post.date ? `<span class="badge badge-year">${esc(post.date)}</span>` : ''}
        </div>
        <h2 class="page-title essay-title">${esc(post.title || ko.title_ko || '')}</h2>
      </header>
      ${ko.title_ko || ko.summary_ko || ko.summary_en ? `
        <aside class="callout essay-summary-callout" aria-label="${tr(lang, '15초 핵심 요약', '15-second summary')}">
          <span class="callout-kicker">${tr(lang, '⏱ 15초 핵심 요약', '⏱ 15-second key message')}</span>
          ${ko.title_ko ? `<h3 class="card-title" lang="ko">${esc(ko.title_ko)}</h3>` : ''}
          ${ko.summary_ko ? `<p class="callout-text" lang="ko">${esc(ko.summary_ko)}</p>` : ''}
          ${ko.summary_en && (lang === 'en' || !ko.summary_ko) ? `<p class="callout-text" lang="en">${esc(ko.summary_en)}</p>` : ''}
        </aside>` : ''}
      <div class="essay-body" lang="en">
        ${paragraphs.length ? renderParagraphs(paragraphs) : emptyNote(lang, '본문을 준비 중입니다.', 'Full text coming soon.')}
      </div>
      ${renderVideoEmbed(post.youtube_embed, post.title || 'Blog from W.P.')}
      <nav class="essay-nav" aria-label="${tr(lang, '에세이 이동', 'Essay navigation')}">
        ${navLink(posts[idx - 1], 'prev')}${navLink(posts[idx + 1], 'next')}
      </nav>
    </article>`;
}
function blogBody(data, postId, base, lang) {
  const id = String(postId ?? '').split('/').filter(Boolean).pop() || '';
  return id && id !== 'blog' ? blogReaderHtml(data, id, base, lang) : blogListHtml(data, base, lang);
}

/* ---------- news ---------- */
function normalizeLinks(links) {
  if (!links) return [];
  const list = Array.isArray(links) ? links
    : typeof links === 'object' ? Object.entries(links).map(([label, url]) => ({ label, url })) : [links];
  return list.map((l) => (typeof l === 'string' ? { label: '', url: l } : { label: l?.label || l?.text || l?.title || '', url: l?.url || l?.href || '' }))
    .map((l) => ({ label: String(l.label).trim(), url: safeUrl(l.url) })).filter((l) => l.url);
}
function newsBody(data, lang) {
  const items = arr(data?.news?.items).filter((n) => n && (n.text || n.date));
  if (!items.length) return emptyNote(lang, '등록된 소식이 없습니다.', 'No news has been posted yet.');
  const groups = new Map();
  items.forEach((n) => {
    const year = String(n.year || String(n.date || '').slice(0, 4) || tr(lang, '기타', 'Other'));
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(n);
  });
  const ordered = [...groups.entries()].sort((a, b) => (Number(b[0]) || 0) - (Number(a[0]) || 0));
  return ordered.map(([year, list]) => `
    <section class="news-year-group">
      <h2 class="section-title news-year-title">${esc(year)} <span class="badge badge-year">${list.length}</span></h2>
      <ul class="news-list">
        ${list.map((n) => {
          const links = normalizeLinks(n.links).map((l, i) => {
            const ext = /^https?:/i.test(l.url);
            return `<a href="${esc(l.url)}" class="btn btn-sm btn-outline"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(l.label || `${tr(lang, '관련 링크', 'Link')} ${i + 1}`)}</a>`;
          }).join('');
          return `
            <li class="news-item card${n.is_new ? ' is-new' : ''}">
              <div class="media-meta-row">
                ${n.date ? `<time class="badge badge-year">${esc(n.date)}</time>` : ''}
                ${n.is_new ? '<span class="badge badge-new">NEW</span>' : ''}
              </div>
              <p class="card-text news-text">${esc(pick(n.text, lang))}</p>
              ${links ? `<div class="card-actions">${links}</div>` : ''}
            </li>`;
        }).join('')}
      </ul>
    </section>`).join('');
}

/* ---------- media ---------- */
function mediaBody(data, lang) {
  const items = arr(data?.documents?.media);
  if (!items.length) return emptyNote(lang, '등록된 언론 보도 자료가 없습니다.', 'No media coverage has been posted yet.');
  const cards = items.map((item, idx) => {
    const dateStr = item.date || item.year || '';
    const source = String(item.source || 'Press').replace(/^[A-Za-z]{3},\s*\d{4},\s*/, '');
    const titleEn = String(item.title || '').trim();
    const titleKo = String(item.title_ko || '').trim();
    const primaryTitle = lang === 'ko' ? (titleKo || titleEn) : (titleEn || titleKo);
    const secondaryTitle = lang === 'ko' && titleKo && titleEn ? titleEn : '';
    const img = normalizeImage(item.image, `${primaryTitle || 'Press Feature'} (${source}${dateStr ? `, ${dateStr}` : ''})`);
    const url = safeUrl(item.url);
    const external = url && !url.includes('multiplexon.com/document_1/media');
    const paperUrl = safeUrl(item.paper_url);
    return `
      <article class="bento-cell ${idx < 2 ? 'span-6' : 'span-4'} media-card">
        <div class="cv-stack">
          ${img ? `<div class="specimen-viewport">${renderLightboxImg(img)}</div>` : ''}
          <div class="media-meta-row">
            <span class="badge badge-domain">${esc(source)}</span>
            ${dateStr ? `<span class="badge badge-year">${esc(dateStr)}</span>` : ''}
          </div>
          <h3 class="card-title">${esc(primaryTitle)}</h3>
          ${secondaryTitle ? `<p class="card-text card-text-alt" lang="en">${esc(secondaryTitle)}</p>` : ''}
        </div>
        ${external || paperUrl ? `<div class="card-actions">
          ${external ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">${tr(lang, '기사 원문 보기 ↗', 'Read press article ↗')}</a>` : ''}
          ${paperUrl ? `<a href="${esc(paperUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">${esc(item.paper_label || tr(lang, '관련 논문 (DOI) ↗', 'Related Paper (DOI) ↗'))}</a>` : ''}
        </div>` : ''}
      </article>`;
  }).join('');
  return `<div class="bento-grid media-grid">${cards}</div>`;
}

/* ---------- faq ---------- */
function accordionHtml(list, prefix, openFirst) {
  return `<div class="accordion">${list.map((item, idx) => {
    const open = openFirst && idx === 0;
    const pid = `${prefix}-panel-${idx}`;
    return `
      <div class="accordion-item card${open ? ' is-open' : ''}">
        <button type="button" class="accordion-header accordion-trigger" aria-expanded="${open ? 'true' : 'false'}" aria-controls="${pid}">
          <span class="accordion-title">Q${idx + 1}. ${esc(item.q)}</span>
          <span class="accordion-icon" aria-hidden="true"></span>
        </button>
        <div class="accordion-content accordion-panel" id="${pid}" role="region"${open ? '' : ' hidden'}>
          <div class="accordion-body">${renderParagraphs(item.a, 'card-text')}</div>
        </div>
      </div>`;
  }).join('')}</div>`;
}
function faqBody(data, lang) {
  const recruit = arr(data?.recruiting?.recruiting_faq).map((f) => ({ q: pick(f?.q, lang), a: pick(f?.a, lang) })).filter((f) => f.q);
  const policy = arr(data?.documents?.faq).map((f) => ({ q: pick(f?.question, lang), a: pick(f?.answer, lang) })).filter((f) => f.q);
  const email = data?.meta?.contact?.email || DEFAULT_EMAIL;
  if (!recruit.length && !policy.length) return emptyNote(lang, '등록된 질문이 없습니다.', 'No FAQs have been posted yet.');
  return `
    ${recruit.length ? `
      <section class="faq-section">
        <h2 class="section-title">${tr(lang, '지원 · 연구실 생활 Q&A', 'Joining & Lab Life Q&A')}</h2>
        <p class="section-lead">${tr(lang, '학부연구생·대학원 지원자들이 가장 많이 묻는 질문입니다.', 'The questions prospective interns and graduate students ask most.')}</p>
        ${accordionHtml(recruit, 'faq-recruit', true)}
      </section>` : ''}
    ${policy.length ? `
      <section class="faq-section">
        <h2 class="section-title">${tr(lang, '수업 · 연구실 운영 Q&A', 'Course & Lab Policy Q&A')}</h2>
        <p class="section-lead">${tr(lang, '강의, 추천서, 면담 등 운영 정책에 관한 안내입니다.', 'Guidance on courses, recommendation letters, meetings and lab policies.')}</p>
        ${accordionHtml(policy, 'faq-policy', !recruit.length)}
      </section>` : ''}
    <p class="faq-more card-text">${tr(lang, '원하는 답을 찾지 못하셨나요?', 'Didn’t find your answer?')}
      <a href="mailto:${esc(email)}" class="text-link">${esc(email)}</a></p>`;
}

/* ---------- exports: Lab Life hub ---------- */
export function renderLife(data = {}, subRoute = 'gallery', appState = {}) {
  const lang = langOf(data);
  const parts = routeParts('life', subRoute);
  const tab = LIFE_TABS.some((t) => t.id === parts[0]) ? parts[0] : 'gallery';
  const arg = parts[1] || '';
  let body = '';
  if (tab === 'rights') body = rightsBody(data, lang);
  else if (tab === 'blog') body = blogBody(data, arg, '#life/blog', lang);
  else if (tab === 'news') {
    body = `<h2 class="section-title">${tr(lang, '연구실 소식', 'Lab News')}</h2>
      <p class="section-lead">${tr(lang, '수상, 논문 게재, 졸업과 새 식구 소식까지 — 연구실의 기록입니다.', 'Awards, papers, graduations and new members — the lab’s running record.')}</p>${newsBody(data, lang)}`;
  } else if (tab === 'media') {
    body = `<h2 class="section-title">${tr(lang, '언론 보도', 'Media & Press Coverage')}</h2>
      <p class="section-lead">${tr(lang, '신문·방송·대학 매체에 소개된 MultiplexON의 연구 성과입니다.', 'Newspaper, broadcast and university features on MultiplexON research.')}</p>${mediaBody(data, lang)}`;
  } else {
    body = `<h2 class="section-title">${tr(lang, '사진으로 보는 연구실', 'The Lab in Photos')}</h2>
      <p class="section-lead">${tr(lang, '학회, MT, 졸업식, 회식 — 실제 연구실의 모습입니다. 사진을 누르면 크게 볼 수 있어요.', 'Conferences, retreats, graduations and dinners — real lab moments. Tap any photo to enlarge.')}</p>${galleryBody(data, arg, '#life/gallery', lang)}`;
  }
  const tabs = LIFE_TABS.map((t) => `<a href="#life/${t.id}" class="subnav-tab${t.id === tab ? ' is-active' : ''}"${t.id === tab ? ' aria-current="page"' : ''}>${esc(tr(lang, t.ko, t.en))}</a>`).join('');
  return `
    <div class="recruiting-page" data-docs-view="life">
      <section class="section life-hub">
        <div class="container">
          <header class="page-header">
            <span class="bento-kicker">${esc(AFF[lang])}</span>
            <h1 class="page-title">${tr(lang, '연구실 문화 &amp; 일상', 'Lab Life, Culture &amp; Mentoring')}</h1>
            <p class="page-subtitle">${tr(lang, 'Lab Life, Culture & Mentoring — 어떤 사람들과, 어떤 원칙으로, 어떻게 성장하는지 직접 확인하세요.', 'See who we are, the principles we work by, and how students grow here.')}</p>
          </header>
          <nav class="subnav-tabs" aria-label="${tr(lang, '연구실 생활 메뉴', 'Lab life sections')}">${tabs}</nav>
          <div class="life-quick-links">
            <a href="#faq" class="btn btn-sm btn-outline">${tr(lang, '자주 묻는 질문', 'FAQ')}</a>
            <a href="#class" class="btn btn-sm btn-outline">${tr(lang, '강의', 'Courses')}</a>
            <a href="#contact" class="btn btn-sm btn-outline">${tr(lang, '오시는 길', 'Contact')}</a>
            <a href="#join/chat" class="btn btn-recruit btn-sm" data-track="life_header_chat_cta">${tr(lang, '☕ 커피챗 신청', '☕ Coffee Chat')}</a>
          </div>
          <div class="life-panel" data-life-tab="${esc(tab)}">${body}</div>
          ${chatCta(lang)}
        </div>
      </section>
    </div>`;
}

/* ---------- exports: standalone routes ---------- */
export function renderMedia(data = {}, subRoute = '', appState = {}) {
  const lang = langOf(data);
  return pageShell(lang, 'media', {
    title: tr(lang, '언론 보도', 'Media & Press Coverage'),
    subtitle: tr(lang, '신문·방송·대학 매체에 소개된 MultiplexON 연구실의 연구 성과입니다.', 'Selected newspaper features, university spotlights and broadcast coverage of MultiplexON discoveries.'),
    body: mediaBody(data, lang),
  });
}

export function renderFaq(data = {}, subRoute = '', appState = {}) {
  const lang = langOf(data);
  return pageShell(lang, 'faq', {
    title: tr(lang, '자주 묻는 질문', 'Frequently Asked Questions'),
    subtitle: tr(lang, '지원, 연구실 생활, 수업과 운영 정책까지 한곳에 모았습니다.', 'Joining the lab, daily life, courses and policies — all in one place.'),
    body: faqBody(data, lang),
  });
}

export function renderBlog(data = {}, postId = '', appState = {}) {
  const lang = langOf(data);
  const parts = routeParts('blog', postId);
  return pageShell(lang, 'blog', {
    title: 'Blog from W.P.',
    subtitle: tr(lang, '박욱 교수가 학생들에게 전하는 연구와 성장에 관한 에세이', 'Essays from Prof. Wook Park on research, growth and careers'),
    body: blogBody(data, parts[parts.length - 1] || '', '#blog', lang),
  });
}

export function renderRights(data = {}, subRoute = '', appState = {}) {
  const lang = langOf(data);
  return pageShell(lang, 'rights', {
    title: tr(lang, '학생 권리장전 · 인권 헌장', 'Student Bill of Rights & Human Rights Charter'),
    subtitle: tr(lang, '존중받으며 연구할 권리 — 연구실이 문서로 약속합니다.', 'The right to do research with respect — a commitment we put in writing.'),
    body: rightsBody(data, lang),
  });
}

export function renderGallery(data = {}, selectedYear = '', appState = {}) {
  const lang = langOf(data);
  const parts = routeParts('gallery', selectedYear);
  return pageShell(lang, 'gallery', {
    title: tr(lang, '사진 갤러리', 'Photo Gallery'),
    subtitle: tr(lang, '학회, MT, 졸업식 등 연구실의 실제 모습입니다. 사진을 누르면 크게 볼 수 있습니다.', 'Conferences, retreats and graduations — real lab moments. Tap any photo to enlarge.'),
    body: galleryBody(data, parts[parts.length - 1] || '', '#gallery', lang),
  });
}

export function renderNewsAll(data = {}, subRoute = '', appState = {}) {
  const lang = langOf(data);
  return pageShell(lang, 'news', {
    title: tr(lang, '연구실 소식', 'Lab News Archive'),
    subtitle: tr(lang, '수상, 논문 게재, 졸업 및 새 구성원 소식을 연도별로 정리했습니다.', 'Awards, publications, graduations and new members, organized by year.'),
    body: newsBody(data, lang),
  });
}

export function renderClass(data = {}, subRoute = '', appState = {}) {
  const lang = langOf(data);
  const cls = data?.meta?.classes || {};
  const groups = arr(cls.courses).map((group) => {
    const items = arr(group?.items).map((it) => {
      const label = typeof it === 'string' ? it
        : [it?.code, pick(it?.title || it?.name, lang), it?.semester].filter(Boolean).join(' · ');
      return label ? `<li class="course-item">${esc(label)}</li>` : '';
    }).join('');
    return `
      <article class="bento-cell span-6 course-group">
        <h2 class="card-title">${esc(pick(group?.category, lang) || tr(lang, '강의', 'Courses'))}</h2>
        ${items ? `<ul class="course-list">${items}</ul>` : emptyNote(lang, '등록된 과목이 없습니다.', 'No courses listed.')}
      </article>`;
  }).join('');
  const video = renderVideoEmbed(cls.youtube_embed, pick(cls.title, lang) || 'MultiplexON Lecture');
  const body = `
    ${groups ? `<div class="bento-grid course-grid">${groups}</div>` : emptyNote(lang, '강의 정보를 준비 중입니다.', 'Course information is being prepared.')}
    ${video ? `<section class="class-video"><h2 class="section-title">${tr(lang, '강의 영상', 'Lecture Video')}</h2>${video}</section>` : ''}
    <p class="card-text class-faq-link">${tr(lang, '수업 관련 문의는', 'For course-related questions, see the')}
      <a href="#faq" class="text-link">${tr(lang, '자주 묻는 질문', 'FAQ')}</a>${tr(lang, '을 먼저 확인해 주세요.', '.')}</p>`;
  return pageShell(lang, 'class', {
    title: pick(cls.title, lang) || tr(lang, '강의', 'Courses & Teaching'),
    subtitle: pick(cls.description, lang) || tr(lang, '박욱 교수가 담당하는 학부·대학원 강의입니다.', 'Undergraduate and graduate courses taught by Prof. Wook Park.'),
    body,
  });
}

export function renderContact(data = {}, subRoute = '', appState = {}) {
  const lang = langOf(data);
  const c = data?.meta?.contact || {};
  const email = c.email || DEFAULT_EMAIL;
  const lat = Number.isFinite(Number(c.lat)) && c.lat !== '' && c.lat != null ? Number(c.lat) : DEFAULT_LAT;
  const lng = Number.isFinite(Number(c.lng)) && c.lng !== '' && c.lng != null ? Number(c.lng) : DEFAULT_LNG;
  const d = 0.006;
  const osm = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d / 2}%2C${lng + d}%2C${lat + d / 2}&layer=mapnik&marker=${lat}%2C${lng}`;
  const labName = c.lab_name || 'MultiplexON Lab';
  const tel = (num) => (num ? `<a href="tel:${esc(String(num).replace(/[^\d+]/g, ''))}" class="text-link">${esc(num)}</a>` : '');
  const rows = [
    [tr(lang, '연구실', 'Laboratory'), esc(labName)],
    [tr(lang, '지도교수', 'Principal Investigator'), esc(c.professor || tr(lang, '박욱 교수', 'Prof. Wook Park'))],
    [tr(lang, '소속', 'Affiliation'), `${esc(c.affiliation_ko || AFF.ko)}<br><span class="contact-alt" lang="en">${esc(c.affiliation_en || AFF.en)}</span>`],
    [tr(lang, '주소', 'Address'), `${esc(c.address_ko || '경기도 용인시 기흥구 덕영대로 1732 경희대학교 국제캠퍼스 전자정보대학')}<br><span class="contact-alt" lang="en">${esc(c.address_en || 'College of Electronics & Information, Kyung Hee University Global Campus, 1732 Deogyeong-daero, Giheung-gu, Yongin-si, Gyeonggi-do, Korea')}</span>`],
    [tr(lang, '교수 연구실', 'Professor’s Office'), esc(c.office || tr(lang, '전자정보대학관 403호', 'Room 403, Electronic Information College'))],
    [tr(lang, '실험실', 'Lab Rooms'), esc(c.lab_room || tr(lang, '전자정보대학관 310-1호, 557호', 'Rooms 310-1 & 557, Electronic Information College'))],
    [tr(lang, '이메일', 'Email'), `<a href="mailto:${esc(email)}" class="text-link">${esc(email)}</a>`],
    [tr(lang, '교수실 전화', 'Office Phone'), tel(c.phone)],
    [tr(lang, '실험실 전화', 'Lab Phone'), tel(c.lab_phone)],
  ].filter(([, v]) => v).map(([k, v]) => `<div class="contact-row"><dt class="contact-label">${k}</dt><dd class="contact-value">${v}</dd></div>`).join('');
  const body = `
    <div class="bento-grid contact-grid">
      <article class="bento-cell span-6 contact-card">
        <h2 class="card-title">${tr(lang, '연락처 및 위치', 'Contact & Location')}</h2>
        <dl class="contact-list">${rows}</dl>
        <div class="card-actions">
          <a href="#join/chat" class="btn btn-recruit" data-track="contact_chat_cta">${tr(lang, '☕ 커피챗 신청하기', '☕ Book a Coffee Chat')}</a>
          <a href="mailto:${esc(email)}" class="btn btn-outline">${tr(lang, '이메일 보내기', 'Send an email')}</a>
        </div>
      </article>
      <article class="bento-cell span-6 contact-map-card">
        <h2 class="card-title">${tr(lang, '오시는 길 — 경희대학교 국제캠퍼스', 'Directions — Kyung Hee Univ. Global Campus')}</h2>
        <div class="map-embed-wrap">
          <iframe src="${esc(osm)}" class="map-frame" title="${esc(`${labName} — OpenStreetMap`)}" loading="lazy" referrerpolicy="no-referrer"></iframe>
        </div>
        <div class="card-actions">
          <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">Google Maps ↗</a>
          <a href="https://map.kakao.com/link/map/${encodeURIComponent(labName)},${lat},${lng}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">${tr(lang, '카카오맵 ↗', 'Kakao Map ↗')}</a>
          <a href="https://www.openstreetmap.org/?mlat=${lat}&amp;mlon=${lng}#map=17/${lat}/${lng}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">OpenStreetMap ↗</a>
        </div>
        <p class="card-text contact-hint">${tr(lang, '방문 전 이메일이나 커피챗으로 일정을 먼저 잡아 주시면 더 편하게 안내해 드릴 수 있습니다.', 'Please arrange a time by email or coffee chat before visiting so we can welcome you properly.')}</p>
      </article>
      <article class="bento-cell span-12 press-kit-card">
        <span class="bento-kicker">${tr(lang, '언론 · 학회 · 산학협력 공식 프레스킷', 'Official Media, Seminar & Industry Press Kit')}</span>
        <h2 class="card-title">${tr(lang, '공식 브랜드 로고 · 교수 프로필 · 기관 표기 안내', 'Official Brand Assets, PI Portrait & Approved Citation')}</h2>
        <p class="card-text">${tr(lang,
          '기사 보도, 초청 강연 포스터, 산학협력 자료 작성 시 아래 공식 명칭과 벡터 로고(외부 폰트 의존성 0%) 및 교수 프로필 사진을 바로 다운로드해 사용하실 수 있습니다. 공식 표기: 경희대학교 전자공학과 MultiplexON 연구실 (Multiplexed Optics & Nanosystems Laboratory, 박욱 교수).',
          'For press articles, seminar posters, and joint R&D materials, download our official outlined vector logos and PI portrait below. Approved citation: MultiplexON Lab (Multiplexed Optics & Nanosystems Laboratory), Prof. Wook Park, Department of Electronic Engineering, Kyung Hee University.')}</p>
        <div class="card-actions">
          <a href="./assets/images/brand/logo_master_light.svg" download class="btn btn-sm btn-outline">${tr(lang, '공식 로고 SVG (밝은 배경)', 'Master Logo SVG (Light)')}</a>
          <a href="./assets/images/brand/logo_master_light.pdf" download class="btn btn-sm btn-outline">${tr(lang, '인쇄용 벡터 PDF', 'Print Vector PDF')}</a>
          <a href="./assets/images/brand/logo_master_light.png" download class="btn btn-sm btn-outline">${tr(lang, '고해상도 PNG (2200px)', 'High-Res PNG (2200px)')}</a>
          <a href="./assets/images/brand/logo_master_dark.svg" download class="btn btn-sm btn-outline">${tr(lang, '다크 배경용 로고 SVG', 'Master Logo SVG (Dark)')}</a>
          <a href="./assets/images/members/professor_wook_park.jpg" download class="btn btn-sm btn-outline">${tr(lang, '박욱 교수 프로필 사진', 'PI Portrait (Prof. Wook Park)')}</a>
          <a href="mailto:${esc(email)}?subject=${encodeURIComponent('[MultiplexON Press / Lecture / R&D] 언론취재·강연·산학협력 문의')}" class="btn btn-sm btn-primary">${tr(lang, '언론 · 강연 · 산학협력 직통 문의 ↗', 'Media, Seminar & Industry Inquiry ↗')}</a>
        </div>
      </article>
    </div>`;
  return pageShell(lang, 'contact', {
    title: tr(lang, '오시는 길 · 연락처', 'Contact & Directions'),
    subtitle: tr(lang, '경희대학교 국제캠퍼스 전자정보대학관 403호 (실험실 310-1호 · 557호)', 'Room 403 (Labs 310-1 & 557), Electronic Information College, Kyung Hee University Global Campus'),
    body,
    cta: false,
  });
}

/* ---------- events ---------- */
const boundRoots = new WeakSet();

function setAccordion(item, open) {
  item.classList.toggle('is-open', open);
  const trigger = item.querySelector('.accordion-trigger');
  if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  const panel = item.querySelector('.accordion-panel');
  if (panel) panel.toggleAttribute('hidden', !open);
}

export function bindDocsGalleryEvents(rootEl, ctx = {}) {
  const root = rootEl || (typeof document !== 'undefined' ? document.body : null);
  if (!root || boundRoots.has(root)) return;
  boundRoots.add(root);

  root.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const scope = target?.closest('[data-docs-view]');
    if (!scope) return;
    const trigger = target.closest('.accordion-trigger');
    if (trigger && scope.contains(trigger)) {
      const item = trigger.closest('.accordion-item');
      if (!item) return;
      event.preventDefault();
      setAccordion(item, !item.classList.contains('is-open'));
      return;
    }
    const tracked = target.closest('[data-track]');
    if (tracked && typeof ctx?.track === 'function') {
      try { ctx.track(tracked.getAttribute('data-track'), { view: scope.getAttribute('data-docs-view') || '', lang: ctx?.data?.lang || '' }); } catch (_) { /* analytics must never break navigation */ }
    }
  });

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target || !target.matches('figure.gallery-item[data-lightbox-src]') || !target.closest('[data-docs-view]')) return;
    event.preventDefault();
    target.click();
  });
}
