/**
 * MultiplexON Lab — Recruiting / Join view (Open Workbench cohort, tracks, charter, composer, FAQ)
 *
 * View contract:   renderJoin(data, subRoute, appState) -> HTML string (data.lang is 'ko' | 'en')
 * Binder contract: bindJoinEvents(rootEl, ctx) with ctx = { state, data, route, subRoute, rerender, navigate, track, toast, openLightbox }
 * Styling rule:    state is expressed ONLY through classList / attributes (no inline style mutation).
 * Privacy rule:    analytics receive only { track, lang } — never names, affiliations or free text.
 */

const RECIPIENT_FALLBACK = 'parkwook@khu.ac.kr';
const LIMITS = { name: 60, affil: 100, note: 1200 };

const UI = {
  ko: {
    mentors: '멘토·동문 진로 보기', heroAlt: '오픈 워크벤치 코호트 — 연구실 실험대에서 함께 작업하는 학생들',
    stepsTitle: '3단계 온보딩', tracksTitle: '모집 트랙', tracksDesc: '나에게 맞는 트랙을 고르면 아래 메일 초안에 바로 반영됩니다.',
    perks: '지원 내용', elig: '지원 자격', supportTitle: '연구 지원과 학생 권리',
    charterTitle: '학생 권리 헌장 5개 조항', charterMore: '인권 헌장 전문 읽기',
    trackLegend: '지원 트랙 (하나 선택)', topicLegend: '이야기하고 싶은 주제 (복수 선택)',
    name: '이름', affil: '학교 · 전공 · 학년', note: '하고 싶은 말 (선택)',
    namePh: '홍길동', affilPh: '예: 경희대 전자공학과 / 물리·화공·생명 등 3학년', notePh: '관심 있는 융합 주제, 특허·논문 연구에 대해 궁금한 점, 가능한 일정 등을 자유롭게 적어 주세요.',
    previewLabel: '메일 초안 미리보기', subjectPrefix: '제목: ',
    gmail: 'Gmail 웹으로 열기', mailto: '기본 메일 앱 열기', copy: '주소·초안 복사',
    copied: '메일 주소와 초안을 복사했습니다. 메일 앱에 붙여 넣어 주세요.',
    copyFail: '복사하지 못했습니다. 미리보기에서 직접 선택해 복사해 주세요: ',
    faqTitle: '지원 관련 자주 묻는 질문', faqMore: '연구실 FAQ 전체 보기',
    trackSet: '트랙을 메일 초안에 반영했습니다.',
  },
  en: {
    mentors: 'Meet Mentors & Alumni', heroAlt: 'Open Workbench cohort — students working together at the lab bench',
    stepsTitle: '3-Step Onboarding', tracksTitle: 'Recruiting Tracks', tracksDesc: 'Pick the track that fits you — it is applied to the email draft below.',
    perks: 'What you get', elig: 'Eligibility', supportTitle: 'Research Support & Student Rights',
    charterTitle: 'Student Bill of Rights — 5 Articles', charterMore: 'Read the full Human Rights Charter',
    trackLegend: 'Track (choose one)', topicLegend: 'Topics you want to discuss (choose any)',
    name: 'Name', affil: 'University · Major · Year', note: 'Anything to add (optional)',
    namePh: 'Jane Doe', affilPh: 'e.g., EE / Physics / Materials / Bio / CS, Junior', notePh: 'Convergence interests, questions on papers/patents, available dates — anything helps.',
    previewLabel: 'Email draft preview', subjectPrefix: 'Subject: ',
    gmail: 'Open in Gmail Web', mailto: 'Open Mail App', copy: 'Copy Address & Draft',
    copied: 'Address and draft copied. Paste them into your mail app.',
    copyFail: 'Could not copy. Please select the preview text manually: ',
    faqTitle: 'Recruiting FAQ', faqMore: 'See the full Lab FAQ',
    trackSet: 'Track applied to your email draft.',
  },
};

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */
function esc(value) {
  return String(value ?? '').normalize('NFC')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const langOf = (data) => (data?.lang === 'en' ? 'en' : 'ko');

function pick(value, lang) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value[lang] ?? value.ko ?? value.en ?? '';
  return value ?? '';
}

function pickList(value, lang) {
  if (Array.isArray(value)) return value;
  const out = value?.[lang] ?? value?.ko ?? value?.en;
  return Array.isArray(out) ? out : [];
}

const arr = (v) => (Array.isArray(v) ? v : []);
const clip = (v, max) => String(v ?? '').normalize('NFC').slice(0, max);

/** Normalizes appState.composerState in place and returns it (app.js may seed only { track, topics }). */
function ensureComposerState(appState, rec, subRoute) {
  const holder = appState && typeof appState === 'object' ? appState : {};
  const cs = holder.composerState && typeof holder.composerState === 'object' ? holder.composerState : (holder.composerState = {});
  const composer = rec?.composer || {};
  const trackIds = arr(composer.tracks).map((x) => x.id);
  const topicIds = arr(composer.topics).map((x) => x.id);
  cs.track = typeof cs.track === 'string' ? cs.track : '';
  cs.topics = arr(cs.topics).filter((id) => topicIds.includes(id));
  cs.name = clip(cs.name, LIMITS.name);
  cs.affil = clip(cs.affil, LIMITS.affil);
  cs.note = clip(cs.note, LIMITS.note);
  if (cs.track && trackIds.length && !trackIds.includes(cs.track)) cs.track = '';
  if (!cs.track && subRoute) {
    const hit = arr(rec?.tracks).find((tr) => tr.id === subRoute);
    const preset = hit ? (hit.preset_track || hit.id) : '';
    if (preset && (!trackIds.length || trackIds.includes(preset))) cs.track = preset;
  }
  return cs;
}

function trackLabel(rec, id, lang) {
  if (!id) return '';
  const fromComposer = arr(rec?.composer?.tracks).find((x) => x.id === id);
  if (fromComposer) return pick(fromComposer.label, lang);
  const fromCards = arr(rec?.tracks).find((x) => x.id === id || x.preset_track === id);
  return fromCards ? pick(fromCards.title, lang) : '';
}

/** Builds the plain-text email draft and the three delivery targets. */
function buildDraft(rec, cs, lang) {
  const to = rec?.composer?.recipient || RECIPIENT_FALLBACK;
  const tLabel = trackLabel(rec, cs.track, lang);
  const topics = arr(rec?.composer?.topics).filter((x) => cs.topics.includes(x.id)).map((x) => pick(x.label, lang));
  const name = cs.name.trim();
  const affil = cs.affil.trim();
  const note = cs.note.trim();
  let subject;
  let lines;
  if (lang === 'ko') {
    const who = name || '[이름]';
    subject = `[MultiplexON Lab] ${tLabel ? `${tLabel} ` : ''}커피챗·지원 문의 — ${who}`;
    lines = [
      '박욱 교수님께,', '',
      `안녕하세요. ${affil || '[소속 · 학년]'} ${who}입니다.`,
      tLabel ? `MultiplexON 연구실의 「${tLabel}」 트랙에 관심이 있어 연락드립니다.` : 'MultiplexON 연구실에 관심이 있어 연락드립니다.',
    ];
    if (topics.length) lines.push('', '이야기 나누고 싶은 주제:', ...topics.map((x) => `- ${x}`));
    if (note) lines.push('', '추가로 드리고 싶은 말씀:', note);
    lines.push('', '편하신 시간에 짧은 커피챗(대면 또는 온라인)이 가능할지 여쭙고 싶습니다.', '읽어 주셔서 감사합니다.', '', `${who} 드림`);
  } else {
    const who = name || '[Your name]';
    subject = `[MultiplexON Lab] Coffee chat / application inquiry${tLabel ? ` — ${tLabel}` : ''} — ${who}`;
    lines = [
      'Dear Prof. Wook Park,', '',
      `Hello, my name is ${who} (${affil || '[affiliation · year]'}).`,
      tLabel ? `I am interested in joining MultiplexON Lab through the "${tLabel}" track.` : 'I am interested in joining MultiplexON Lab.',
    ];
    if (topics.length) lines.push('', 'Topics I would like to discuss:', ...topics.map((x) => `- ${x}`));
    if (note) lines.push('', 'A few more words:', note);
    lines.push('', 'Would a short coffee chat (in person or online) be possible at a time that suits you?', 'Thank you for your time.', '', 'Best regards,', who);
  }
  const body = lines.join('\n');
  const enc = encodeURIComponent;
  return {
    to, subject, body,
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(to)}&su=${enc(subject)}&body=${enc(body)}`,
    mailto: `mailto:${to}?subject=${enc(subject)}&body=${enc(body.replace(/\n/g, '\r\n'))}`,
    clipboard: `To: ${to}\nSubject: ${subject}\n\n${body}`,
  };
}

/* --------------------------------------------------------------------------
   Section renderers
   -------------------------------------------------------------------------- */
function renderHero(banner, lang, ui) {
  const steps = arr(banner.steps).map((s) => `
        <article class="track-card">
          <span class="charter-num">${esc(s.num)}</span>
          <h3>${esc(pick(s.title, lang))}</h3>
          <p>${esc(pick(s.desc, lang))}</p>
        </article>`).join('');
  const image = banner.image ? `
        <div class="cohort-open-media">
          <img src="${esc(banner.image)}" data-lightbox-src="${esc(banner.image)}" alt="${esc(ui.heroAlt)}" decoding="async">
        </div>` : '';
  return `
  <section class="section" aria-labelledby="join-hero-title">
    <div class="container">
      <div class="cohort-open-banner">
        <div class="cohort-open-copy">
          <span class="recruit-status-pill">${esc(pick(banner.tag, lang))}</span>
          <h1 id="join-hero-title">${esc(pick(banner.title, lang))}</h1>
          <p>${esc(pick(banner.body, lang))}</p>
          <div class="recruit-hero-actions">
            <a href="#join/chat" class="btn btn-recruit">${esc(pick(banner.cta_label, lang))}</a>
            <a href="#members" class="btn btn-outline">${esc(ui.mentors)}</a>
          </div>
        </div>${image}
      </div>
      ${steps ? `<h2 class="section-title mt-4">${esc(ui.stepsTitle)}</h2>
      <div class="track-grid mt-4">${steps}
      </div>` : ''}
    </div>
  </section>`;
}

function renderTracks(tracks, subRoute, lang, ui) {
  if (!tracks.length) return '';
  const cards = tracks.map((tr) => {
    const featured = tr.featured || subRoute === tr.id;
    const perks = pickList(tr.perks, lang).map((p) => `<li>${esc(p)}</li>`).join('');
    const chips = pickList(tr.eligibility_chips, lang).map((c) => `<li>${esc(c)}</li>`).join('');
    return `
        <article class="track-card${featured ? ' track-card-featured' : ''}" id="track-${esc(tr.id)}">
          <span class="track-tag">${esc(pick(tr.tag, lang))}</span>
          <h3>${esc(pick(tr.title, lang))}</h3>
          <p>${esc(pick(tr.summary, lang))}</p>
          ${perks ? `<ul class="track-perks" aria-label="${esc(ui.perks)}">${perks}</ul>` : ''}
          ${chips ? `<ul class="track-elig-chips" aria-label="${esc(ui.elig)}">${chips}</ul>` : ''}
          <button type="button" class="btn ${tr.featured ? 'btn-recruit' : 'btn-outline'}" data-select-track="${esc(tr.preset_track || tr.id)}">${esc(pick(tr.cta_label, lang))}</button>
        </article>`;
  }).join('');
  return `
  <section class="section" id="tracks-section" aria-labelledby="tracks-title">
    <div class="container">
      <h2 class="section-title" id="tracks-title">${esc(ui.tracksTitle)}</h2>
      <p class="section-desc">${esc(ui.tracksDesc)}</p>
      <div class="track-grid">${cards}
      </div>
    </div>
  </section>`;
}

function renderSupport(stipend, charter, lang, ui) {
  const bullets = pickList(stipend?.bullets, lang).map((b) => `<li>${esc(b)}</li>`).join('');
  const box = stipend ? `
      <div class="stipend-highlight-box single-col">
        <h3>${esc(pick(stipend.title, lang))}</h3>
        <p>${esc(pick(stipend.body, lang))}</p>
        ${bullets ? `<ul class="track-perks">${bullets}</ul>` : ''}
      </div>` : '';
  const cards = charter.map((c) => `
        <article class="charter-card">
          <span class="charter-num">${esc(c.num)}</span>
          <h4>${esc(pick(c.heading, lang))}</h4>
          <p>${esc(pick(c.body, lang))}</p>
        </article>`).join('');
  if (!box && !cards) return '';
  return `
  <section class="section" id="support-section" aria-labelledby="support-title">
    <div class="container">
      <h2 class="section-title" id="support-title">${esc(ui.supportTitle)}</h2>${box}
      ${cards ? `<h3 class="section-subtitle mt-4">${esc(ui.charterTitle)}</h3>
      <div class="charter-grid-5">${cards}
      </div>
      <p class="mt-4"><a href="#life/rights" class="btn btn-outline btn-sm">${esc(ui.charterMore)}</a></p>` : ''}
    </div>
  </section>`;
}

function renderChips(items, attr, isOn, lang) {
  return arr(items).map((x) => {
    const on = isOn(x.id);
    return `<button type="button" class="choice-chip${on ? ' is-selected' : ''}" ${attr}="${esc(x.id)}" aria-pressed="${on}">${esc(pick(x.label, lang))}</button>`;
  }).join('');
}

function renderComposer(rec, cs, lang, ui) {
  const composer = rec.composer || {};
  const draft = buildDraft(rec, cs, lang);
  return `
  <section class="composer-shell is-open" id="composer-section" aria-labelledby="composer-title">
    <div class="container">
      <h2 id="composer-title" tabindex="-1">${esc(pick(composer.heading, lang))}</h2>
      <p class="section-desc">${esc(pick(composer.subheading, lang))}</p>
      <div class="composer-layout">
        <div class="composer-controls">
          <fieldset>
            <legend>${esc(ui.trackLegend)}</legend>
            <div class="chip-group">${renderChips(composer.tracks, 'data-composer-track', (id) => id === cs.track, lang)}</div>
          </fieldset>
          <fieldset>
            <legend>${esc(ui.topicLegend)}</legend>
            <div class="chip-group">${renderChips(composer.topics, 'data-composer-topic', (id) => cs.topics.includes(id), lang)}</div>
          </fieldset>
          <div class="composer-inputs">
            <label for="comp-name"><span>${esc(ui.name)}</span>
              <input id="comp-name" type="text" autocomplete="name" maxlength="${LIMITS.name}" placeholder="${esc(ui.namePh)}" value="${esc(cs.name)}">
            </label>
            <label for="comp-affil"><span>${esc(ui.affil)}</span>
              <input id="comp-affil" type="text" autocomplete="organization" maxlength="${LIMITS.affil}" placeholder="${esc(ui.affilPh)}" value="${esc(cs.affil)}">
            </label>
            <label class="span-12" for="comp-note"><span>${esc(ui.note)}</span>
              <textarea id="comp-note" rows="4" maxlength="${LIMITS.note}" placeholder="${esc(ui.notePh)}">${esc(cs.note)}</textarea>
            </label>
          </div>
        </div>
        <div class="composer-preview" role="group" aria-label="${esc(ui.previewLabel)}">
          <p class="composer-to">To: ${esc(draft.to)}</p>
          <p class="composer-subject" id="comp-preview-subject">${esc(ui.subjectPrefix + draft.subject)}</p>
          <pre class="composer-body" id="comp-preview-body" tabindex="0">${esc(draft.body)}</pre>
          <div class="composer-actions">
            <a id="comp-gmail-btn" class="btn btn-recruit" target="_blank" rel="noopener noreferrer" href="${esc(draft.gmail)}">${esc(ui.gmail)}</a>
            <a id="comp-mailto-btn" class="btn btn-outline" href="${esc(draft.mailto)}">${esc(ui.mailto)}</a>
            <button type="button" id="comp-copy-btn" class="btn btn-outline">${esc(ui.copy)}</button>
          </div>
          <p class="composer-note">${esc(pick(composer.reassurance, lang))}</p>
        </div>
      </div>
    </div>
  </section>`;
}

function renderRecruitFaq(faq, lang, ui) {
  if (!faq.length) return '';
  const items = faq.map((f, i) => {
    const open = i < 2;
    return `
        <div class="accordion-item${open ? ' is-open' : ''}">
          <h3 class="accordion-heading">
            <button type="button" class="accordion-trigger" id="recruit-faq-trigger-${i}" aria-expanded="${open}" aria-controls="recruit-faq-panel-${i}">${esc(pick(f.q, lang))}</button>
          </h3>
          <div class="accordion-panel" id="recruit-faq-panel-${i}" role="region" aria-labelledby="recruit-faq-trigger-${i}">
            <p>${esc(pick(f.a, lang))}</p>
          </div>
        </div>`;
  }).join('');
  return `
  <section class="section" id="recruit-faq-section" aria-labelledby="recruit-faq-title">
    <div class="container">
      <h2 class="section-title" id="recruit-faq-title">${esc(ui.faqTitle)}</h2>
      <div class="accordion">${items}
      </div>
      <p class="mt-4"><a href="#faq" class="btn btn-outline btn-sm">${esc(ui.faqMore)}</a></p>
    </div>
  </section>`;
}

function renderJoinYoutubeTalks(rec, lang) {
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
  <section class="section yt-talks-section" id="join-prof-talks" aria-labelledby="join-talks-title">
    <div class="container">
      <div class="yt-talks-head-row">
        <header class="section-head">
          <span class="section-eyebrow">${esc(yt.eyebrow || '지도교수의 육성 · @꽁대교수')}</span>
          <h2 class="section-title" id="join-talks-title">${esc(yt.title || '커피챗 전에 미리 들어보는 박욱 교수의 생각')}</h2>
          ${yt.lead ? `<p class="section-lead">${esc(yt.lead)}</p>` : ''}
        </header>
        <a class="btn btn-outline btn-sm yt-channel-btn" href="${esc(chUrl)}" target="_blank" rel="noopener noreferrer" data-track="youtube_channel_open">${esc(yt.channel_cta || '@꽁대교수 채널 보기 ↗')}</a>
      </div>
      <div class="yt-talks-grid">${items}
      </div>
    </div>
  </section>`;
}

/* --------------------------------------------------------------------------
   Public view
   -------------------------------------------------------------------------- */
export function renderJoin(data = {}, subRoute = '', appState = {}) {
  const lang = langOf(data);
  const ui = UI[lang];
  const rec = data.recruiting || {};
  const banner = rec.cohort_banner || {};
  const cs = ensureComposerState(appState, rec, subRoute);
  return `<div class="recruiting-page" data-join-sub="${esc(subRoute)}">
${renderHero(banner, lang, ui)}
${renderTracks(arr(rec.tracks), subRoute, lang, ui)}
${renderSupport(banner.stipend_box, arr(rec.charter_ko), lang, ui)}
${renderJoinYoutubeTalks(rec, lang)}
${renderComposer(rec, cs, lang, ui)}
${renderRecruitFaq(arr(rec.recruiting_faq), lang, ui)}
</div>`;
}

/* --------------------------------------------------------------------------
   Public binder (elements are re-created per render, so listeners attach directly)
   -------------------------------------------------------------------------- */
async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch (_) { /* fall through to the legacy path */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.className = 'sr-only';
    ta.setAttribute('readonly', '');
    ta.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (_) { return false; }
}

export function bindJoinEvents(rootEl, ctx = {}) {
  const root = rootEl || document;
  const state = ctx.state || {};
  const data = ctx.data || state.data || {};
  const lang = langOf(data);
  const ui = UI[lang];
  const rec = data.recruiting || {};
  const subRoute = ctx.subRoute || '';
  const cs = ensureComposerState(state, rec, subRoute);
  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => Array.from(root.querySelectorAll(sel));
  const fire = (name, extra = {}) => { try { ctx.track?.(name, { lang, ...extra }); } catch (_) { /* analytics must never break UI */ } };
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const scrollTo = (el) => el?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });

  const subjectEl = $('#comp-preview-subject');
  const bodyEl = $('#comp-preview-body');
  const gmailBtn = $('#comp-gmail-btn');
  const mailtoBtn = $('#comp-mailto-btn');
  const copyBtn = $('#comp-copy-btn');
  const composerSection = $('#composer-section');

  const setChip = (btn, on) => {
    btn.classList.toggle('is-selected', on);
    btn.setAttribute('aria-pressed', String(on));
  };

  const refresh = () => {
    const draft = buildDraft(rec, cs, lang);
    if (subjectEl) subjectEl.textContent = ui.subjectPrefix + draft.subject;
    if (bodyEl) bodyEl.textContent = draft.body;
    gmailBtn?.setAttribute('href', draft.gmail);
    mailtoBtn?.setAttribute('href', draft.mailto);
    $$('[data-composer-track]').forEach((b) => setChip(b, b.dataset.composerTrack === cs.track));
    $$('[data-composer-topic]').forEach((b) => setChip(b, cs.topics.includes(b.dataset.composerTopic)));
    return draft;
  };

  /* Track cards -> preset composer track and jump to the composer */
  $$('[data-select-track]').forEach((btn) => {
    btn.addEventListener('click', () => {
      cs.track = btn.dataset.selectTrack || '';
      refresh();
      fire('recruit_track_select', { track: cs.track });
      scrollTo(composerSection);
      const chip = $$('[data-composer-track]').find((b) => b.dataset.composerTrack === cs.track);
      (chip || $('#composer-title'))?.focus({ preventScroll: true });
      ctx.toast?.(ui.trackSet);
    });
  });

  /* Composer chips: single-select track, multi-select topics */
  $$('[data-composer-track]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.composerTrack;
      cs.track = cs.track === id ? '' : id;
      refresh();
    });
  });
  $$('[data-composer-topic]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.composerTopic;
      cs.topics = cs.topics.includes(id) ? cs.topics.filter((x) => x !== id) : [...cs.topics, id];
      refresh();
    });
  });

  /* Typed inputs persist in app state so a KO/EN switch keeps them */
  [['#comp-name', 'name'], ['#comp-affil', 'affil'], ['#comp-note', 'note']].forEach(([sel, key]) => {
    const el = $(sel);
    if (!el) return;
    if (el.value !== cs[key]) el.value = cs[key];
    el.addEventListener('input', () => { cs[key] = clip(el.value, LIMITS[key]); refresh(); });
  });

  /* Three delivery actions */
  gmailBtn?.addEventListener('click', () => { refresh(); fire('inquiry_gmail_open', { track: cs.track || 'none' }); });
  mailtoBtn?.addEventListener('click', () => { refresh(); fire('inquiry_mailto_open', { track: cs.track || 'none' }); });
  copyBtn?.addEventListener('click', async () => {
    const draft = refresh();
    const ok = await copyText(draft.clipboard);
    if (ok) {
      ctx.toast?.(ui.copied);
      fire('inquiry_draft_copy', { track: cs.track || 'none' });
    } else {
      ctx.toast?.(ui.copyFail + draft.to);
      bodyEl?.focus();
    }
  });

  /* FAQ accordion */
  $$('.accordion-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      if (!item) return;
      const open = item.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', String(open));
    });
  });

  refresh();

  /* Deep links: #join/chat -> composer, #join/<track> -> track cards (skipped on language-only rerenders) */
  const langOnlyRerender = state.joinViewLang && state.joinViewLang !== lang && state.joinViewSub === subRoute;
  state.joinViewLang = lang;
  state.joinViewSub = subRoute;
  if (!langOnlyRerender && subRoute) {
    const target = subRoute === 'chat' || subRoute === 'composer' ? composerSection
      : (arr(rec.tracks).some((tr) => tr.id === subRoute) ? $('#tracks-section') : null);
    if (target) requestAnimationFrame(() => scrollTo(target));
  }
}
