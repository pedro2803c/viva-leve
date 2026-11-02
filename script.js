(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Reveal on scroll ---------- */

  function setupReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    // Stagger siblings that share a parent so groups cascade in
    var groups = new Map();
    items.forEach(function (el) {
      var list = groups.get(el.parentElement) || [];
      el.style.transitionDelay = Math.min(list.length * 90, 360) + 'ms';
      list.push(el);
      groups.set(el.parentElement, list);
    });

    // Hero is visible immediately after setup
    var hero = document.querySelector('.hero__section');
    if (hero) {
      setTimeout(function () {
        hero.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-visible'); });
      }, 60);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });

    items.forEach(function (el) {
      if (hero && hero.contains(el)) return;
      observer.observe(el);
    });
  }

  /* ---------- Draggable carousels ---------- */

  function setupCarousel(root) {
    var track = root.querySelector('.carousel__track');
    if (!track) return;

    var mode = root.getAttribute('data-mode'); // "bounce" | "forward"
    var sideBtn = root.querySelector('[data-carousel-side]');
    var headBtn = document.querySelector('[data-carousel-next="' + root.getAttribute('data-carousel') + '"]');
    var buttons = [sideBtn, headBtn].filter(Boolean);

    var startX = 0;
    var startScroll = 0;
    var dragging = false;
    var moved = false;

    function step() {
      var card = track.firstElementChild;
      if (!card) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return card.getBoundingClientRect().width + gap;
    }

    function atEnd() { return track.scrollLeft + track.clientWidth >= track.scrollWidth - 4; }
    function atStart() { return track.scrollLeft <= 4; }

    function update() {
      var end = atEnd();
      root.classList.toggle('is-end', end);

      if (mode === 'bounce') {
        if (end) root.classList.add('is-back');
        else if (atStart()) root.classList.remove('is-back');
        var back = root.classList.contains('is-back');
        buttons.forEach(function (b) {
          b.classList.toggle('is-back', back);
          b.setAttribute('aria-label', back ? 'Voltar conteúdos' : 'Avançar conteúdos');
        });
      } else {
        buttons.forEach(function (b) { b.disabled = end; });
      }
    }

    function go() {
      var dir = mode === 'bounce' && root.classList.contains('is-back') ? -1 : 1;
      track.scrollBy({ left: step() * dir, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    buttons.forEach(function (b) { b.addEventListener('click', go); });

    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.classList.add('is-dragging');
      try { track.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    });

    track.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startScroll - dx;
    });

    function stop() {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
    }
    track.addEventListener('pointerup', stop);
    track.addEventListener('pointercancel', stop);
    track.addEventListener('lostpointercapture', stop);

    // Swallow the click that ends a drag so links/cards don't fire
    track.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });

    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    }, { passive: true });
    window.addEventListener('resize', update);

    update();
  }

  /* ---------- FAQ: one open at a time ---------- */

  function setupFaq() {
    var items = document.querySelectorAll('.faq__item');
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        items.forEach(function (other) { if (other !== item) other.open = false; });
      });
    });
  }

  function init() {
    setupReveal();
    document.querySelectorAll('[data-carousel]').forEach(setupCarousel);
    setupFaq();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
