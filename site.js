/* ==========================================================================
   LiteCone — shared site behaviour
   Theme toggle · accessible nav dropdowns · lead-capture modals + sender.
   Kept in one external file so the pages can run under a strict CSP that
   forbids inline script (the only inline block is the theme boot, which is
   allow-listed by hash in amplify.yml).
   ========================================================================== */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── theme toggle ──────────────────────────────────────────────────── */
  (function () {
    var KEY = 'lc-theme';
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    function current() {
      var set = document.documentElement.getAttribute('data-theme');
      if (set) return set;
      return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    function label() {
      var next = current() === 'dark' ? 'light' : 'dark';
      btn.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    }
    label();
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (_) {}
      label();
    });
  })();

  /* ── nav dropdowns: hover on pointer devices, click + keyboard always ── */
  document.querySelectorAll('.dd').forEach(function (dd) {
    var trigger = dd.querySelector('a');
    var menu = dd.querySelector('.ddm');
    if (!trigger || !menu) return;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'true');
    function set(open) {
      dd.classList.toggle('open', open);
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    trigger.addEventListener('click', function (e) {
      if (dd.classList.contains('open')) return;   /* second click follows the link */
      e.preventDefault();
      set(true);
    });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
      dd.addEventListener('mouseenter', function () { set(true); });
      dd.addEventListener('mouseleave', function () { set(false); });
    }
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { set(false); });
    });
  });

  /* ── lead modals + delivery ────────────────────────────────────────── */
  (function () {
    var openOv = null;
    var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
                    'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

    /* delivery paths — keep identical to litecone.ai (see LEADS-SETUP.md) */
    var LEAD_ENDPOINT   = 'https://formsubmit.co/ajax/team.marketing@lumiq.ai';
    var SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyguR9DAle1KsnJVEg2_yrGlvlJkMwELrsYya8Ac-IINSf54j4lVwtUvjZD-Iu-W5gcgg/exec';

    function openModal(id, trigger) {
      var ov = document.getElementById(id);
      if (!ov) return false;
      ov.__trigger = trigger || null;
      ov.classList.add('open');
      ov.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      openOv = ov;
      var stamp = ov.querySelector('input[name="_ts"]');
      if (stamp) stamp.value = String(Date.now());
      /* one form serves every CTA, so record which button opened it —
         the lead row still shows 'Request a demo' vs 'Book a briefing' */
      var cta = ov.querySelector('input[name="cta"]');
      if (cta) cta.value = (trigger && trigger.textContent || '').trim().slice(0, 60);
      var f = ov.querySelector('.control');
      if (f) setTimeout(function () {
        try { f.focus({ preventScroll: true }); } catch (_) { f.focus(); }
      }, reduce ? 0 : 80);
      return true;
    }

    function closeModal(ov) {
      if (!ov) return;
      ov.classList.remove('open');
      ov.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (openOv === ov) openOv = null;
      var form = ov.querySelector('form'), done = ov.querySelector('.done');
      setTimeout(function () {
        if (form) {
          form.reset();
          form.style.display = '';
          form.querySelectorAll('.field.err').forEach(function (x) { x.classList.remove('err'); });
          form.querySelectorAll('[aria-invalid]').forEach(function (x) { x.removeAttribute('aria-invalid'); });
        }
        if (done) done.classList.remove('show');
      }, reduce ? 0 : 260);
      if (ov.__trigger && ov.__trigger.focus) ov.__trigger.focus();
    }

    function trap(ov, e) {
      if (e.key !== 'Tab') return;
      var nodes = Array.prototype.filter.call(ov.querySelectorAll(FOCUSABLE), function (el) {
        return el.offsetParent !== null;
      });
      if (!nodes.length) return;
      var first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    /* lead forms take official work addresses only, never personal mailboxes */
    var FREE_MAIL_EXACT = ['gmail.com','googlemail.com','aol.com','icloud.com','me.com','mac.com',
      'mail.com','mail.ru','msn.com','proton.me','protonmail.com','pm.me','zoho.com','qq.com',
      '163.com','126.com','naver.com','daum.net','sina.com','rediffmail.com','rediff.com','inbox.com',
      'fastmail.com','tutanota.com','hushmail.com','ymail.com','rocketmail.com','comcast.net',
      'verizon.net','sbcglobal.net','att.net','cox.net','bellsouth.net','earthlink.net',
      'btinternet.com','bigpond.com','web.de','t-online.de','libero.it','wanadoo.fr','laposte.net',
      'orange.fr','free.fr','sky.com','virginmedia.com'];
    var FREE_MAIL_ANY_TLD = ['yahoo','hotmail','outlook','live','gmx','yandex'];
    function workEmail(v) {
      var d = (v.split('@')[1] || '').toLowerCase().replace(/\.$/, '');
      if (!d) return false;
      if (FREE_MAIL_EXACT.indexOf(d) !== -1) return false;
      return FREE_MAIL_ANY_TLD.indexOf(d.split('.')[0]) === -1;
    }
    function validPhone(v) {
      var digits = (v || '').replace(/[^0-9]/g, '');
      return digits.length >= 7 && digits.length <= 15;
    }

    document.querySelectorAll('[data-modal]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('data-modal');
        if (document.getElementById(id)) { e.preventDefault(); openModal(id, a); }
      });
    });

    /* deep links from other pages: contact.html#open-briefing etc. */
    var hm = location.hash.match(/^#open-(briefing|demo|contact)$/);
    if (hm) {
      openModal('m-' + hm[1], null);
      try { history.replaceState(null, '', location.pathname + location.search); } catch (_) {}
    }

    document.querySelectorAll('.ov').forEach(function (ov) {
      ov.querySelectorAll('[data-close]').forEach(function (b) {
        b.addEventListener('click', function () { closeModal(ov); });
      });
      ov.addEventListener('click', function (e) { if (e.target === ov) closeModal(ov); });
      ov.addEventListener('keydown', function (e) { trap(ov, e); });
      wireForm(ov, ov.querySelector('form'), ov.querySelector('.done'));
    });

    /* the page-level contact form uses the same validation and sender */
    document.querySelectorAll('form[data-form]:not(.ov form)').forEach(function (form) {
      wireForm(null, form, form.parentNode.querySelector('.done'));
    });

    function wireForm(ov, form, done) {
      if (!form) return;
      form.setAttribute('novalidate', 'novalidate');
      form.querySelectorAll('.field').forEach(function (fl, ix) {
        var m = fl.querySelector('.msg'), c = fl.querySelector('.control');
        if (m && c) {
          m.id = m.id || form.getAttribute('data-form') + '-msg-' + ix;
          c.setAttribute('aria-describedby', m.id);
        }
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        form.querySelectorAll('.field.err').forEach(function (f) { f.classList.remove('err'); });
        form.querySelectorAll('[aria-invalid]').forEach(function (x) { x.removeAttribute('aria-invalid'); });

        form.querySelectorAll('[required]').forEach(function (el) {
          var w = el.closest('.field');
          if (!w) return;
          var note = w.querySelector('.msg');
          var val = (el.value || '').trim();
          var empty = val === '';
          var bad = false;
          if (!empty && el.type === 'email') {
            if (!validEmail(val)) { bad = true; if (note) note.textContent = 'Enter a valid email address.'; }
            else if (!workEmail(val)) {
              bad = true;
              if (note) note.textContent = 'Use your official work email, not a personal one.';
            }
          }
          if (!empty && el.type === 'tel' && !validPhone(val)) {
            bad = true;
            if (note) note.textContent = 'Enter a valid mobile number with country code.';
          }
          if (empty && note && !note.textContent) note.textContent = 'This field is required.';
          if (empty || bad) { ok = false; w.classList.add('err'); el.setAttribute('aria-invalid', 'true'); }
        });

        if (!ok) {
          var fe = form.querySelector('.field.err .control');
          if (fe) fe.focus();
          return;
        }

        /* ── spam gates: honeypot must stay empty, and a real person takes
              more than three seconds to fill the form in ── */
        var hp = form.querySelector('input[name="_hp"]');
        var ts = form.querySelector('input[name="_ts"]');
        var tooFast = ts && ts.value && (Date.now() - Number(ts.value)) < 3000;
        if ((hp && hp.value) || tooFast) {
          form.style.display = 'none';
          if (done) done.classList.add('show');   /* silent drop */
          return;
        }

        var data = {};
        new FormData(form).forEach(function (v, k) {
          if (k === '_hp' || k === '_ts') return;
          data[k] = (k in data) ? [].concat(data[k], v) : v;
        });
        if (Array.isArray(data.coworkers)) data.coworkers = data.coworkers.join(', ');
        data.form_type = form.getAttribute('data-form');
        data.page = location.pathname.split('/').pop() || 'index.html';

        var btn = form.querySelector('button[type="submit"]');
        var sendErr = form.querySelector('.send-err');
        if (sendErr) sendErr.style.display = 'none';
        var orig = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = 'Sending&hellip;';

        var req;
        if (SHEETS_ENDPOINT) {
          /* Apps Script: plain-text body avoids a CORS preflight it cannot answer */
          req = fetch(SHEETS_ENDPOINT, { method: 'POST', body: JSON.stringify(data) });
        } else {
          data._subject = 'LiteCone lead · ' + data.form_type +
                          (data.name ? ' · ' + data.name : '') +
                          (data.company ? ' — ' + data.company : '');
          data._template = 'table';
          data._captcha = 'false';
          if (data.email) data._replyto = data.email;
          req = fetch(LEAD_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data)
          });
        }

        req.then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) {
            if (!r.ok || String(j.success) === 'false') throw new Error('send failed');
            btn.disabled = false;
            btn.innerHTML = orig;
            form.style.display = 'none';
            if (done) done.classList.add('show');
          });
        }).catch(function () {
          btn.disabled = false;
          btn.innerHTML = orig;
          if (sendErr) sendErr.style.display = 'block';
        });
      });

      form.addEventListener('input', function (e) {
        var w = e.target.closest && e.target.closest('.field');
        if (w) w.classList.remove('err');
        if (e.target && e.target.removeAttribute) e.target.removeAttribute('aria-invalid');
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && openOv) closeModal(openOv);
    });
  })();

  /* ── mobile menu ───────────────────────────────────────────────────
     Below 960px the link row becomes a full-screen panel. Ported from
     litecone.ai and adapted to this build's .dd dropdowns.            */
  (function () {
    var b = document.getElementById('navBurger');
    var nav = document.getElementById('primaryNav');
    if (!b || !nav) return;
    var hdr = document.querySelector('.nav');

    function set(open) {
      document.body.classList.toggle('menu-open', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
      if (open && hdr) {
        document.documentElement.style.setProperty('--hdr-h', hdr.offsetHeight + 'px');
      }
      if (!open) {
        nav.querySelectorAll('.dd.open').forEach(function (d) {
          d.classList.remove('open');
          var t = d.querySelector('a');
          if (t) t.setAttribute('aria-expanded', 'false');
        });
      }
    }

    b.addEventListener('click', function (e) {
      e.stopPropagation();
      set(!document.body.classList.contains('menu-open'));
    });

    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        /* a dropdown trigger expands in place — only real links close the menu */
        if (a.parentElement && a.parentElement.classList.contains('dd')) return;
        set(false);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) set(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960 && document.body.classList.contains('menu-open')) set(false);
    });
  })();

  /* ── harden every off-site link against reverse tabnabbing ─────────── */
  document.querySelectorAll('a[target="_blank"], a[href^="http"]').forEach(function (a) {
    if (a.host && a.host !== location.host) a.setAttribute('rel', 'noopener noreferrer');
  });
})();
