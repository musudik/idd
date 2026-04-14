/* ============================================================
   INDISCHER DACHVERBAND DEUTSCHLAND — app.js
   SPA Router · i18n · Page Renderers
   ============================================================ */

// ── State ────────────────────────────────────────────────────
let CONTENT  = null;
let VEREINE  = null;
let lang     = localStorage.getItem('idd-lang') || 'en';
let currentPage = 'home';

const PAGES = ['home','about','vereine','events','gallery','news','join','contact','impressum','privacy'];

const NAV_ICONS = {
  home:      '⌂',
  about:     '◉',
  vereine:   '❋',
  events:    '◈',
  gallery:   '▣',
  news:      '◎',
  join:      '✦',
  contact:   '◌',
};

// ── i18n helper ──────────────────────────────────────────────
function t(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj['en'] || '';
}

// ── Load Data ────────────────────────────────────────────────
async function loadData() {
  const [contentRes, vereineRes] = await Promise.all([
    fetch('data/content.json'),
    fetch('data/vereine.json')
  ]);
  CONTENT = await contentRes.json();
  VEREINE = await vereineRes.json();
}

// ── Bootstrap ────────────────────────────────────────────────
async function init() {
  await loadData();
  buildNav();
  setupLangSwitchers();
  setupHashRouter();
  setupCookieBanner();
  setupMobileMenu();
  renderFooter();
  // Route to initial page
  const hash = location.hash.replace('#', '') || 'home';
  navigateTo(PAGES.includes(hash) ? hash : 'home');
}

// ── Navigation ───────────────────────────────────────────────
function buildNav() {
  const navItems = Object.keys(NAV_ICONS).map(key => ({
    key,
    label: t(CONTENT.nav[key]),
    icon: NAV_ICONS[key]
  }));

  // Desktop sidebar
  const sidebarNav = document.getElementById('sidebar-nav');
  sidebarNav.innerHTML = navItems.map(item => `
    <li>
      <a href="#${item.key}" data-page="${item.key}">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
      </a>
    </li>
  `).join('');

  // Mobile drawer
  const mobileNav = document.getElementById('mobile-nav-list');
  mobileNav.innerHTML = navItems.map(item => `
    <li><a href="#${item.key}" data-page="${item.key}">${item.label}</a></li>
  `).join('');
}

function updateNavActive(page) {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

// ── Hash Router ──────────────────────────────────────────────
function setupHashRouter() {
  window.addEventListener('hashchange', () => {
    const hash = location.hash.replace('#', '') || 'home';
    navigateTo(PAGES.includes(hash) ? hash : 'home');
  });
}

function navigateTo(page) {
  currentPage = page;
  updateNavActive(page);
  renderPage(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeMobileMenu();
}

// ── Page Renderer ────────────────────────────────────────────
function renderPage(page) {
  const main = document.getElementById('main-content');
  const tpl = document.getElementById(`page-${page}`);
  if (!tpl) return;

  main.innerHTML = '';
  const node = tpl.content.cloneNode(true);
  main.appendChild(node);

  const renderers = {
    home:       renderHome,
    about:      renderAbout,
    vereine:    renderVereine,
    events:     renderEvents,
    gallery:    renderGallery,
    news:       renderNews,
    join:       renderJoin,
    contact:    renderContact,
    impressum:  renderImpressum,
    privacy:    renderPrivacy,
  };

  if (renderers[page]) renderers[page]();
}

// ── HOME ─────────────────────────────────────────────────────
function renderHome() {
  const h = CONTENT.home;

  // Hero headline
  const headlines = t(h.heroHeadline);
  document.getElementById('hero-headline').innerHTML =
    headlines.map(line => `<span class="line">${line}</span>`).join('');

  setText('hero-sub',   t(h.heroSub));
  setText('hero-intro', t(h.intro));
  setText('cta-join',   t(h.ctaJoin));
  setText('cta-vereine',t(h.ctaVereine));

  // Stats
  const statsEl = document.getElementById('stats-inner');
  statsEl.innerHTML = h.stats.map(s => `
    <div class="stat-item">
      <span class="stat-number">${s.number}</span>
      <span class="stat-label">${t(s.label)}</span>
    </div>
  `).join('');

  // Featured Vereine
  setText('featured-title', t(h.featuredTitle));

  const featuredIds = VEREINE.featured;
  const allVereine  = VEREINE.states.flatMap(s => s.vereine);
  const featured    = featuredIds.map(id => allVereine.find(v => v.id === id)).filter(Boolean);

  const featuredEl = document.getElementById('featured-grid');
  featuredEl.innerHTML = `<div class="home-section-wrap" style="padding:0; display:contents">` +
    featured.map(v => `
      <div class="verein-card" style="--accent-color:${v.color}" onclick="location.hash='vereine'">
        ${v.logo ? `
          <div class="verein-card-logo">
            <img src="${v.logo}" alt="${v.name} logo" loading="lazy"
                 onerror="this.parentElement.style.display='none'" />
          </div>
        ` : ''}
        <div class="verein-card-name">${v.name}</div>
        <div class="verein-card-city">${v.city}</div>
        <span class="verein-card-category">${t(v.category)}</span>
      </div>
    `).join('') + `</div>`;

  // ── Home Logo Constellation ──
  buildLogoConstellation();

  // Responsive padding for featured section
  const homeSection = document.querySelector('.page-home .section');
  if (homeSection) {
    const isMobile = window.innerWidth <= 768;
    homeSection.style.padding = isMobile ? '0 0 56px' : '0 64px 64px';
  }

  // Card glow tracking
  document.querySelectorAll('.verein-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100) + '%');
    });
  });
}

// ── ABOUT ────────────────────────────────────────────────────
function renderAbout() {
  const a = CONTENT.about;
  setText('about-title',    t(a.title));
  setText('vision-title',   t(a.visionTitle));
  setText('vision-text',    t(a.vision));
  setText('mission-title',  t(a.missionTitle));
  setText('mission-text',   t(a.mission));
  setText('founding-title', t(a.foundingTitle));
  setText('founding-text',  t(a.founding));
  setText('chair-message',  t(a.chairMessage));
  setText('chair-name',     a.chairName);
  setText('chair-role',     t(a.chairRole));
  setText('leadership-title', { en:'Leadership', de:'Führung', hi:'नेतृत्व' }[lang] || 'Leadership');

  const grid = document.getElementById('leadership-grid');
  grid.innerHTML = a.leadership.map(l => {
    const initials = l.name.split(' ').map(w => w[0]).join('').slice(0,2);
    return `
      <div class="leader-card">
        <div class="leader-initials">${initials}</div>
        <div class="leader-name">${l.name}</div>
        <div class="leader-role">${t(l.role)}</div>
        <div class="leader-state">${l.state}</div>
      </div>
    `;
  }).join('');
}

// ── VEREINE ──────────────────────────────────────────────────
function renderVereine() {
  const titleMap   = { en:'Vereine Directory', de:'Vereineverzeichnis', hi:'वेराइने निर्देशिका' };
  const hintVereine = { en:'Select a state to browse Vereine', de:'Bundesland auswählen', hi:'राज्य चुनें' };
  const hintDetail  = { en:'Select a Verein to view details', de:'Verein auswählen', hi:'वेराइन चुनें' };
  const backLabels  = { en:'Back', de:'Zurück', hi:'वापस' };

  setText('vereine-title', titleMap[lang]);
  setText('vereine-hint',  hintVereine[lang]);
  setText('detail-hint',   hintDetail[lang]);
  setText('back-label',    backLabels[lang]);

  const layout     = document.getElementById('vereine-layout');
  const statesCol  = document.getElementById('states-col');
  const vereineCol = document.getElementById('vereine-col');
  const detailCol  = document.getElementById('detail-col');
  const backBtn    = document.getElementById('mobile-back-btn');
  const breadcrumb = document.getElementById('mobile-breadcrumb');

  const isMobile = () => window.innerWidth <= 768;

  // ── Step management (mobile only) ──
  let mobileStep = 'states'; // 'states' | 'vereine' | 'detail'
  let activeStateName = '';

  function setStep(step, label) {
    mobileStep = step;
    layout.className = layout.className.replace(/step-\S+/g, '').trim();
    layout.classList.add('step-' + step);

    if (!isMobile()) return;

    if (step === 'states') {
      backBtn.style.display = 'none';
      breadcrumb.textContent = '';
    } else if (step === 'vereine') {
      backBtn.style.display = 'flex';
      breadcrumb.textContent = activeStateName;
    } else if (step === 'detail') {
      backBtn.style.display = 'flex';
      breadcrumb.textContent = label || '';
    }
  }

  backBtn.addEventListener('click', () => {
    if (mobileStep === 'detail')  setStep('vereine', activeStateName);
    else if (mobileStep === 'vereine') setStep('states');
  });

  // ── Build state list ──
  statesCol.innerHTML = VEREINE.states.map(s => `
    <div class="state-item" data-state="${s.id}" tabindex="0" role="button">
      <span>${s.name}</span>
      <span class="state-count">${s.vereine.length}</span>
    </div>
  `).join('');

  let activeStateId  = null;
  let activeVereinId = null;

  function selectState(stateId, fromInteraction) {
    activeStateId  = stateId;
    activeVereinId = null;

    statesCol.querySelectorAll('.state-item').forEach(el => {
      el.classList.toggle('active', el.dataset.state === stateId);
    });

    const state = VEREINE.states.find(s => s.id === stateId);
    if (!state) return;
    activeStateName = state.name;

    // Sort vereine alphabetically by name
    const sortedVereine = [...state.vereine].sort((a, b) => a.name.localeCompare(b.name));

    vereineCol.innerHTML = sortedVereine.map(v => `
      <div class="verein-row" data-verein="${v.id}"
           style="--accent-color:${v.color}" tabindex="0" role="button">
        ${v.logo ? `<div class="verein-row-logo"><img src="${v.logo}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'" /></div>` : ''}
        <div class="verein-row-info">
          <div class="verein-row-name">${v.name}</div>
          <div class="verein-row-city">${v.city}</div>
        </div>
      </div>
    `).join('');

    detailCol.innerHTML = `<p class="detail-hint">${hintDetail[lang]}</p>`;

    vereineCol.querySelectorAll('.verein-row').forEach(el => {
      el.addEventListener('click',      () => selectVerein(el.dataset.verein, true));
      el.addEventListener('mouseenter', () => { if (!isMobile()) selectVerein(el.dataset.verein, false); });
      el.addEventListener('keypress',   e  => { if (e.key === 'Enter') selectVerein(el.dataset.verein, true); });
    });

    // On mobile: slide to step 2
    if (isMobile() && fromInteraction) {
      setStep('vereine');
      vereineCol.scrollTop = 0;
    }

    // On desktop: auto-preview first verein
    if (!isMobile() && state.vereine.length > 0) {
      selectVerein(state.vereine[0].id, false);
    }
  }

  function selectVerein(vereinId, fromInteraction) {
    activeVereinId = vereinId;

    vereineCol.querySelectorAll('.verein-row').forEach(el => {
      el.classList.toggle('active', el.dataset.verein === vereinId);
    });

    const allVereine = VEREINE.states.flatMap(s => s.vereine);
    const v = allVereine.find(x => x.id === vereinId);
    if (!v) return;

    const foundedLabel = { en:'Founded', de:'Gegründet', hi:'स्थापित' };
    const membersLabel = { en:'Members', de:'Mitglieder', hi:'सदस्य' };
    const personsLabel = { en:'Key Persons', de:'Schlüsselpersonen', hi:'प्रमुख व्यक्ति' };
    const visitLabel   = { en:'Visit Website ↗', de:'Website besuchen ↗', hi:'वेबसाइट देखें ↗' };
    const aboutLabel   = { en:'About', de:'Über', hi:'के बारे में' };
    const contactLabel = { en:'Get in Touch', de:'Kontakt', hi:'संपर्क करें' };

    // Unique animation theme per verein (deterministic from id hash)
    const hash = vereinId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const themes = ['theme-wave', 'theme-glow', 'theme-prism', 'theme-aurora', 'theme-ember'];
    const theme = themes[hash % themes.length];
    const patterns = ['◆', '✦', '◈', '❋', '✧', '◎', '▣', '◉'];
    const pattern = patterns[hash % patterns.length];

    detailCol.innerHTML = `
      <div class="verein-detail ${theme}" style="--accent:${v.color}">
        <!-- Hero stripe -->
        <div class="detail-hero-stripe">
          <div class="stripe-bg"></div>
          <div class="stripe-pattern">${(pattern + ' ').repeat(20)}</div>
          <div class="stripe-content">
            ${v.logo ? `
              <div class="detail-logo-wrap">
                <img src="${v.logo}" alt="${v.name} logo" class="detail-logo" loading="lazy"
                     onerror="this.parentElement.innerHTML='<span class=\\'logo-fallback\\' style=\\'color:${v.color}\\'>${pattern}</span>'" />
              </div>
            ` : `<div class="detail-logo-wrap">
              <span class="logo-fallback" style="color:${v.color}">${pattern}</span>
            </div>`}
          </div>
        </div>

        <!-- Body -->
        <div class="detail-body">
          <div class="detail-category" style="color:${v.color}">
            <span>${t(v.category)}</span>
          </div>
          <h2 class="detail-name">${v.name}</h2>
          <div class="detail-city">📍 ${v.city}</div>

          <div class="detail-stats-row">
            ${v.founded ? `<div class="detail-stat" style="--accent:${v.color}">
              <div class="detail-stat-value">${v.founded}</div>
              <div class="detail-stat-label">${foundedLabel[lang]}</div>
            </div>` : ''}
            <div class="detail-stat" style="--accent:${v.color}">
              <div class="detail-stat-value">${v.members > 0 ? v.members.toLocaleString() : '—'}</div>
              <div class="detail-stat-label">${membersLabel[lang]}</div>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-section-title">${aboutLabel[lang]}</div>
            <p class="detail-desc">${t(v.description)}</p>
          </div>

          ${v.keyPersons && v.keyPersons.length ? `
            <div class="detail-section">
              <div class="detail-section-title">${personsLabel[lang]}</div>
              <div class="detail-persons-grid">
                ${v.keyPersons.map(p => `
                  <div class="person-card" style="--accent:${v.color}">
                    <div class="person-avatar" style="background:${v.color}">${p.name.charAt(0)}</div>
                    <strong>${p.name}</strong>
                    <span>${t(p.role)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${v.website && v.website !== 'https://example.com' ? `
            <div class="detail-section">
              <div class="detail-section-title">${contactLabel[lang]}</div>
              <a href="${v.website}" target="_blank" rel="noopener" class="detail-cta"
                 style="background:${v.color}; border-color:${v.color}">
                ${visitLabel[lang]}
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // On mobile: slide to step 3
    if (isMobile() && fromInteraction) {
      setStep('detail', v.name);
      detailCol.scrollTop = 0;
    }
  }

  // Wire up state items
  statesCol.querySelectorAll('.state-item').forEach(el => {
    el.addEventListener('click',      () => selectState(el.dataset.state, true));
    el.addEventListener('mouseenter', () => { if (!isMobile()) selectState(el.dataset.state, false); });
    el.addEventListener('keypress',   e  => { if (e.key === 'Enter') selectState(el.dataset.state, true); });
  });

  // Respond to window resize (desktop ↔ mobile switch)
  const resizeHandler = () => {
    if (!isMobile()) {
      // Reset to desktop 3-col view
      layout.className = layout.className.replace(/step-\S+/g, '').trim();
      layout.classList.add('step-states');
      backBtn.style.display  = 'none';
      breadcrumb.textContent = '';
      if (activeStateId) selectState(activeStateId, false);
    }
  };
  window.addEventListener('resize', resizeHandler);

  // Auto-select first state on desktop, or just show states list on mobile
  if (VEREINE.states.length > 0) {
    if (!isMobile()) {
      selectState(VEREINE.states[0].id, false);
    }
    // Mark first state visually even on mobile
    statesCol.querySelector('.state-item')?.classList.add('active');
    activeStateId  = VEREINE.states[0].id;
    activeStateName = VEREINE.states[0].name;
  }
}

// ── EVENTS ───────────────────────────────────────────────────
function renderEvents() {
  const ev = CONTENT.events;
  setText('events-title',  t(ev.title));
  setText('tab-upcoming',  t(ev.upcomingLabel));
  setText('tab-past',      t(ev.pastLabel));

  let filter = 'upcoming';

  function renderEventCards() {
    const items = ev.items.filter(e => filter === 'upcoming' ? e.upcoming : !e.upcoming);
    const grid  = document.getElementById('events-grid');
    if (!items.length) {
      grid.innerHTML = `<p style="padding:40px;color:var(--text-muted);text-align:center;font-style:italic;">No events found.</p>`;
      return;
    }
    grid.innerHTML = items.map(e => {
      const d = new Date(e.date);
      const day   = d.getDate();
      const month = d.toLocaleString(lang === 'de' ? 'de-DE' : lang === 'hi' ? 'hi-IN' : 'en-US', { month: 'short' });
      const year  = d.getFullYear();
      return `
        <div class="event-card">
          <div class="event-date-block">
            <span class="event-day">${day}</span>
            <span class="event-month-year">${month} ${year}</span>
          </div>
          <div class="event-info">
            <div class="event-location">📍 ${e.location}</div>
            <h3>${t(e.title)}</h3>
            <p class="event-desc">${t(e.description)}</p>
          </div>
          <div>
            <span class="event-badge ${e.upcoming ? 'badge-upcoming' : 'badge-past'}">
              ${t(e.category)}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  renderEventCards();

  document.querySelectorAll('.event-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.event-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filter = tab.dataset.filter;
      renderEventCards();
    });
  });
}

// ── GALLERY ──────────────────────────────────────────────────
function renderGallery() {
  const g = CONTENT.gallery;
  setText('gallery-title',    t(g.title));
  setText('gallery-subtitle', t(g.subtitle));

  const filtersEl = document.getElementById('gallery-filters');
  const categories = Object.keys(g.categories);
  filtersEl.innerHTML = categories.map(cat => `
    <button class="filter-btn ${cat === 'all' ? 'active' : ''}"
            data-cat="${cat}">${t(g.categories[cat])}</button>
  `).join('');

  const galleryEl = document.getElementById('gallery-grid');
  const EMOJIS = { cultural:'🎭', sports:'🏏', community:'🤝' };

  galleryEl.innerHTML = g.items.map(item => `
    <div class="gallery-item" data-cat="${item.category}">
      <div class="gallery-placeholder" style="background:${item.color}22">
        <span style="font-size:48px">${EMOJIS[item.category] || '🖼️'}</span>
      </div>
      <div class="gallery-caption">${t(item.caption)}</div>
    </div>
  `).join('');

  filtersEl.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filtersEl.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      galleryEl.querySelectorAll('.gallery-item').forEach(item => {
        item.classList.toggle('hidden', cat !== 'all' && item.dataset.cat !== cat);
      });
    });
  });
}

// ── NEWS ─────────────────────────────────────────────────────
function renderNews() {
  setText('news-title', t(CONTENT.news.title));
  const list = document.getElementById('news-list');
  list.innerHTML = CONTENT.news.items.map(n => {
    const d = new Date(n.date);
    const day   = d.getDate();
    const month = d.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { month: 'short' });
    return `
      <div class="news-item">
        <div class="news-date-block">
          <span class="news-day">${day}</span>
          <span class="news-month">${month}</span>
        </div>
        <div>
          <div class="news-category">${t(n.category)}</div>
          <h3 class="news-title">${t(n.title)}</h3>
          <p class="news-excerpt">${t(n.excerpt)}</p>
        </div>
      </div>
    `;
  }).join('');
}

// ── JOIN ─────────────────────────────────────────────────────
function renderJoin() {
  const j = CONTENT.join;
  setText('join-title',      t(j.title));
  setText('join-subtitle',   t(j.subtitle));
  setText('eligibility-title', t(j.eligibility.title));
  setText('eligibility-text',  t(j.eligibility.text));
  setText('join-cta',          t(j.ctaLabel));

  const grid = document.getElementById('benefits-grid');
  grid.innerHTML = j.benefits.map(b => `
    <div class="benefit-card">
      <span class="benefit-icon">${b.icon}</span>
      <div class="benefit-title">${t(b.title)}</div>
      <p class="benefit-desc">${t(b.desc)}</p>
    </div>
  `).join('');
}

// ── CONTACT ──────────────────────────────────────────────────
function renderContact() {
  const c = CONTENT.contact;
  setText('contact-title',  t(c.title));
  setText('contact-address', c.address);
  setText('contact-phone',   c.phone);

  const emailEl = document.getElementById('contact-email');
  emailEl.textContent = c.email;
  emailEl.href = `mailto:${c.email}`;

  const fl = c.formLabels;
  setText('label-name',    t(fl.name));
  setText('label-email',   t(fl.email));
  setText('label-subject', t(fl.subject));
  setText('label-message', t(fl.message));
  setText('btn-send',      t(fl.send));

  document.querySelectorAll('#input-name, #input-email, #input-subject, #input-message').forEach(el => {
    const labelId = 'label-' + el.id.replace('input-','');
    const lbl = document.getElementById(labelId);
    if (lbl) el.placeholder = lbl.textContent;
  });
}

// ── LEGAL ────────────────────────────────────────────────────
function renderImpressum() {
  const imp = CONTENT.legal.impressum;
  setText('impressum-title',   t(imp.title));
  setText('impressum-content', t(imp.content));
}

function renderPrivacy() {
  const priv = CONTENT.legal.privacy;
  setText('privacy-title',   t(priv.title));
  setText('privacy-content', t(priv.content));
}

// ── FOOTER ───────────────────────────────────────────────────
function renderFooter() {
  document.getElementById('footer-year').textContent = new Date().getFullYear();
}

// Re-render footer text on lang change
function updateFooterText() {
  if (!CONTENT) return;
  const el = document.getElementById('footer-sitename');
  if (el) el.textContent = t(CONTENT.meta.siteName);
  const imp = document.getElementById('footer-impressum');
  if (imp) imp.textContent = t(CONTENT.footer.impressum);
  const prv = document.getElementById('footer-privacy');
  if (prv) prv.textContent = t(CONTENT.footer.privacy);
  const rts = document.getElementById('footer-rights');
  if (rts) rts.textContent = t(CONTENT.footer.rights);
}

// ── Language Switcher ────────────────────────────────────────
function setupLangSwitchers() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.lang-btn');
    if (!btn) return;
    const newLang = btn.dataset.lang;
    if (!newLang || newLang === lang) return;
    lang = newLang;
    localStorage.setItem('idd-lang', lang);

    document.querySelectorAll('.lang-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });

    // Re-build nav labels & re-render current page
    buildNav();
    updateNavActive(currentPage);
    renderPage(currentPage);
    updateFooterText();
    updateCookieBannerText();

    // Devanagari font class on body
    document.body.classList.toggle('devanagari', lang === 'hi');
  });
}

// ── Cookie Banner ────────────────────────────────────────────
const COOKIE_TEXTS = {
  en: 'We use cookies to improve your experience. By continuing, you agree to our privacy policy.',
  de: 'Wir verwenden Cookies, um Ihr Erlebnis zu verbessern. Durch die weitere Nutzung stimmen Sie unserer Datenschutzerklärung zu.',
  hi: 'हम आपके अनुभव को बेहतर बनाने के लिए कुकीज़ का उपयोग करते हैं। जारी रखने से आप हमारी गोपनीयता नीति से सहमत होते हैं।'
};
const COOKIE_ACCEPT = { en:'Accept', de:'Akzeptieren', hi:'स्वीकार करें' };
const COOKIE_MORE   = { en:'Learn more', de:'Mehr erfahren', hi:'और जानें' };

function updateCookieBannerText() {
  const banner = document.getElementById('cookie-banner');
  if (!banner || banner.classList.contains('hide')) return;
  setText('cookie-text',   COOKIE_TEXTS[lang]);
  setText('cookie-accept', COOKIE_ACCEPT[lang]);
  setText('cookie-more',   COOKIE_MORE[lang]);
}

function setupCookieBanner() {
  const banner  = document.getElementById('cookie-banner');
  const accept  = document.getElementById('cookie-accept');
  const more    = document.getElementById('cookie-more');

  if (localStorage.getItem('idd-cookies-accepted')) {
    banner.classList.add('hide');
    return;
  }

  updateCookieBannerText();

  setTimeout(() => banner.classList.add('show'), 1200);

  accept.addEventListener('click', () => {
    localStorage.setItem('idd-cookies-accepted', '1');
    banner.classList.remove('show');
    banner.classList.add('hide');
  });

  more.addEventListener('click', () => {
    navigateTo('privacy');
    location.hash = 'privacy';
  });
}

// ── Mobile Menu ──────────────────────────────────────────────
function setupMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const drawer    = document.getElementById('mobile-drawer');
  const overlay   = document.getElementById('drawer-overlay');

  hamburger.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    overlay.style.display = isOpen ? 'block' : 'none';
    setTimeout(() => { if (isOpen) overlay.classList.add('show'); }, 10);
  });

  overlay.addEventListener('click', closeMobileMenu);
}

function closeMobileMenu() {
  const drawer    = document.getElementById('mobile-drawer');
  const hamburger = document.getElementById('hamburger');
  const overlay   = document.getElementById('drawer-overlay');
  drawer.classList.remove('open');
  hamburger.classList.remove('open');
  overlay.classList.remove('show');
  setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

// ── Contact form handler ─────────────────────────────────────
function handleContactSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  const successMsgs = { en:'Message sent! We\'ll get back to you soon.', de:'Nachricht gesendet!', hi:'संदेश भेजा गया!' };
  const orig = btn.textContent;
  btn.textContent = '✓ ' + (successMsgs[lang]);
  btn.style.background = 'var(--india-green)';
  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = '';
    e.target.reset();
  }, 3000);
}

// ── Logo Grid (Home Hero) ────────────────────────────────────
function buildLogoConstellation() {
  const track = document.getElementById('hero-strip-track');
  if (!track) return;

  const allVereine = VEREINE.states.flatMap(s => s.vereine).filter(v => v.logo);
  if (!allVereine.length) return;

  // Calculate how many cells per row to fill viewport + buffer
  const cellW = 140;
  const viewW = window.innerWidth;
  const perRow = Math.ceil(viewW / cellW) + 4; // visible + buffer
  const totalNeeded = perRow * 3;

  // Shuffle and guarantee no duplicates across all visible cells
  const shuffled = [...allVereine].sort(() => Math.random() - 0.5);
  const pool = [];
  while (pool.length < totalNeeded) {
    const batch = [...allVereine].sort(() => Math.random() - 0.5);
    pool.push(...batch);
  }
  // Remove consecutive duplicates
  const assigned = [];
  const usedIds = new Set();
  for (const v of pool) {
    if (assigned.length >= totalNeeded) break;
    if (!usedIds.has(v.id)) {
      assigned.push(v);
      usedIds.add(v.id);
    }
  }
  // If we need more (more cells than unique vereine), allow reuse but not adjacent
  while (assigned.length < totalNeeded) {
    for (const v of shuffled) {
      if (assigned.length >= totalNeeded) break;
      const last = assigned.slice(-perRow); // check no duplicate in same row-window
      if (!last.some(a => a.id === v.id)) {
        assigned.push(v);
      }
    }
  }

  track.innerHTML = '';
  const rows = [];
  const allCellData = []; // flat array of {cell, vereinIdx, rowIdx, colIdx}
  const displayedIds = new Set(); // track currently visible IDs

  for (let r = 0; r < 3; r++) {
    const row = document.createElement('div');
    row.className = 'hero-strip-row';
    row.style.animationDuration = (30 + r * 8) + 's';
    row.style.animationDelay = -(r * 5) + 's';

    // Direction: alternate rows scroll different directions
    const direction = r % 2 === 0 ? 'scrollLeft' : 'scrollRight';
    row.classList.add(direction);

    const rowVereine = assigned.slice(r * perRow, (r + 1) * perRow);
    // Double up for seamless loop
    const doubledVereine = [...rowVereine, ...rowVereine];

    doubledVereine.forEach((v, ci) => {
      const cell = document.createElement('div');
      cell.className = 'hero-strip-cell';
      cell.innerHTML = `
        <img src="${v.logo}" alt="${v.name}" loading="lazy"
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22/>'"/>
        <div class="strip-cell-name">${v.name}</div>
        <div class="strip-cell-glow"></div>
      `;
      row.appendChild(cell);
      if (ci < perRow) {
        allCellData.push({ cell, verein: v, rowIdx: r, colIdx: ci });
        displayedIds.add(v.id);
      }
    });

    track.appendChild(row);
    rows.push(row);
  }

  // ── Periodic logo swap: every 2.5s swap 2-3 random cells, no duplicates ──
  function cycleLogos() {
    const swapCount = 2 + Math.floor(Math.random() * 2);
    const indices = [];
    while (indices.length < swapCount && indices.length < allCellData.length) {
      const idx = Math.floor(Math.random() * allCellData.length);
      if (!indices.includes(idx)) indices.push(idx);
    }

    // Build set of currently displayed IDs (excluding cells being swapped)
    const currentIds = new Set();
    allCellData.forEach((cd, i) => {
      if (!indices.includes(i)) currentIds.add(cd.verein.id);
    });

    for (const idx of indices) {
      const cd = allCellData[idx];
      // Pick a verein not currently displayed
      let candidate = null;
      const shuffledV = [...allVereine].sort(() => Math.random() - 0.5);
      for (const v of shuffledV) {
        if (!currentIds.has(v.id)) {
          candidate = v;
          break;
        }
      }
      if (!candidate) candidate = shuffledV[0]; // fallback

      currentIds.add(candidate.id);

      const cell = cd.cell;
      cell.classList.add('swap-out');
      const newV = candidate;
      setTimeout(() => {
        const img = cell.querySelector('img');
        const name = cell.querySelector('.strip-cell-name');
        if (img) { img.src = newV.logo; img.alt = newV.name; }
        if (name) name.textContent = newV.name;
        cd.verein = newV;
        cell.classList.remove('swap-out');
        cell.classList.add('swap-in');
        setTimeout(() => cell.classList.remove('swap-in'), 400);
      }, 350);
    }

    setTimeout(cycleLogos, 2500);
  }
  setTimeout(cycleLogos, 3000);

  // ── Indo-German flag color wave ──
  const flagColors = [
    { r:255, g:153, b:51  },
    { r:255, g:204, b:0   },
    { r:221, g:0,   b:0   },
    { r:19,  g:136, b:8   },
    { r:0,   g:0,   b:128 },
    { r:255, g:153, b:51  },
  ];

  function lerpColor(c1, c2, t) {
    return {
      r: Math.round(c1.r + (c2.r - c1.r) * t),
      g: Math.round(c1.g + (c2.g - c1.g) * t),
      b: Math.round(c1.b + (c2.b - c1.b) * t),
    };
  }

  function getFlagColor(t) {
    const scaled = t * (flagColors.length - 1);
    const idx = Math.floor(scaled);
    const frac = scaled - idx;
    return lerpColor(
      flagColors[Math.min(idx, flagColors.length - 1)],
      flagColors[Math.min(idx + 1, flagColors.length - 1)],
      frac
    );
  }

  let waveOffset = 0;
  function flagWave() {
    waveOffset += 0.002;
    if (waveOffset > 1) waveOffset -= 1;

    allCellData.forEach((cd) => {
      const diag = (cd.rowIdx * 0.15 + cd.colIdx * 0.08);
      const t = (diag + waveOffset) % 1;
      const c = getFlagColor(t);
      const intensity = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
      const glow = cd.cell.querySelector('.strip-cell-glow');
      if (glow) {
        const alpha = 0.04 + intensity * 0.1;
        glow.style.background = `radial-gradient(circle, rgba(${c.r},${c.g},${c.b},${alpha}) 0%, transparent 70%)`;
        cd.cell.style.borderColor = `rgba(${c.r},${c.g},${c.b},${0.08 + intensity * 0.15})`;
      }
    });
    requestAnimationFrame(flagWave);
  }
  requestAnimationFrame(flagWave);
}

// ── Utility ──────────────────────────────────────────────────
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// ── Start ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
