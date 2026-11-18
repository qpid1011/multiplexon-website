/**
 * MultiplexON Lab — Home (6-Stage Recruiting Funnel), Research & Notice View Renderers
 * Department of Electronic Engineering, Kyung Hee University (경희대학교 전자공학과)
 * Contract: render*(data, subRoute, appState) -> HTML string (data.lang is 'ko' | 'en').
 * Pure ES module: zero inline styles; every image carries data-lightbox-src for app.js's <dialog> lightbox.
 */

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const arr = (v) => (Array.isArray(v) ? v : []);
const getLang = (data, appState) => ((data?.lang || appState?.lang) === 'en' ? 'en' : 'ko');
const pick = (lang, ko, en) => (lang === 'ko' ? ko : en);
const slugKey = (raw) => String(raw ?? '').trim().toLowerCase().replace(/_/g, '-');
const stripLeadingDate = (text) => String(text ?? '').replace(/^\(\d{4}(?:\.\d{1,2})?\)\s*/, '').trim();

/** Localized pick for a plain value or a { ko, en } pair. */
function t(value, lang) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value[lang] ?? value.ko ?? value.en ?? '';
  return value ?? '';
}

/** Localized list pick for an array or a { ko:[], en:[] } pair. */
function tl(value, lang) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return arr(value[lang] ?? value.ko ?? value.en);
  return [];
}

function normalizeImage(entry, fallbackCaption = '') {
  if (!entry) return null;
  if (typeof entry === 'string') return entry.trim() ? { src: entry.trim(), caption: fallbackCaption } : null;
  const src = String(entry.src || entry.image || entry.url || '').trim();
  if (!src) return null;
  return { src, caption: String(entry.caption || entry.title || entry.alt || fallbackCaption || '').trim() };
}

function lightboxImg(entry, caption = '', cls = 'card-img lightbox-img', loading = 'lazy') {
  const img = normalizeImage(entry, caption);
  if (!img) return '';
  return `<img src="${esc(img.src)}" alt="${esc(img.caption)}" class="${cls}" loading="${loading}" data-lightbox-src="${esc(img.src)}" data-lightbox-caption="${esc(img.caption)}">`;
}

function paragraphs(value, cls = 'prose-p') {
  const list = Array.isArray(value) ? value : String(value ?? '').split(/\n{2,}/);
  return list.map((p) => String(p ?? '').trim()).filter(Boolean)
    .map((p) => `<p class="${cls}">${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
}

function sectionHead(eyebrow, title, lead = '') {
  return `
    <header class="section-header">
      ${eyebrow ? `<span class="section-eyebrow">${esc(eyebrow)}</span>` : ''}
      <h2 class="section-title">${esc(title)}</h2>
      ${lead ? `<p class="section-lead">${esc(lead)}</p>` : ''}
    </header>`;
}

const chipList = (items, cls) => (items.length
  ? `<ul class="${cls}">${items.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : '');

/* --------------------------------------------------------------------------
   Shared: Convergence Manifesto, Patent Spotlight & 30-Second Pitch Cards
   -------------------------------------------------------------------------- */
function renderManifestoAndIp(rec, data, lang) {
  const mf = rec.manifesto || {};
  const sp = rec.patent_spotlight || {};
  const paras = arr(mf.paragraphs).map((p) => `<p>${esc(t(p, lang))}</p>`).join('');
  const pillars = arr(mf.pillars).map((pl) => `
      <li class="manifesto-pillar">
        <span class="track-tag">${esc(t(pl.tag, lang))}</span>
        <h3>${esc(t(pl.title, lang))}</h3>
        <p>${esc(t(pl.body, lang))}</p>
      </li>`).join('');
  const pats = arr(data.publications?.patents);
  const usCnt = pats.filter((x) => x.country === 'US').length || 16;
  const krCnt = pats.filter((x) => x.country === 'KR').length || 14;
  const totCnt = pats.length || 30;
  const ipMetrics = arr(sp.metrics).length ? arr(sp.metrics) : [
    { value: String(totCnt), label: { ko: '검증된 특허 포트폴리오', en: 'Verified Patent Portfolio' } },
    { value: String(usCnt), label: { ko: '미국 특허 · 출원 (USPTO)', en: 'U.S. USPTO Patents & Apps' } },
    { value: String(krCnt), label: { ko: '대한민국 등록특허 (KIPO)', en: 'Korean KIPO Patents' } },
  ];
  const proofs = arr(sp.proof_points).map((pt) => `<li>${esc(t(pt, lang))}</li>`).join('');
  const mfTitle = t(mf.title, lang);
  const mfCap = t(mf.image_caption, lang) || mfTitle;
  const ety = mf.etymology || {};
  const etyHtml = t(ety.body, lang) ? `
          <aside class="etymology-callout">
            <span class="track-tag">${esc(t(ety.tag, lang))}</span>
            <h3 class="card-title">${esc(t(ety.title, lang))}</h3>
            <p>${esc(t(ety.body, lang))}</p>
          </aside>` : '';
  const licSubject = encodeURIComponent('[MultiplexON Tech-Transfer / R&D] 기술이전·산학공동연구 문의');
  return `
    <section class="section" id="manifesto" aria-labelledby="home-manifesto-title">
      <div class="container">
        ${mfTitle ? `
        <div class="manifesto-shell">
          <div class="manifesto-top">
            <div class="manifesto-copy">
              <span class="section-eyebrow">${esc(t(mf.eyebrow, lang))}</span>
              <h2 class="section-title" id="home-manifesto-title">${esc(mfTitle)}</h2>
              ${paras}
              ${t(mf.major_fit_note, lang) ? `<p class="major-fit-note">${esc(t(mf.major_fit_note, lang))}</p>` : ''}
            </div>
            ${mf.image ? `<figure class="manifesto-visual">${lightboxImg(mf.image, mfCap, 'pathway-img lightbox-img')}<figcaption>${esc(mfCap)}</figcaption></figure>` : ''}
          </div>
          ${etyHtml}
          ${pillars ? `<ul class="manifesto-pillars">${pillars}</ul>` : ''}
        </div>` : ''}
        <div class="patent-spotlight-band" aria-labelledby="home-ip-title">
          <header>
            <span class="section-eyebrow">${esc(t(sp.eyebrow, lang) || pick(lang, '원천 특허 & 산업 임팩트', 'Frontier IP & Industrial Impact'))}</span>
            <h2 class="section-title" id="home-ip-title">${esc(t(sp.title, lang) || pick(lang, '논문을 넘어 산업과 직결되는 미국·한국 원천 특허', 'Beyond Papers: Industry-Connected U.S. & Korean Patents'))}</h2>
            ${t(sp.lead, lang) ? `<p class="section-lead">${esc(t(sp.lead, lang))}</p>` : ''}
          </header>
          <dl class="ip-metrics">
            ${ipMetrics.map((m) => `<div class="ip-metric"><dt>${esc(t(m.label, lang))}</dt><dd>${esc(m.value)}</dd></div>`).join('')}
          </dl>
          ${proofs ? `<ul class="ip-proof">${proofs}</ul>` : ''}
          <nav class="ip-actions" aria-label="${pick(lang, '특허 탐색 및 기술이전·합류 문의', 'Patent portfolio, licensing and joining')}">
            <a href="#publications/patents" class="btn btn-primary">${esc(t(sp.cta_patents, lang) || pick(lang, `미국·한국 특허 ${totCnt}건 카탈로그 보기 →`, `Explore All ${totCnt} U.S. & KR Patents →`))}</a>
            <a href="mailto:parkwook@khu.ac.kr?subject=${licSubject}" class="btn btn-outline">${esc(t(sp.cta_licensing, lang) || pick(lang, '기업 기술이전 · 산학공동연구 문의 ↗', 'Inquire Licensing & Industry R&D ↗'))}</a>
            <a href="#join/chat" class="btn btn-recruit">${esc(t(sp.cta_chat, lang) || pick(lang, '다음 특허의 발명자로 합류 문의', 'Join as a Next Co-Inventor'))}</a>
          </nav>
        </div>
      </div>
    </section>`;
}

function renderPathwayBanner(rec, lang) {
  const pb = rec.pathway_banner || {};
  const title = t(pb.title, lang) || pick(lang, '광학 × 알고리즘 × 마이크로 제작, 도메인의 경계를 넘는 연구', 'Optics × Algorithms × Microfabrication, Beyond Boundaries');
  const note = t(pb.major_fit_note, lang);
  return `
    <div class="pathway-banner">
      <div class="pathway-banner-copy">
        <span class="section-eyebrow">${esc(t(pb.eyebrow, lang) || pick(lang, '도메인 융합 30초 가이드', 'Domain Convergence in 30 Seconds'))}</span>
        <h2 class="section-title">${esc(title)}</h2>
        <p class="section-lead">${esc(t(pb.lead, lang))}</p>
        ${note ? `<p class="major-fit-note">${esc(note)}</p>` : ''}
      </div>
      ${pb.image ? `<figure class="pathway-banner-media">${lightboxImg(pb.image, title, 'pathway-img lightbox-img')}</figure>` : ''}
    </div>`;
}

function renderPitchCard(p, lang) {
  const milestone = t(p.first_milestone, lang);
  const outcome = t(p.real_outcome, lang);
  return `
    <article class="pitch-card" id="pitch-${esc(p.id || '')}">
      <span class="track-tag">${esc(t(p.tag, lang))}</span>
      <h3 class="pitch-question">${esc(t(p.question, lang))}</h3>
      <p class="pitch-summary">${esc(t(p.summary, lang))}</p>
      ${chipList(tl(p.major_chips, lang), 'major-chips')}
      ${milestone ? `<div class="pitch-milestone"><strong>${pick(lang, '첫 학기 마일스톤', 'First milestone')}</strong> <span>${esc(milestone)}</span></div>` : ''}
      ${outcome ? `<div class="pitch-outcome"><strong>${pick(lang, '실제 성과', 'Real outcome')}</strong> <span>${esc(outcome)}</span></div>` : ''}
      <div class="pitch-footer">
        <a href="#research/${esc(p.domain_route || '')}" class="btn btn-outline btn-sm">${pick(lang, '연구 자세히 보기', 'Explore research')}</a>
        <a href="#join/chat?topic=${encodeURIComponent(p.preset_topic || p.id || '')}" class="btn btn-recruit btn-sm">${pick(lang, '이 주제로 커피챗', 'Coffee chat on this')}</a>
      </div>
    </article>`;
}

function renderPitchSection(rec, lang) {
  const pitches = arr(rec.research_pitches);
  return `
    <section class="section pitch-section" id="research-pitch">
      <div class="container">
        ${renderPathwayBanner(rec, lang)}
        ${pitches.length ? `<div class="pitch-grid">${pitches.map((p) => renderPitchCard(p, lang)).join('')}</div>` : ''}
      </div>
    </section>`;
}

/* --------------------------------------------------------------------------
   Home — Stage 1: Recruiting Hero
   -------------------------------------------------------------------------- */
function renderHero(rec, data, lang) {
  const hero = rec.hero || {};
  const labels = hero.proof_labels || {};
  const pubs = data.publications || {};
  const alumni = data.members?.alumni || {};
  const journalCount = arr(pubs.journals).length;
  const coverCount = arr(pubs.covers).length;
  const pats = arr(pubs.patents);
  const patentCount = pats.length || 30;
  const usCount = pats.filter((x) => x.country === 'US').length || 16;
  const krCount = pats.filter((x) => x.country === 'KR').length || 14;
  const alumniCount = arr(alumni.graduate).length + arr(alumni.undergraduate).length;
  const title = t(hero.title, lang) || 'MultiplexON Lab';
  const caption = t(hero.stage_caption, lang);
  const quickLinks = arr(hero.quick_links).length ? arr(hero.quick_links) : [
    { href: '#publications/journals', ko: '대표 논문·표지 (68 SCI) →', en: 'Selected Papers & Covers (68 SCI) →' },
    { href: '#publications/patents', ko: `한·미 특허 포트폴리오 (${patentCount}) →`, en: `U.S. & KR Patents (${patentCount}) →` },
    { href: '#members/professor', ko: '지도교수 약력 · Scholar · ORCID →', en: 'PI Profile · Scholar · ORCID →' },
  ];
  const metrics = [
    ['#publications/patents', pick(lang, `특허 ${patentCount}건`, `${patentCount} Patents`), t(labels.patents, lang) || pick(lang, `미국 ${usCount} · 한국 ${krCount}`, `${usCount} US · ${krCount} KR`)],
    ['#publications/journals', `${journalCount || 68}+ SCI`, t(labels.journals, lang) || pick(lang, `표지 ${coverCount}편 · 상위 저널`, `${coverCount} Covers · Top Journals`)],
    ['#members/alumni', pick(lang, `${alumniCount}명`, `${alumniCount} Alumni`), t(labels.alumni, lang) || pick(lang, '졸업생 진로', 'Alumni')],
    ['#rights', pick(lang, '5대 조항', '5 Articles'), t(labels.charter, lang) || pick(lang, '학생 권리장전', 'Charter Articles')],
  ];
  return `
    <section class="recruit-hero-section">
      <div class="container">
        <div class="recruit-hero">
          <div class="recruit-hero-copy">
            <span class="recruit-status-pill">${esc(t(hero.status_pill, lang) || pick(lang, '연구원 상시 모집 중', 'Now recruiting'))}</span>
            <h1>${esc(title)}</h1>
            <p class="recruit-hero-lead">${esc(t(hero.lead, lang))}</p>
            <div class="recruit-hero-actions">
              <a href="#join/chat" class="btn btn-recruit">${esc(t(hero.primary_cta, lang) || pick(lang, '커피챗 신청하기', 'Request a coffee chat'))}</a>
              <a href="#join" class="btn btn-outline">${esc(t(hero.secondary_cta, lang) || pick(lang, '지원 안내 보기', 'How to join'))}</a>
            </div>
            <nav class="hero-quick-links" aria-label="${pick(lang, '학술·특허 바로가기', 'Academic and patent quick links')}">
              ${quickLinks.map((q) => `<a class="hero-quick-pill" href="${esc(q.href)}">${esc(pick(lang, q.ko, q.en))}</a>`).join('')}
            </nav>
            <div class="recruit-proof-strip">
              ${metrics.map(([href, value, label]) => `
              <a class="proof-metric" href="${href}">
                <strong class="proof-value">${esc(value)}</strong>
                <span class="proof-label">${esc(label)}</span>
              </a>`).join('')}
            </div>
          </div>
          <figure class="recruit-hero-stage">
            ${hero.image ? `<img src="${esc(hero.image)}" data-lightbox-src="${esc(hero.image)}" data-lightbox-caption="${esc(caption || title)}" alt="${esc(caption || title)}" class="recruit-hero-img lightbox-img" loading="eager">` : ''}
            ${caption ? `<figcaption class="recruit-stage-caption">${esc(caption)}</figcaption>` : ''}
          </figure>
        </div>
      </div>
    </section>`;
}

/* --------------------------------------------------------------------------
   Home — Stage 2: Entry Track Cards
   -------------------------------------------------------------------------- */
function renderTracks(rec, lang) {
  const tracks = arr(rec.tracks);
  if (!tracks.length) return '';
  const cards = tracks.map((tr) => {
    const featured = Boolean(tr.featured) || tr.id === 'graduate';
    return `
      <article class="track-card${featured ? ' track-card-featured' : ''}" id="track-${esc(tr.id || '')}">
        <span class="track-tag">${esc(t(tr.tag, lang))}</span>
        <h3>${esc(t(tr.title, lang))}</h3>
        <p>${esc(t(tr.summary, lang))}</p>
        ${chipList(tl(tr.perks, lang), 'track-perks')}
        ${chipList(tl(tr.eligibility_chips, lang), 'track-elig-chips')}
        <a href="#join/chat?track=${encodeURIComponent(tr.preset_track || tr.id || '')}" class="btn ${tr.featured ? 'btn-recruit' : 'btn-outline'}">${esc(t(tr.cta_label, lang) || pick(lang, '이 트랙으로 문의하기', 'Ask about this track'))}</a>
      </article>`;
  }).join('');
  return `
    <section class="section" id="tracks">
      <div class="container">
        ${sectionHead(
          pick(lang, '나에게 맞는 시작점', 'Find your entry point'),
          pick(lang, '세 가지 합류 트랙', 'Three Ways to Join'),
          pick(lang, '학부 연구인턴부터 대학원 진학까지, 지금 단계에 맞는 트랙을 골라 가볍게 문의하세요.', 'From undergraduate internships to graduate study, pick the track that fits where you are now.'),
        )}
        <div class="track-grid">${cards}</div>
      </div>
    </section>`;
}

/* --------------------------------------------------------------------------
   Home — Stage 4: Student Growth, Alumni Destinations & Cover Shelf
   -------------------------------------------------------------------------- */
const DEFAULT_HIGHLIGHTS = [
  { year: '2025', badge: { ko: '학부생 제1저자', en: 'Undergrad first author' }, title: { ko: '학부연구생 Q1 SCI 논문 게재', en: 'Undergraduate Q1 SCI Paper' }, detail: { ko: '학부 연구인턴으로 시작해 Q1 SCI 저널에 논문을 게재했습니다.', en: 'Started as an undergraduate intern and published in a Q1 SCI journal.' } },
  { year: '2025', badge: { ko: '금상', en: 'Gold Prize' }, title: { ko: '2025 서울대 푸드테크 경진대회 금상', en: '2025 SNU FoodTech Gold Prize' }, detail: { ko: '연구실 기술을 응용한 아이디어로 금상을 수상했습니다.', en: 'Awarded for an idea built on the lab’s core technology.' } },
  { year: '', badge: { ko: '대상', en: 'Grand Prize' }, title: { ko: '경희대 캡스톤디자인 대상', en: 'KHU Capstone Grand Prize' }, detail: { ko: '졸업연구 프로젝트가 캡스톤디자인 대상으로 이어졌습니다.', en: 'A graduation project that went on to win the capstone grand prize.' } },
  { year: '', badge: { ko: '포스터상', en: 'Poster Award' }, title: { ko: '한국바이오칩학회 포스터상', en: 'BioChip Poster Award' }, detail: { ko: '학회 발표를 통해 연구 성과를 인정받았습니다.', en: 'Recognized for research presented at the BioChip conference.' } },
];

const ALUMNI_DESTINATIONS = [
  ['전북대 교수', 'Professor, Jeonbuk Nat’l Univ.'], ['Bhome Gen CTO', 'Bhome Gen CTO'], ['KIST', 'KIST'],
  ['삼성전자', 'Samsung Electronics'], ['SK하이닉스', 'SK hynix'], ['LG전자', 'LG Electronics'],
  ['현대자동차', 'Hyundai Motor'], ['KAIST/GIST', 'KAIST/GIST'],
];

function renderCoverItem(cover) {
  const journal = cover.journal || cover.journal_info || 'Journal Cover';
  const caption = `${journal}${cover.year ? ` (${cover.year})` : ''}${cover.title ? ` — ${cover.title}` : ''}`;
  const safeUrl = /^https?:\/\//i.test(cover.url || '') ? cover.url : '';
  return `
    <figure class="cover-folio" title="${esc(caption)}">
      ${lightboxImg(cover.image, caption, 'cover-img lightbox-img')}
      <figcaption class="media-meta-row">
        <strong>${esc(journal)}</strong>
        ${cover.year ? `<span class="badge badge-year">${esc(cover.year)}</span>` : ''}
        ${safeUrl ? `<a href="${esc(safeUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">Paper</a>` : ''}
      </figcaption>
    </figure>`;
}

function renderGrowth(rec, data, lang) {
  const highlights = arr(rec.student_highlights).length ? rec.student_highlights : DEFAULT_HIGHLIGHTS;
  const covers = arr(data.publications?.covers).slice(0, 6);
  const cards = highlights.map((h) => `
      <article class="card highlight-card">
        <div class="card-body">
          <div class="media-meta-row">
            ${h.year ? `<span class="badge badge-year">${esc(h.year)}</span>` : ''}
            ${t(h.badge, lang) ? `<span class="badge badge-award">${esc(t(h.badge, lang))}</span>` : ''}
          </div>
          <h3 class="card-title">${esc(t(h.title, lang))}</h3>
          <p class="card-text">${esc(t(h.detail, lang))}</p>
        </div>
      </article>`).join('');
  const badges = ALUMNI_DESTINATIONS
    .map(([ko, en]) => `<a href="#members/alumni" class="badge alumni-dest-badge">${esc(pick(lang, ko, en))}</a>`).join('');
  return `
    <section class="section" id="growth">
      <div class="container">
        ${sectionHead(
          pick(lang, '학생이 성장하는 연구실', 'Where students grow'),
          pick(lang, '학생 성과와 졸업 후 진로', 'Student Highlights & Alumni Destinations'),
          pick(lang, '학부생도 논문의 주인공이 됩니다. 실제 학생들이 만든 결과입니다.', 'Undergraduates lead real papers here. These are outcomes our students actually achieved.'),
        )}
        <div class="grid-2">${cards}</div>
        <div class="alumni-destinations">
          <h3 class="card-title">${pick(lang, '졸업생들은 지금 이런 곳에 있습니다', 'Where our alumni are now')}</h3>
          <div class="alumni-dest-badges">${badges}</div>
          <a href="#members/alumni" class="btn btn-outline btn-sm">${pick(lang, '졸업생 전체 보기', 'See all alumni')}</a>
        </div>
        ${covers.length ? `
        <h3 class="card-title cover-shelf-title">${pick(lang, '저널 표지 논문', 'Journal Cover Articles')}</h3>
        <div class="cover-shelf">${covers.map(renderCoverItem).join('')}</div>
        <a href="#publications" class="btn btn-outline btn-sm">${pick(lang, '전체 연구성과 보기', 'View all publications')}</a>` : ''}
      </div>
    </section>`;
}

/* --------------------------------------------------------------------------
   Home — Stage 5: Culture, Student Bill of Rights, Photos & News
   -------------------------------------------------------------------------- */
function pickRecentPhotos(gallery, count) {
  const events = arr(gallery?.years).slice()
    .sort((a, b) => Number(b.year) - Number(a.year))
    .flatMap((y) => arr(y.events).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))));
  const firsts = [];
  const rest = [];
  events.forEach((ev) => arr(ev.images).forEach((im, i) => {
    const img = normalizeImage(im, ev.title || '');
    if (img) (i === 0 ? firsts : rest).push({ ...img, date: ev.date || '' });
  }));
  return [...firsts, ...rest].slice(0, count);
}

function renderNewsItem(item, idx, lang) {
  const dateLabel = item.date || item.year || '';
  const links = arr(item.links).filter((lnk) => lnk && lnk.url).map((lnk) => {
    const ext = /^https?:\/\//i.test(lnk.url) ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${esc(lnk.url)}" class="btn btn-outline btn-sm"${ext}>${esc(lnk.text || pick(lang, '링크', 'Link'))}</a>`;
  }).join(' ');
  return `
    <li class="timeline-item news-item">
      <div class="timeline-period news-meta">
        ${dateLabel ? `<span class="badge badge-year">${esc(dateLabel)}</span>` : ''}
        ${item.is_new || idx < 2 ? '<span class="badge badge-new">NEW</span>' : ''}
      </div>
      <div class="timeline-content news-body">
        <p class="news-text">${esc(stripLeadingDate(item.text))}</p>
        ${links ? `<div class="news-links">${links}</div>` : ''}
      </div>
    </li>`;
}

function renderCulture(rec, data, lang) {
  const charter = arr(rec.charter_ko);
  const photos = pickRecentPhotos(data.gallery, 4);
  const news = arr(data.news?.items).slice(0, 4);
  return `
    <section class="section" id="culture">
      <div class="container">
        ${sectionHead(
          pick(lang, '연구실 문화', 'Lab culture'),
          pick(lang, '학생 권리 5개 조항', 'The 5-Article Student Bill of Rights'),
          pick(lang, '좋은 연구는 존중받는 환경에서 나옵니다. 우리 연구실이 학생에게 약속하는 다섯 가지입니다.', 'Good research comes from a respectful environment. These are five promises we make to every student.'),
        )}
        ${charter.length ? `
        <div class="charter-grid-5">
          ${charter.map((c) => `
          <article class="charter-card">
            <span class="charter-num">${esc(c.num || '')}</span>
            <h3 class="card-title">${esc(t(c.heading, lang))}</h3>
            <p class="card-text">${esc(t(c.body, lang))}</p>
          </article>`).join('')}
        </div>
        <a href="#rights" class="btn btn-outline btn-sm">${pick(lang, '인권 헌장 전문 보기', 'Read the full charter')}</a>` : ''}
        ${photos.length ? `
        <h3 class="card-title">${pick(lang, '실제 연구실 사진', 'Real Lab Photos')}</h3>
        <div class="grid-4">
          ${photos.map((ph) => `
          <figure class="gallery-item">
            ${lightboxImg(ph, ph.caption, 'gallery-img lightbox-img')}
            ${ph.caption ? `<figcaption class="gallery-caption">${esc(ph.caption)}</figcaption>` : ''}
          </figure>`).join('')}
        </div>
        <a href="#life/gallery" class="btn btn-outline btn-sm">${pick(lang, '사진 갤러리 더 보기', 'More in the gallery')}</a>` : ''}
        ${news.length ? `
        <h3 class="card-title">${pick(lang, '최근 연구실 소식', 'Latest Lab News')}</h3>
        <ul class="timeline news-list">${news.map((n, i) => renderNewsItem(n, i, lang)).join('')}</ul>
        <a href="#news" class="btn btn-outline btn-sm">${pick(lang, '소식 전체 보기', 'All news')}</a>` : ''}
      </div>
    </section>`;
}

/* --------------------------------------------------------------------------
   Home — Stage 5.5 (KO Recruiting Feature): Curated @꽁대교수 Voice Talks
   -------------------------------------------------------------------------- */
function renderYoutubeTalks(rec, lang) {
  if (lang !== 'ko') return '';
  const yt = rec.youtube_talks || {};
  const cards = arr(yt.cards);
  if (!cards.length) return '';
  const chUrl = yt.channel_url || 'https://www.youtube.com/@꽁대교수';
  const items = cards.map((c) => {
    const extUrl = c.is_shorts ? `https://www.youtube.com/shorts/${c.youtube_id}` : `https://youtu.be/${c.youtube_id}`;
    const secLabel = String(c.duration || '').split(' ')[0];
    return `
      <article class="yt-talk-card">
        <div class="yt-talk-meta">
          <span class="yt-talk-badge">${esc(c.badge || '')}</span>
          <span class="yt-talk-duration">${esc(c.duration || '')}</span>
        </div>
        <h3 class="yt-talk-title">${esc(c.title || '')}</h3>
        ${c.quote ? `<blockquote class="yt-talk-quote">“${esc(c.quote)}”</blockquote>` : ''}
        <p class="yt-talk-summary">${esc(c.summary || '')}</p>
        <div class="yt-talk-actions">
          <button type="button" class="btn btn-recruit btn-sm yt-play-btn" data-yt-id="${esc(c.youtube_id)}" data-yt-title="${esc(c.title || '')}" data-yt-shorts="${Boolean(c.is_shorts)}" data-talk-id="${esc(c.id || '')}">▶ ${esc(yt.play_cta || '바로 재생')}${secLabel ? ` (${esc(secLabel)})` : ''}</button>
          <a class="btn btn-outline btn-sm" href="${esc(extUrl)}" target="_blank" rel="noopener noreferrer" data-track="youtube_channel_open">${esc(yt.watch_on_yt || 'YouTube에서 열기 ↗')}</a>
        </div>
      </article>`;
  }).join('');
  return `
    <section class="section yt-talks-section" id="prof-talks">
      <div class="container">
        <div class="yt-talks-head-row">
          ${sectionHead(yt.eyebrow || '지도교수의 육성 · @꽁대교수', yt.title || '커피챗 전에 미리 들어보는 박욱 교수의 생각', yt.lead || '')}
          <a class="btn btn-outline btn-sm yt-channel-btn" href="${esc(chUrl)}" target="_blank" rel="noopener noreferrer" data-track="youtube_channel_open">${esc(yt.channel_cta || '@꽁대교수 채널 보기 ↗')}</a>
        </div>
        <div class="yt-talks-grid">${items}</div>
      </div>
    </section>`;
}

/* --------------------------------------------------------------------------
   Home — Stage 6 (shared): Frictionless Coffee-Chat Banner
   -------------------------------------------------------------------------- */
function renderChatBanner(lang) {
  return `
    <section class="section">
      <div class="container">
        <div class="cohort-open-banner single-col">
          <h2 class="section-title">${pick(lang, '연구계획서 없이, 커피챗부터 시작하세요', 'No research proposal needed. Start with a coffee chat.')}</h2>
          <p class="section-lead">${pick(lang, '전공이나 학점, 사전 지식이 걱정되어도 괜찮습니다. 궁금한 점 몇 가지만 남겨 주시면 편하게 이야기 나눌 시간을 잡아 드립니다.', 'It is fine if you are unsure about your major, grades or background. Leave a few questions and we will set up a casual conversation.')}</p>
          <a href="#join/chat" class="btn btn-recruit">${pick(lang, '가볍게 커피챗 신청하기', 'Request a casual coffee chat')}</a>
        </div>
      </div>
    </section>`;
}

export function renderHome(data = {}, subRoute = '', appState = {}) {
  const lang = getLang(data, appState);
  const rec = data?.recruiting || {};
  return `
<div class="recruiting-page">
  ${renderHero(rec, data || {}, lang)}
  ${renderManifestoAndIp(rec, data || {}, lang)}
  ${renderTracks(rec, lang)}
  ${renderPitchSection(rec, lang)}
  ${renderGrowth(rec, data || {}, lang)}
  ${renderCulture(rec, data || {}, lang)}
  ${renderYoutubeTalks(rec, lang)}
  ${renderChatBanner(lang)}
</div>`;
}

/* --------------------------------------------------------------------------
   Research — Platforms, Domains & Subtopics
   -------------------------------------------------------------------------- */
const DOMAIN_PILLS = [
  ['', '전체', 'All'],
  ['optical-applications', '광학 응용', 'Optical Applications'],
  ['security-applications', '보안 응용', 'Security Applications'],
  ['bio-applications', '바이오 응용', 'Bio Applications'],
];

const domainMatches = (domainId, seg) => {
  const s = slugKey(domainId);
  return Boolean(seg) && (s === seg || `${s}-applications` === seg || s.split('-')[0] === seg.split('-')[0]);
};

function renderPlatformCard(p, rec, lang) {
  const ko = (rec.platforms_ko || {})[p.id] || {};
  const title = lang === 'ko' ? (ko.title_ko || p.title) : p.title;
  const desc = lang === 'ko' ? (ko.description_ko || p.description) : p.description;
  return `
    <article class="specimen-card" id="platform-${esc(p.id || '')}">
      ${p.image ? `<div class="specimen-viewport">${lightboxImg(p.image, title)}</div>` : ''}
      <div class="card-body">
        <h3 class="card-title">${esc(title || '')}</h3>
        ${lang === 'ko' && ko.title_ko && p.title ? `<p class="card-subtitle">${esc(p.title)}</p>` : ''}
        <p class="card-text">${esc(desc || '')}</p>
      </div>
    </article>`;
}

function renderSubtopic(st, rec, lang, isOpen) {
  const ko = (rec.subtopics_ko || {})[st.id] || {};
  const title = lang === 'ko' ? (ko.title_ko || st.title) : st.title;
  const summary = lang === 'ko' ? (ko.summary_ko || st.summary) : st.summary;
  const images = arr(st.images);
  const drawerImages = images.slice(1).map((im) => lightboxImg(im, st.title)).filter(Boolean);
  return `
    <article class="card subtopic-card" id="subtopic-${esc(slugKey(st.id))}">
      <div class="card-body">
        <h4 class="card-title">${esc(title || '')}</h4>
        ${lang === 'ko' && ko.title_ko && st.title ? `<p class="card-subtitle">${esc(st.title)}</p>` : ''}
        <p class="card-text">${esc(summary || '')}</p>
        ${images.length ? `<figure class="specimen-viewport">${lightboxImg(images[0], st.title)}</figure>` : ''}
        <a href="#join/chat?topic=${encodeURIComponent(st.id || '')}" class="btn btn-outline btn-sm">${pick(lang, '이 주제로 커피챗 문의', 'Ask about this topic')}</a>
        <details class="researcher-drawer" ${isOpen ? 'open' : ''}>
          <summary>${lang === 'ko' ? '연구자용 심화 원리 & 상세 설명 보기' : 'Read Technical Deep Dive'}</summary>
          <div class="researcher-drawer-body">
            ${lang === 'ko' && ko.summary_ko && st.summary ? `<p class="prose-p">${esc(st.summary)}</p>` : ''}
            ${paragraphs(st.paragraphs)}
            ${drawerImages.length ? `<div class="grid-2">${drawerImages.map((html) => `<figure class="specimen-viewport">${html}</figure>`).join('')}</div>` : ''}
          </div>
        </details>
      </div>
    </article>`;
}

function renderDomain(domain, rec, lang, subSeg) {
  const ko = (rec.domains_ko || {})[domain.id] || {};
  const title = lang === 'ko' ? (ko.title_ko || domain.title) : domain.title;
  const summary = lang === 'ko' ? (ko.summary_ko || domain.summary) : domain.summary;
  const subtopics = arr(domain.subtopics);
  return `
    <section class="domain-block" id="domain-${esc(slugKey(domain.id))}">
      <div class="grid-2 domain-head">
        <div class="domain-head-copy">
          <h3 class="section-title">${esc(title || '')}</h3>
          ${lang === 'ko' && ko.title_ko && domain.title ? `<p class="card-subtitle">${esc(domain.title)}</p>` : ''}
          <p class="section-lead">${esc(summary || '')}</p>
        </div>
        ${domain.image ? `<figure class="specimen-viewport">${lightboxImg(domain.image, domain.title)}</figure>` : ''}
      </div>
      <div class="grid-2 subtopic-grid">
        ${subtopics.map((st) => renderSubtopic(st, rec, lang, Boolean(subSeg) && slugKey(st.id) === subSeg)).join('')}
      </div>
    </section>`;
}

export function renderResearch(data = {}, subRoute = '', appState = {}) {
  const lang = getLang(data, appState);
  const rec = data?.recruiting || {};
  const research = data?.research || {};
  const platforms = arr(research.platforms);
  const domains = arr(research.domains);
  const overview = arr(research.overview_images);

  const parts = String(subRoute || '').split('?')[0].split('/').map(slugKey).filter(Boolean);
  const subSeg = parts[1] || parts[0] || '';
  const subtopicDomain = domains.find((d) => arr(d.subtopics).some((st) => slugKey(st.id) === subSeg));
  const activeDomain = subtopicDomain || domains.find((d) => domainMatches(d.id, parts[0] || ''));
  const visibleDomains = activeDomain ? [activeDomain] : domains;

  const pills = DOMAIN_PILLS.map(([slug, ko, en]) => {
    const isActive = slug ? Boolean(activeDomain) && domainMatches(activeDomain.id, slug) : !activeDomain;
    return `<a href="#research${slug ? `/${slug}` : ''}" class="filter-pill${isActive ? ' active' : ''}"${isActive ? ' aria-current="page"' : ''}>${pick(lang, ko, en)}</a>`;
  }).join('');

  return `
<div class="recruiting-page">
  ${renderPitchSection(rec, lang)}
  <section class="section" id="platforms">
    <div class="container">
      ${sectionHead(
        pick(lang, '핵심 기술', 'Core technology'),
        pick(lang, '4대 핵심 플랫폼', 'Four Core Platforms'),
        pick(lang, '모든 응용 연구의 바탕이 되는 연구실의 기반 기술입니다.', 'The foundational technologies behind every application we build.'),
      )}
      ${lang === 'en' && research.intro ? paragraphs(research.intro) : ''}
      <div class="grid-2">${platforms.map((p) => renderPlatformCard(p, rec, lang)).join('')}</div>
      ${overview.length ? `
      <div class="grid-4 overview-grid">
        ${overview.map((im) => `<figure class="gallery-item">${lightboxImg(im, 'MultiplexON Lab research overview', 'gallery-img lightbox-img')}</figure>`).join('')}
      </div>` : ''}
    </div>
  </section>
  <section class="section" id="domains">
    <div class="container">
      ${sectionHead(
        pick(lang, '응용 분야', 'Applications'),
        pick(lang, '3대 응용 분야와 7개 세부 주제', 'Three Application Domains & Seven Subtopics'),
        pick(lang, '쉬운 요약을 먼저 읽고, 더 궁금하면 연구자용 심화 설명을 펼쳐 보세요.', 'Read the plain summary first, then open the technical deep dive if you want more.'),
      )}
      <nav class="filter-pills" aria-label="${pick(lang, '응용 분야 필터', 'Application domain filter')}">${pills}</nav>
      ${visibleDomains.length
        ? visibleDomains.map((d) => renderDomain(d, rec, lang, subSeg)).join('')
        : `<p class="empty-state">${pick(lang, '연구 정보를 불러오는 중입니다.', 'Research content is loading.')}</p>`}
    </div>
  </section>
  ${renderChatBanner(lang)}
</div>`;
}

/* --------------------------------------------------------------------------
   Notice — Research Intern / Graduate Project
   -------------------------------------------------------------------------- */
export function renderNotice(data = {}, noticeSlug = 'research-intern', appState = {}) {
  const lang = getLang(data, appState);
  const slug = slugKey(String(noticeSlug || '').split('?')[0]) || 'research-intern';
  const isGradProj = /graduate|project|capstone/.test(slug);
  const notices = data?.meta?.notices || {};
  const notice = (isGradProj ? notices.graduate_project : notices.research_intern) || {};
  const sections = arr(notice.sections);
  const fallbackTitle = isGradProj
    ? pick(lang, '졸업연구(캡스톤) 프로젝트 안내', 'Graduation (Capstone) Project Notice')
    : pick(lang, '학부 연구인턴 모집 안내', 'Undergraduate Research Intern Notice');
  const title = t(notice.title, lang) || fallbackTitle;
  const tabs = [
    ['research-intern', pick(lang, '학부 연구인턴', 'Research Intern'), !isGradProj],
    ['graduate-project', pick(lang, '졸업연구 프로젝트', 'Graduation Project'), isGradProj],
  ].map(([s, label, active]) => `<a href="#notice/${s}" class="filter-pill${active ? ' active' : ''}"${active ? ' aria-current="page"' : ''}>${label}</a>`).join('');

  const body = sections.length
    ? sections.map((sec) => `
          <section class="notice-section">
            ${t(sec.heading, lang) ? `<h2 class="card-title">${esc(t(sec.heading, lang))}</h2>` : ''}
            ${paragraphs(t(sec.body, lang))}
          </section>`).join('')
    : `<p class="prose-p">${pick(lang, '상세 공지를 준비 중입니다. 궁금한 점은 커피챗으로 편하게 문의해 주세요.', 'The detailed notice is being prepared. Feel free to ask anything through a coffee chat.')}</p>`;

  return `
<div class="recruiting-page">
  <section class="section">
    <div class="container">
      <nav class="filter-pills" aria-label="${pick(lang, '공지 종류', 'Notice type')}">${tabs}</nav>
      <article class="card notice-card" id="notice-${isGradProj ? 'graduate-project' : 'research-intern'}">
        <div class="card-body">
          <span class="track-tag">${pick(lang, '공지사항', 'Announcement')}</span>
          <h1 class="section-title">${esc(title)}</h1>
          ${title !== fallbackTitle && lang === 'ko' ? `<p class="card-subtitle">${esc(fallbackTitle)}</p>` : ''}
          ${body}
          <div class="recruit-hero-actions">
            <a href="#join/chat?track=${isGradProj ? 'capstone' : 'undergrad'}" class="btn btn-recruit">${isGradProj
              ? pick(lang, '졸업연구 주제로 커피챗 신청', 'Coffee chat about a capstone project')
              : pick(lang, '연구인턴 커피챗 신청', 'Coffee chat about an internship')}</a>
            <a href="#research" class="btn btn-outline">${pick(lang, '연구 주제 먼저 보기', 'Browse research topics first')}</a>
          </div>
        </div>
      </article>
    </div>
  </section>
</div>`;
}
