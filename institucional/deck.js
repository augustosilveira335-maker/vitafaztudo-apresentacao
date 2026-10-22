// Navegação: setas, espaço, PageUp/PageDown (passador de slides), clique (terço esquerdo volta), toque, F tela cheia, N notas.
(() => {
  'use strict';
  const deck = document.querySelector('.deck');
  const palco = deck.querySelector('.palco');
  const slides = [...palco.querySelectorAll('.slide')];
  const contador = palco.querySelector('.contador');
  const barra = palco.querySelector('.rodape i');
  const ajuda = document.querySelector('.ajuda');
  const notas = document.querySelector('dialog.notas');
  let atual = 0;

  const ajustar = () => deck.style.setProperty('--s', Math.min(innerWidth / 1920, innerHeight / 1080));
  const encherNotas = () => {
    const texto = (slides[atual].dataset.nota || 'Sem notas para este slide.').split('|');
    notas.querySelector('h2').textContent = `Slide ${atual + 1} de ${slides.length}`;
    notas.querySelector('.corpo').replaceChildren(...texto.map(t => Object.assign(document.createElement('p'), { textContent: t.trim() })));
  };
  const ir = n => {
    atual = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach((s, k) => {
      s.classList.toggle('on', k === atual);
      s.setAttribute('aria-hidden', String(k !== atual));
      if (k !== atual) s.querySelectorAll('video').forEach(v => v.pause());
    });
    slides[atual].querySelectorAll('video[data-auto]').forEach(v => { v.currentTime = 0; v.play().catch(() => {}); });
    slides[atual].querySelectorAll('[data-conta]').forEach(el => {
      const alvo = Number(el.dataset.conta), t0 = performance.now();
      const passo = t => { const p = Math.min(1, (t - t0) / 1400); el.textContent = String(Math.round(alvo * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(passo); };
      el.textContent = '0'; setTimeout(() => requestAnimationFrame(passo), 300);
    });
    palco.classList.toggle('escuro', slides[atual].classList.contains('escuro'));
    contador.textContent = `${atual + 1} / ${slides.length}`;
    barra.style.transform = `scaleX(${(atual + 1) / slides.length})`;
    history.replaceState(null, '', `#${atual + 1}`);
    if (notas.open) encherNotas();
  };
  const telaCheia = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  addEventListener('resize', ajustar);
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); ir(atual + 1); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); ir(atual - 1); }
    else if (k === 'Home') ir(0);
    else if (k === 'End') ir(slides.length - 1);
    else if (k.toLowerCase() === 'f') telaCheia();
    else if (k.toLowerCase() === 'n') { if (notas.open) notas.close(); else { encherNotas(); notas.showModal(); } }
  });
  deck.addEventListener('click', e => {
    if (e.target.closest('video,a,button')) return;
    const r = palco.getBoundingClientRect();
    ir(e.clientX < r.left + r.width / 3 ? atual - 1 : atual + 1);
  });
  let x0 = null;
  deck.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  deck.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) ir(atual + (dx < 0 ? 1 : -1));
  });
  notas.addEventListener('click', e => { if (e.target === notas) notas.close(); });

  ajustar();
  ir((parseInt(location.hash.slice(1), 10) || 1) - 1);
  ajuda.classList.add('ver');
  setTimeout(() => ajuda.classList.remove('ver'), 4500);
})();
