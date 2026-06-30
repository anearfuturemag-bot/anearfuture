/* ═══════════════════════════════════════════
   A NEAR FUTURE — main.js v1.0
════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── HAMBURGER NAV ──────────────────────
  const hamburger = document.querySelector('.nav-hamburger');
  const drawer    = document.querySelector('.nav-drawer');
  const body      = document.body;

  if (hamburger && drawer) {
    hamburger.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close drawer when a link is tapped
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        drawer.classList.remove('open');
        hamburger.classList.remove('open');
        body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (drawer.classList.contains('open') &&
          !drawer.contains(e.target) &&
          !hamburger.contains(e.target)) {
        drawer.classList.remove('open');
        hamburger.classList.remove('open');
        body.style.overflow = '';
      }
    });
  }

  // ── ACTIVE NAV LINK ─────────────────────
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-drawer a').forEach(a => {
    const href = (a.getAttribute('href') || '').split('/').pop();
    if (href === currentFile || (currentFile === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // ── TICKER DUPLICATE (seamless loop) ────
  document.querySelectorAll('.ticker-track').forEach(track => {
    // Only duplicate once
    if (!track.dataset.duped) {
      track.innerHTML += track.innerHTML;
      track.dataset.duped = '1';
    }
  });

  // ── INTERSECTION OBSERVER — appear anim ─
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('appeared');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.06,
    rootMargin: '0px 0px -32px 0px'
  });

  document.querySelectorAll('.will-appear').forEach(el => observer.observe(el));

  // ── CATEGORY FILTER TABS ─────────────────
  document.querySelectorAll('.cat-tabs').forEach(tabsEl => {
    tabsEl.querySelectorAll('.cat-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active state
        tabsEl.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const cat = btn.dataset.cat;
        // Find the associated grid/list container
        const container = tabsEl.nextElementSibling;
        if (!container) return;

        container.querySelectorAll('[data-cat]').forEach(item => {
          if (cat === 'all' || item.dataset.cat === cat) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  });

  // ── SMOOTH SCROLL FOR ANCHOR LINKS ───────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;
        const top  = target.getBoundingClientRect().top + window.scrollY - navH - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ── CONTACT FORM ──────────────────────────
  const form = document.querySelector('.nominate-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('.form-btn');
      btn.textContent = 'Submitted — Thank You';
      btn.disabled = true;
      btn.style.opacity = '0.55';
      // In production, replace with fetch() to your form endpoint
    });
  }

});
