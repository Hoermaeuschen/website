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

// Inline SVG icons with brand colours — no CDN dependency.
const PLATFORM_ICONS = {
  spotify: `<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#1DB954" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`,

  youtube: `<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,

  apple: `<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#FC3C44" d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a6.133 6.133 0 0 0-1.903-.737 9.55 9.55 0 0 0-1.41-.109c-.03 0-9.535.004-9.535.004V5.17l.004.186V8.01c-.638-.34-1.35-.536-2.108-.536C3.605 7.474.862 10.197.862 13.56c0 3.362 2.743 6.085 6.12 6.085 3.378 0 6.12-2.723 6.12-6.085V7.07h6.986a3.77 3.77 0 0 1-.01-.337V4.86h.014c.024 0 .048-.002.072-.002 1.254 0 2.306.94 2.455 2.18a2.48 2.48 0 0 1 .02.32v1.77a.9.9 0 0 1-.898.9h-.834v1.794h.834c.497 0 .898.4.898.898v1.768a2.47 2.47 0 0 1-2.475 2.475h-.038V16.8h.038c2.356 0 4.269-1.913 4.269-4.268v-1.769a2.68 2.68 0 0 0-.898-1.993 2.68 2.68 0 0 0 .898-1.993V5.008a4.247 4.247 0 0 0-.44-1.884zM6.982 17.851c-2.356 0-4.268-1.912-4.268-4.268s1.912-4.268 4.268-4.268c2.357 0 4.269 1.912 4.269 4.268s-1.912 4.268-4.269 4.268z"/></svg>`,

  amazon: `<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#FF9900" d="M.288 17.108c3.107 1.94 6.763 3.12 10.685 3.12 3.28 0 7.205-.87 10.012-2.854.43-.303.047-.747-.42-.534-2.87 1.196-5.969 1.783-8.852 1.783-3.789 0-7.45-.99-10.566-2.735-.39-.22-.7.29-.36.52M.015 15.56c-.14.095-.168.299-.06.433 3.064 3.816 7.665 6.268 12.867 6.268 3.94 0 8.36-1.52 11.39-4.16.334-.288.164-.78-.27-.694-4.008.804-8.37 1.205-12.403.388C7.635 17.046 3.593 15.42.015 15.56M14.75 6.978c-.018.065.033.13.1.13h1.756c.058 0 .108-.038.12-.094l.713-4.1h2.657l.716 4.1a.123.123 0 0 0 .12.094h1.757c.067 0 .118-.065.1-.13L20.04 0H17.71l-2.96 6.978zm-7.384 0c-.017.065.033.13.1.13H9.23a.12.12 0 0 0 .12-.094l.714-4.1H12.7l.716 4.1c.013.056.063.094.12.094h1.758c.067 0 .118-.065.1-.13L12.636 0h-2.33L7.366 6.978z"/></svg>`,

  youtubeMusic: `<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#FF0000" d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.2C7.128 19.2 3.2 15.272 3.2 12 3.2 8.728 7.128 4.8 12 4.8c4.872 0 8.8 3.928 8.8 7.2 0 3.272-3.928 7.2-8.8 7.2zm-2.4-10.8v7.2l6-3.6-6-3.6z"/></svg>`,
};

function renderStreamingBar() {
  const section   = document.getElementById('streaming-bar-section');
  const container = document.getElementById('streaming-bar');
  if (!section || !container) return;

  const platforms = [
    { key: 'spotify',      label: 'Spotify',       icon: PLATFORM_ICONS.spotify },
    { key: 'apple',        label: 'Apple Music',    icon: PLATFORM_ICONS.apple },
    { key: 'youtubeMusic', label: 'YouTube Music',  icon: PLATFORM_ICONS.youtubeMusic },
    { key: 'amazon',       label: 'Amazon Music',   icon: PLATFORM_ICONS.amazon },
    { key: 'youtube',      label: 'YouTube',        icon: PLATFORM_ICONS.youtube },
  ];

  const links = platforms
    .filter(p => artistStreaming[p.key])
    .map(p => `
      <a href="${artistStreaming[p.key]}" target="_blank" rel="noopener noreferrer"
         class="inline-flex items-center gap-2.5 px-5 py-2.5 border border-surface/15 rounded-full text-sm font-semibold text-surface/75 hover:bg-surface/10 hover:text-surface hover:border-surface/30 transition-all duration-200">
        ${p.icon}
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
    <div class="flex-shrink-0 w-72 aspect-video rounded-2xl overflow-hidden shadow-xl yt-embed">
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
