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
  { key: 'gallery',    icon: '▣',  section: 'section-gallery'    },
  { key: 'news',       icon: '◙',  section: 'section-news'       },
  { key: 'join',       icon: '✦',  section: 'section-join'       },
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
    fetch('data/vereine_empty.json')
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
  buildNewsTicker();

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

// ── News Ticker ──────────────────────────────────────────────
function buildNewsTicker() {
  const TIMELINE = [
    { date: '01 Apr 2026', text: { en: 'FOT Dachverband Satzung Workshop Successfully Conducted — Democracy in Action', de: 'FOT Datzung Workshop erfolgreich durchgeführt — Demokratie in Aktion', hi: 'FOT दत्ज़ुंग कार्यशाला सफलतापूर्वक संपन्न' } },
    { date: 'Mar 2026',    text: { en: 'Governance & Satzung Workshop: Bringing Together the Minds Who Built Your Verein\'s Foundation', de: 'Governance- und Satzungsworkshop: Die Köpfe zusammenbringen', hi: 'गवर्नेंस और सत्ज़ुंग कार्यशाला' } },
    { date: '5 Mar 2026',  text: { en: 'Meeting with the Consulate General of India in Munich', de: 'Treffen mit dem Generalkonsulat Indien in München', hi: 'म्यूनिख में भारतीय महावाणिज्य दूतावास के साथ बैठक' } },
    { date: '28 Feb 2026', text: { en: 'Presenting the IDD Initiative to Political Leadership', de: 'Vorstellung der IDD-Initiative bei der politischen Führung', hi: 'राजनीतिक नेतृत्व को IDD पहल की प्रस्तुति' } },
    { date: '22 Feb 2026', text: { en: 'Pulse Check Results — Official Go-Ahead from the Community', de: 'Puls-Check-Ergebnisse — Offizielles Go-Ahead der Gemeinschaft', hi: 'पल्स चेक परिणाम — समुदाय से आधिकारिक मंजूरी' } },
    { date: '1 Feb 2026',  text: { en: 'FOT 2026: Explaining the Need for a Dachverband — Pulse Check from the Community', de: 'FOT 2026: Den Bedarf eines Dachverbands erklären — Puls-Check', hi: 'FOT 2026: दाखफरबांड की आवश्यकता समझाना' } },
    { date: 'Jan 2025',    text: { en: 'FOT 2025: The Beginning — Getting to Know Each Other', de: 'FOT 2025: Der Anfang — Kennenlernen', hi: 'FOT 2025: शुरुआत — एक दूसरे को जानना' } },
  ];

  // Also pull latest news items
  const newsItems = (CONTENT?.news?.items || []).slice(0, 3).map(n => ({
    date: new Date(n.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    text: n.title
  }));

  const combined = [...newsItems, ...TIMELINE];
  const track = document.getElementById('ticker-track');
  if (!track) return;

  // Build items HTML — duplicate for seamless loop
  const itemsHTML = combined.map(item => `
    <span class="ticker-item">
      <span class="ticker-item-date">${item.date}</span>
      <span class="ticker-item-sep">◆</span>
      <span>${t(item.text)}</span>
    </span>
  `).join('');

  // Duplicate so the animation loops seamlessly
  track.innerHTML = itemsHTML + itemsHTML;

  // Adjust animation duration based on content length
  const totalChars = combined.reduce((acc, i) => acc + t(i.text).length, 0);
  const duration = Math.max(30, totalChars * 0.18);
  track.style.animationDuration = duration + 's';

  // Store combined for lang rebuild
  track._tickerData = combined;
}

function rebuildTickerText() {
  const track = document.getElementById('ticker-track');
  if (!track || !track._tickerData) return;
  const combined = track._tickerData;
  const itemsHTML = combined.map(item => `
    <span class="ticker-item">
      <span class="ticker-item-date">${item.date}</span>
      <span class="ticker-item-sep">◆</span>
      <span>${t(item.text)}</span>
    </span>
  `).join('');
  track.innerHTML = itemsHTML + itemsHTML;
}

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

  // Emblem tagline
  const taglineEl = document.getElementById('emblem-tagline');
  if (taglineEl && h.emblemTagline) {
    const taglineColors = ['#FF9933', 'rgba(255,255,255,0.92)', '#7DD87D'];
    const taglineDelays = ['0.8s', '1.2s', '1.6s'];
    taglineEl.innerHTML = h.emblemTagline.map((word, i) =>
      `<span class="emblem-tagline-word" style="--word-color: ${taglineColors[i]}; --delay: ${taglineDelays[i]};">${t(word)}</span>`
    ).join('');
  }

  // Concept cards
  const conceptsEl = document.getElementById('emblem-concepts');
  if (conceptsEl && h.conceptCards) {
    const CONCEPT_ICONS = {
      circle: '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="16" stroke="currentColor" stroke-width="1.5" opacity="0.6"/><circle cx="20" cy="20" r="10" stroke="currentColor" stroke-width="1.2" opacity="0.4"/><circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.7"/></svg>',
      colors: '<svg viewBox="0 0 40 40" fill="none"><circle cx="12" cy="14" r="5" fill="#FF9933" opacity="0.8"/><circle cx="20" cy="14" r="5" fill="#fff" opacity="0.6"/><circle cx="28" cy="14" r="5" fill="#138808" opacity="0.8"/><circle cx="12" cy="26" r="5" fill="#1A1A1A" opacity="0.7"/><circle cx="20" cy="26" r="5" fill="#DD0000" opacity="0.8"/><circle cx="28" cy="26" r="5" fill="#FFCC00" opacity="0.8"/></svg>',
      banyan: '<svg viewBox="0 0 40 40" fill="none"><path d="M20 4c0 0-4 6-4 12 0 4 2 6 4 8 2-2 4-4 4-8 0-6-4-12-4-12z" fill="currentColor" opacity="0.7"/><path d="M20 24v12M14 36c0-4 3-7 6-8m6 8c0-4-3-7-6-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 16c4 2 8 6 12 8M32 16c-4 2-8 6-12 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/></svg>',
      integration: '<svg viewBox="0 0 40 40" fill="none"><rect x="4" y="4" width="14" height="14" rx="3" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><rect x="22" y="4" width="14" height="14" rx="3" stroke="currentColor" stroke-width="1.5" opacity="0.5" fill="currentColor" fill-opacity="0.1"/><rect x="4" y="22" width="14" height="14" rx="3" stroke="currentColor" stroke-width="1.5" opacity="0.5" fill="currentColor" fill-opacity="0.1"/><rect x="22" y="22" width="14" height="14" rx="3" stroke="currentColor" stroke-width="1.5" opacity="0.7"/><path d="M18 11h4M29 18v4M22 29h-4M11 22v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="20" cy="20" r="3" fill="currentColor" opacity="0.8"/></svg>',
      typography: '<svg viewBox="0 0 40 40" fill="none"><text x="4" y="18" font-family="serif" font-size="16" fill="currentColor" opacity="0.8">A</text><text x="18" y="30" font-family="serif" font-size="12" fill="currentColor" opacity="0.5">a</text><path d="M4 34h32" stroke="currentColor" stroke-width="1" opacity="0.3"/></svg>'
    };
    const cardDelays = ['0.2s', '0.4s', '0.6s', '0.8s'];
    conceptsEl.innerHTML = h.conceptCards.map((card, i) => `
      <div class="concept-card" style="--card-accent: ${card.accent}; --card-delay: ${cardDelays[i]};">
        <div class="concept-card-glow"></div>
        <div class="concept-card-icon">${CONCEPT_ICONS[card.icon] || ''}</div>
        <h4 class="concept-card-title">${t(card.title)}</h4>
        <p class="concept-card-text">${t(card.text)}</p>
      </div>
    `).join('');
  }

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
  setHTML('founding-text', t(a.founding).split('\n\n').map(p => `<p style="margin-bottom:1em">${p.replace(/\n/g,'<br>')}</p>`).join(''));
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
const GALLERY_IMAGES = [
  { src: 'assets/images/gallary/0.jpg',   caption: { en: 'Community Gathering',        de: 'Gemeinschaftstreffen',         hi: 'सामुदायिक आयोजन' },        category: 'community' },
  { src: 'assets/images/gallary/1.jpg',   caption: { en: 'Cultural Celebration',        de: 'Kulturfeier',                  hi: 'सांस्कृतिक उत्सव' },       category: 'cultural'  },
  { src: 'assets/images/gallary/2.jpg',   caption: { en: 'Festival of Colors',           de: 'Farbenfest',                   hi: 'रंगों का त्योहार' },        category: 'cultural'  },
  { src: 'assets/images/gallary/3.jfif',  caption: { en: 'Community Event',              de: 'Gemeinschaftsveranstaltung',   hi: 'सामुदायिक कार्यक्रम' },     category: 'community' },
  { src: 'assets/images/gallary/5.jfif',  caption: { en: 'Festival of Togetherness',     de: 'Festival der Gemeinschaft',    hi: 'सामंजस्य का उत्सव' },       category: 'community' },
  { src: 'assets/images/gallary/6.webp',  caption: { en: 'IDD Gathering — Bavaria',      de: 'IDD-Treffen — Bayern',         hi: 'IDD आयोजन — बवेरिया' },     category: 'community' },
  { src: 'assets/images/gallary/7.webp',  caption: { en: 'India-Germany Cultural Bridge', de: 'Indisch-Deutsche Kulturbrücke', hi: 'भारत-जर्मनी सांस्कृतिक सेतु' }, category: 'cultural'  },
  { src: 'assets/images/gallary/8.webp',  caption: { en: 'Voices of the Diaspora',       de: 'Stimmen der Diaspora',         hi: 'प्रवासियों की आवाज़' },      category: 'community' },
];

function renderGallery() {
  const g = CONTENT.gallery;
  setText('gallery-title',    t(g.title));
  setText('gallery-subtitle', t(g.subtitle));

  const filtersEl = document.getElementById('gallery-filters');
  const filterDefs = {
    all:       { en: 'All',       de: 'Alle',         hi: 'सभी' },
    community: { en: 'Community', de: 'Gemeinschaft', hi: 'समुदाय' },
    cultural:  { en: 'Cultural',  de: 'Kulturell',    hi: 'सांस्कृतिक' },
  };
  filtersEl.innerHTML = Object.entries(filterDefs).map(([key, label]) => `
    <button class="filter-btn ${key === 'all' ? 'active' : ''}" data-cat="${key}">${t(label)}</button>
  `).join('');

  const galleryEl = document.getElementById('gallery-grid');

  function renderImages(cat) {
    const items = cat === 'all' ? GALLERY_IMAGES : GALLERY_IMAGES.filter(i => i.category === cat);
    galleryEl.innerHTML = items.map((item, idx) => `
      <div class="gallery-item" data-cat="${item.category}" data-idx="${idx}">
        <div class="gallery-img-wrap">
          <img src="${item.src}" alt="${t(item.caption)}" loading="lazy"
               onerror="this.closest('.gallery-item').style.display='none'" />
          <div class="gallery-overlay">
            <button class="gallery-view-btn" onclick="openLightbox(${idx}, '${cat}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
              <span>${{ en:'View', de:'Ansehen', hi:'देखें' }[lang] || 'View'}</span>
            </button>
          </div>
        </div>
        <div class="gallery-caption">${t(item.caption)}</div>
      </div>
    `).join('');
  }

  renderImages('all');

  filtersEl.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filtersEl.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderImages(btn.dataset.cat);
    });
  });
}

// ── LIGHTBOX ─────────────────────────────────────────────────
function openLightbox(idx, cat) {
  const items = cat === 'all' ? GALLERY_IMAGES : GALLERY_IMAGES.filter(i => i.category === cat);
  let current = idx;

  let lb = document.getElementById('gallery-lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'gallery-lightbox';
    lb.className = 'gallery-lightbox';
    lb.innerHTML = `
      <div class="lightbox-backdrop" onclick="closeLightbox()"></div>
      <div class="lightbox-panel">
        <button class="lightbox-close" onclick="closeLightbox()">✕</button>
        <button class="lightbox-prev" id="lb-prev">&#8249;</button>
        <div class="lightbox-img-wrap">
          <img id="lb-img" src="" alt="" />
        </div>
        <button class="lightbox-next" id="lb-next">&#8250;</button>
        <div class="lightbox-caption" id="lb-caption"></div>
        <div class="lightbox-counter" id="lb-counter"></div>
      </div>
    `;
    document.body.appendChild(lb);
  }

  function show(i) {
    current = (i + items.length) % items.length;
    document.getElementById('lb-img').src = items[current].src;
    document.getElementById('lb-caption').textContent = t(items[current].caption);
    document.getElementById('lb-counter').textContent = `${current + 1} / ${items.length}`;
  }

  show(current);
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';

  document.getElementById('lb-prev').onclick = () => show(current - 1);
  document.getElementById('lb-next').onclick = () => show(current + 1);

  const keyHandler = e => {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
    if (e.key === 'Escape') closeLightbox();
  };
  document.addEventListener('keydown', keyHandler);
  lb._keyHandler = keyHandler;
}

function closeLightbox() {
  const lb = document.getElementById('gallery-lightbox');
  if (lb) {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    if (lb._keyHandler) document.removeEventListener('keydown', lb._keyHandler);
  }
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
  const labels = { en:'Leadership', de:'Führung', hi:'नेतृत्व' };
  setText('leadership-section-title', labels[lang] || 'Leadership');

  const tbcLabel = { en: 'To Be Confirmed', de: 'Wird noch bestätigt', hi: 'शीघ्र घोषित किया जाएगा' };
  const tbcNote  = { en: 'Leadership details will be announced soon.', de: 'Details zur Führung werden in Kürze bekannt gegeben.', hi: 'नेतृत्व विवरण जल्द ही घोषित किया जाएगा।' };
  const tbcHTML  = `<div style="padding:60px 40px;text-align:center;">
    <div style="font-family:'Cormorant Garamond',serif;font-size:clamp(80px,14vw,160px);font-weight:300;letter-spacing:0.1em;color:var(--saffron);opacity:0.18;line-height:1;user-select:none;">TBC</div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:clamp(28px,4vw,48px);font-weight:300;color:var(--text-primary);margin-top:-16px;margin-bottom:16px;">${tbcLabel[lang] || tbcLabel.en}</div>
    <div style="font-size:15px;color:var(--text-muted);">${tbcNote[lang] || tbcNote.en}</div>
  </div>`;

  const grid = document.getElementById('leadership-grid');
  grid.innerHTML = tbcHTML;

  // Advisors
  const adv = CONTENT.advisors;
  setText('advisors-title', t(adv.title));
  setText('advisors-subtitle', t(adv.subtitle));

  const advTbcNote = { en: 'Advisory Board members will be announced soon.', de: 'Die Mitglieder des Beirats werden in Kürze bekannt gegeben.', hi: 'सलाहकार बोर्ड के सदस्यों की शीघ्र घोषणा की जाएगी।' };
  const advTbcHTML = `<div style="padding:60px 40px;text-align:center;">
    <div style="font-family:'Cormorant Garamond',serif;font-size:clamp(80px,14vw,160px);font-weight:300;letter-spacing:0.1em;color:var(--saffron);opacity:0.18;line-height:1;user-select:none;">TBC</div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:clamp(28px,4vw,48px);font-weight:300;color:var(--text-primary);margin-top:-16px;margin-bottom:16px;">${tbcLabel[lang] || tbcLabel.en}</div>
    <div style="font-size:15px;color:var(--text-muted);">${advTbcNote[lang] || advTbcNote.en}</div>
  </div>`;

  const advGrid = document.getElementById('advisors-grid');
  advGrid.innerHTML = advTbcHTML;
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

  // Social links removed from contact — shown in footer only
  const socialEl = document.getElementById('contact-social');
  if (socialEl) socialEl.style.display = 'none';
}

function buildSocialLinks() {
  const s = CONTENT.footer.social;
  const links = [
    { key: 'linkedin',  svg: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>', label: 'LinkedIn',  href: s.linkedin  },
    { key: 'instagram', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>', label: 'Instagram', href: s.instagram },
    { key: 'whatsapp',  svg: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>', label: 'WhatsApp',  href: s.whatsapp  },
    { key: 'youtube',   svg: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>', label: 'YouTube',   href: 'https://www.youtube.com/@Idd-ev' },
  ];
  return links.map(l => `
    <a href="${l.href}" target="_blank" rel="noopener noreferrer" class="social-link">
      ${l.svg}<span>${l.label}</span>
    </a>
  `).join('');
}

function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('[type=submit]');
  const name    = document.getElementById('input-name')?.value    || '';
  const email   = document.getElementById('input-email')?.value   || '';
  const subject = document.getElementById('input-subject')?.value || '';
  const message = document.getElementById('input-message')?.value || '';

  const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
  const mailtoUrl = `mailto:info@idd-ev.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Open the user's mail client pre-filled
  window.location.href = mailtoUrl;

  const successMsgs = {
    en: "Opening your mail client… Thank you for reaching out!",
    de: "E-Mail-Programm wird geöffnet… Vielen Dank!",
    hi: "आपका ईमेल क्लाइंट खुल रहा है… धन्यवाद!"
  };
  const orig = btn.textContent;
  btn.textContent = '✓ ' + (successMsgs[lang] || successMsgs.en);
  btn.style.background = 'var(--india-green)';
  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = '';
    form.reset();
  }, 4000);
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
    rebuildTickerText();
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
