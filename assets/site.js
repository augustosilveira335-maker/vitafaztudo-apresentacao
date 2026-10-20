(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const stories = [...document.querySelectorAll('.scrolly')];
  const pain = document.querySelector('.pain-scroll');
  const sections = [...document.querySelectorAll('main > section')];
  const films = [...document.querySelectorAll('.film')];
  const notes = document.getElementById('presenter-notes');
  const speaker = JSON.parse(document.getElementById('speaker-data').textContent);
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const forcedFallback = new URLSearchParams(location.search).get('motion') === 'fallback';
  const supportsScroll = CSS.supports('animation-timeline: view()') && CSS.supports('animation-range: contain');
  let native = false, motion = false, raf = 0, activeSection = 0, previousFocus = null;
  let observers = [];
  const topInset = () => parseFloat(getComputedStyle(root).getPropertyValue('--top')) || 86;
  const progress = el => {
    const box = el.getBoundingClientRect();
    return clamp((topInset() - box.top) / Math.max(1, box.height - (innerHeight - topInset() - 24)));
  };

  function updateStory(story) {
    if (!story.classList.contains('enhanced')) return;
    const p = progress(story);
    const index = Math.min(3, Math.floor(p * 4));
    story.dataset.progress = p.toFixed(4);
    if (story.dataset.step !== String(index) || !story.dataset.initialized) {
      story.dataset.step = index;
      story.dataset.initialized = 'true';
      story.querySelectorAll('.story-step').forEach((step, i) => {
        step.classList.toggle('is-current', i === index);
        step.inert = i !== index;
        if (i === index) step.removeAttribute('aria-hidden');
        else step.setAttribute('aria-hidden', 'true');
      });
    }
  }

  function updatePain() {
    if (!pain.classList.contains('enhanced') || native) return;
    const p = progress(pain);
    const exit = clamp((p - .67) / .13);
    const stack = pain.querySelector('.chat-stack');
    stack.style.opacity = 1 - exit;
    stack.style.transform = `translateY(${-exit * 18}px)`;
    pain.querySelector('.chat-heading').style.opacity = 1 - exit;
    pain.querySelectorAll('.chat-bubble').forEach((bubble, i) => {
      const amount = clamp((p - i * .11) / .12);
      bubble.style.opacity = amount;
      bubble.style.transform = `translateY(${(1 - amount) * 20}px)`;
    });
    const answer = pain.querySelector('.no-answer');
    const amount = clamp((p - .8) / .11);
    answer.style.opacity = amount;
    answer.style.visibility = amount > 0 ? 'visible' : 'hidden';
    answer.style.transform = `translateY(${(1 - amount) * 24}px)`;
  }

  function refresh() {
    raf = 0;
    const hero = sections[0].getBoundingClientRect();
    root.classList.toggle('past-hero', hero.bottom <= topInset());
    root.classList.toggle('at-contact', sections[sections.length - 1].getBoundingClientRect().top < innerHeight * .6);
    let current = 0;
    sections.forEach((section, i) => {
      if (section.getBoundingClientRect().top <= innerHeight * .42) current = i;
    });
    if (activeSection !== current) {
      activeSection = current;
      if (notes.open) fillNotes();
    }
    stories.forEach(updateStory);
    if (!motion) return;
    updatePain();
    if (!native) {
      const full = document.documentElement.scrollHeight - innerHeight;
      document.querySelector('.reading-progress i').style.transform = `scaleX(${clamp(scrollY / Math.max(1, full))})`;
      const hp = clamp(-hero.top / Math.max(1, hero.height));
      document.querySelector('.building-photo').style.transform = `translateY(${hp * 90}px)`;
      document.querySelector('.window-shade').style.opacity = .92 * (1 - clamp(hp / .25));
      const proof = document.querySelector('.tenant-proof');
      const pp = clamp((innerHeight * .9 - proof.getBoundingClientRect().top) / (innerHeight * .65));
      proof.querySelector('.wipe-after').style.clipPath = `inset(0 ${(1 - pp) * 100}% 0 0)`;
      proof.querySelector('.tenant-claim i').style.transform = `rotate(-5deg) scaleX(${clamp((pp - .65) / .35)})`;
    }
    const owner = document.querySelector('.owner-proof');
    const ownerP = clamp((innerHeight - owner.getBoundingClientRect().top) / (innerHeight * .62));
    const total = document.querySelector('.account-total');
    const formatted = money.format(Math.round(1060 * ownerP));
    if (total.textContent !== formatted) total.textContent = formatted;
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(refresh); };

  function configure() {
    observers.forEach(o => o.disconnect());
    observers = [];
    motion = !reduced.matches && 'IntersectionObserver' in window;
    native = motion && supportsScroll && !forcedFallback;
    root.classList.add('js');
    if (/[?&]apresentador\b/.test(location.search) || location.hash === '#apresentador') root.classList.add('presenter');
    root.classList.toggle('motion', motion);
    root.classList.toggle('native-scroll', native);
    root.classList.toggle('fallback', motion && !native);
    root.dataset.motionEngine = !motion ? 'static' : native ? 'css-scroll' : 'intersection-observer';
    const canPin = motion && (innerWidth >= 1024 ? innerHeight >= 600 : innerHeight >= 740);
    [...stories, pain].forEach(el => el.classList.toggle('enhanced', canPin));
    stories.forEach(story => {
      delete story.dataset.initialized;
      const travel = story.offsetHeight - (innerHeight - topInset() - 24);
      story.querySelectorAll('[data-marker]').forEach((marker, i) => {
        marker.style.top = `${Math.max(0, travel * i / 4)}px`;
      });
      story.querySelectorAll('.story-step').forEach(step => {
        step.inert = false;
        step.removeAttribute('aria-hidden');
        step.classList.remove('is-current');
      });
    });
    document.querySelectorAll('.chat-stack,.chat-heading,.chat-bubble,.no-answer,.building-photo,.window-shade,.wipe-after,.tenant-claim i').forEach(el => el.removeAttribute('style'));
    // O índice de cada bolha é estático; a limpeza acima não remove sua sequência.
    pain.querySelectorAll('.chat-bubble').forEach((el, i) => el.style.setProperty('--bubble', i));
    document.querySelector('.account-total').textContent = money.format(1060);
    document.querySelectorAll('.reveal-item').forEach(el => el.classList.remove('waiting','revealed'));
    if (motion) {
      const stepObserver = new IntersectionObserver(schedule, { rootMargin: `-${topInset()}px 0px -55% 0px`, threshold: 0 });
      document.querySelectorAll('[data-marker],.pain-scroll,.scrolly,.owner-proof,.tenant-proof').forEach(el => stepObserver.observe(el));
      observers.push(stepObserver);
      if (!native) {
        const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove('waiting');
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }), { threshold: .08 });
        document.querySelectorAll('.reveal-item').forEach(el => {
          if (el.getBoundingClientRect().top > innerHeight) el.classList.add('waiting');
          revealObserver.observe(el);
        });
        observers.push(revealObserver);
      }
    }
    refresh();
  }

  function fillNotes() {
    document.getElementById('notes-title').textContent = speaker.titles[activeSection];
    const holder = document.getElementById('notes-content');
    holder.replaceChildren(...speaker.notes[activeSection].map(text => {
      const p = document.createElement('p'); p.textContent = text; return p;
    }));
  }
  function openNotes() {
    previousFocus = document.activeElement;
    fillNotes(); notes.showModal(); notes.querySelector('.close-notes').focus();
  }
  function closeNotes() { notes.close(); previousFocus?.focus({ preventScroll: true }); }
  document.querySelector('.notes-button').addEventListener('click', openNotes);
  document.querySelector('.close-notes').addEventListener('click', closeNotes);
  notes.addEventListener('click', event => { if (event.target === notes) { const r = notes.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeNotes(); } });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    if (event.key.toLowerCase() === 'n') { event.preventDefault(); if (notes.open) closeNotes(); else openNotes(); }
    if (event.key === 'Escape') {
      if (notes.open) { event.preventDefault(); closeNotes(); }
      else films.forEach(film => { film.open = false; film.querySelector('video').pause(); });
    }
    // Espaço, PageUp/PageDown, Home/End e setas mantêm o comportamento do navegador.
  });
  films.forEach(film => film.addEventListener('toggle', () => {
    const video = film.querySelector('video');
    if (!film.open) { video.pause(); return; }
    films.filter(other => other !== film).forEach(other => { other.open = false; other.querySelector('video').pause(); });
    video.play().catch(() => { /* Os controles nativos continuam disponíveis. */ });
    requestAnimationFrame(() => {
      const box = video.getBoundingClientRect();
      scrollTo({ top: scrollY + box.top - (innerHeight + topInset() - box.height) / 2, behavior: reduced.matches ? 'instant' : 'smooth' });
    });
  }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) films.forEach(film => film.querySelector('video').pause()); });
  addEventListener('pagehide', () => { cancelAnimationFrame(raf); observers.forEach(o => o.disconnect()); films.forEach(film => film.querySelector('video').pause()); });
  addEventListener('scroll', schedule, { passive: true });
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(configure, 150); }, { passive: true });
  reduced.addEventListener('change', configure);
  configure();
})();
