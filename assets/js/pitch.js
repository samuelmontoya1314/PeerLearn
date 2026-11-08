/* =========================================================================
   PeerLearn · Pitch Engine (Presentación a Stakeholders)
   Controles de navegación (teclas ←, →, Espacio, P, D, N, F),
   escalado responsivo al viewport (1600x900 base), notas del orador
   y renderizado SVG dinámico (Radar de Problemas + Matriz de Soluciones).
   ========================================================================= */
window.PL = window.PL || {};

(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const pitchState = {
    index: 0,
    total: 10,
    showNotes: false
  };

  function updateScale() {
    const vp = $('#deck-viewport');
    const deck = $('#deck');
    if (!vp || !deck) return;

    const w = vp.clientWidth;
    const h = vp.clientHeight;
    const scale = Math.min(w / 1600, h / 900);
    deck.style.transform = `scale(${scale})`;
  }

  function goToSlide(idx, skipHash) {
    const slides = $$('.slide', $('#deck'));
    if (!slides.length) return;

    if (idx < 0) idx = 0;
    if (idx >= slides.length) idx = slides.length - 1;

    pitchState.index = idx;
    pitchState.total = slides.length;

    slides.forEach((s, i) => {
      s.classList.toggle('active', i === idx);
      const numEl = $('.s-num', s);
      if (numEl) numEl.textContent = `${i + 1} / ${slides.length}`;
    });

    // Barra de progreso y contador
    const pBar = $('#deck-progress-bar');
    if (pBar) {
      const pct = ((idx + 1) / slides.length) * 100;
      pBar.style.width = `${pct}%`;
    }

    const countEl = $('#deck-count');
    if (countEl) countEl.textContent = `${idx + 1} / ${slides.length}`;

    const titleEl = $('#deck-title');
    const currentSlide = slides[idx];
    if (titleEl && currentSlide) {
      titleEl.textContent = currentSlide.dataset.title || '';
    }

    // Actualizar panel de notas si está activo
    updateNotesPanel();

    if (!skipHash && document.body.classList.contains('mode-pitch')) {
      location.hash = `#pitch/${idx + 1}`;
    }
  }

  function toggleNotes() {
    pitchState.showNotes = !pitchState.showNotes;
    const panel = $('#notes-panel');
    const btn = $('#deck-notes-btn');
    if (panel) panel.classList.toggle('open', pitchState.showNotes);
    if (btn) btn.classList.toggle('active', pitchState.showNotes);
    updateNotesPanel();
  }

  function updateNotesPanel() {
    const panel = $('#notes-panel');
    if (!panel || !pitchState.showNotes) return;

    const slides = $$('.slide', $('#deck'));
    const current = slides[pitchState.index];
    const notesEl = $('.speaker-notes', current);

    if (!notesEl) {
      panel.innerHTML = '<div class="np-head"><b>Notas del orador</b></div><div class="np-body"><p class="muted">No hay notas registradas para esta diapositiva.</p></div>';
      return;
    }

    const presenter = notesEl.dataset.presenter || 'Equipo';
    panel.innerHTML = `
      <div class="np-head">
        <div>
          <b>Notas del orador</b>
          <small class="mono">Presenta: <strong class="hl">${presenter}</strong></small>
        </div>
        <button class="icon-btn sm" id="close-notes-btn" type="button" aria-label="Cerrar notas">
          ${PL.icon('x', 14)}
        </button>
      </div>
      <div class="np-body">
        ${notesEl.innerHTML}
      </div>
    `;

    const closeBtn = $('#close-notes-btn', panel);
    if (closeBtn) closeBtn.onclick = toggleNotes;
    PL.hydrateIcons(panel);
  }

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  /* =========================================================================
     Renderizado Dinámico de Gráficas para Slides (Radar + Matriz)
     Directamente desde los datos de Trabajo emprendimiento.docx
     ========================================================================= */
  function renderRadar() {
    const el = $('[data-radar]');
    if (!el) return;

    // Criterios del radar evaluados en el docx:
    // Criterio: [P1 Inexistencia canales tutorias, P2 Falta organizacion practicantes]
    const criteria = [
      { name: 'Impacto', p1: 4, p2: 2 },
      { name: 'Frecuencia', p1: 5, p2: 5 },
      { name: 'Necesidad', p1: 4, p2: 4 },
      { name: 'Evidencia', p1: 3, p2: 2 },
      { name: 'Potencial Innovación', p1: 5, p2: 2 },
      { name: 'Viabilidad', p1: 4, p2: 1 }
    ];

    const cx = 160, cy = 150, rMax = 110;
    const numAxes = criteria.length;

    let circles = '';
    for (let level = 1; level <= 5; level++) {
      const r = (level / 5) * rMax;
      circles += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255, 255, 255, 0.18)" stroke-dasharray="2,2"/>`;
    }

    let axesLines = '';
    let labels = '';
    const pointsP1 = [];
    const pointsP2 = [];

    criteria.forEach((c, i) => {
      const angle = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
      const xMax = cx + rMax * Math.cos(angle);
      const yMax = cy + rMax * Math.sin(angle);
      axesLines += `<line x1="${cx}" y1="${cy}" x2="${xMax}" y2="${yMax}" stroke="rgba(255, 255, 255, 0.18)"/>`;

      // Label
      const xLbl = cx + (rMax + 24) * Math.cos(angle);
      const yLbl = cy + (rMax + 14) * Math.sin(angle);
      const anchor = Math.abs(Math.cos(angle)) < 0.2 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
      labels += `<text x="${xLbl}" y="${yLbl}" fill="#CBD5E1" font-size="11" font-weight="600" text-anchor="${anchor}">${c.name}</text>`;

      // Polígonos
      const r1 = (c.p1 / 5) * rMax;
      pointsP1.push(`${cx + r1 * Math.cos(angle)},${cy + r1 * Math.sin(angle)}`);

      const r2 = (c.p2 / 5) * rMax;
      pointsP2.push(`${cx + r2 * Math.cos(angle)},${cy + r2 * Math.sin(angle)}`);
    });

    el.innerHTML = `
      <svg viewBox="0 0 320 300" class="radar-svg">
        ${circles}
        ${axesLines}
        <polygon points="${pointsP2.join(' ')}" fill="rgba(148, 163, 184, 0.2)" stroke="#94A3B8" stroke-width="2"/>
        <polygon points="${pointsP1.join(' ')}" fill="rgba(37, 99, 235, 0.4)" stroke="#3B82F6" stroke-width="2.5"/>
        ${pointsP1.map(pt => `<circle cx="${pt.split(',')[0]}" cy="${pt.split(',')[1]}" r="4" fill="#FBBF24"/>`).join('')}
        ${labels}
      </svg>
    `;
  }

  function renderMatrix() {
    const el = $('[data-matrix]');
    if (!el) return;

    // Matriz de evaluación del documento (5 alternativas x 5 criterios)
    const data = [
      { name: 'PeerLearn (P2P)', d: 5, i: 5, f: 4, dif: 5, a: 5, total: 24, win: true },
      { name: 'Chatbot con IA', d: 3, i: 3, f: 3, dif: 4, a: 3, total: 16 },
      { name: 'Padrino académico', d: 4, i: 4, f: 3, dif: 3, a: 4, total: 18 },
      { name: 'Mesa de ayuda física', d: 3, i: 3, f: 4, dif: 2, a: 3, total: 15 },
      { name: 'Talleres de choque', d: 3, i: 3, f: 4, dif: 2, a: 3, total: 15 }
    ];

    el.innerHTML = `
      <table class="matrix-tbl">
        <thead>
          <tr>
            <th>Alternativa</th>
            <th title="Deseabilidad">Des</th>
            <th title="Impacto">Imp</th>
            <th title="Factibilidad">Fact</th>
            <th title="Diferenciación">Dif</th>
            <th title="Alineación">Alin</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr class="${row.win ? 'win-row' : ''}">
              <td><b>${row.name}</b> ${row.win ? '<span class="win-badge">Seleccionada</span>' : ''}</td>
              <td class="mono">${row.d}</td>
              <td class="mono">${row.i}</td>
              <td class="mono">${row.f}</td>
              <td class="mono">${row.dif}</td>
              <td class="mono">${row.a}</td>
              <td class="mono total-cell"><strong>${row.total}</strong>/25</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function initPitch() {
    renderRadar();
    renderMatrix();

    // Eventos de botones UI del deck
    const prevBtn = $('#deck-prev');
    const nextBtn = $('#deck-next');
    if (prevBtn) prevBtn.onclick = () => goToSlide(pitchState.index - 1);
    if (nextBtn) nextBtn.onclick = () => goToSlide(pitchState.index + 1);

    const notesBtn = $('#deck-notes-btn');
    if (notesBtn) notesBtn.onclick = toggleNotes;

    const fsBtn = $('#deck-fs-btn');
    if (fsBtn) fsBtn.onclick = toggleFullScreen;

    window.addEventListener('resize', updateScale);
    updateScale();

    // Navegación con teclado en modo Pitch
    document.addEventListener('keydown', (e) => {
      if (!document.body.classList.contains('mode-pitch')) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          goToSlide(pitchState.index + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          goToSlide(pitchState.index - 1);
          break;
        case 'Home':
          e.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          goToSlide(pitchState.total - 1);
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          toggleNotes();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullScreen();
          break;
        case 'd':
        case 'D':
          e.preventDefault();
          PL.setMode('app');
          break;
        case 't':
        case 'T':
          e.preventDefault();
          if (PL.toggleTheme) PL.toggleTheme();
          break;
      }
    });

    goToSlide(0, true);
  }

  PL.pitch = {
    goTo: goToSlide,
    toggleNotes: toggleNotes,
    index: 0
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPitch);
  } else {
    initPitch();
  }
})();

