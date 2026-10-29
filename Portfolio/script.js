'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* -- Footer year ------------------------------------------- */
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -- Active nav on scroll ---------------------------------- */
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
  if (navAnchors.length) {
    const sectionEls = Array.from(navAnchors)
      .map(a => document.getElementById(a.getAttribute('href').slice(1)))
      .filter(Boolean);

    const activeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navAnchors.forEach(a => a.classList.remove('nav-active'));
          const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
          if (active) active.classList.add('nav-active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sectionEls.forEach(el => activeObserver.observe(el));
  }

  /* -- Mobile Menu ------------------------------------------- */
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!expanded));
      hamburger.classList.toggle('toggle');
      navLinks.classList.toggle('active');
    });

    navLinks.addEventListener('click', e => {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('active');
        hamburger.classList.remove('toggle');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* -- Stats Counter Animation ------------------------------- */
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  if (statNumbers.length) {
    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target, 10);
          const duration = 1200;
          const step = Math.ceil(target / (duration / 16));
          let current = 0;
          const tick = () => {
            current = Math.min(current + step, target);
            el.textContent = current;
            if (current < target) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    statNumbers.forEach(el => counterObserver.observe(el));
  }

  /* -- Scroll Reveal ----------------------------------------- */
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  document.querySelectorAll('section, .projects-page, .stats-bar').forEach(el => {
    el.classList.add('hidden');
    revealObserver.observe(el);
  });

  /* -- Staggered Project Cards ------------------------------- */
  const cards = document.querySelectorAll('.project-card');
  if (cards.length) {
    const cardObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    cards.forEach(card => {
      card.classList.add('hidden');
      cardObserver.observe(card);
    });
  }

  /* -- Experience / Education Tab Switching ------------------ */
  const tabBtns = document.querySelectorAll('.tab-btn');
  if (tabBtns.length) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => {
          b.classList.remove('tab-active');
          b.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-panel').forEach(p => {
          p.classList.remove('tab-panel-active');
          p.hidden = true;
        });
        btn.classList.add('tab-active');
        btn.setAttribute('aria-selected', 'true');
        const target = document.getElementById(btn.getAttribute('aria-controls'));
        if (target) {
          target.classList.add('tab-panel-active');
          target.hidden = false;
        }
      });
    });
  }

  /* -- Project Category Filtering ---------------------------- */
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('#projects-grid .project-card');

  if (filterBtns.length && projectCards.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        filterBtns.forEach(b => b.classList.remove('filter-active'));
        btn.classList.add('filter-active');
        projectCards.forEach((card, i) => {
          const match = filter === 'all' || card.dataset.category === filter;
          if (match) {
            card.classList.remove('hidden-filter');
            card.classList.remove('visible');
            setTimeout(() => card.classList.add('visible'), i * 60);
          } else {
            card.classList.add('hidden-filter');
          }
        });
      });
    });
  }

  /* -- EmailJS Contact Form ---------------------------------- */
  const EMAILJS_PUBLIC_KEY  = 'PwosmWQOgpNYdQjFS';
  const EMAILJS_SERVICE_ID  = 'service_lwzzu1n';
  const EMAILJS_TEMPLATE_ID = 'template_l10pbma';

  if (typeof emailjs !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const fields = {
      name:    { el: document.getElementById('contact-name'),    validate: v => v.trim().length >= 2 ? '' : 'Please enter your full name (min 2 characters).' },
      email:   { el: document.getElementById('contact-email'),   validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email address.' },
      subject: { el: document.getElementById('contact-subject'), validate: v => v ? '' : 'Please select a subject.' },
      message: { el: document.getElementById('contact-message'), validate: v => v.trim().length >= 10 ? '' : 'Message must be at least 10 characters.' },
    };

    Object.values(fields).forEach(({ el, validate }) => {
      if (!el) return;
      el.addEventListener('blur', () => {
        const err = validate(el.value);
        const errEl = el.closest('.form-group').querySelector('.form-error');
        if (errEl) errEl.textContent = err;
        err ? el.classList.add('field-error') : el.classList.remove('field-error');
      });
      el.addEventListener('input', () => {
        const errEl = el.closest('.form-group').querySelector('.form-error');
        if (errEl) errEl.textContent = '';
        el.classList.remove('field-error');
      });
    });

    const submitBtn  = document.getElementById('formSubmitBtn');
    const btnText    = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const successEl  = document.getElementById('formSuccess');

    const showError = msg => {
      let errEl = contactForm.querySelector('.form-api-error');
      if (!errEl) {
        errEl = document.createElement('p');
        errEl.className = 'form-api-error';
        errEl.style.cssText = 'color:#f87171;margin-top:.75rem;font-size:.9rem;text-align:center;';
        submitBtn.insertAdjacentElement('afterend', errEl);
      }
      errEl.textContent = msg;
      setTimeout(() => { errEl.textContent = ''; }, 6000);
    };

    const setLoading = on => {
      submitBtn.disabled = on;
      btnText.hidden     = on;
      btnLoading.hidden  = !on;
    };

    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      let isValid = true;
      Object.values(fields).forEach(({ el, validate }) => {
        if (!el) return;
        const err = validate(el.value);
        const errEl = el.closest('.form-group').querySelector('.form-error');
        if (errEl) errEl.textContent = err;
        if (err) { el.classList.add('field-error'); isValid = false; }
      });
      if (!isValid) return;
      if (submitBtn.disabled) return;
      if (typeof emailjs === 'undefined') { showError('Email service unavailable. Please email me directly.'); return; }

      setLoading(true);
      const subjectLabels = { internship: 'Internship Opportunity', job: 'Job Opportunity', freelance: 'Freelance Project', collaboration: 'Collaboration', other: 'Other' };
      const templateParams = {
        name:    fields.name.el.value.trim(),
        email:   fields.email.el.value.trim(),
        subject: subjectLabels[fields.subject.el.value] || fields.subject.el.value,
        message: fields.message.el.value.trim(),
        time:    new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      };

      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)
        .then(() => {
          contactForm.reset();
          if (successEl) { successEl.hidden = false; setTimeout(() => { successEl.hidden = true; }, 6000); }
        })
        .catch(err => { showError(`Failed to send message. ${err?.text || err?.message || 'Please try again.'}`); })
        .finally(() => setLoading(false));
    });
  }

  /* -- Contact Modal ----------------------------------------- */
  const contactBtn = document.getElementById('contactBtn');
  const modal      = document.getElementById('contactModal');
  const closeBtn   = document.querySelector('.close-btn');

  if (contactBtn && modal && closeBtn) {
    const openModal  = () => { modal.style.display = 'flex'; requestAnimationFrame(() => { requestAnimationFrame(() => modal.classList.add('show')); }); modal.setAttribute('aria-hidden', 'false'); closeBtn.focus(); };
    const closeModal = () => { modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true'); setTimeout(() => { modal.style.display = 'none'; }, 300); contactBtn.focus(); };
    contactBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('show')) closeModal(); });
  }

  /* -- Hero Video Control ------------------------------------ */
  const heroVideo = document.getElementById('heroVideo');
  const heroPlayOverlay = document.getElementById('heroPlayOverlay');
  const heroPlayBtn = document.getElementById('heroPlayBtn');
  const heroMuteBtn = document.getElementById('heroMuteBtn');

  if (heroVideo && heroPlayOverlay && heroPlayBtn && heroMuteBtn) {
    heroVideo.muted = true;

    const togglePlay = () => {
      if (heroVideo.paused) {
        heroVideo.play().then(() => {
          heroPlayOverlay.classList.add('hidden');
          heroPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
          heroPlayBtn.setAttribute('aria-label', 'Pause video');
        }).catch(err => {
          console.error("Playback failed", err);
        });
      } else {
        heroVideo.pause();
        heroPlayOverlay.classList.remove('hidden');
        heroPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
        heroPlayBtn.setAttribute('aria-label', 'Play video');
      }
    };

    const toggleMute = () => {
      heroVideo.muted = !heroVideo.muted;
      if (heroVideo.muted) {
        heroMuteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        heroMuteBtn.setAttribute('aria-label', 'Unmute video');
      } else {
        heroMuteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        heroMuteBtn.setAttribute('aria-label', 'Mute video');
      }
    };

    heroPlayOverlay.addEventListener('click', togglePlay);
    heroPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay();
    });
    heroMuteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMute();
    });
    heroVideo.addEventListener('click', togglePlay);

    heroVideo.addEventListener('play', () => {
      heroVideo.parentElement.classList.add('controls-visible');
    });
    heroVideo.addEventListener('pause', () => {
      heroVideo.parentElement.classList.remove('controls-visible');
    });
    heroVideo.addEventListener('ended', () => {
      heroPlayOverlay.classList.remove('hidden');
      heroPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
      heroPlayBtn.setAttribute('aria-label', 'Play video');
      heroVideo.parentElement.classList.remove('controls-visible');
    });
  }

  /* -- VanillaTilt ------------------------------------------- */
  if (typeof VanillaTilt !== 'undefined') {
    const tiltTargets = document.querySelectorAll('.skill-category, .project-card, .cert-card, .service-card');
    const tiltObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          VanillaTilt.init(entry.target, { max: 8, speed: 400, glare: true, 'max-glare': 0.12, scale: 1.02 });
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    tiltTargets.forEach(el => tiltObserver.observe(el));
  }

});
