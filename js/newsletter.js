/* ═══════════════════════════════════════════════════
   A NEAR FUTURE — Newsletter Signup Card
   Self-contained: injects CSS + HTML if not present.
   Any page only needs: <script src="…/js/newsletter.js" defer></script>
   Shows after 5s OR 25% scroll, submits to Netlify Forms.
══════════════════════════════════════════════════ */

(function () {
  'use strict';

  var STORE_KEY = 'anf_newsletter';

  /* ── Already dismissed or subscribed? Bail early ── */
  try { if (localStorage.getItem(STORE_KEY)) return; } catch (e) {}

  /* ── Derive base path from script src ── */
  var basePath = (function () {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('newsletter.js') > -1) {
        return scripts[i].src.replace(/js\/newsletter\.js[^]*$/, '');
      }
    }
    // fallback: guess from pathname depth
    var depth = (window.location.pathname.match(/\//g) || []).length;
    return depth > 1 ? '../' : './';
  })();

  /* ── Inject CSS if not already linked ── */
  if (!document.querySelector('link[href*="newsletter.css"]')) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = basePath + 'css/newsletter.css';
    document.head.appendChild(link);
  }

  /* ── Inject card HTML if not already in DOM ── */
  if (!document.getElementById('anf-news-card')) {
    var wrapper = document.createElement('div');
    wrapper.innerHTML =
      '<div class="anf-news-card" id="anf-news-card">' +
        '<button class="anf-news-close" id="anf-news-close" aria-label="Close">&times;</button>' +
        '<p class="anf-news-eyebrow">A Near Future</p>' +
        '<h2 class="anf-news-head">Join the list.</h2>' +
        '<p class="anf-news-sub">Monthly drops on the young builders, creatives, and founders shaping what\'s next. Free, no spam.</p>' +
        '<form class="anf-news-form" id="anf-news-form" name="newsletter-signup" method="POST" data-netlify="true" netlify-honeypot="bot-field">' +
          '<input type="hidden" name="form-name" value="newsletter-signup">' +
          '<input type="hidden" name="bot-field">' +
          '<input type="email" class="anf-news-input" id="anf-news-email" name="email" placeholder="your@email.com" required autocomplete="email">' +
          '<button type="submit" class="anf-news-btn">Join &rarr;</button>' +
        '</form>' +
        '<p class="anf-news-error" id="anf-news-error"></p>' +
        '<p class="anf-news-success" id="anf-news-success">You\'re in. Check your inbox.</p>' +
      '</div>';
    document.body.appendChild(wrapper.firstChild);
  }

  var card      = document.getElementById('anf-news-card');
  var closeBtn  = document.getElementById('anf-news-close');
  var form      = document.getElementById('anf-news-form');
  var emailInp  = document.getElementById('anf-news-email');
  var successEl = document.getElementById('anf-news-success');
  var errorEl   = document.getElementById('anf-news-error');

  if (!card) return;

  var shown = false;

  function showCard() {
    if (shown) return;
    shown = true;
    requestAnimationFrame(function () {
      card.classList.add('visible');
    });
  }

  function hideCard(permanent) {
    card.classList.remove('visible');
    if (permanent) {
      try { localStorage.setItem(STORE_KEY, '1'); } catch (e) {}
    }
  }

  /* ── Triggers: 5s timer, 25% scroll, exit intent ── */
  setTimeout(showCard, 5000);

  window.addEventListener('scroll', function () {
    var pct = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
    if (pct > 0.25) showCard();
  }, { passive: true });

  document.addEventListener('mouseleave', function (e) {
    if (e.clientY < 10) {
      showCard();
      card.classList.add('pulse');
      setTimeout(function () { card.classList.remove('pulse'); }, 450);
    }
  });

  /* ── Close ── */
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      hideCard(true);
    });
  }

  /* ── Form submission → Netlify Forms ── */
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = emailInp ? emailInp.value.trim() : '';
      if (!email) return;

      var btn = form.querySelector('.anf-news-btn');
      if (btn) { btn.disabled = true; btn.textContent = '…'; }
      if (errorEl) errorEl.style.display = 'none';

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form-name': 'newsletter-signup',
          email: email
        }).toString()
      })
        .then(function (res) {
          if (!res.ok) throw new Error('non-200');
          form.style.display = 'none';
          if (errorEl) errorEl.style.display = 'none';
          if (successEl) successEl.style.display = 'block';
          try { localStorage.setItem(STORE_KEY, 'subscribed'); } catch (e) {}
          setTimeout(function () { hideCard(false); }, 3200);
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = 'Join →'; }
          if (errorEl) {
            errorEl.textContent = 'Something went wrong — try again.';
            errorEl.style.display = 'block';
          }
        });
    });
  }

})();
