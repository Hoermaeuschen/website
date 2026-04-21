// ============================================================
// HörMäuschen — main.js
// ============================================================

// --- State ---
const audio = new Audio();
let songs = [];
let bundles = [];
let artistStreaming = {};
let currentIndex = 0;
let isPlaying = false;
let isSeeking = false;

// --- DOM Ready ---
document.addEventListener('DOMContentLoaded', () => {
  loadSongs();
  initMobileMenu();
  initContactForm();
  initNavHighlight();
  initPlayerProgressClick();
  initFloatingPlayerToggle();
});

// ============================================================
// SONGS — Load & Render
// ============================================================

async function loadSongs() {
  try {
    const res = await fetch('songs.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    songs = data.songs;
    bundles = data.bundles || [];
    artistStreaming = data.artist_streaming || {};
    renderSongGrid(songs);
    renderShopSection();
    renderHeroStreamingLinks();
    renderFooterStreamingLinks();
    loadTrack(0, false);
  } catch (e) {
    console.error('Fehler beim Laden der Songs:', e);
    const grid = document.getElementById('song-grid');
    if (grid) {
      grid.innerHTML = '<p class="text-text-muted col-span-full text-center py-12">Songs konnten nicht geladen werden.</p>';
    }
  }
}

function renderSongGrid(songList) {
  const grid = document.getElementById('song-grid');
  if (!grid) return;

  if (songList.length === 0) {
    grid.innerHTML = '<p class="text-text-muted col-span-full text-center py-12">Keine Songs in dieser Kategorie.</p>';
    return;
  }

  grid.innerHTML = songList.map((song, i) => {
    const globalIndex = songs.indexOf(song);
    return `
      <div
        class="song-card group relative bg-surface rounded-xl overflow-hidden shadow-[0px_8px_24px_rgba(59,168,223,0.07)] hover:shadow-[0px_16px_40px_rgba(59,168,223,0.14)] hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-primary/5"
        data-index="${globalIndex}"
        onclick="playSongAt(${globalIndex})"
        role="button"
        aria-label="${song.title} abspielen"
      >
        <div class="relative aspect-square overflow-hidden">
          <img
            src="${song.cover}"
            alt="${song.title} – Cover"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors duration-300 flex items-center justify-center">
            <div class="song-play-indicator w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
              <span class="material-symbols-outlined text-primary text-3xl song-play-icon" style="font-variation-settings:'FILL' 1,'wght' 400">play_arrow</span>
            </div>
          </div>
          <span class="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-primary text-xs font-bold rounded-full shadow-sm category-badge">${getCategoryLabel(song.category)}</span>
        </div>
        <div class="p-4">
          <p class="font-headline font-bold text-on-surface text-base leading-tight mb-3">${song.title}</p>
          <div class="flex items-center justify-between gap-2">
            <div class="flex gap-1.5 streaming-links hidden" id="links-${song.id}"></div>
            <div class="flex-1"></div>
            ${song.payhip_link
              ? `<a href="${song.payhip_link}" target="_blank" rel="noopener noreferrer"
                    onclick="event.stopPropagation()"
                    class="inline-flex items-center gap-1 bg-accent/20 text-on-surface hover:bg-accent/40 transition-colors px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0">
                   <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">shopping_cart</span>
                   Kaufen
                 </a>`
              : `<span class="inline-flex items-center gap-1 text-text-muted/60 px-3 py-1.5 rounded-full text-xs font-semibold border border-surface-container-high whitespace-nowrap flex-shrink-0">
                   <span class="material-symbols-outlined text-sm">schedule</span>
                   Bald
                 </span>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Render streaming links where available
  songList.forEach(song => {
    renderStreamingLinks(song);
  });

  // Highlight currently active card
  updateActiveCard();
}

function getCategoryLabel(categoryId) {
  const labels = {
    'kinderlieder': 'Kinderlieder',
    'emotionale-lieder': 'Emotionale Lieder',
    'anlass-lieder': 'Anlass-Lieder'
  };
  return labels[categoryId] || categoryId;
}

function renderStreamingLinks(song) {
  const container = document.getElementById('links-' + song.id);
  if (!container) return;

  const platforms = [
    { key: 'spotify',      label: 'Spotify',       icon: 'assets/icons/spotify.svg' },
    { key: 'apple',        label: 'Apple Music',    icon: 'assets/icons/apple-music.svg' },
    { key: 'youtube',      label: 'YouTube',        icon: 'assets/icons/youtube.svg' },
    { key: 'amazon',       label: 'Amazon Music',   icon: 'assets/icons/amazon-music.svg' },
    { key: 'youtubeMusic', label: 'YouTube Music',  icon: 'assets/icons/youtube-music.svg' }
  ];

  const links = platforms
    .filter(p => song.streaming[p.key])
    .map(p => `
      <a href="${song.streaming[p.key]}" target="_blank" rel="noopener noreferrer"
         onclick="event.stopPropagation()"
         title="${p.label}"
         class="text-text-muted hover:text-primary transition-colors text-xs font-semibold">
        ${p.label.split(' ')[0]}
      </a>`)
    .join('');

  if (links) {
    container.innerHTML = links;
    container.classList.remove('hidden');
  }
}

// ============================================================
// SHOP — Bundles
// ============================================================

function renderShopSongGrid() {
  const grid = document.getElementById('shop-song-grid');
  if (!grid || !songs.length) return;

  const shopSongs = songs.filter(s => s.featured);

  if (!shopSongs.length) {
    grid.innerHTML = '<p class="text-text-muted col-span-full text-center py-8">Bald erhältlich.</p>';
    return;
  }

  grid.innerHTML = shopSongs.map(song => {
    const buyBtn = song.payhip_link
      ? `<a href="${song.payhip_link}" target="_blank" rel="noopener noreferrer"
              class="w-full text-center block bg-primary text-on-primary py-2.5 rounded-full text-sm font-bold hover:bg-primary-dark transition-colors shadow-md shadow-primary/20">
               Kaufen
             </a>`
      : `<span class="w-full text-center block bg-surface-container text-text-muted py-2.5 rounded-full text-sm font-semibold border border-surface-container-high cursor-default">
               Preis folgt
             </span>`;

    return `
      <div class="bg-surface rounded-xl overflow-hidden shadow-md border border-primary/5 flex flex-col">
        <div class="relative aspect-square overflow-hidden cursor-pointer group" onclick="playSongAt(${songs.indexOf(song)})" title="${song.title} anhören">
          <img src="${song.cover}" alt="${song.title} – Cover" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          <div class="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
            <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
              <span class="material-symbols-outlined text-primary text-2xl" style="font-variation-settings:'FILL' 1">play_arrow</span>
            </div>
          </div>
        </div>
        <div class="p-4 flex flex-col gap-3 flex-1">
          <p class="font-headline font-bold text-on-surface text-sm leading-tight">${song.title}</p>
          <div class="flex items-center justify-between text-xs text-text-muted">
            <span>${song.format || 'MP3 320 kbps'}</span>
            <span class="font-bold text-on-surface">${song.price || ''}</span>
          </div>
          ${buyBtn}
        </div>
      </div>
    `;
  }).join('');
}

function renderShopSection() {
  renderShopSongGrid();
  const container = document.getElementById('bundles-grid');
  if (!container) return;

  if (!bundles.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = bundles.map(bundle => {
    // Collect covers for the bundle collage (up to 4)
    const coverSongs = bundle.song_ids
      .map(id => songs.find(s => s.id === id))
      .filter(Boolean)
      .slice(0, 4);

    const coverImgs = coverSongs.map((s, i) => {
      const rotations = ['-rotate-6', 'rotate-3', '-rotate-2', 'rotate-6'];
      const opacities = ['opacity-50', 'opacity-70', 'opacity-85', ''];
      return `<img src="${s.cover}" alt="${s.title}" aria-hidden="true"
                   class="absolute inset-0 w-full h-full object-cover rounded-xl shadow-xl ${rotations[i] || ''} ${opacities[i] || ''}" />`;
    }).join('');

    const badge = bundle.badge
      ? `<span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-on-surface text-xs font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">${bundle.badge}</span>`
      : '';

    const buyBtn = bundle.payhip_link
      ? `<a href="${bundle.payhip_link}" target="_blank" rel="noopener noreferrer"
              class="inline-flex items-center gap-2 bg-primary text-on-primary px-8 py-3.5 rounded-full font-bold hover:bg-primary-dark hover:scale-105 transition-all shadow-lg shadow-primary/25">
               <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">shopping_cart</span>
               Bundle kaufen
             </a>`
      : `<span class="inline-flex items-center gap-2 bg-surface-container text-text-muted px-8 py-3.5 rounded-full font-bold cursor-default border border-surface-container-high">
               <span class="material-symbols-outlined text-lg">schedule</span>
               Preis folgt bald
             </span>`;

    return `
      <div class="relative bg-surface rounded-2xl p-8 lg:p-10 shadow-xl border border-primary/10 flex flex-col lg:flex-row items-center gap-10">
        ${badge}
        <!-- Cover collage -->
        <div class="relative w-48 h-48 flex-shrink-0">
          ${coverImgs}
        </div>
        <!-- Info -->
        <div class="flex-1 text-center lg:text-left space-y-4">
          <h3 class="text-2xl font-extrabold font-headline text-on-surface">${bundle.title}</h3>
          <p class="text-text-muted leading-relaxed">${bundle.description}</p>
          <ul class="flex flex-wrap gap-2 justify-center lg:justify-start">
            ${bundle.song_ids.map(id => {
              const s = songs.find(x => x.id === id);
              return s ? `<li class="px-3 py-1 bg-surface-container text-on-surface text-xs font-semibold rounded-full">${s.title}</li>` : '';
            }).join('')}
          </ul>
          ${bundle.price ? `<p class="text-xl font-extrabold font-headline text-primary">${bundle.price}</p>` : ''}
          <div class="pt-2">${buyBtn}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// HERO — Streaming Platforms Bar
// ============================================================

function renderHeroStreamingLinks() {
  const section   = document.getElementById('streaming-bar-section');
  const container = document.getElementById('streaming-bar');
  if (!section || !container || !Object.keys(artistStreaming).length) return;

  const platforms = [
    { key: 'spotify',      label: 'Spotify' },
    { key: 'apple',        label: 'Apple Music' },
    { key: 'youtubeMusic', label: 'YouTube Music' },
    { key: 'amazon',       label: 'Amazon Music' },
    { key: 'youtube',      label: 'YouTube' },
  ];

  const links = platforms
    .filter(p => artistStreaming[p.key])
    .map(p => `
      <a href="${artistStreaming[p.key]}" target="_blank" rel="noopener noreferrer"
         class="inline-flex items-center gap-2 px-5 py-2.5 border border-surface/15 rounded-full text-sm font-semibold text-surface/75 hover:bg-primary hover:text-on-primary hover:border-primary hover:scale-105 transition-all duration-200">
        <span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">headphones</span>
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
  if (!container || !Object.keys(artistStreaming).length) return;

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

// --- Category Filter ---
function filterSongs(categoryId) {
  // Update tab styles
  document.querySelectorAll('.filter-tab').forEach(tab => {
    const isActive = tab.dataset.category === categoryId;
    tab.classList.toggle('bg-primary', isActive);
    tab.classList.toggle('text-on-primary', isActive);
    tab.classList.toggle('shadow-md', isActive);
    tab.classList.toggle('bg-surface', !isActive);
    tab.classList.toggle('text-text-muted', !isActive);
  });

  const filtered = categoryId === 'all' ? songs : songs.filter(s => s.category === categoryId);
  renderSongGrid(filtered);
}

// ============================================================
// AUDIO PLAYER
// ============================================================

function loadTrack(index, autoplay = false) {
  if (!songs[index]) return;
  const song = songs[index];
  currentIndex = index;

  audio.src = song.audio;
  audio.load();

  updatePlayerUI(song);
  updateActiveCard();

  if (autoplay) {
    audio.play()
      .then(() => { isPlaying = true; updatePlayButtons(); })
      .catch(err => console.warn('Autoplay blocked:', err));
  } else {
    isPlaying = false;
    updatePlayButtons();
  }
}

function playSongAt(index) {
  if (index === currentIndex && isPlaying) {
    pauseAudio();
  } else if (index === currentIndex && !isPlaying) {
    playAudio();
  } else {
    loadTrack(index, true);
  }
}

function playAudio() {
  audio.play()
    .then(() => { isPlaying = true; updatePlayButtons(); })
    .catch(err => console.warn('Play failed:', err));
}

function pauseAudio() {
  audio.pause();
  isPlaying = false;
  updatePlayButtons();
}

function togglePlay() {
  isPlaying ? pauseAudio() : playAudio();
}

function nextTrack() {
  const next = (currentIndex + 1) % songs.length;
  loadTrack(next, isPlaying);
}

function prevTrack() {
  // If more than 3 seconds in, restart; else go to previous
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  const prev = (currentIndex - 1 + songs.length) % songs.length;
  loadTrack(prev, isPlaying);
}

// --- Audio Events ---
audio.addEventListener('timeupdate', () => {
  if (isSeeking) return;
  const progress = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  document.querySelectorAll('.progress-fill').forEach(el => {
    el.style.width = progress + '%';
  });
  const currentEl = document.getElementById('player-current-time');
  if (currentEl) currentEl.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  const durationEl = document.getElementById('player-duration');
  if (durationEl) durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', () => {
  nextTrack();
});

audio.addEventListener('play', () => {
  isPlaying = true;
  updatePlayButtons();
});

audio.addEventListener('pause', () => {
  isPlaying = false;
  updatePlayButtons();
});

// --- UI Updates ---
function updatePlayerUI(song) {
  // Floating player
  setEl('fp-cover',    el => { el.src = song.cover; el.alt = song.title + ' Cover'; });
  setEl('fp-title',    el => el.textContent = song.title);
  setEl('fp-category', el => el.textContent = getCategoryLabel(song.category));

  // Hero mini-player
  setEl('hero-song-title',    el => el.textContent = song.title);
  setEl('hero-song-category', el => el.textContent = getCategoryLabel(song.category));
  setEl('hero-cover', el => { el.src = song.cover; el.alt = song.title + ' Cover'; });

  // Reset progress + time
  document.querySelectorAll('.progress-fill').forEach(el => el.style.width = '0%');
  setEl('player-current-time', el => el.textContent = '0:00');
  setEl('player-duration',     el => el.textContent = '0:00');
}

function updatePlayButtons() {
  const icon = isPlaying ? 'pause' : 'play_arrow';
  const fill = isPlaying ? 1 : 1;
  document.querySelectorAll('.main-play-icon').forEach(el => {
    el.textContent = icon;
  });
  // Update the currently active song card's play icon
  updateActiveCard();
}

function updateActiveCard() {
  document.querySelectorAll('.song-card').forEach(card => {
    const idx = parseInt(card.dataset.index);
    const icon = card.querySelector('.song-play-icon');
    if (idx === currentIndex) {
      card.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      if (icon) icon.textContent = isPlaying ? 'pause' : 'play_arrow';
    } else {
      card.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      if (icon) icon.textContent = 'play_arrow';
    }
  });
}

// --- Progress Bar Click ---
function initPlayerProgressClick() {
  document.querySelectorAll('.progress-bar').forEach(bar => {
    bar.addEventListener('click', e => {
      if (!audio.duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      audio.currentTime = Math.max(0, Math.min(1, ratio)) * audio.duration;
    });

    // Drag support
    bar.addEventListener('mousedown', () => { isSeeking = true; });
    document.addEventListener('mouseup', () => { isSeeking = false; });
    bar.addEventListener('mousemove', e => {
      if (!isSeeking || !audio.duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      audio.currentTime = Math.max(0, Math.min(1, ratio)) * audio.duration;
    });
  });
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

  // Close on any drawer link click
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => closeMenu(drawer, overlay, btn));
  });
}

function toggleMenu(drawer, overlay, btn) {
  const isOpen = !drawer.classList.contains('translate-x-full');
  if (isOpen) {
    closeMenu(drawer, overlay, btn);
  } else {
    openMenu(drawer, overlay, btn);
  }
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
// CONTACT FORM (Formspree)
// ============================================================

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalHTML = btn.innerHTML;

    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-xl">progress_activity</span> Wird gesendet…';
    btn.disabled = true;

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (res.ok) {
        form.innerHTML = `
          <div class="flex flex-col items-center text-center py-16 gap-4">
            <span class="material-symbols-outlined text-primary text-6xl" style="font-variation-settings:'FILL' 1,'wght' 400">check_circle</span>
            <h3 class="text-2xl font-bold font-headline text-on-surface">Vielen Dank!</h3>
            <p class="text-text-muted max-w-sm leading-relaxed">Deine Nachricht ist angekommen. Ich freue mich darauf, mit dir gemeinsam etwas Schönes zu erschaffen.</p>
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
    err.className = 'form-error text-sm text-accent text-center mt-2';
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
// UTILS
// ============================================================

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function setEl(id, fn) {
  const el = document.getElementById(id);
  if (el) fn(el);
}

// ============================================================
// FLOATING PLAYER — show on first play, collapse toggle
// ============================================================

function initFloatingPlayerToggle() {
  const player = document.getElementById('floating-player');
  if (!player) return;
  // Start hidden; show when first song plays
  player.classList.add('player-hidden');
  audio.addEventListener('play', () => {
    player.classList.remove('player-hidden');
  }, { once: true });
}
