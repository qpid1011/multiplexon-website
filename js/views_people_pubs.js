/**
 * MultiplexON Lab — People (Members & Career Trajectory) + Publications views
 * Department of Electronic Engineering, Kyung Hee University (경희대학교 전자공학과)
 * Pure ES module. State is expressed only via classList / attributes (no inline style mutation).
 * Privacy: the only email ever rendered is the PI contact address.
 */

const AFFILIATION_KO = '경희대학교 전자공학과 교수';
const AFFILIATION_EN = 'Professor, Department of Electronic Engineering, Kyung Hee University';
const PI_EMAIL = 'parkwook@khu.ac.kr';
const COHORT_IMAGE = 'assets/images/recruiting/workbench_open_cohort.jpg';
const PUB_TABS = ['journals', 'conferences', 'patents'];

const SECTOR_LABELS = {
  all: ['전체', 'All'],
  industry: ['글로벌 테크·반도체', 'Global Tech & Semiconductor'],
  academia: ['학계·국책연구소', 'Academia & National Labs'],
  startup: ['스타트업', 'Startup'],
  other: ['기타', 'Other'],
};

/* ------------------------------ helpers ------------------------------ */
function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const getLang = (data, appState) => ((data && data.lang) || (appState && appState.lang)) === 'en' ? 'en' : 'ko';
const tr = (lang, ko, en) => (lang === 'en' ? en : ko);
const pick = (v, lang) => (v && typeof v === 'object' && !Array.isArray(v)) ? (v[lang] ?? v.ko ?? v.en ?? '') : (v ?? '');
const arr = (v) => (Array.isArray(v) ? v : []);
const cleanSub = (s) => String(s ?? '').split('?')[0].replace(/^\/+|\/+$/g, '').toLowerCase();

function safeUrl(url) {
  const s = String(url ?? '').trim();
  if (!s) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(s) && !/^https?:/i.test(s)) return '';
  return s;
}

function initials(name) {
  const cleaned = String(name ?? '').replace(/\(.*?\)/g, '').replace(/^(Dr|Prof)\.?\s+/i, '').trim();
  if (!cleaned) return 'MO';
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2 && /^[A-Za-z]/.test(parts[0])) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return cleaned.slice(0, 2).toUpperCase();
}

function biName(m, lang) {
  const en = String(m.name || '').trim();
  const ko = String(m.name_ko || '').trim();
  const primary = lang === 'en' ? (en || ko) : (ko || en);
  const secondary = lang === 'en' ? ko : en;
  return { primary, secondary: secondary && secondary !== primary ? secondary : '' };
}

function mentorName(p, lang) {
  const en = String(p.name || '').replace(/^Dr\.?\s*/i, '').trim();
  const ko = String(p.name_ko || '').replace(/\s*박사$/, '').trim();
  const enFull = en ? `Dr. ${en}` : '';
  const koFull = ko ? `${ko} 박사` : '';
  const [a, b] = lang === 'en' ? [enFull, koFull] : [koFull, enFull];
  return a && b ? `${a} (${b})` : (a || b || 'Postdoctoral Mentor');
}

function sectionHead(kicker, title, lede = '') {
  return `<header class="section-head">
      <span class="bento-kicker">${esc(kicker)}</span>
      <h2 class="section-title">${esc(title)}</h2>
      ${lede ? `<p class="section-lede">${esc(lede)}</p>` : ''}
    </header>`;
}

function subnav(tabs, activeHref, label) {
  return `<nav class="subnav-tabs" aria-label="${esc(label)}">${tabs.map(([href, text]) => {
    const on = href === activeHref;
    return `<a class="subnav-tab${on ? ' is-active' : ''}" href="${esc(href)}"${on ? ' aria-current="page"' : ''}>${esc(text)}</a>`;
  }).join('')}</nav>`;
}

/* ------------------------------ members: PI ------------------------------ */
function piNames(prof, lang) {
  const en = `Prof. ${String(prof.name || 'Wook Park').replace(/^Prof\.?\s*/i, '').trim()}`;
  const ko = `${String(prof.name_ko || '박욱').replace(/\s*교수$/, '').trim()} 교수`;
  return lang === 'en' ? { primary: en, secondary: ko } : { primary: ko, secondary: en };
}

function piPhoto(prof, caption) {
  const src = safeUrl(prof.photo);
  return src
    ? `<img class="prof-photo lightbox-img" src="${esc(src)}" alt="${esc(caption)}" loading="lazy" data-lightbox-src="${esc(src)}" data-lightbox-caption="${esc(caption)}">`
    : `<div class="prof-photo member-avatar" aria-hidden="true"><span>WP</span></div>`;
}

function piActions(prof, lang, withProfileLink) {
  const scholar = safeUrl(prof.scholar_url);
  const orcid = safeUrl(prof.orcid_url);
  const yt = safeUrl(prof.youtube_url) || 'https://www.youtube.com/@꽁대교수';
  const origin = safeUrl(prof.lab_origin_url);
  return `<div class="prof-actions">
      <a class="btn btn-sm btn-primary" href="mailto:${PI_EMAIL}">${PI_EMAIL}</a>
      ${scholar ? `<a class="btn btn-sm btn-outline" href="${esc(scholar)}" target="_blank" rel="noopener noreferrer">Google Scholar ↗</a>` : ''}
      ${orcid ? `<a class="btn btn-sm btn-outline" href="${esc(orcid)}" target="_blank" rel="noopener noreferrer">ORCID (${esc(prof.orcid || '0000-0002-7928-547X')}) ↗</a>` : ''}
      ${yt ? `<a class="btn btn-sm btn-outline" href="${esc(yt)}" target="_blank" rel="noopener noreferrer" data-track="youtube_channel_open">${esc(tr(lang, 'YouTube @꽁대교수 ↗', 'YouTube (Korean Talks) ↗'))}</a>` : ''}
      ${origin ? `<a class="btn btn-sm btn-outline" href="${esc(origin)}" target="_blank" rel="noopener noreferrer">${esc(tr(lang, '출신 연구실 (SNU BINEL)', 'Lab of Origin (SNU BINEL)'))}</a>` : ''}
      ${withProfileLink ? `<a class="btn btn-sm btn-outline" href="#members/professor">${esc(tr(lang, '약력 전체 보기 →', 'Full PI profile →'))}</a>` : `<a class="btn btn-sm btn-outline" href="./professor.html">${esc(tr(lang, '박욱 교수 고정 프로필 URL ↗', 'Canonical Faculty Profile ↗'))}</a>`}
    </div>`;
}

function renderPiCard(prof, lang) {
  const n = piNames(prof, lang);
  return `<section class="pi-card bento-cell scroll-reveal" aria-label="${esc(tr(lang, '지도교수', 'Principal Investigator'))}">
      <div class="pi-card-media">${piPhoto(prof, `${n.primary} — ${tr(lang, AFFILIATION_KO, AFFILIATION_EN)}`)}</div>
      <div class="pi-card-body">
        <span class="bento-kicker">${esc(tr(lang, '지도교수', 'Principal Investigator'))}</span>
        <h2 class="prof-name">${esc(n.primary)} <span class="name-secondary">${esc(n.secondary)}</span></h2>
        <p class="prof-affiliation">${esc(tr(lang, AFFILIATION_KO, AFFILIATION_EN))}</p>
        <p class="prof-affiliation-alt">${esc(tr(lang, AFFILIATION_EN, AFFILIATION_KO))}</p>
        ${piActions(prof, lang, true)}
      </div>
    </section>`;
}

function timeline(entries, lang) {
  const list = arr(entries);
  if (!list.length) return '';
  return `<ul class="timeline cv-timeline">${list.map((e) => {
    if (typeof e === 'string') return `<li class="timeline-item"><div class="timeline-content">${esc(e)}</div></li>`;
    const period = e.period || e.date || e.year || '';
    const detail = pick(e.detail ?? e.text ?? e.title, lang);
    return `<li class="timeline-item">${period ? `<div class="timeline-period"><span class="badge badge-year">${esc(period)}</span></div>` : ''}<div class="timeline-content">${esc(detail)}</div></li>`;
  }).join('')}</ul>`;
}

function renderPiProfile(prof, lang) {
  const n = piNames(prof, lang);
  const bio = pick(prof.bio, lang);
  const blocks = [
    [tr(lang, '학력', 'Education'), tr(lang, '학문적 배경', 'Academic training'), timeline(prof.education, lang)],
    [tr(lang, '경력', 'Career & Leadership'), tr(lang, '주요 보직과 활동', 'Appointments & service'), timeline(prof.career, lang)],
    [tr(lang, '수상', 'Honors & Awards'), tr(lang, '주요 수상 내역', 'Selected recognition'), timeline(prof.awards, lang)],
  ].filter((b) => b[2]);
  return `<section class="professor-view cv-stack">
      <div class="bento-grid">
        <aside class="bento-cell span-4">
          ${piPhoto(prof, `${n.primary} — ${tr(lang, AFFILIATION_KO, AFFILIATION_EN)}`)}
          <h2 class="prof-name">${esc(n.primary)}</h2>
          <p class="name-secondary">${esc(n.secondary)}</p>
          <p class="prof-affiliation">${esc(AFFILIATION_KO)}</p>
          <p class="prof-affiliation-alt">${esc(AFFILIATION_EN)}</p>
          ${piActions(prof, lang, false)}
        </aside>
        <div class="bento-cell span-8 cv-stack">
          ${sectionHead(tr(lang, '지도교수 약력', 'PI Profile'), tr(lang, '연구와 교육의 궤적', 'A trajectory in research and mentoring'), bio)}
          ${blocks.length ? blocks.map(([title, kicker, html]) => `<section class="cv-block scroll-reveal"><span class="bento-kicker">${esc(kicker)}</span><h3 class="card-title">${esc(title)}</h3>${html}</section>`).join('')
            : `<p class="empty-state">${esc(tr(lang, '약력 정보를 준비 중입니다.', 'Profile details are being prepared.'))}</p>`}
        </div>
      </div>
    </section>`;
}

/* ------------------------------ members: current ------------------------------ */
function renderMentors(postdocs, lang) {
  if (!postdocs.length) return '';
  const cards = postdocs.map((p) => {
    const display = mentorName(p, lang);
    const badge = pick(p.mentor_badge, lang) || tr(lang, '연구실 출신 박사후연구원', 'Lab-grown Postdoc');
    const role = tr(lang, p.role_ko || p.role, p.role || p.role_ko) || tr(lang, '박사후연구원', 'Postdoctoral Researcher');
    const spec = pick(p.specialty, lang);
    const note = pick(p.mentor_note, lang) || (typeof p.current_mentor === 'string' && p.current_mentor.trim()
      ? p.current_mentor
      : tr(lang, '신입 대학원생·학부연구생의 실험 설계부터 논문 작성까지 가까이에서 함께합니다.', 'Works side by side with new graduate and undergraduate researchers — from experiment design to manuscript writing.'));
    return `<article class="mentor-card scroll-reveal">
        <div class="member-avatar" aria-hidden="true"><span>${esc(initials(p.name || p.name_ko))}</span></div>
        <div class="mentor-card-body">
          <span class="mentor-origin-badge">${esc(badge)}</span>
          <h3 class="mentor-name">${esc(display)}</h3>
          <p class="mentor-role">${esc(role)}${spec ? ` · ${esc(spec)}` : ''}</p>
          <p class="mentor-note">${esc(note)}</p>
        </div>
      </article>`;
  }).join('');
  return `<section class="mentor-spotlight" id="mentors">
      ${sectionHead(tr(lang, '밀착 멘토링', 'Close Mentoring'), tr(lang, '연구실에서 성장한 박사후연구원 멘토', 'Lab-Grown Postdoctoral Mentors'),
        tr(lang, '이 연구실에서 학위를 마친 선배가 지금은 멘토로서 다음 세대와 함께 연구합니다.', 'Researchers who earned their degrees in this lab now mentor the next cohort.'))}
      <div class="mentor-spotlight-grid">${cards}</div>
    </section>`;
}

function memberCard(m, lang, fallbackRole) {
  const n = biName(m, lang);
  const role = tr(lang, m.role_ko || m.role, m.role || m.role_ko) || fallbackRole;
  return `<article class="member-card scroll-reveal">
      <div class="member-avatar" aria-hidden="true"><span>${esc(initials(m.name || m.name_ko))}</span></div>
      <div class="member-card-body">
        <h4 class="member-name">${esc(n.primary)}${n.secondary ? ` <span class="name-secondary">${esc(n.secondary)}</span>` : ''}</h4>
        <p class="member-role">${esc(role)}</p>
      </div>
    </article>`;
}

function renderCohort(gradStudents, recruiting, lang) {
  const head = sectionHead(tr(lang, '대학원 과정', 'Graduate Cohort'), tr(lang, '대학원생 워크벤치', 'Graduate Workbench'));
  if (gradStudents.length > 0) {
    return `<section class="cohort-section" id="cohort">${head}
        <div class="member-grid">${gradStudents.map((m) => memberCard(m, lang, tr(lang, '대학원생', 'Graduate Student'))).join('')}</div>
      </section>`;
  }
  const b = (recruiting && recruiting.cohort_banner) || {};
  const image = safeUrl(b.image) || COHORT_IMAGE;
  const tag = pick(b.tag, lang) || tr(lang, '새 코호트 모집 중', 'Open Cohort');
  const title = pick(b.title, lang) || tr(lang, '이 워크벤치의 다음 주인을 기다립니다', 'This workbench is waiting for its next researcher');
  const body = pick(b.body, lang) || tr(lang,
    '현재 대학원 과정 재학생 자리는 비어 있습니다. 숨기지 않고 말씀드립니다 — 새로 합류하는 석·박사과정생은 연구실 출신 박사후연구원 멘토와 지도교수의 밀착 지도를 받으며 새 코호트의 첫 구성원이 됩니다.',
    'We currently have no enrolled graduate students, and we say so plainly. Incoming M.S./Ph.D. students become the first members of a new cohort, working closely with our lab-grown postdoctoral mentors and the PI.');
  const cta = pick(b.cta_label, lang) || tr(lang, '대학원 진학 상담 시작하기', 'Start a graduate admission chat');
  return `<section class="cohort-section" id="cohort">
      <div class="cohort-open-banner scroll-reveal">
        <figure class="cohort-open-media">
          <img class="lightbox-img" src="${esc(image)}" alt="${esc(tr(lang, '새 대학원 코호트를 기다리는 연구실 워크벤치', 'Lab workbench open for the next graduate cohort'))}" loading="lazy" data-lightbox-src="${esc(image)}" data-lightbox-caption="${esc(title)}">
        </figure>
        <div class="cohort-open-body">
          <span class="cohort-open-tag">${esc(tag)}</span>
          <h2 class="cohort-open-title">${esc(title)}</h2>
          <p class="cohort-open-text">${esc(body)}</p>
          <div class="cohort-open-actions">
            <a href="#join/chat?track=graduate" class="btn btn-recruit">${esc(cta)}</a>
            <a href="#members/alumni" class="btn btn-outline">${esc(tr(lang, '선배들의 진로 보기', 'See where alumni went'))}</a>
          </div>
        </div>
      </div>
    </section>`;
}

function renderActiveTeam(current, lang) {
  const groups = [
    [tr(lang, '학부연구생', 'Undergraduate Researchers'), arr(current.undergrad_students), tr(lang, '학부연구생', 'Undergraduate Researcher')],
    [tr(lang, '연구 지원', 'Research Staff'), arr(current.staff), tr(lang, '연구원', 'Staff')],
  ].filter((g) => g[1].length);
  if (!groups.length) return '';
  return `<section class="active-team" id="team">
      ${sectionHead(tr(lang, '현재 구성원', 'Active Team'), tr(lang, '지금 함께 연구하는 사람들', 'People in the lab right now'))}
      ${groups.map(([title, list, fb]) => `<div class="team-group"><h3 class="card-title">${esc(title)} <span class="badge badge-count">${list.length}</span></h3>
        <div class="member-grid">${list.map((m) => memberCard(m, lang, fb)).join('')}</div></div>`).join('')}
      <p class="team-cta"><a class="btn btn-outline" href="#join/chat?track=intern">${esc(tr(lang, '학부연구생 지원 문의', 'Ask about undergraduate research'))}</a></p>
    </section>`;
}

/* ------------------------------ members: alumni wall ------------------------------ */
function alumniCard(a, level, lang) {
  const sector = SECTOR_LABELS[a.sector] && a.sector !== 'all' ? a.sector : 'other';
  const n = biName(a, lang);
  const degree = level === 'graduate' ? (a.degree || 'Ph.D. / M.S.') : tr(lang, '학부연구생', 'Undergrad Intern');
  const aff = tr(lang, a.affiliation_ko || a.affiliation, a.affiliation || a.affiliation_ko) || (a.current_member ? '' : (a.raw || ''));
  const dest = a.current_member
    ? `<span class="badge alumni-current-badge">${esc(tr(lang, '현 박사후연구원 멘토 재직 중', 'Currently Postdoc Mentor in Lab'))}</span>${aff ? `<span class="alumni-affiliation">${esc(aff)}</span>` : ''}`
    : `<span class="alumni-affiliation">${esc(aff || tr(lang, '진로 정보 업데이트 예정', 'Destination to be updated'))}</span>`;
  return `<article class="alumni-trajectory-card sector-${sector}${a.current_member ? ' is-current-member' : ''}" data-sector="${sector}" data-level="${level}">
      <header class="alumni-card-head">
        <span class="badge alumni-degree-badge">${esc(degree)}</span>
        ${a.year_or_period ? `<span class="alumni-period">${esc(a.year_or_period)}</span>` : ''}
      </header>
      <h4 class="alumni-name">${esc(n.primary || tr(lang, '동문', 'Alumnus'))}${n.secondary ? ` <span class="name-secondary">${esc(n.secondary)}</span>` : ''}</h4>
      <p class="alumni-trajectory"><span class="alumni-origin">MultiplexON Lab</span><span class="alumni-arrow" aria-hidden="true">→</span>${dest}</p>
      <span class="badge alumni-sector-badge">${esc(tr(lang, ...SECTOR_LABELS[sector]))}</span>
    </article>`;
}

function renderAlumniWall(alumni, lang) {
  const grad = arr(alumni.graduate);
  const ug = arr(alumni.undergraduate);
  const all = grad.concat(ug);
  if (!all.length) {
    return `<section class="alumni-section" id="alumni">${sectionHead(tr(lang, '동문 진로', 'Alumni Trajectory'), tr(lang, '졸업 후의 길', 'Where our alumni go'))}
        <p class="empty-state">${esc(tr(lang, '동문 정보를 준비 중입니다.', 'Alumni records are being prepared.'))}</p></section>`;
  }
  const count = (s) => all.filter((a) => a.sector === s).length;
  const stats = [
    [all.length, tr(lang, '전체 동문', 'Total Alumni')],
    [grad.length, tr(lang, '대학원 졸업 동문', 'Graduate Alumni')],
    [count('academia'), tr(lang, ...SECTOR_LABELS.academia)],
    [count('industry'), tr(lang, ...SECTOR_LABELS.industry)],
    [count('startup'), tr(lang, ...SECTOR_LABELS.startup)],
  ];
  const sectors = ['all', 'industry', 'academia', 'startup'].concat(count('other') ? ['other'] : []);
  const levels = [['all', tr(lang, '전체 과정', 'All levels')], ['graduate', 'Ph.D. / M.S.'], ['undergraduate', tr(lang, '학부연구생', 'Undergrad Intern')]];
  const btn = (attr, value, label, on) => `<button type="button" class="alumni-tab${on ? ' is-active' : ''}" data-${attr}="${value}" aria-pressed="${on ? 'true' : 'false'}">${esc(label)}</button>`;
  return `<section class="alumni-section" id="alumni">
      ${sectionHead(tr(lang, '동문 진로', 'Alumni Trajectory'), tr(lang, '졸업 후, 선배들은 어디로 갔을까요?', 'Where do our alumni go next?'),
        tr(lang, '분야와 과정을 눌러 실제 진로를 직접 확인해 보세요.', 'Filter by sector and degree level to explore real career paths.'))}
      <ul class="alumni-stats" aria-label="${esc(tr(lang, '동문 진로 요약', 'Alumni career summary'))}">
        ${stats.map(([num, label]) => `<li class="alumni-stat"><strong class="alumni-stat-num">${num}</strong><span class="alumni-stat-label">${esc(label)}</span></li>`).join('')}
      </ul>
      <div class="alumni-filter-bar">
        <div class="alumni-sector-tabs" role="group" aria-label="${esc(tr(lang, '진로 분야 필터', 'Filter by sector'))}">
          ${sectors.map((s) => btn('sector', s, tr(lang, ...SECTOR_LABELS[s]), s === 'all')).join('')}
        </div>
        <div class="alumni-degree-tabs" role="group" aria-label="${esc(tr(lang, '과정 필터', 'Filter by degree level'))}">
          ${levels.map(([v, label]) => btn('level', v, label, v === 'all')).join('')}
        </div>
      </div>
      <p class="alumni-filter-status" id="alumni-filter-status" role="status" aria-live="polite">${esc(tr(lang, `${all.length}명 표시 중`, `Showing ${all.length} alumni`))}</p>
      <div class="alumni-wall">
        ${grad.map((a) => alumniCard(a, 'graduate', lang)).join('')}
        ${ug.map((a) => alumniCard(a, 'undergraduate', lang)).join('')}
      </div>
      <p class="alumni-empty empty-state" hidden>${esc(tr(lang, '조건에 맞는 동문이 없습니다. 다른 필터를 선택해 보세요.', 'No alumni match this combination. Try another filter.'))}</p>
      <div class="alumni-cta">
        <p>${esc(tr(lang, '다음 진로 이야기의 주인공이 되어 보세요.', 'Your trajectory could be the next one on this wall.'))}</p>
        <a href="#join" class="btn btn-recruit">${esc(tr(lang, '지원 안내 보기', 'How to join'))}</a>
      </div>
    </section>`;
}

/* ------------------------------ members: public API ------------------------------ */
export function renderMembers(data = {}, subRoute = '', appState = {}) {
  const lang = getLang(data, appState);
  const members = data.members || {};
  const prof = members.professor || {};
  const current = members.current || {};
  const alumni = members.alumni || {};
  const sub = cleanSub(subRoute);
  const view = ['current', 'alumni', 'professor'].includes(sub) ? sub : 'all';

  const mentors = () => renderMentors(arr(current.postdocs), lang);
  const cohort = () => renderCohort(arr(current.grad_students), data.recruiting || {}, lang);
  const team = () => renderActiveTeam(current, lang);
  const wall = () => renderAlumniWall(alumni, lang);

  let body;
  if (view === 'professor') body = renderPiProfile(prof, lang);
  else if (view === 'current') body = mentors() + cohort() + team();
  else if (view === 'alumni') body = wall();
  else body = renderPiCard(prof, lang) + mentors() + cohort() + team() + wall();

  const tabs = [
    ['#members', tr(lang, '전체 보기', 'Team & Career Overview')],
    ['#members/current', tr(lang, '구성원 & 멘토', 'Mentors & Open Seats')],
    ['#members/alumni', tr(lang, '동문 진로', 'Alumni Trajectory')],
    ['#members/professor', tr(lang, '지도교수 약력', 'PI Profile')],
  ];
  return `<div class="recruiting-page">
    <div class="members-page" data-members-view="${view}">
      <header class="page-header">
        <span class="bento-kicker">${esc(tr(lang, '사람과 진로', 'People & Careers'))}</span>
        <h1 class="page-title">${esc(tr(lang, '함께 연구하고, 함께 성장합니다', 'We research together and grow together'))}</h1>
        <p class="page-lede">${esc(tr(lang, '멘토, 열려 있는 자리, 그리고 선배들의 실제 진로를 한 페이지에서 확인하세요.', 'Meet the mentors, see the open seats, and explore where our alumni actually went.'))}</p>
      </header>
      ${subnav(tabs, view === 'all' ? '#members' : `#members/${view}`, tr(lang, '구성원 하위 메뉴', 'Members sections'))}
      ${body}
    </div>
  </div>`;
}

export function bindMembersEvents(rootEl, ctx = {}) {
  if (!rootEl) return;
  const lang = getLang(ctx.data, ctx.state);
  const track = (name, params) => { try { if (typeof ctx.track === 'function') ctx.track(name, params); } catch (_) { /* analytics is optional */ } };

  rootEl.querySelectorAll('.cohort-open-banner a.btn-recruit, .alumni-cta a.btn-recruit').forEach((link) => {
    link.addEventListener('click', () => track('recruit_cta_click', { source: 'members', lang }));
  });

  const wall = rootEl.querySelector('.alumni-wall');
  if (!wall) return;
  const cards = Array.from(wall.querySelectorAll('article.alumni-trajectory-card'));
  const status = rootEl.querySelector('#alumni-filter-status');
  const empty = rootEl.querySelector('.alumni-empty');
  const filter = { sector: 'all', level: 'all' };

  const apply = () => {
    let shown = 0;
    cards.forEach((card) => {
      const match = (filter.sector === 'all' || card.dataset.sector === filter.sector)
        && (filter.level === 'all' || card.dataset.level === filter.level);
      card.hidden = !match;
      if (match) shown += 1;
    });
    if (status) status.textContent = tr(lang, `${shown}명 표시 중 (전체 ${cards.length}명)`, `Showing ${shown} of ${cards.length} alumni`);
    if (empty) empty.hidden = shown !== 0;
  };

  const wire = (groupSelector, key) => {
    const group = rootEl.querySelector(groupSelector);
    if (!group) return;
    const buttons = Array.from(group.querySelectorAll(`button[data-${key}]`));
    group.addEventListener('click', (event) => {
      const button = event.target.closest(`button[data-${key}]`);
      if (!button || !group.contains(button)) return;
      filter[key] = button.dataset[key] || 'all';
      buttons.forEach((b) => {
        const on = b === button;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      apply();
      track('alumni_filter', { sector: filter.sector, level: filter.level, lang });
    });
  };
  wire('.alumni-sector-tabs', 'sector');
  wire('.alumni-degree-tabs', 'level');
  apply();
}

/* ------------------------------ publications ------------------------------ */
function pubHaystack(p) {
  return [p.title, p.title_ko, p.patent_number, p.authors, p.journal_info, p.citation, p.year, p.country, p.domain, p.scope, p.journal].filter(Boolean).join(' ').toLowerCase();
}

function filterPubs(list, filter, tab = '') {
  const year = String((filter && filter.year) || 'ALL');
  const country = String((filter && filter.country) || 'ALL');
  const domain = String((filter && filter.domain) || 'ALL');
  const terms = String((filter && filter.query) || '').toLowerCase().split(/\s+/).filter(Boolean);
  return list.filter((p) => {
    if (tab === 'patents' && country !== 'ALL' && String(p.country) !== country) return false;
    if (tab === 'patents' && domain !== 'ALL' && String(p.domain) !== domain) return false;
    if (year !== 'ALL' && String(p.year) !== year) return false;
    if (!terms.length) return true;
    return terms.every((term) => pubHaystack(p).includes(term));
  });
}

function pubYears(list) {
  return Array.from(new Set(list.map((p) => String(p.year ?? '')).filter((y) => y && y !== '0'))).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
}

function parsePatentMeta(p, lang) {
  const cit = String(p.citation || p.title || '');
  const usGrant = cit.match(/U\.S\.\s*Patent\s*No\.\s*([\d,]+)/i);
  const usApp = cit.match(/U\.S\.\s*Patent\s*Application\s*No\.\s*([\d/,]+)/i);
  const krReg = cit.match(/Korea\s*Patent\s*Registration\s*No\.\s*([\d-]+)/i);
  const rawUrl = safeUrl(p.url);
  if (usGrant) {
    const cleanNum = usGrant[1].replace(/,/g, '');
    return { badge: tr(lang, `US 등록특허 · ${usGrant[1]}`, `US Granted · ${usGrant[1]}`), isApp: false, url: rawUrl || `https://patents.google.com/patent/US${cleanNum}`, linkLabel: 'Google Patents ↗' };
  }
  if (krReg) return { badge: tr(lang, `KR 등록특허 · ${krReg[1]}`, `KR Registered · ${krReg[1]}`), isApp: false, url: rawUrl, linkLabel: 'Google Patents ↗' };
  if (usApp) return { badge: tr(lang, `US 공개출원 · ${usApp[1]}`, `US Published App · ${usApp[1]}`), isApp: true, url: rawUrl, linkLabel: 'Google Patents ↗' };
  return { badge: p.country === 'US' ? 'USPTO' : 'KIPO', isApp: p.status_type === 'application', url: rawUrl, linkLabel: tr(lang, '원문 보기 ↗', 'View ↗') };
}

function pubItem(p, tab, lang) {
  const url = safeUrl(p.url);
  const num = p.num !== undefined && p.num !== null && p.num !== '' ? `<span class="pub-num">${esc(p.num)}</span>` : '';
  let body;
  if (tab === 'journals' && p.title) {
    const title = url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(p.title)}</a>` : esc(p.title);
    body = `<h4 class="pub-title">${title}${p.is_cover ? ` <span class="badge badge-cover">${esc(tr(lang, '표지 논문', 'Cover Article'))}</span>` : ''}</h4>
        ${p.authors ? `<p class="pub-authors">${esc(p.authors)}</p>` : ''}${p.journal_info ? `<p class="pub-journal">${esc(p.journal_info)}</p>` : ''}`;
  } else if (tab === 'patents') {
    const pm = parsePatentMeta(p, lang);
    const pTitle = lang === 'ko' ? (p.title_ko || p.title) : (p.title || p.title_ko);
    const altTitle = lang === 'ko' && p.title_ko && p.title ? p.title : (lang === 'en' && p.title && p.title_ko ? p.title_ko : '');
    const domBadge = p.domain_label ? `<span class="badge badge-domain">${esc(pick(p.domain_label, lang))}</span>` : '';
    const famNote = p.family_note ? `<span class="patent-family-note">${esc(pick(p.family_note, lang))}</span>` : '';
    const doiUrl = safeUrl(p.doi_url);
    const pLink = pm.url ? `<a class="pub-link" href="${esc(pm.url)}" target="_blank" rel="noopener noreferrer">${esc(pm.linkLabel)}</a>` : '';
    const kLink = doiUrl && doiUrl !== pm.url ? ` <a class="pub-link" href="${esc(doiUrl)}" target="_blank" rel="noopener noreferrer">KIPRIS DOI ↗</a>` : '';
    const head = pTitle ? `<h4 class="pub-title">${pm.url ? `<a href="${esc(pm.url)}" target="_blank" rel="noopener noreferrer">${esc(pTitle)}</a>` : esc(pTitle)}</h4>` : '';
    body = `<div class="patent-meta-row"><span class="patent-status-badge${pm.isApp ? ' is-app' : ''}">${esc(pm.badge)}</span>${domBadge}${famNote}</div>
        ${head}${altTitle ? `<p class="pub-authors">${esc(altTitle)}</p>` : ''}<p class="pub-citation">${esc(p.citation || '')}</p>${pLink}${kLink}`;
  } else {
    const link = url ? `<a class="pub-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(tr(lang, '원문 보기 ↗', 'View ↗'))}</a>` : '';
    body = `<p class="pub-citation">${p.scope ? `<span class="badge badge-scope">${esc(p.scope)}</span> ` : ''}${esc(p.citation || p.title || '')}</p>${link}`;
  }
  return `<li class="pub-item${p.is_cover ? ' is-cover' : ''}">${num}<div class="pub-body">${body}</div></li>`;
}

function pubCountText(count, total, lang) {
  return tr(lang, `${total}건 중 ${count}건 표시`, `Showing ${count} of ${total}`);
}

function renderPubResults(list, tab, filter, lang) {
  const results = filterPubs(list, filter, tab);
  if (!results.length) {
    return `<div class="empty-state pub-empty">
        <p>${esc(list.length ? tr(lang, '검색 조건에 맞는 성과가 없습니다.', 'No records match your search.') : tr(lang, '등록된 성과를 준비 중입니다.', 'Records are being prepared.'))}</p>
        ${list.length ? `<button type="button" class="btn btn-sm btn-outline" data-pub-reset>${esc(tr(lang, '필터 초기화', 'Reset filters'))}</button>` : ''}
      </div>`;
  }
  const groups = [];
  results.forEach((p) => {
    const rawYear = String(p.year ?? '');
    const year = rawYear && rawYear !== '0' ? rawYear : tr(lang, '기타 등록·출원', 'Additional Filings');
    const last = groups[groups.length - 1];
    if (last && last.year === year) last.items.push(p);
    else groups.push({ year, items: [p] });
  });
  return groups.map((g) => `<section class="pub-year-group">
      ${g.year ? `<h3 class="pub-year-heading">${esc(g.year)} <span class="badge badge-count">${g.items.length}</span></h3>` : ''}
      <ol class="pub-list">${g.items.map((p) => pubItem(p, tab, lang)).join('')}</ol>
    </section>`).join('');
}

function renderStudentSpotlight(highlights, lang) {
  const items = arr(highlights).slice(0, 4);
  return `<aside class="student-spotlight scroll-reveal" aria-label="${esc(tr(lang, '학생 연구·수상 하이라이트', 'Student research and award spotlight'))}">
      <div class="student-spotlight-head">
        <span class="bento-kicker">${esc(tr(lang, '학생이 주인공인 연구', 'Student-Led Research'))}</span>
        <h2 class="card-title">${esc(tr(lang, '학생 연구 & 수상 스포트라이트', 'Student Research & Award Spotlight'))}</h2>
      </div>
      ${items.length ? `<ul class="student-spotlight-strip">${items.map((h) => `<li class="student-spotlight-item">
          <span class="badge badge-year">${esc(h.year ?? '')}</span>
          ${pick(h.badge, lang) ? `<span class="badge badge-award">${esc(pick(h.badge, lang))}</span>` : ''}
          <strong class="student-spotlight-title">${esc(pick(h.title, lang))}</strong>
          ${pick(h.detail, lang) ? `<span class="student-spotlight-detail">${esc(pick(h.detail, lang))}</span>` : ''}
        </li>`).join('')}</ul>`
        : `<p class="student-spotlight-detail">${esc(tr(lang, '이 목록의 논문 대부분은 학생이 제1저자로 이끈 연구입니다.', 'Most papers in this list were led by students as first authors.'))}</p>`}
      <a href="#join" class="btn btn-sm btn-recruit">${esc(tr(lang, '다음 논문의 저자 되기 →', 'Become an author of the next paper →'))}</a>
    </aside>`;
}

function renderCoverShelf(covers, lang) {
  const list = arr(covers).filter((c) => safeUrl(c.image)).slice(0, 6);
  if (!list.length) return '';
  return `<section class="cover-shelf-section">
      ${sectionHead(tr(lang, '저널 표지 선정', 'Journal Covers'), tr(lang, '표지를 장식한 연구', 'Research featured on journal covers'))}
      <div class="cover-shelf">${list.map((c) => {
        const img = safeUrl(c.image);
        const url = safeUrl(c.url);
        const caption = [c.journal, c.year].filter(Boolean).join(' · ');
        return `<figure class="cover-folio" id="cover-${esc(c.id ?? '')}">
            <img class="lightbox-img" src="${esc(img)}" alt="${esc(`${c.journal || 'Journal'} cover — ${c.title || ''}`)}" loading="lazy" data-lightbox-src="${esc(img)}" data-lightbox-caption="${esc(`${c.title || ''}${caption ? ` — ${caption}` : ''}`)}">
            <figcaption class="cover-folio-caption">
              <span class="cover-folio-journal">${esc(caption)}</span>
              ${url ? `<a class="cover-folio-title" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(c.title || '')}</a>` : `<span class="cover-folio-title">${esc(c.title || '')}</span>`}
            </figcaption>
          </figure>`;
      }).join('')}</div>
    </section>`;
}

function renderPubPatentBand(rec, pats, lang) {
  const sp = (rec && rec.patent_spotlight) || {};
  const usCnt = pats.filter((x) => x.country === 'US').length;
  const krCnt = pats.filter((x) => x.country === 'KR').length;
  const proofs = arr(sp.proof_points).map((pt) => `<li>${esc(pick(pt, lang))}</li>`).join('');
  return `<section class="patent-spotlight-band" aria-labelledby="pub-ip-title">
      <header>
        <span class="bento-kicker">${esc(pick(sp.eyebrow, lang) || tr(lang, '원천 특허 & 산업화 임팩트', 'Frontier IP & Industrial Impact'))}</span>
        <h2 class="section-title" id="pub-ip-title">${esc(pick(sp.title, lang) || tr(lang, '산업과 직결되는 미국·한국 원천 특허 포트폴리오', 'Industry-Connected U.S. & Korean Patent Portfolio'))}</h2>
        ${pick(sp.lead, lang) ? `<p class="section-lede">${esc(pick(sp.lead, lang))}</p>` : ''}
      </header>
      <dl class="ip-metrics">
        <div class="ip-metric"><dt>${esc(tr(lang, '전체 특허 포트폴리오', 'Total Patent Records'))}</dt><dd>${pats.length}</dd></div>
        <div class="ip-metric"><dt>${esc(tr(lang, '미국 특허·출원 (USPTO)', 'U.S. USPTO Patents & Apps'))}</dt><dd>${usCnt}</dd></div>
        <div class="ip-metric"><dt>${esc(tr(lang, '대한민국 특허 (KIPO)', 'Korean KIPO Patents'))}</dt><dd>${krCnt}</dd></div>
      </dl>
      ${proofs ? `<ul class="ip-proof">${proofs}</ul>` : ''}
      <div class="ip-actions">
        <a href="mailto:${PI_EMAIL}?subject=${encodeURIComponent('[MultiplexON Tech-Transfer / R&D] 기술이전·라이선싱·산학협력 문의')}" class="btn btn-primary btn-sm">${esc(pick(sp.cta_licensing, lang) || tr(lang, '기업 기술이전 · 라이선싱 · 산학공동연구 문의 ↗', 'Inquire Tech-Transfer, Licensing & Industry R&D ↗'))}</a>
        <a href="#join/chat" class="btn btn-outline btn-sm">${esc(pick(sp.cta_chat, lang) || tr(lang, '다음 특허의 공동발명자로 합류 문의', 'Inquire to Join as a Co-Inventor'))}</a>
      </div>
    </section>`;
}

export function renderPublications(data = {}, subRoute = 'journals', appState = {}) {
  const lang = getLang(data, appState);
  const pubs = data.publications || {};
  const sub = cleanSub(subRoute);
  const tab = PUB_TABS.includes(sub) ? sub : 'journals';
  const list = arr(pubs[tab]);
  const years = pubYears(list);
  const stored = (appState && appState.pubFilter) || {};
  const country = tab === 'patents' && ['US', 'KR'].includes(stored.country) ? stored.country : 'ALL';
  const domain = tab === 'patents' && ['optical', 'security', 'bio', 'dna'].includes(stored.domain) ? stored.domain : 'ALL';
  const filter = { query: String(stored.query || ''), year: years.includes(String(stored.year)) ? String(stored.year) : 'ALL', country, domain };
  const tabs = [
    ['#publications/journals', `${tr(lang, '저널 논문', 'Journal Articles')} (${arr(pubs.journals).length})`],
    ['#publications/patents', `${tr(lang, '미국·한국 특허', 'US & KR Patents')} (${arr(pubs.patents).length})`],
    ['#publications/conferences', `${tr(lang, '학술대회', 'Conferences')} (${arr(pubs.conferences).length})`],
  ];
  const pill = (value, label) => `<button type="button" class="year-pill${filter.year === value ? ' is-active' : ''}" data-year="${esc(value)}" aria-pressed="${filter.year === value ? 'true' : 'false'}">${esc(label)}</button>`;
  const cPill = (code, label) => `<button type="button" class="choice-chip${filter.country === code ? ' is-selected' : ''}" data-patent-country="${code}" aria-pressed="${filter.country === code ? 'true' : 'false'}">${esc(label)}</button>`;
  const dPill = (code, label) => `<button type="button" class="choice-chip${filter.domain === code ? ' is-selected' : ''}" data-patent-domain="${code}" aria-pressed="${filter.domain === code ? 'true' : 'false'}">${esc(label)}</button>`;
  const usCnt = list.filter((x) => x.country === 'US').length;
  const krCnt = list.filter((x) => x.country === 'KR').length;
  const countryBar = tab === 'patents' ? `<div class="patent-country-pills" role="group" aria-label="${esc(tr(lang, '특허 관할 국가 및 기술 분야 필터', 'Filter by jurisdiction and technology domain'))}">
      ${cPill('ALL', tr(lang, `전체 국가 (${list.length})`, `All (${list.length})`))}
      ${cPill('US', tr(lang, `미국 USPTO (${usCnt})`, `U.S. USPTO (${usCnt})`))}
      ${cPill('KR', tr(lang, `대한민국 KIPO (${krCnt})`, `Korea KIPO (${krCnt})`))}
      <span class="notice-divider" aria-hidden="true">|</span>
      ${dPill('ALL', tr(lang, '전체 기술분야', 'All Domains'))}
      ${dPill('optical', tr(lang, '광학·렌즈리스', 'Optics & Lensless'))}
      ${dPill('security', tr(lang, '보안·PUF', 'Security & PUF'))}
      ${dPill('bio', tr(lang, '바이오·진단', 'Bio & Diagnostics'))}
      ${dPill('dna', tr(lang, 'DNA 저장', 'DNA Storage'))}
    </div>` : '';
  const placeholder = tab === 'patents'
    ? tr(lang, '발명의 명칭(PUF, 렌즈리스, DNA, 하이드로젤), 특허번호, 발명자 검색', 'Search by invention title (PUF, lensless, DNA), patent number, or inventor')
    : tr(lang, '제목, 저자, 저널명으로 검색', 'Search by title, author, or venue');
  return `<div class="recruiting-page"><div class="publications-page" data-pub-tab="${tab}">
      <header class="page-header">
        <span class="bento-kicker">${esc(tr(lang, '논문 & 원천 특허', 'Papers & Industrial Patents'))}</span>
        <h1 class="page-title">${esc(tr(lang, 'SCI 논문 · 미국/한국 특허 · 학술대회', 'SCI Papers, U.S./KR Patents & Conferences'))}</h1>
      </header>
      ${subnav(tabs, `#publications/${tab}`, tr(lang, '연구성과 하위 메뉴', 'Publication sections'))}
      ${tab === 'patents' ? renderPubPatentBand(data.recruiting, list, lang) : renderStudentSpotlight(data.recruiting && data.recruiting.student_highlights, lang)}
      ${tab === 'journals' ? renderCoverShelf(pubs.covers, lang) : ''}
      <section class="pub-browser">
        ${countryBar}
        <div class="pub-toolbar">
          <label class="visually-hidden" for="pub-search-input">${esc(placeholder)}</label>
          <input type="search" id="pub-search-input" class="pub-search-input" placeholder="${esc(placeholder)}" value="${esc(filter.query)}" autocomplete="off" spellcheck="false">
          <p class="pub-result-count" id="pub-result-count" role="status" aria-live="polite">${esc(pubCountText(filterPubs(list, filter, tab).length, list.length, lang))}</p>
        </div>
        ${years.length ? `<div class="year-pills" role="group" aria-label="${esc(tr(lang, '연도 필터', 'Filter by year'))}">${pill('ALL', tr(lang, '전체', 'All'))}${years.map((y) => pill(y, y)).join('')}</div>` : ''}
        <div id="pub-results-container" class="pub-results">${renderPubResults(list, tab, filter, lang)}</div>
      </section>
    </div></div>`;
}

export function bindPublicationsEvents(rootEl, ctx = {}) {
  if (!rootEl) return;
  const container = rootEl.querySelector('#pub-results-container');
  if (!container) return;
  const page = rootEl.querySelector('.publications-page');
  const tab = PUB_TABS.includes(page && page.dataset.pubTab) ? page.dataset.pubTab : 'journals';
  const lang = getLang(ctx.data, ctx.state);
  const list = arr(ctx.data && ctx.data.publications && ctx.data.publications[tab]);
  const state = ctx.state || {};
  if (!state.pubFilter || typeof state.pubFilter !== 'object') state.pubFilter = { query: '', year: 'ALL', country: 'ALL', domain: 'ALL' };
  if (!state.pubFilter.country) state.pubFilter.country = 'ALL';
  if (!state.pubFilter.domain) state.pubFilter.domain = 'ALL';

  const input = rootEl.querySelector('#pub-search-input');
  const countEl = rootEl.querySelector('#pub-result-count');
  const pillBox = rootEl.querySelector('.year-pills');
  const pills = pillBox ? Array.from(pillBox.querySelectorAll('button.year-pill')) : [];
  const countryBox = rootEl.querySelector('.patent-country-pills');
  const countryPills = countryBox ? Array.from(countryBox.querySelectorAll('button[data-patent-country]')) : [];
  const domainPills = countryBox ? Array.from(countryBox.querySelectorAll('button[data-patent-domain]')) : [];
  if (!pills.some((p) => p.dataset.year === String(state.pubFilter.year))) state.pubFilter.year = 'ALL';

  const update = () => {
    const filter = state.pubFilter;
    container.innerHTML = renderPubResults(list, tab, filter, lang);
    pills.forEach((p) => { const on = p.dataset.year === String(filter.year); p.classList.toggle('is-active', on); p.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    countryPills.forEach((b) => { const on = b.dataset.patentCountry === String(filter.country || 'ALL'); b.classList.toggle('is-selected', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    domainPills.forEach((b) => { const on = b.dataset.patentDomain === String(filter.domain || 'ALL'); b.classList.toggle('is-selected', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    if (countEl) countEl.textContent = pubCountText(filterPubs(list, filter, tab).length, list.length, lang);
  };

  if (countryBox) {
    countryBox.addEventListener('click', (event) => {
      const cBtn = event.target.closest('button[data-patent-country]');
      const dBtn = event.target.closest('button[data-patent-domain]');
      if (cBtn && countryBox.contains(cBtn)) { state.pubFilter.country = cBtn.dataset.patentCountry || 'ALL'; update(); }
      else if (dBtn && countryBox.contains(dBtn)) { state.pubFilter.domain = dBtn.dataset.patentDomain || 'ALL'; update(); }
    });
  }

  if (input) {
    input.addEventListener('input', () => {
      state.pubFilter.query = input.value;
      update();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !input.value) return;
      input.value = '';
      state.pubFilter.query = '';
      update();
    });
  }

  if (pillBox) {
    pillBox.addEventListener('click', (event) => {
      const pill = event.target.closest('button.year-pill');
      if (!pill || !pillBox.contains(pill)) return;
      state.pubFilter.year = pill.dataset.year || 'ALL';
      update();
      try { if (typeof ctx.track === 'function') ctx.track('pub_year_filter', { tab, year: state.pubFilter.year, lang }); } catch (_) { /* analytics is optional */ }
    });
  }

  container.addEventListener('click', (event) => {
    if (!event.target.closest('[data-pub-reset]')) return;
    state.pubFilter.query = '';
    state.pubFilter.year = 'ALL';
    state.pubFilter.country = 'ALL';
    state.pubFilter.domain = 'ALL';
    if (input) { input.value = ''; input.focus(); }
    update();
  });
}
