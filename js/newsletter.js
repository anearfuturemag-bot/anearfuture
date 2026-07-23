/* ═══════════════════════════════════════════════════
   A NEAR FUTURE — Newsletter Signup Card
   Shows after 5s or 50% scroll, submits to Netlify Forms,
   stores dismissal in localStorage.
══════════════════════════════════════════════════ */

(function () {
  'use strict';

  var STORE_KEY = 'anf_newsletter';
  var card      = document.getElementById('anf-news-card');
  var closeBtn  = document.getElementById('anf-news-close');
  var form      = document.getElementById('anf-news-form');
  var emailInp  = document.getElementById('anf-news-email');
  var successEl = document.getElementById('anf-news-success');
  var errorEl   = document.getElementById('anf-news-error');

  if (!card) return;

  /* ── Already dismissed or subscribed? Skip ── */
  try { if (localStorage.getItem(STORE_KEY)) return; } catch (e) {}

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

  /* ── Triggers ── */
  setTimeout(showCard, 5000);

  window.addEventListener('scroll', function () {
    var pct = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
    if (pct > 0.5) showCard();
  }, { passive: true });

  document.addEventListener('mouseleave', function (e) {
    if (e.clientY < 10) {
      showCard();
      card.classList.add('pulse');
      setTimeout(function () { card.classList.remove('pulse'); }, 450);
    }
  });

  /* ── Close button ── */
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      hideCard(true);
    });
  }

  /* ── Form submission ── */
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
