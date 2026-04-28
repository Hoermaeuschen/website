// ============================================================
// HörMäuschen — main.js
// ============================================================

// --- State ---
let artistStreaming = {};
let youtubeVideos  = [];

// --- DOM Ready ---
document.addEventListener('DOMContentLoaded', () => {
  loadContent();
  initMobileMenu();
  initContactForm();
  initNavHighlight();
  initReveal();
  initFaq();
});

// ============================================================
// CONTENT — Load from songs.json
// ============================================================

async function loadContent() {
  try {
    const res = await fetch('songs.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    artistStreaming = data.artist_streaming || {};
    youtubeVideos  = data.youtube_videos   || [];
    renderStreamingBar();
    renderFooterStreamingLinks();
    renderYouTubeVideos();
  } catch (e) {
    console.error('Fehler beim Laden:', e);
  }
}

// ============================================================
// STREAMING BAR — with platform logos via Simple Icons CDN
// ============================================================

function renderStreamingBar() {
  const section   = document.getElementById('streaming-bar-section');
  const container = document.getElementById('streaming-bar');
  if (!section || !container) return;

  const platforms = [
    { key: 'spotify',      label: 'Spotify',       slug: 'spotify' },
    { key: 'apple',        label: 'Apple Music',    slug: 'applemusic' },
    { key: 'youtubeMusic', label: 'YouTube Music',  slug: 'youtubemusic' },
    { key: 'amazon',       label: 'Amazon Music',   slug: 'amazonmusic' },
    { key: 'youtube',      label: 'YouTube',        slug: 'youtube' },
  ];

  // jsDelivr serves the Simple Icons npm package — more reliable than cdn.simpleicons.org.
  // CSS filter brightness(0) invert(1) turns any brand-coloured SVG white.
  const cdnBase = 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons';

  const links = platforms
    .filter(p => artistStreaming[p.key])
    .map(p => `
      <a href="${artistStreaming[p.key]}" target="_blank" rel="noopener noreferrer"
         class="inline-flex items-center gap-2.5 px-5 py-2.5 border border-surface/15 rounded-full text-sm font-semibold text-surface/75 hover:bg-surface/10 hover:text-surface hover:border-surface/30 transition-all duration-200">
        <img src="${cdnBase}/${p.slug}.svg"
             style="filter:brightness(0) invert(1);"
             width="18" height="18" alt="${p.label}" loading="lazy" />
        ${p.label}
      </a>`)
    .join('');

  if (links) {
    container.innerHTML = links;
    section.classList.remove('hidden');
  }
}

// ============================================================
// FOOTER — Streaming Links
// ============================================================

function renderFooterStreamingLinks() {
  const container = document.getElementById('footer-streaming-links');
  if (!container) return;

  const platforms = [
    { key: 'spotify',      label: 'Spotify' },
    { key: 'youtube',      label: 'YouTube' },
    { key: 'apple',        label: 'Apple Music' },
    { key: 'amazon',       label: 'Amazon Music' },
    { key: 'youtubeMusic', label: 'YouTube Music' }
  ];

  container.innerHTML = platforms
    .filter(p => artistStreaming[p.key])
    .map(p => `<li><a href="${artistStreaming[p.key]}" target="_blank" rel="noopener noreferrer" class="hover:text-surface transition-colors">${p.label}</a></li>`)
    .join('');
}

// ============================================================
// YOUTUBE — Hörproben (managed via CMS in songs.json)
// ============================================================

function renderYouTubeVideos() {
  const grid = document.getElementById('youtube-grid');
  if (!grid) return;

  const active = youtubeVideos.filter(v => v.embed_code && v.embed_code.trim());

  if (!active.length) {
    grid.innerHTML = '<p class="text-text-muted text-center col-span-full py-12 italic">Hörproben werden bald hinzugefügt.</p>';
    return;
  }

  // Paste the full YouTube <iframe> embed code directly from YouTube → Share → Einbetten.
  // The wrapper forces the iframe to fill the responsive aspect-ratio container.
  grid.innerHTML = active.map(v => `
    <div class="aspect-video rounded-2xl overflow-hidden shadow-xl yt-embed">
      ${v.embed_code}
    </div>`).join('');
}

// ============================================================
// MOBILE MENU
// ============================================================

function initMobileMenu() {
  const btn     = document.getElementById('menu-btn');
  const drawer  = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('drawer-overlay');
  if (!btn || !drawer || !overlay) return;

  btn.addEventListener('click', () => toggleMenu(drawer, overlay, btn));
  overlay.addEventListener('click', () => closeMenu(drawer, overlay, btn));

  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => closeMenu(drawer, overlay, btn));
  });
}

function toggleMenu(drawer, overlay, btn) {
  drawer.classList.contains('translate-x-full')
    ? openMenu(drawer, overlay, btn)
    : closeMenu(drawer, overlay, btn);
}

function openMenu(drawer, overlay, btn) {
  drawer.classList.remove('translate-x-full');
  overlay.classList.remove('opacity-0', 'pointer-events-none');
  overlay.classList.add('opacity-100');
  btn.querySelector('span').textContent = 'close';
  document.body.style.overflow = 'hidden';
}

function closeMenu(drawer, overlay, btn) {
  drawer.classList.add('translate-x-full');
  overlay.classList.add('opacity-0', 'pointer-events-none');
  overlay.classList.remove('opacity-100');
  btn.querySelector('span').textContent = 'menu';
  document.body.style.overflow = '';
}

// ============================================================
// CONTACT FORM
// Fallback: native mailto: if action is not a real endpoint.
// To enable form submissions: set action to a Formspree URL,
// e.g. https://formspree.io/f/YOUR_FORM_ID
// ============================================================

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const action = form.getAttribute('action') || '';
  // If action is a mailto: or placeholder, skip JS and let browser handle it natively
  if (!action || action.startsWith('mailto:') || action === '#') return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalHTML = btn.innerHTML;

    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-xl">progress_activity</span> Wird gesendet…';
    btn.disabled = true;

    try {
      const res = await fetch(action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (res.ok) {
        form.innerHTML = `
          <div class="flex flex-col items-center text-center py-16 gap-4">
            <span class="material-symbols-outlined text-primary text-6xl" style="font-variation-settings:'FILL' 1">check_circle</span>
            <h3 class="text-2xl font-bold font-headline text-on-surface">Vielen Dank für deine Anfrage! 💛</h3>
            <p class="text-text-muted max-w-sm leading-relaxed">
              Ich freue mich darauf, deine Geschichte in ein ganz besonderes Lied zu verwandeln.
              Ich melde mich bald persönlich bei dir.
            </p>
          </div>`;
      } else {
        throw new Error('Server error');
      }
    } catch {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
      showFormError(form);
    }
  });
}

function showFormError(form) {
  let err = form.querySelector('.form-error');
  if (!err) {
    err = document.createElement('p');
    err.className = 'form-error text-sm text-accent-dark text-center mt-4';
    form.appendChild(err);
  }
  err.textContent = 'Fehler beim Senden. Bitte schreibe direkt an info@hoermaeuschen.ch';
}

// ============================================================
// NAV SCROLL HIGHLIGHT
// ============================================================

function initNavHighlight() {
  const sections = document.querySelectorAll('[data-nav-section]');
  const navLinks  = document.querySelectorAll('[data-nav-link]');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          const active = link.getAttribute('href') === '#' + id;
          link.classList.toggle('text-primary',    active);
          link.classList.toggle('border-b-2',      active);
          link.classList.toggle('border-primary',  active);
          link.classList.toggle('pb-0.5',          active);
          link.classList.toggle('text-text-muted', !active);
        });
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach(s => observer.observe(s));
}

// ============================================================
// SCROLL REVEAL
// ============================================================

function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ============================================================
// FAQ ACCORDION
// ============================================================

function initFaq() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn    = item.querySelector('.faq-btn');
    const answer = item.querySelector('.faq-answer');
    const icon   = item.querySelector('.faq-icon');
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = !answer.classList.contains('hidden');
      // Close all others
      document.querySelectorAll('.faq-answer').forEach(a => a.classList.add('hidden'));
      document.querySelectorAll('.faq-icon').forEach(i => { if (i) i.textContent = 'add'; });
      // Toggle current
      if (!isOpen) {
        answer.classList.remove('hidden');
        if (icon) icon.textContent = 'remove';
      }
    });
  });
}
