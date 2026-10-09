(function () {
  'use strict';

  // Year
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // Mobile menu
  var toggle = document.querySelector('.menu-toggle');
  var mnav = document.getElementById('mobile-nav');
  if (toggle && mnav) {
    toggle.addEventListener('click', function () {
      var open = mnav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mnav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { mnav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  // "Schedule X →" links preselect the service in the full form
  document.querySelectorAll('[data-service]').forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = document.getElementById('f-service');
      if (sel) sel.value = a.getAttribute('data-service');
    });
  });

  // Gallery (only shows when photos exist)
  var g = window.GALLERY || [];
  var gal = document.getElementById('gallery');
  if (gal && g.length) {
    g.forEach(function (p) {
      var fig = document.createElement('figure');
      var img = document.createElement('img');
      img.src = p.src; img.alt = p.alt || ''; img.loading = 'lazy';
      fig.appendChild(img);
      if (p.caption) { var c = document.createElement('figcaption'); c.textContent = p.caption; fig.appendChild(c); }
      gal.appendChild(fig);
    });
    document.getElementById('work').hidden = false;
  }

  // Reveal on scroll
  var els = document.querySelectorAll('.svc, .pillar, .review, .steps li, .stat, .faq details');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }

  // Lead forms
  document.querySelectorAll('.lead-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      var btn = form.querySelector('button[type=submit]');
      form.querySelectorAll('.err').forEach(function (n) { n.remove(); });
      form.querySelectorAll('.invalid').forEach(function (n) { n.classList.remove('invalid'); });
      status.className = 'form-status'; status.textContent = '';

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });

      // Client-side checks (server re-validates)
      var errs = {};
      if (!data.name || data.name.trim().length < 2) errs.name = 'Please enter your name.';
      if (!data.phone || data.phone.replace(/\D/g, '').length < 10) errs.phone = 'Please enter a phone number we can call back.';
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'That email doesn’t look right.';
      if (showErrors(form, errs)) return;

      btn.disabled = true;
      var label = btn.querySelector('span'); var orig = label.textContent; label.textContent = 'Sending…';

      fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok && res.j.ok) {
            form.reset();
            status.className = 'form-status ok';
            status.innerHTML = res.j.emergency
              ? '✅ Got it. For emergencies, please <strong>also call <a href="tel:+12077672614">(207) 767-2614</a></strong> so we can get moving right away.'
              : '✅ Thanks! Your request is in. We’ll call you back shortly.';
          } else {
            if (res.j.errors) showErrors(form, res.j.errors);
            status.className = 'form-status bad';
            status.innerHTML = res.j.error || 'Please fix the highlighted fields, or call <a href="tel:+12077672614">(207) 767-2614</a>.';
          }
        })
        .catch(function () {
          status.className = 'form-status bad';
          status.innerHTML = 'Couldn’t send right now. Please call <a href="tel:+12077672614">(207) 767-2614</a>.';
        })
        .finally(function () { btn.disabled = false; label.textContent = orig; });
    });
  });

  function showErrors(form, errs) {
    var keys = Object.keys(errs);
    keys.forEach(function (k) {
      var input = form.querySelector('[name="' + k + '"]');
      if (!input) return;
      input.classList.add('invalid');
      var m = document.createElement('span'); m.className = 'err'; m.textContent = errs[k];
      input.insertAdjacentElement('afterend', m);
    });
    if (keys.length) { var first = form.querySelector('.invalid'); if (first) first.focus(); }
    return keys.length > 0;
  }
})();
