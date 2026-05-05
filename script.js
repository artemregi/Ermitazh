'use strict';

/* ============================================================
   HERMITAGE Beauty Salon — script.js
   Modules: Header scroll | Burger menu | Accordion | Fade-in | Lazy video | Smooth scroll
   ============================================================ */

// ================================
// CONFIG
// ================================
const SEL = {
  header:           '#header',
  burger:           '#burger',
  nav:              '#nav',
  accordionTrigger: '.accordion__trigger',
  fadeTarget:       '.fade-in',
};

const CLS = {
  headerScrolled: 'header--scrolled',
  burgerActive:   'is-active',
  navOpen:        'is-open',
  panelOpen:      'is-open',
  visible:        'is-visible',
};

// ================================
// HEADER — scroll state
// ================================
function initHeader() {
  const header = document.querySelector(SEL.header);
  if (!header) return;

  const toggle = () => {
    header.classList.toggle(CLS.headerScrolled, window.scrollY > 40);
  };

  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
}

// ================================
// BURGER MENU
// ================================
function initBurger() {
  const burger = document.querySelector(SEL.burger);
  const nav    = document.querySelector(SEL.nav);
  if (!burger || !nav) return;

  function close() {
    nav.classList.remove(CLS.navOpen);
    burger.classList.remove(CLS.burgerActive);
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', () => {
    const willOpen = !nav.classList.contains(CLS.navOpen);
    willOpen ? open() : close();
  });

  function open() {
    nav.classList.add(CLS.navOpen);
    burger.classList.add(CLS.burgerActive);
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  // Close on nav link click
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!burger.contains(e.target) && !nav.contains(e.target)) close();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

// ================================
// ACCORDION
// ================================
function initAccordion() {
  const triggers = document.querySelectorAll(SEL.accordionTrigger);
  if (!triggers.length) return;

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const isOpen  = trigger.getAttribute('aria-expanded') === 'true';
      const panel   = trigger.nextElementSibling;

      // Collapse all
      triggers.forEach(t => {
        t.setAttribute('aria-expanded', 'false');
        const p = t.nextElementSibling;
        if (p) p.classList.remove(CLS.panelOpen);
      });

      // Toggle clicked
      if (!isOpen) {
        trigger.setAttribute('aria-expanded', 'true');
        if (panel) panel.classList.add(CLS.panelOpen);
      }
    });
  });
}

// ================================
// SCROLL ANIMATIONS
// ================================
function initScrollAnimations() {
  const items = document.querySelectorAll(SEL.fadeTarget);
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(CLS.visible);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  items.forEach(el => observer.observe(el));
}

// ================================
// AUTOPLAY VIDEOS — play/pause on viewport
// ================================
function initAutoplayVideos() {
  // Service videos: autoplay muted loop — pause when offscreen to save battery
  const autoVideos = document.querySelectorAll('.service-block__video[autoplay]');
  if (!autoVideos.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.play().catch(() => {});
        } else {
          entry.target.pause();
        }
      });
    },
    { threshold: 0.2 }
  );

  autoVideos.forEach(v => observer.observe(v));
}

// ================================
// LAZY VIDEO — load metadata on approach (review video)
// ================================
function initLazyVideos() {
  const videos = document.querySelectorAll('video[preload="none"]');
  if (!videos.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.preload = 'metadata';
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '300px' }
  );

  videos.forEach(v => observer.observe(v));
}

// ================================
// SMOOTH SCROLL — offset for fixed header
// ================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;

      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();

      const headerH = document.querySelector(SEL.header)?.offsetHeight ?? 72;
      const top     = target.getBoundingClientRect().top + window.scrollY - headerH;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// ================================
// PREPARE FADE-IN ELEMENTS
// ================================
function prepareFadeElements() {
  const targets = [
    '.about__content',
    '.about__stats',
    '.services__card',
    '.service-block__content',
    '.service-block__media',
    '.hit-badge',
    '.laser-combos__item',
    '.reviews__video-wrap',
    '.reviews__caption',
    '.certificates__card',
    '.accordion__item',
    '.contacts__info',
    '.contacts__map',
    '.prices__footer',
  ];

  targets.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.add('fade-in');
    });
  });
}

// ================================
// CAROUSEL
// ================================
function initCarousel() {
  const track     = document.getElementById('carouselTrack');
  const viewport  = document.getElementById('carouselViewport');
  const dotsWrap  = document.getElementById('carouselDots');
  const btnPrev   = document.getElementById('carouselPrev');
  const btnNext   = document.getElementById('carouselNext');
  if (!track || !dotsWrap || !btnPrev || !btnNext) return;

  const slides     = Array.from(track.children);
  const total      = slides.length;
  let current      = 0;
  let autoTimer    = null;
  let isDragging   = false;
  let dragStartX   = 0;
  let dragDeltaX   = 0;

  // Count visible slides based on viewport width
  function visibleCount() {
    const w = window.innerWidth;
    if (w >= 1024) return 3;
    if (w >= 768)  return 2;
    return 1;
  }

  // Maximum index so last group is full
  function maxIndex() {
    return Math.max(0, total - visibleCount());
  }

  // Build dots
  function buildDots() {
    dotsWrap.innerHTML = '';
    const count = maxIndex() + 1;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel__dot' + (i === current ? ' is-active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Отзыв ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    }
  }

  function updateDots() {
    Array.from(dotsWrap.children).forEach((d, i) =>
      d.classList.toggle('is-active', i === current)
    );
  }

  function updateButtons() {
    btnPrev.disabled = current === 0;
    btnNext.disabled = current >= maxIndex();
  }

  function getSlideWidth() {
    return slides[0].getBoundingClientRect().width + parseInt(getComputedStyle(track).gap || '0');
  }

  function goTo(index) {
    current = Math.max(0, Math.min(index, maxIndex()));
    track.style.transform = `translateX(-${current * getSlideWidth()}px)`;
    updateDots();
    updateButtons();
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(() => {
      goTo(current >= maxIndex() ? 0 : current + 1);
    }, 5000);
  }

  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  // Buttons
  btnPrev.addEventListener('click', () => { goTo(current - 1); stopAuto(); });
  btnNext.addEventListener('click', () => { goTo(current + 1); stopAuto(); });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { goTo(current - 1); stopAuto(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); stopAuto(); }
  });

  // Drag / swipe
  function onDragStart(x) {
    isDragging = true;
    dragStartX = x;
    dragDeltaX = 0;
    track.style.transition = 'none';
  }

  function onDragMove(x) {
    if (!isDragging) return;
    dragDeltaX = x - dragStartX;
    track.style.transform = `translateX(${-current * getSlideWidth() + dragDeltaX}px)`;
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    track.style.transition = '';
    if (Math.abs(dragDeltaX) > 50) {
      dragDeltaX < 0 ? goTo(current + 1) : goTo(current - 1);
    } else {
      goTo(current);
    }
    stopAuto();
  }

  track.addEventListener('mousedown',  (e) => onDragStart(e.clientX));
  track.addEventListener('mousemove',  (e) => onDragMove(e.clientX));
  track.addEventListener('mouseup',    onDragEnd);
  track.addEventListener('mouseleave', onDragEnd);

  track.addEventListener('touchstart', (e) => onDragStart(e.touches[0].clientX), { passive: true });
  track.addEventListener('touchmove',  (e) => onDragMove(e.touches[0].clientX),  { passive: true });
  track.addEventListener('touchend',   onDragEnd);

  // Pause on hover
  viewport.addEventListener('mouseenter', stopAuto);
  viewport.addEventListener('mouseleave', startAuto);

  // Resize — recalculate
  window.addEventListener('resize', () => {
    buildDots();
    goTo(Math.min(current, maxIndex()));
  });

  // Init
  buildDots();
  updateButtons();
  startAuto();
}

// ================================
// INIT
// ================================
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initBurger();
  initAccordion();
  prepareFadeElements();
  initScrollAnimations();
  initAutoplayVideos();
  initLazyVideos();
  initSmoothScroll();
  initCarousel();
});
