/* ============================================================
   INDISCHER DACHVERBAND DEUTSCHLAND — app.js
   Single-Page SPA · i18n · Dynamic Sidebar · All Sections
   ============================================================ */

// ── State ────────────────────────────────────────────────────
let CONTENT  = null;
let VEREINE  = null;
let lang     = localStorage.getItem('idd-lang') || 'en';
let inVereineView = false;

const NAV_ITEMS = [
  { key: 'home',       icon: '⌂',  section: 'section-home'       },
  { key: 'about',      icon: '◉',  section: 'section-about'      },
  { key: 'vereine',    icon: '❋',  isPage: true                   },
  { key: 'mission',    icon: '◈',  section: 'section-mission'    },
  { key: 'events',     icon: '◎',  section: 'section-events'     },
  { key: 'gallery',    icon: '▣',  section: 'section-gallery'    },
  { key: 'news',       icon: '◙',  section: 'section-news'       },
  { key: 'join',       icon: '✦',  section: 'section-join'       },
  { key: 'donate',     icon: '◆',  section: 'section-donate'     },
  { key: 'contact',    icon: '◌',  section: 'section-contact'    },
];

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
  setupMobileMenu();
  setupScrollSpy();
  setupCookieBanner();
  renderAllSections();
  renderFooter();
  initHeroCarousel();

  // Check hash on load
  const hash = location.hash.replace('#', '');
  if (hash === 'vereine') {
    showVereineView(false);
  } else if (hash) {
    const el = document.getElementById(hash) || document.getElementById('section-' + hash);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth' }));
  }

  // Wire vereine back button
  document.getElementById('vereine-back-to-main')?.addEventListener('click', hideVereineView);
}

// ── Sidebar: removed (now using top nav) ─────────────────────

// ── Hero Carousel ────────────────────────────────────────────
function initHeroCarousel() {
  const carousel    = document.getElementById('hero-carousel');
  const indicators  = document.getElementById('hero-indicators');
  if (!carousel) return;

  const slides = [
    { bg: 'linear-gradient(135deg, #2A0800 0%, #7C2206 25%, #C24A00 55%, #FF8C00 80%, #FFB347 100%)' },
    { bg: 'linear-gradient(135deg, #001508 0%, #003A18 30%, #0D6B10 60%, #1DA00E 85%, #5CB85C 100%)' },
    { bg: 'linear-gradient(150deg, #0A0015 0%, #1A0040 30%, #2B006B 55%, #4400A8 75%, #6600CC 100%)' },
    { bg: 'linear-gradient(135deg, #1A0A00 0%, #522000 30%, #9B4400 55%, #CC7700 78%, #FFAA00 100%)' },
    { bg: 'linear-gradient(130deg, #0A1500 0%, #1C3300 30%, #2E5500 55%, #3D6B00 75%, #557700 100%)' },
  ];

  slides.forEach((slide, i) => {
    const el = document.createElement('div');
    el.className = 'hero-slide' + (i === 0 ? ' active' : '');
    el.style.backgroundImage = slide.bg;
    carousel.appendChild(el);
  });

  if (indicators) {
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Slide ' + (i + 1));
      dot.addEventListener('click', () => goToSlide(i));
      indicators.appendChild(dot);
    });
  }

  let current = 0;
  function goToSlide(idx) {
    const slideEls = carousel.querySelectorAll('.hero-slide');
    const dotEls   = indicators ? indicators.querySelectorAll('.hero-dot') : [];
    slideEls[current].classList.remove('active');
    if (dotEls[current]) dotEls[current].classList.remove('active');
    current = idx;
    slideEls[current].classList.add('active');
    if (dotEls[current]) dotEls[current].classList.add('active');
  }

  setInterval(() => goToSlide((current + 1) % slides.length), 6000);
}

// ── Navigation ───────────────────────────────────────────────
function buildNav() {
  const navItems = NAV_ITEMS.map(item => ({
    ...item,
    label: t(CONTENT.nav[item.key]) || item.key
  }));

  // Desktop top nav
  const topNavLinks = document.getElementById('top-nav-links');
  if (topNavLinks) {
    topNavLinks.innerHTML = navItems.map(item => `
      <li>
        <a href="#${item.isPage ? 'vereine' : item.section}"
           data-nav="${item.key}"
           data-section="${item.section || ''}"
           data-ispage="${item.isPage ? '1' : '0'}">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </a>
      </li>
    `).join('');
  }

  // Mobile drawer
  const mobileNav = document.getElementById('mobile-nav-list');
  if (mobileNav) {
    mobileNav.innerHTML = navItems.map(item => `
      <li>
        <a href="#${item.isPage ? 'vereine' : item.section}"
           data-nav="${item.key}"
           data-section="${item.section || ''}"
           data-ispage="${item.isPage ? '1' : '0'}">${item.label}</a>
      </li>
    `).join('');
  }

  // Wire nav clicks
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const key = el.dataset.nav;
      const isPage = el.dataset.ispage === '1';
      const section = el.dataset.section;

      closeMobileMenu();

      if (isPage) {
        showVereineView(true);
      } else {
        if (inVereineView) hideVereineView();
        scrollToSection(section);
      }
    });
  });
}

function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function setNavActive(key) {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.classList.toggle('active', el.dataset.nav === key);
    if (el.dataset.nav !== key) el.classList.remove('scroll-active');
  });
}

// ── Vereine View Toggle ──────────────────────────────────────
function showVereineView(scroll = true) {
  inVereineView = true;
  document.getElementById('single-page-view').style.display = 'none';
  const vv = document.getElementById('vereine-view');
  vv.style.display = 'block';
  setNavActive('vereine');
  renderVereine();
  if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  history.replaceState(null, '', '#vereine');

  // Update back label
  const backLabel = document.getElementById('vereine-back-label');
  if (backLabel) backLabel.textContent = { en: 'Back to Main', de: 'Zurück', hi: 'वापस' }[lang] || 'Back to Main';
}

function hideVereineView() {
  inVereineView = false;
  document.getElementById('vereine-view').style.display = 'none';
  document.getElementById('single-page-view').style.display = 'block';
  setNavActive('home');
  history.replaceState(null, '', '#section-home');
}

// ── Scroll Spy ──────────────────────────────────────────────
function setupScrollSpy() {
  const sections = NAV_ITEMS
    .filter(i => i.section)
    .map(i => ({ key: i.key, el: document.getElementById(i.section) }))
    .filter(i => i.el);

  const obs = new IntersectionObserver(entries => {
    if (inVereineView) return;
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const item = sections.find(s => s.el === entry.target);
        if (item) {
          document.querySelectorAll('[data-nav]').forEach(el => {
            const active = el.dataset.nav === item.key;
            el.classList.toggle('scroll-active', active);
            el.classList.toggle('active', active);
          });
        }
      }
    });
  }, { threshold: 0.15 });

  sections.forEach(s => obs.observe(s.el));
}

// ── Render ALL Sections (single-page) ────────────────────────
function renderAllSections() {
  renderHome();
  renderAbout();
  renderMission();
  renderStructure();
  renderPrinciples();
  renderEvents();
  renderGallery();
  renderNews();
  renderLeadership();
  renderJoin();
  renderDonate();
  renderContact();
  renderImpressum();
  renderPrivacy();
}

// ── HOME ─────────────────────────────────────────────────────
function renderHome() {
  const h = CONTENT.home;

  const headlines = t(h.heroHeadline);
  document.getElementById('hero-headline').innerHTML =
    headlines.map(line => `<span class="line">${line}</span>`).join('');

  setText('hero-sub',    t(h.heroSub));
  setText('hero-intro',  t(h.intro));
  setText('cta-join',    t(h.ctaJoin));
  setText('cta-vereine', t(h.ctaVereine));

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
  featuredEl.innerHTML = featured.map(v => `
    <div class="verein-card" style="--accent-color:${v.color}" onclick="showVereineView(true)">
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
  `).join('');

  buildLogoConstellation();

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

  // Chair avatar initials
  const avatarEl = document.getElementById('chair-avatar-initials');
  if (avatarEl) {
    avatarEl.textContent = a.chairName.split(' ').map(w => w[0]).join('').slice(0,2);
  }
}

// ── MISSION / COLLECTIVE ACTION ──────────────────────────────
function renderMission() {
  const m = CONTENT.mission;
  setText('mission-section-title',    t(m.title));
  setText('mission-section-subtitle', t(m.subtitle));

  const grid = document.getElementById('mission-grid');
  grid.innerHTML = m.areas.map(area => `
    <div class="mission-card">
      <span class="mission-card-icon">${area.icon}</span>
      <div class="mission-card-title">${t(area.title)}</div>
      <p class="mission-card-desc">${t(area.desc)}</p>
    </div>
  `).join('');
}

// ── FEDERAL & REGIONAL STRUCTURE ─────────────────────────────
function renderStructure() {
  const s = CONTENT.structure;
  setText('structure-title',    t(s.title));
  setText('structure-subtitle', t(s.subtitle));

  const grid = document.getElementById('structure-grid');

  function buildPanel(data, mod) {
    const featuresHTML = data.features.map(f => `
      <div class="structure-feature">
        <span class="structure-feature-icon">${f.icon}</span>
        <span>${f[lang] || f.en}</span>
      </div>
    `).join('');
    return `
      <div class="structure-panel structure-panel--${mod}">
        <span class="structure-panel-label">${t(data.label)}</span>
        <h3 class="structure-panel-title">${t(data.title)}</h3>
        <p class="structure-panel-desc">${t(data.desc)}</p>
        <div class="structure-features">${featuresHTML}</div>
      </div>
    `;
  }

  grid.innerHTML = buildPanel(s.federal, 'federal') + buildPanel(s.regional, 'regional');
}

// ── PRINCIPLES ───────────────────────────────────────────────
function renderPrinciples() {
  const p = CONTENT.principles;
  setText('principles-title',    t(p.title));
  setText('principles-subtitle', t(p.subtitle));

  const grid = document.getElementById('principles-grid');
  grid.innerHTML = p.items.map(item => `
    <div class="principle-card">
      <span class="principle-icon">${item.icon}</span>
      <div class="principle-title">${t(item.title)}</div>
      <p class="principle-desc">${t(item.desc)}</p>
    </div>
  `).join('');
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

// ── LEADERSHIP + ADVISORS ────────────────────────────────────
function renderLeadership() {
  const a = CONTENT.about;
  const labels = { en:'Leadership', de:'Führung', hi:'नेतृत्व' };
  setText('leadership-section-title', labels[lang] || 'Leadership');

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

  // Advisors
  const adv = CONTENT.advisors;
  setText('advisors-title', t(adv.title));
  setText('advisors-subtitle', t(adv.subtitle));

  const advGrid = document.getElementById('advisors-grid');
  advGrid.innerHTML = adv.members.map(m => `
    <div class="advisor-card">
      <div class="advisor-avatar">?</div>
      <div class="advisor-name">${t(m.name)}</div>
      <div class="advisor-role">${t(m.role)}</div>
    </div>
  `).join('');
}

// ── JOIN / MEMBERSHIP ────────────────────────────────────────
function renderJoin() {
  const j = CONTENT.join;
  setText('join-title',       t(j.title));
  setText('join-subtitle',    t(j.subtitle));
  setText('eligibility-title',t(j.eligibility.title));
  setText('eligibility-text', t(j.eligibility.text));
  setText('join-cta',         t(j.ctaLabel));

  // Membership types
  const typesEl = document.getElementById('membership-types');
  const membershipTypes = [
    {
      badge: { en: 'REGULAR MEMBERSHIP', de: 'ORDENTLICHE MITGLIEDSCHAFT', hi: 'नियमित सदस्यता' },
      title: { en: 'For Registered Vereine', de: 'Für eingetragene Vereine', hi: 'पंजीकृत वेराइने के लिए' },
      desc:  { en: 'For registered charitable organizations (e.V.) operating in Germany.', de: 'Für eingetragene gemeinnützige Organisationen in Deutschland.', hi: 'जर्मनी में कार्यरत पंजीकृत धर्मार्थ संगठनों के लिए।' }
    },
    {
      badge: { en: 'ASSOCIATE MEMBERSHIP', de: 'FÖRDERMITGLIEDSCHAFT', hi: 'सहयोगी सदस्यता' },
      title: { en: 'For Individuals & Supporters', de: 'Für Einzelpersonen & Förderer', hi: 'व्यक्तियों और समर्थकों के लिए' },
      desc:  { en: 'For individuals and supporters who share our vision for the Indian diaspora in Germany.', de: 'Für Einzelpersonen, die unsere Vision für die indische Diaspora in Deutschland teilen.', hi: 'उन व्यक्तियों के लिए जो जर्मनी में भारतीय प्रवासियों के लिए हमारी दृष्टि साझा करते हैं।' }
    }
  ];

  typesEl.innerHTML = membershipTypes.map((mt, i) => `
    <div class="membership-type-card ${i === 0 ? 'selected' : ''}" onclick="selectMembershipType(this)">
      <div class="membership-type-badge">${t(mt.badge)}</div>
      <div class="membership-type-title">${t(mt.title)}</div>
      <p class="membership-type-desc">${t(mt.desc)}</p>
    </div>
  `).join('');

  // Benefits
  const grid = document.getElementById('benefits-grid');
  grid.innerHTML = j.benefits.map(b => `
    <div class="benefit-card">
      <span class="benefit-icon">${b.icon}</span>
      <div class="benefit-title">${t(b.title)}</div>
      <p class="benefit-desc">${t(b.desc)}</p>
    </div>
  `).join('');
}

function selectMembershipType(el) {
  document.querySelectorAll('.membership-type-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

// ── DONATE ───────────────────────────────────────────────────
function renderDonate() {
  const d = CONTENT.donate;
  setText('donate-title',    t(d.title));
  setText('donate-subtitle', t(d.subtitle));

  const formTitleLabels = { en: 'Make a Contribution', de: 'Beitrag leisten', hi: 'योगदान करें' };
  setText('donate-form-title', formTitleLabels[lang] || formTitleLabels.en);

  // Reasons
  const reasonsEl = document.getElementById('donate-reasons');
  reasonsEl.innerHTML = d.reasons.map(r => `
    <div class="donate-reason-card">
      <span class="donate-reason-icon">${r.icon}</span>
      <div>
        <div class="donate-reason-title">${t(r.title)}</div>
        <p class="donate-reason-desc">${t(r.desc)}</p>
      </div>
    </div>
  `).join('');

  // Amount selector
  const amountEl = document.getElementById('amount-selector');
  const customLabel = { en: 'Custom', de: 'Eigener Betrag', hi: 'कस्टम' };
  let selectedAmount = d.amounts[1]; // default €50

  function updateAmounts() {
    amountEl.querySelectorAll('.amount-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.amount === String(selectedAmount));
    });
  }

  amountEl.innerHTML = d.amounts.map(amt => `
    <button class="amount-btn" data-amount="${amt}">€${amt}</button>
  `).join('') + `<button class="amount-btn amount-btn--custom" data-amount="custom">${customLabel[lang] || customLabel.en}</button>`;

  amountEl.querySelectorAll('.amount-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedAmount = btn.dataset.amount;
      updateAmounts();
    });
  });

  updateAmounts();

  // Form labels
  setText('label-donate-name',    t(d.formLabels.name));
  setText('label-donate-email',   t(d.formLabels.email));
  setText('label-donate-message', t(d.formLabels.message));
  setText('btn-donate',           t(d.ctaLabel));

  document.getElementById('input-donate-name')?.setAttribute('placeholder', t(d.formLabels.name));
  document.getElementById('input-donate-email')?.setAttribute('placeholder', t(d.formLabels.email));
}

function handleDonateSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  const successMsgs = { en:'Thank you for your support!', de:'Vielen Dank für Ihre Unterstützung!', hi:'आपके सहयोग के लिए धन्यवाद!' };
  const orig = btn.textContent;
  btn.textContent = '✓ ' + successMsgs[lang];
  btn.style.background = 'var(--india-green)';
  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = '';
    e.target.reset();
  }, 3000);
}

// ── CONTACT ──────────────────────────────────────────────────
function renderContact() {
  const c = CONTENT.contact;
  setText('contact-title',   t(c.title));
  setText('contact-address', c.address);
  setText('contact-phone',   c.phone);

  const emailEl = document.getElementById('contact-email');
  if (emailEl) { emailEl.textContent = c.email; emailEl.href = `mailto:${c.email}`; }

  const fl = c.formLabels;
  setText('label-name',    t(fl.name));
  setText('label-email',   t(fl.email));
  setText('label-subject', t(fl.subject));
  setText('label-message', t(fl.message));
  setText('btn-send',      t(fl.send));

  ['name','email','subject','message'].forEach(field => {
    const el = document.getElementById('input-' + field);
    const lbl = document.getElementById('label-' + field);
    if (el && lbl) el.placeholder = lbl.textContent;
  });

  // Social links
  const socialEl = document.getElementById('contact-social');
  if (socialEl && CONTENT.footer?.social) {
    socialEl.innerHTML = buildSocialLinks();
  }
}

function buildSocialLinks() {
  const s = CONTENT.footer.social;
  const links = [
    { key: 'linkedin',  icon: '🔗', label: 'LinkedIn',  href: s.linkedin  },
    { key: 'instagram', icon: '📸', label: 'Instagram', href: s.instagram },
    { key: 'whatsapp',  icon: '💬', label: 'WhatsApp',  href: s.whatsapp  },
  ];
  return links.map(l => `
    <a href="${l.href}" target="_blank" rel="noopener noreferrer" class="social-link">
      <span class="social-icon">${l.icon}</span>${l.label}
    </a>
  `).join('');
}

function handleContactSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  const successMsgs = { en:"Message sent! We'll get back to you soon.", de:'Nachricht gesendet!', hi:'संदेश भेजा गया!' };
  const orig = btn.textContent;
  btn.textContent = '✓ ' + successMsgs[lang];
  btn.style.background = 'var(--india-green)';
  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = '';
    e.target.reset();
  }, 3000);
}

// ── IMPRESSUM & PRIVACY ──────────────────────────────────────
function renderImpressum() {
  const imp = CONTENT.legal.impressum;
  setText('impressum-title',   t(imp.title));
  setHTML('impressum-content', t(imp.content).replace(/\n/g, '<br>'));
}

function renderPrivacy() {
  const priv = CONTENT.legal.privacy;
  setText('privacy-title',   t(priv.title));
  setHTML('privacy-content', t(priv.content).replace(/\n/g, '<br>'));
}

// ── FOOTER ───────────────────────────────────────────────────
function renderFooter() {
  document.getElementById('footer-year').textContent = new Date().getFullYear();
  updateFooterText();
}

function updateFooterText() {
  if (!CONTENT) return;
  setText('footer-sitename', t(CONTENT.meta.siteName));
  setText('footer-impressum', t(CONTENT.footer.impressum));
  setText('footer-privacy',   t(CONTENT.footer.privacy));
  setText('footer-rights',    t(CONTENT.footer.rights));

  const footerSocial = document.getElementById('footer-social');
  if (footerSocial && CONTENT.footer?.social) {
    footerSocial.innerHTML = buildSocialLinks();
  }
}

// ── VEREINE DIRECTORY ────────────────────────────────────────
function renderVereine() {
  const titleMap    = { en:'Vereine Directory', de:'Vereineverzeichnis', hi:'वेराइने निर्देशिका' };
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

  let mobileStep = 'states';
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
    if (mobileStep === 'detail')   setStep('vereine', activeStateName);
    else if (mobileStep === 'vereine') setStep('states');
  });

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

    if (isMobile() && fromInteraction) {
      setStep('vereine');
      vereineCol.scrollTop = 0;
    }

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

    const hash = vereinId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const themes = ['theme-wave', 'theme-glow', 'theme-prism', 'theme-aurora', 'theme-ember'];
    const theme = themes[hash % themes.length];
    const patterns = ['◆', '✦', '◈', '❋', '✧', '◎', '▣', '◉'];
    const pattern = patterns[hash % patterns.length];

    detailCol.innerHTML = `
      <div class="verein-detail ${theme}" style="--accent:${v.color}">
        <div class="detail-hero-stripe">
          <div class="stripe-bg"></div>
          <div class="stripe-pattern">${(pattern + ' ').repeat(20)}</div>
          <div class="stripe-content">
            ${v.logo ? `
              <div class="detail-logo-wrap">
                <img src="${v.logo}" alt="${v.name} logo" class="detail-logo" loading="lazy"
                     onerror="this.parentElement.innerHTML='<span class=\\'logo-fallback\\' style=\\'color:${v.color}\\'>${pattern}</span>'" />
              </div>
            ` : `<div class="detail-logo-wrap"><span class="logo-fallback" style="color:${v.color}">${pattern}</span></div>`}
          </div>
        </div>
        <div class="detail-body">
          <div class="detail-category" style="color:${v.color}"><span>${t(v.category)}</span></div>
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
                 style="background:${v.color}; border-color:${v.color}">${visitLabel[lang]}</a>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    if (isMobile() && fromInteraction) {
      setStep('detail', v.name);
      detailCol.scrollTop = 0;
    }
  }

  statesCol.querySelectorAll('.state-item').forEach(el => {
    el.addEventListener('click',      () => selectState(el.dataset.state, true));
    el.addEventListener('mouseenter', () => { if (!isMobile()) selectState(el.dataset.state, false); });
    el.addEventListener('keypress',   e  => { if (e.key === 'Enter') selectState(el.dataset.state, true); });
  });

  const resizeHandler = () => {
    if (!isMobile()) {
      layout.className = layout.className.replace(/step-\S+/g, '').trim();
      layout.classList.add('step-states');
      backBtn.style.display  = 'none';
      breadcrumb.textContent = '';
      if (activeStateId) selectState(activeStateId, false);
    }
  };
  window.addEventListener('resize', resizeHandler);

  if (VEREINE.states.length > 0) {
    if (!isMobile()) {
      selectState(VEREINE.states[0].id, false);
    }
    statesCol.querySelector('.state-item')?.classList.add('active');
    activeStateId   = VEREINE.states[0].id;
    activeStateName = VEREINE.states[0].name;
  }
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

    document.body.classList.toggle('devanagari', lang === 'hi');

    buildNav();
    renderAllSections();
    if (inVereineView) renderVereine();
    updateFooterText();
    updateCookieBannerText();
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
  const banner = document.getElementById('cookie-banner');
  const accept = document.getElementById('cookie-accept');

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

  document.getElementById('cookie-more')?.addEventListener('click', () => {
    scrollToSection('section-impressum');
  });
}

// ── Mobile Menu ──────────────────────────────────────────────
function setupMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const drawer    = document.getElementById('mobile-drawer');
  const overlay   = document.getElementById('drawer-overlay');
  if (!hamburger || !drawer) return;

  hamburger.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    if (overlay) {
      overlay.style.display = isOpen ? 'block' : 'none';
      setTimeout(() => { if (isOpen) overlay.classList.add('show'); }, 10);
    }
  });

  if (overlay) overlay.addEventListener('click', closeMobileMenu);
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

// ── Logo Constellation (Home Hero) ───────────────────────────
function buildLogoConstellation() {
  const track = document.getElementById('hero-strip-track');
  if (!track) return;

  const allVereine = VEREINE.states.flatMap(s => s.vereine).filter(v => v.logo);
  if (!allVereine.length) return;

  const cellW    = 130;
  const viewW    = window.innerWidth;
  const perRow   = Math.ceil(viewW / cellW) + 4;

  const shuffled = [...allVereine].sort(() => Math.random() - 0.5);
  const pool = [];
  while (pool.length < perRow * 2) pool.push(...[...allVereine].sort(() => Math.random() - 0.5));

  const assigned = [];
  const usedIds  = new Set();
  for (const v of pool) {
    if (assigned.length >= perRow) break;
    if (!usedIds.has(v.id)) { assigned.push(v); usedIds.add(v.id); }
  }
  while (assigned.length < perRow) {
    for (const v of shuffled) {
      if (assigned.length >= perRow) break;
      assigned.push(v);
    }
  }

  track.innerHTML = '';
  const allCellData = [];

  const row = document.createElement('div');
  row.className = 'hero-strip-row scrollLeft';
  row.style.animationDuration = '38s';

  const doubled = [...assigned, ...assigned];
  doubled.forEach((v, ci) => {
    const cell = document.createElement('div');
    cell.className = 'hero-strip-cell';
    cell.innerHTML = `
      <img src="${v.logo}" alt="${v.name}" loading="lazy"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22/>'"/>
      <div class="strip-cell-name">${v.name}</div>
      <div class="strip-cell-glow"></div>
    `;
    row.appendChild(cell);
    if (ci < assigned.length) allCellData.push({ cell, verein: v, rowIdx: 0, colIdx: ci });
  });

  track.appendChild(row);

  function cycleLogos() {
    const swapCount = 2 + Math.floor(Math.random() * 2);
    const indices   = [];
    while (indices.length < swapCount && indices.length < allCellData.length) {
      const idx = Math.floor(Math.random() * allCellData.length);
      if (!indices.includes(idx)) indices.push(idx);
    }
    const currentIds = new Set();
    allCellData.forEach((cd, i) => { if (!indices.includes(i)) currentIds.add(cd.verein.id); });

    for (const idx of indices) {
      const cd = allCellData[idx];
      let candidate = null;
      const shuffledV = [...allVereine].sort(() => Math.random() - 0.5);
      for (const v of shuffledV) {
        if (!currentIds.has(v.id)) { candidate = v; break; }
      }
      if (!candidate) candidate = shuffledV[0];
      currentIds.add(candidate.id);

      const cell = cd.cell;
      cell.classList.add('swap-out');
      const newV = candidate;
      setTimeout(() => {
        const img  = cell.querySelector('img');
        const name = cell.querySelector('.strip-cell-name');
        if (img)  { img.src = newV.logo; img.alt = newV.name; }
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

  // Flag color wave
  const flagColors = [
    { r:255, g:153, b:51  },
    { r:255, g:204, b:0   },
    { r:221, g:0,   b:0   },
    { r:19,  g:136, b:8   },
    { r:0,   g:0,   b:128 },
    { r:255, g:153, b:51  },
  ];
  function lerpColor(c1, c2, t) {
    return { r:Math.round(c1.r+(c2.r-c1.r)*t), g:Math.round(c1.g+(c2.g-c1.g)*t), b:Math.round(c1.b+(c2.b-c1.b)*t) };
  }
  function getFlagColor(t) {
    const scaled = t*(flagColors.length-1);
    const idx    = Math.floor(scaled);
    return lerpColor(flagColors[Math.min(idx,flagColors.length-1)], flagColors[Math.min(idx+1,flagColors.length-1)], scaled-idx);
  }
  let waveOffset = 0;
  function flagWave() {
    waveOffset += 0.0015;
    if (waveOffset > 1) waveOffset -= 1;
    allCellData.forEach(cd => {
      const tVal = (cd.colIdx * 0.06 + waveOffset) % 1;
      const c    = getFlagColor(tVal);
      const intensity = 0.5 + 0.5 * Math.sin(tVal * Math.PI * 2);
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

// ══════════════════════════════════════════════════════════════
// EMBLEM HERO — Particle System & Scroll-triggered Reveals
// ══════════════════════════════════════════════════════════════

(function initEmblemHero() {
  document.addEventListener('DOMContentLoaded', () => {
    initEmblemParticles();
    initConceptCardObserver();
  });

  // ── Floating Particles (leaf-like, in flag colors) ──
  function initEmblemParticles() {
    const canvas = document.getElementById('emblem-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const FLAG_COLORS = [
      'rgba(255,153,51,0.6)',   // saffron
      'rgba(255,255,255,0.3)',  // white
      'rgba(19,136,8,0.5)',     // green
      'rgba(40,40,40,0.3)',     // black (subtle)
      'rgba(221,0,0,0.4)',      // red
      'rgba(255,204,0,0.5)',    // gold
    ];

    function resize() {
      const hero = canvas.parentElement;
      if (!hero) return;
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        size: Math.random() * 3 + 1,
        speedY: -(Math.random() * 0.6 + 0.2),
        speedX: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.7 + 0.3,
        color: FLAG_COLORS[Math.floor(Math.random() * FLAG_COLORS.length)],
        life: 0,
        maxLife: Math.random() * 400 + 200,
        wobbleSpeed: Math.random() * 0.02 + 0.01,
        wobbleAmp: Math.random() * 30 + 10,
      };
    }

    function animate() {
      if (!canvas.offsetParent) { requestAnimationFrame(animate); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles
      if (particles.length < 50 && Math.random() > 0.92) {
        particles.push(createParticle());
      }

      particles.forEach((p, i) => {
        p.life++;
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.life * p.wobbleSpeed) * 0.3;

        const lifeRatio = p.life / p.maxLife;
        const alpha = lifeRatio < 0.15 ? lifeRatio / 0.15 :
                      lifeRatio > 0.8 ? (1 - lifeRatio) / 0.2 : 1;

        ctx.save();
        ctx.globalAlpha = p.opacity * alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Add glow
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Remove dead particles
        if (p.life > p.maxLife || p.y < -20) {
          particles.splice(i, 1);
        }
      });

      requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener('resize', resize);
    animate();
  }

  // ── Intersection Observer for Concept Cards ──
  function initConceptCardObserver() {
    const cards = document.querySelectorAll('.concept-card');
    if (!cards.length) return;

    // Reset animation state — cards start hidden
    cards.forEach(card => {
      card.style.animationPlayState = 'paused';
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    cards.forEach(card => observer.observe(card));
  }
})();
