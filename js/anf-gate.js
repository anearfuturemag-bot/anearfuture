/* ═══════════════════════════════════════════════════
   A NEAR FUTURE — Email Gate v1.0
   Soft metered paywall for articles and features.

   How it works:
   - Shows the first ~60% of content free
   - Fades to black, displays email capture form
   - Submits to Netlify Forms (form name: "anf-email-gate")
   - On success: unlocks content, stores in localStorage
   - Skip = session-only unlock (no email collected)
   - Exit intent: pulse + scroll to gate when mouse leaves top

   To view collected emails:
   Netlify dashboard → Forms → anf-email-gate → Download CSV
   Then import CSV into Beehiiv.
══════════════════════════════════════════════════ */

(function () {
  'use strict';

  var STORAGE_KEY = 'anf_access';
  var FORM_NAME   = 'anf-email-gate';

  /* ── Already unlocked? Show everything immediately ── */
  function isUnlocked() {
    try { return localStorage.getItem(STORAGE_KEY) === 'granted'; } catch (e) { return false; }
  }
  function setUnlocked() {
    try { localStorage.setItem(STORAGE_KEY, 'granted'); } catch (e) {}
  }

  if (isUnlocked()) {
    document.documentElement.classList.add('anf-unlocked');
    return;
  }

  /* ── Find body container ── */
  var body = document.querySelector('.article-body') || document.querySelector('.feature-body');
  if (!body) return;

  /* ── Collect gatable children (skip nav) ── */
  var navClasses = ['article-nav', 'feature-nav'];
  var children = Array.from(body.children).filter(function (el) {
    return !navClasses.some(function (c) { return el.classList.contains(c); });
  });

  var gateIndex = Math.max(2, Math.floor(children.length * 0.60));
  var lastFree  = children[gateIndex - 1];
  if (!lastFree) return;

  /* ── Hide everything after the gate point ── */
  for (var i = gateIndex; i < children.length; i++) {
    children[i].classList.add('anf-gated');
  }
  /* Nav stays hidden too (SEO content stays in DOM) */
  var navEl = body.querySelector('.article-nav, .feature-nav');
  if (navEl) navEl.classList.add('anf-gated');

  /* ── Build fade + gate card ── */
  var fade = document.createElement('div');
  fade.className = 'anf-fade';

  var gate = document.createElement('div');
  gate.className = 'anf-gate';
  gate.setAttribute('aria-label', 'Continue reading');
  gate.innerHTML =
    '<div class="anf-gate-inner">' +
      '<p class="anf-gate-eyebrow">A Near Future</p>' +
      '<h2 class="anf-gate-head">Keep reading.</h2>' +
      '<p class="anf-gate-sub">Join A Near Future, free. Be the first to read new features and stories from Detroit\'s next generation.</p>' +
      '<form class="anf-gate-form" id="anf-gate-form" method="POST" action="' + window.location.pathname + '">' +
        '<input type="hidden" name="form-name" value="' + FORM_NAME + '">' +
        '<input type="hidden" name="source" value="' + window.location.pathname + '">' +
        '<input type="text" name="bot-field" style="display:none" tabindex="-1" autocomplete="off">' +
        '<input type="email" class="anf-gate-input" name="email" id="anf-email-input" placeholder="your@email.com" required autocomplete="email">' +
        '<button type="submit" class="anf-gate-btn">Continue &rarr;</button>' +
      '</form>' +
      '<button type="button" class="anf-gate-skip" id="anf-skip">Maybe later</button>' +
      '<p class="anf-gate-success" id="anf-success">You\'re in. Unlocking the rest…</p>' +
    '</div>';

  /* ── Set initial invisible state via inline style (before DOM insertion) ── */
  gate.style.opacity = '0';
  gate.style.transform = 'translateY(28px)';
  gate.style.transition = 'none';

  lastFree.after(fade);
  fade.after(gate);

  /* ── Entrance animation — JS-controlled inline styles (bypasses CSS class issues) ── */
  function showGate() {
    requestAnimationFrame(function () {
      gate.style.transition = 'opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.75s cubic-bezier(0.16,1,0.3,1)';
      gate.style.opacity = '1';
      gate.style.transform = 'translateY(0)';
    });
  }

  if ('IntersectionObserver' in window) {
    var gateObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        gateObserver.disconnect();
        setTimeout(showGate, 120);
      }
    }, { threshold: 0.05 });
    gateObserver.observe(gate);
  } else {
    showGate(); /* fallback for older browsers */
  }

  /* ── Exit intent ── */
  var exitFired = false;
  document.addEventListener('mouseleave', function (e) {
    if (e.clientY < 50 && !exitFired && !document.documentElement.classList.contains('anf-unlocked')) {
      exitFired = true;
      /* Pulse via inline animation */
      gate.style.animation = 'anf-gate-pulse 0.45s cubic-bezier(0.16,1,0.3,1)';
      setTimeout(function () { gate.style.animation = ''; }, 500);
      var rect = gate.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) {
        gate.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(function () {
        var inp = document.getElementById('anf-email-input');
        if (inp) inp.focus();
      }, 800);
    }
  });

  /* ── Form submit ── */
  document.getElementById('anf-gate-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var emailInput = document.getElementById('anf-email-input');
    var email = emailInput ? emailInput.value.trim() : '';
    if (!email) return;

    /* Optimistic UI — show success immediately */
    var formEl = document.getElementById('anf-gate-form');
    if (formEl) { formEl.style.opacity = '0.35'; formEl.style.pointerEvents = 'none'; }
    var skipEl = document.getElementById('anf-skip');
    if (skipEl) skipEl.style.display = 'none';
    var successEl = document.getElementById('anf-success');
    if (successEl) successEl.style.display = 'block';

    /* Submit to Netlify Forms */
    var params = new URLSearchParams({
      'form-name': FORM_NAME,
      email: email,
      source: window.location.pathname,
      date: new Date().toISOString().split('T')[0]
    });

    fetch(window.location.pathname, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    }).catch(function () {
      /* Silent fail — unlock proceeds regardless */
    });

    setTimeout(function () { unlock(true); }, 900);
  });

  /* ── Maybe later ── */
  document.getElementById('anf-skip').addEventListener('click', function () {
    try { sessionStorage.setItem('anf_skipped', '1'); } catch (e) {}
    unlock(false);
  });

  /* ── Unlock content ── */
  function unlock(permanent) {
    document.documentElement.classList.add('anf-unlocked');
    if (permanent) setUnlocked();

    /* Hide gate + fade via inline style (reliable across all browsers) */
    gate.style.display = 'none';
    fade.style.display = 'none';

    var gated = document.querySelectorAll('.anf-gated');
    gated.forEach(function (el) {
      el.style.opacity = '0';
      el.style.display = 'block';
    });

    /* Double rAF so display:block is painted before transition fires */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        gated.forEach(function (el) {
          el.style.transition = 'opacity 0.9s cubic-bezier(0.16,1,0.3,1)';
          el.style.opacity = '1';
        });
      });
    });

    if (permanent) {
      setTimeout(function () {
        var first = document.querySelector('.anf-gated');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 600);
    }
  }

})();
