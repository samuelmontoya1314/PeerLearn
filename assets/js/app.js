/* =========================================================================
   PeerLearn · MVP funcional
   Vistas: Explorar (estudiante) · Mi agenda · Portal del tutor · Panel institucional
   Todo el estado vive en memoria: la demo es 100% interactiva y sin backend.
   ========================================================================= */
(function () {
  'use strict';

  const D = PL.data;
  const I = PL.icon;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* =======================================================================
     Utilidades
     ======================================================================= */
  const DAY = 86400000;
  const WD = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const WDL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const MON = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const COP = (n) => '$' + Math.round(n).toLocaleString('es-CO');
  const pad = (n) => String(n).padStart(2, '0');
  const first = (name) => name.split(' ')[0];
  const initials = (name) => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const startOf = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const at = (d, hhmm) => { const p = hhmm.split(':').map(Number); const x = new Date(d); x.setHours(p[0], p[1], 0, 0); return x; };
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const fmtTime = (d) => pad(d.getHours()) + ':' + pad(d.getMinutes());
  function fmtDay(d, long) {
    const diff = Math.round((startOf(d) - today0()) / DAY);
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Mañana';
    if (diff === -1) return 'Ayer';
    return (long ? WDL[d.getDay()] : WD[d.getDay()]) + ' ' + d.getDate() + ' ' + MON[d.getMonth()];
  }
  function fmtRel(d) {
    const ms = d - new Date();
    if (ms <= 0) return 'en curso';
    const h = Math.floor(ms / 3600000), days = Math.floor(h / 24);
    if (days >= 1) return 'en ' + days + ' d ' + (h % 24) + ' h';
    if (h >= 1) return 'en ' + h + ' h ' + Math.floor((ms % 3600000) / 60000) + ' min';
    return 'en ' + Math.max(1, Math.floor(ms / 60000)) + ' min';
  }
  /** Día hábil (sin domingos) a `offset` días de hoy. */
  function workday(offset, dir) {
    let d = addDays(today0(), offset);
    while (d.getDay() === 0) d = addDays(d, dir || 1);
    return d;
  }

  const tutorById = (id) => D.tutors.find((t) => t.id === id);
  const subjectById = (id) => D.subjects.find((s) => s.id === id);
  const offerById = (id) => S.offers.find((o) => o.id === id);

  function avatar(p, size, extra) {
    const s = size || 40;
    const ini = p.initials || initials(p.name);
    return '<span class="avatar ' + (extra || '') + '" style="--h:' + (p.hue || 220) + ';width:' + s + 'px;height:' + s + 'px;font-size:' + Math.round(s * 0.36) + 'px">' + esc(ini) + '</span>';
  }
  function stars(n, size) {
    let h = '';
    for (let i = 1; i <= 5; i++) h += I('star', size || 14, 'star ' + (i <= Math.round(n) ? 'fill' : 'empty'));
    return '<span class="stars">' + h + '</span>';
  }

  /* =======================================================================
     Estado
     ======================================================================= */
  const S = {
    view: 'explorar',
    filters: { q: '', subject: 'all', modality: 'all', cost: 'all', minGrade: false, sort: 'recommended' },
    offers: D.offers.map((o) => Object.assign({}, o)),
    bookings: [],
    requests: D.requests.map((r) => Object.assign({}, r)),
    applicants: D.applicants.map((a) => Object.assign({}, a)),
    notifs: [],
    agendaStart: today0(),
    highlight: null,
    instRange: 'semestre',
    policy: { reminders: true, confirm2h: true, limitNoShows: true },
    bk: null,
    rt: null,
    tf: null
  };

  function saveState() {
    try {
      const payload = {
        bookings: S.bookings,
        offers: S.offers,
        requests: S.requests
      };
      localStorage.setItem('peerlearn_sim_data', JSON.stringify(payload));
    } catch (_) {}
  }

  function seed() {
    const t2 = tutorById('t2'), t3 = tutorById('t3'), t5 = tutorById('t5');
    S.bookings = [
      { id: 'b1', offerId: 'o3', tutorId: 't3', subject: 'logica', topic: 'Ciclos for / while', start: at(workday(-6, -1), '10:00'), modality: 'presencial', location: t3.place, status: 'completada', reviewed: true, rating: 5, rate: 0 },
      { id: 'b2', offerId: 'o2', tutorId: 't2', subject: 'calculo', topic: 'Regla de la cadena', start: at(workday(-2, -1), '16:00'), modality: 'presencial', location: t2.place, status: 'completada', reviewed: false, rate: 0 },
      { id: 'b3', offerId: 'o2', tutorId: 't2', subject: 'calculo', topic: 'Optimización', start: at(workday(1), '14:00'), modality: 'presencial', location: t2.place, status: 'confirmada', attendance: false, rate: 0 },
      { id: 'b4', offerId: 'o5', tutorId: 't5', subject: 'matop', topic: 'Logaritmos', start: at(workday(3), '10:00'), modality: 'virtual', location: 'Google Meet', status: 'pendiente', rate: 0 }
    ];
    try {
      const saved = JSON.parse(localStorage.getItem('peerlearn_sim_data'));
      if (saved && Array.isArray(saved.bookings) && saved.bookings.length) {
        saved.bookings.forEach((b) => { b.start = new Date(b.start); });
        S.bookings = saved.bookings;
        if (Array.isArray(saved.offers) && saved.offers.length) S.offers = saved.offers;
        if (Array.isArray(saved.requests)) S.requests = saved.requests;
      }
    } catch (_) {}
    S.notifs = [
      { icon: 'check-circle', tone: 'emerald', title: 'Santiago confirmó tu tutoría', body: 'Cálculo Diferencial · ' + fmtDay(S.bookings[2] ? S.bookings[2].start : new Date()) + ' 14:00', when: 'hace 2 h', unread: true },
      { icon: 'star', tone: 'gold', title: '¿Cómo te fue con Santiago?', body: 'Califica tu sesión de Regla de la cadena', when: 'hace 1 d', unread: true },
      { icon: 'sparkles', tone: 'blue', title: 'Nuevos tutores en Lógica de Programación', body: '3 tutores verificados con cupos esta semana', when: 'hace 2 d', unread: false }
    ];
    // Formulario del portal del tutor (Laura)
    S.tf = {
      subject: 'poo',
      topics: ['Clases y objetos', 'Herencia', 'Polimorfismo'],
      modality: 'ambas',
      incentive: 'social',
      rate: 22000,
      avail: ['1-14:00', '1-16:00', '3-10:00', '5-14:00'],
      method: 'Programamos juntos sobre tu propio proyecto y te dejo ejercicios cortos para practicar.',
      published: null,
      customTopic: ''
    };
  }

  /* =======================================================================
     Disponibilidad y cupos
     ======================================================================= */
  function isTaken(tutorId, start) {
    return S.bookings.some((b) => b.status !== 'cancelada' && b.start.getTime() === start.getTime() && (b.tutorId === tutorId || true));
  }
  /** Días con cupos (próximos 8 días) a partir de una disponibilidad semanal. */
  function slotsByDay(tutorId, avail) {
    const out = [];
    const now = new Date();
    for (let i = 0; i < 8; i++) {
      const d = addDays(today0(), i);
      const times = avail[d.getDay()];
      if (!times || !times.length) continue;
      const slots = times.map((tm) => {
        const st = at(d, tm);
        return { time: tm, start: st, past: st <= new Date(now.getTime() + 30 * 60000), taken: isTaken(tutorId, st) };
      });
      if (slots.some((s) => !s.past)) out.push({ date: d, slots: slots });
    }
    return out;
  }
  function nextSlot(tutorId, avail) {
    const days = slotsByDay(tutorId, avail);
    for (const d of days) for (const s of d.slots) if (!s.past && !s.taken) return s.start;
    return null;
  }
  const offerAvail = (o) => o.avail || tutorById(o.tutorId).avail;

  /* =======================================================================
     Componentes compartidos
     ======================================================================= */
  function incentiveTag(o) {
    if (o.incentive === 'pago') return '<span class="tag tag-pay mono">' + COP(o.rate) + '<small>/h</small></span>';
    if (o.incentive === 'social') return '<span class="tag tag-social">' + I('heart', 13) + 'Gratis · Bienestar</span>';
    return '<span class="tag tag-credit">' + I('award', 13) + 'Gratis · Certificación</span>';
  }
  function modalityLabel(mods) {
    if (mods.length > 1) return I('map-pin', 14) + 'Presencial ' + '<span class="sep">·</span>' + I('video', 14) + 'Virtual';
    return mods[0] === 'presencial' ? I('map-pin', 14) + 'Presencial en campus' : I('video', 14) + 'Virtual';
  }
  function matchedTopics(o) {
    const q = norm(S.filters.q);
    if (!q) return [];
    const words = q.split(/\s+/).filter((w) => w.length > 2);
    return o.topics.filter((tp) => { const n = norm(tp); return n.includes(q) || q.includes(n) || words.some((w) => n.includes(w)); });
  }

  function offerCard(o, opts) {
    opts = opts || {};
    const t = tutorById(o.tutorId), s = subjectById(o.subject);
    const g = t.grades[o.subject] || 0;
    const matched = opts.preview ? [] : matchedTopics(o);
    const next = nextSlot(t.id, offerAvail(o));
    const cls = ['tcard'];
    if (o.isNew) cls.push('is-new');
    if (S.highlight === o.id) cls.push('is-highlight');
    if (opts.preview) cls.push('is-preview');
    return '' +
      '<article class="' + cls.join(' ') + '" data-offer="' + o.id + '">' +
        (o.isNew ? '<span class="new-flag mono">Nuevo</span>' : '') +
        '<header class="tcard-head">' + avatar(t, 52) +
          '<div class="tcard-id"><h3>' + esc(t.name) + I('shield-check', 16, 'verified') + '</h3><p>' + esc(t.program) + ' · ' + t.semester + '.º sem</p></div>' +
          incentiveTag(o) +
        '</header>' +
        '<div class="grade-badge">' + I('shield-check', 15) + '<span>Aprobó <b>' + esc(s.name) + '</b></span><span class="grade mono">' + g.toFixed(1) + '</span></div>' +
        '<div class="topics">' + (o.topics.length ? o.topics.map((tp) => '<span class="chip ' + (matched.includes(tp) ? 'chip-match' : '') + '">' + esc(tp) + '</span>').join('') : '<span class="chip ghost">Agrega micro-temas</span>') + '</div>' +
        '<div class="tcard-stats">' +
          '<span>' + I('star', 14, 'star fill') + '<b>' + t.rating.toFixed(1) + '</b><em>(' + t.reviews + ')</em></span>' +
          '<span>' + I('check-circle', 14) + t.attendance + '% asistencia</span>' +
          '<span>' + I('award', 14) + t.sessions + ' sesiones</span>' +
        '</div>' +
        '<div class="tcard-mod">' + modalityLabel(o.modality) + '</div>' +
        '<footer class="tcard-foot">' +
          '<div class="next-slot">' + I('clock', 15) + '<span>Próximo cupo</span><b>' + (next ? fmtDay(next) + ' · ' + fmtTime(next) : 'Sin cupos') + '</b></div>' +
          (opts.preview ? '<div class="actions"><span class="btn btn-primary sm is-static">Agendar</span></div>' :
          '<div class="actions"><button class="btn btn-ghost sm" data-action="profile" data-offer="' + o.id + '">Ver perfil</button><button class="btn btn-primary sm" data-action="book" data-offer="' + o.id + '"' + (next ? '' : ' disabled') + '>Agendar</button></div>') +
        '</footer>' +
      '</article>';
  }

  /* =======================================================================
     Router y modos
     ======================================================================= */
  const VIEWS = {
    explorar:    { title: 'Explorar tutores',    role: 'Vista estudiante', persona: 'student', render: renderExplorar, after: afterExplorar },
    agenda:      { title: 'Mi agenda',           role: 'Vista estudiante', persona: 'student', render: renderAgenda },
    tutor:       { title: 'Portal del tutor',    role: 'Vista tutor par',  persona: 'tutor',   render: renderTutor },
    institucion: { title: 'Panel institucional', role: 'Vista institución', persona: 'inst',   render: renderInst }
  };

  function setModeClass(mode) {
    document.body.classList.toggle('mode-app', mode === 'app');
    document.body.classList.toggle('mode-pitch', mode === 'pitch');
  }

  function route() {
    const h = location.hash || '';
    if (h.indexOf('#app') === 0) {
      const v = h.split('/')[1];
      setModeClass('app');
      if (VIEWS[v]) S.view = v;
      closeAllOverlays();
      render();
    } else {
      setModeClass('pitch');
      closeAllOverlays();
      const n = parseInt(h.split('/')[1], 10);
      if (PL.pitch) PL.pitch.goTo(isNaN(n) ? (PL.pitch.index || 0) : n - 1, true);
    }
  }

  function go(view) {
    const target = '#app/' + view;
    if (location.hash === target) { S.view = view; render(); }
    else location.hash = target;
  }

  PL.setMode = function (mode) {
    if (mode === 'app') go(S.view);
    else location.hash = '#pitch/' + ((PL.pitch ? PL.pitch.index : 0) + 1);
  };

  function render() {
    const v = VIEWS[S.view];
    $('#crumb-title').textContent = v.title;
    const rp = $('#crumb-role');
    rp.textContent = v.role;
    rp.dataset.role = v.persona;
    renderPersona(v.persona);
    $$('.nav-item').forEach((a) => a.classList.toggle('active', a.dataset.nav === S.view));
    const host = $('#view-host');
    host.innerHTML = v.render();
    PL.hydrateIcons(host);
    if (v.after) v.after();
    host.scrollTop = 0;
    window.scrollTo(0, 0);
    updateBadges();
  }

  function renderPersona(key) {
    const p = D.personas[key] || D.personas.student;
    $('#persona').innerHTML = avatar(p, 38) + '<div class="persona-copy"><b>' + esc(p.name) + '</b><small>' + esc(p.detail) + '</small></div>' +
      '<div class="persona-dropdown" id="persona-dropdown">' +
        '<button type="button" class="persona-opt ' + (key === 'student' ? 'active' : '') + '" data-set-persona="student">' + avatar(D.personas.student, 28) + '<div><b>Juan Carrascal</b><small style="display:block;font-size:10.5px;color:var(--c-text-muted);">Estudiante (1.er semestre)</small></div></button>' +
        '<button type="button" class="persona-opt ' + (key === 'tutor' ? 'active' : '') + '" data-set-persona="tutor">' + avatar(D.personas.tutor, 28) + '<div><b>Laura Restrepo</b><small style="display:block;font-size:10.5px;color:var(--c-text-muted);">Tutora par (8.º semestre)</small></div></button>' +
        '<button type="button" class="persona-opt ' + (key === 'inst' ? 'active' : '') + '" data-set-persona="inst">' + avatar(D.personas.inst, 28) + '<div><b>Bienestar Universitario</b><small style="display:block;font-size:10.5px;color:var(--c-text-muted);">Dirección Académica B2B</small></div></button>' +
      '</div>';
  }

  function updateBadges() {
    const now = new Date();
    const upcoming = S.bookings.filter((b) => (b.status === 'confirmada' || b.status === 'pendiente') && b.start > now).length;
    const pend = S.requests.filter((r) => r.status === 'pendiente').length;
    const ba = $('#badge-agenda'), bt = $('#badge-tutor');
    ba.textContent = upcoming || ''; ba.hidden = !upcoming;
    bt.textContent = pend || ''; bt.hidden = !pend;
    const unread = S.notifs.filter((n) => n.unread).length;
    $('#bell-dot').hidden = !unread;
  }

  /* =======================================================================
     Toasts, modal, drawer, notificaciones
     ======================================================================= */
  function toast(o) {
    const type = o.type || 'success';
    const el = document.createElement('div');
    el.className = 'toast t-' + type;
    el.innerHTML = '<span class="t-icon">' + I(type === 'success' ? 'check' : type === 'warn' ? 'alert' : 'info', 16) + '</span>' +
      '<div class="t-copy"><b>' + esc(o.title) + '</b>' + (o.body ? '<span>' + esc(o.body) + '</span>' : '') + '</div>' +
      (o.action ? '<button class="t-action" type="button">' + esc(o.action.label) + '</button>' : '') +
      '<button class="t-close" type="button" aria-label="Cerrar">' + I('x', 14) + '</button>';
    const remove = () => { el.classList.add('out'); setTimeout(() => el.remove(), 260); };
    el.querySelector('.t-close').onclick = remove;
    if (o.action) el.querySelector('.t-action').onclick = () => { o.action.fn(); remove(); };
    $('#toasts').appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    setTimeout(remove, o.duration || 5200);
  }

  function addNotif(n) { S.notifs.unshift(Object.assign({ when: 'justo ahora', unread: true }, n)); updateBadges(); }

  const modal = () => $('#modal');
  function showModal(html, size) {
    const m = modal();
    m.innerHTML = '<div class="modal-card ' + (size || '') + '">' + html + '</div>';
    PL.hydrateIcons(m);
    m.classList.add('open');
    document.body.classList.add('no-scroll');
  }
  function setModal(html, size) {
    const m = modal();
    const card = m.querySelector('.modal-card');
    if (!card) return showModal(html, size);
    card.className = 'modal-card ' + (size || '');
    card.innerHTML = html;
    PL.hydrateIcons(card);
  }
  function closeModal() {
    modal().classList.remove('open');
    document.body.classList.remove('no-scroll');
    S.bk = null; S.rt = null;
  }
  function openDrawer(html) {
    const d = $('#drawer');
    d.innerHTML = html;
    PL.hydrateIcons(d);
    d.classList.add('open');
    $('#drawer-backdrop').classList.add('open');
    d.scrollTop = 0;
  }
  function closeDrawer() { $('#drawer').classList.remove('open'); $('#drawer-backdrop').classList.remove('open'); }
  function closeAllOverlays() { closeModal(); closeDrawer(); $('#notif-pop').classList.remove('open'); }

  function renderNotifs() {
    const pop = $('#notif-pop');
    pop.innerHTML = '<header><b>Notificaciones</b><button class="link" data-notif="read">Marcar todo como leído</button></header>' +
      '<ul>' + S.notifs.slice(0, 6).map((n) => '<li class="' + (n.unread ? 'unread' : '') + '"><span class="n-icon tone-' + n.tone + '">' + I(n.icon, 16) + '</span><div><b>' + esc(n.title) + '</b><span>' + esc(n.body) + '</span><small>' + esc(n.when) + '</small></div></li>').join('') + '</ul>';
  }

  /* =======================================================================
     VISTA 1 · EXPLORAR TUTORES
     ======================================================================= */
  function renderExplorar() {
    const f = S.filters;
    const hr = new Date().getHours();
    const greet = hr < 12 ? 'Buenos días' : hr < 19 ? 'Buenas tardes' : 'Buenas noches';
    const trending = ['Árboles binarios', 'Regla de la cadena', 'Ciclos for / while', 'Polimorfismo', 'Logaritmos'];
    const seg = (key, opts) => '<div class="seg" data-filter="' + key + '">' + opts.map((o) => '<button type="button" class="' + (f[key] === o[0] ? 'on' : '') + '" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>';
    return '' +
      '<section class="view view-explorar">' +
        '<div class="hero">' +
          '<div class="hero-main">' +
            '<span class="eyebrow mono">' + greet + ', Juan</span>' +
            '<h1>¿Qué tema se te está complicando hoy?</h1>' +
            '<p>Encuentra un tutor par que ya aprobó la materia, revisa su nota verificada y agenda en tu hueco libre.</p>' +
            '<label class="searchbox">' + I('search', 20) + '<input id="q" type="search" autocomplete="off" placeholder="Busca un tema, asignatura o tutor… ej. árboles binarios" value="' + esc(f.q) + '"><kbd>/</kbd></label>' +
            '<div class="trending"><span>Más buscado esta semana</span>' + trending.map((t) => '<button type="button" class="chip chip-btn" data-action="quick" data-q="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>' +
          '</div>' +
          '<div class="hero-aside">' +
            '<div class="exam-alert">' + I('flame', 18) + '<div><b>Se acercan los parciales</b><span>En semana de parciales la demanda se duplica. Reserva con tiempo.</span></div></div>' +
            '<div class="hero-stats">' +
              '<div><b class="mono">47</b><span>tutores verificados</span></div>' +
              '<div><b class="mono">8</b><span>asignaturas críticas</span></div>' +
              '<div><b class="mono">15<small>min</small></b><span>respuesta promedio</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="filterbar">' +
          '<div class="field"><label>Asignatura</label><div class="select-wrap"><select id="f-subject"><option value="all">Todas las asignaturas</option>' +
            D.subjects.map((s) => '<option value="' + s.id + '"' + (f.subject === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('') +
          '</select>' + I('chevron-down', 16) + '</div></div>' +
          '<div class="field"><label>Modalidad</label>' + seg('modality', [['all', 'Todas'], ['presencial', 'Presencial'], ['virtual', 'Virtual']]) + '</div>' +
          '<div class="field"><label>Costo para ti</label>' + seg('cost', [['all', 'Todas'], ['gratis', 'Gratuitas'], ['pago', 'Remuneradas']]) + '</div>' +
          '<div class="field"><label>Confianza</label><label class="switch"><input type="checkbox" id="f-grade"' + (f.minGrade ? ' checked' : '') + '><span class="track"></span><span>Nota ≥ 4.5</span></label></div>' +
          '<div class="field push"><label>Ordenar por</label><div class="select-wrap"><select id="f-sort">' +
            [['recommended', 'Recomendados para ti'], ['rating', 'Mejor calificados'], ['grade', 'Mayor nota en la materia'], ['price', 'Menor costo'], ['soon', 'Cupo más próximo']].map((o) => '<option value="' + o[0] + '"' + (f.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') +
          '</select>' + I('chevron-down', 16) + '</div></div>' +
        '</div>' +

        '<div class="results-head" id="results-head"></div>' +
        '<div class="cards" id="cards"></div>' +
      '</section>';
  }

  function afterExplorar() {
    renderResults();
    if (S.highlight) {
      const el = $('[data-offer="' + S.highlight + '"]');
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
      setTimeout(() => { S.highlight = null; const e2 = $('.tcard.is-highlight'); if (e2) e2.classList.remove('is-highlight'); }, 3200);
    }
  }

  function filteredOffers() {
    const f = S.filters, q = norm(f.q);
    let list = S.offers.filter((o) => {
      const t = tutorById(o.tutorId), s = subjectById(o.subject);
      if (f.subject !== 'all' && o.subject !== f.subject) return false;
      if (f.modality !== 'all' && o.modality.indexOf(f.modality) < 0) return false;
      if (f.cost === 'gratis' && o.incentive === 'pago') return false;
      if (f.cost === 'pago' && o.incentive !== 'pago') return false;
      if (f.minGrade && (t.grades[o.subject] || 0) < 4.5) return false;
      if (q) {
        const hay = norm([t.name, s.name, s.short, s.area, t.program].concat(o.topics).join(' '));
        return q.split(/\s+/).every((w) => hay.includes(w));
      }
      return true;
    });
    const score = (o) => {
      const t = tutorById(o.tutorId);
      return t.rating * 2 + (t.grades[o.subject] || 0) + matchedTopics(o).length * 3 + (o.isNew ? 4 : 0) + (o.incentive !== 'pago' ? 0.6 : 0) + t.attendance / 100;
    };
    const sorters = {
      recommended: (a, b) => score(b) - score(a),
      rating: (a, b) => tutorById(b.tutorId).rating - tutorById(a.tutorId).rating,
      grade: (a, b) => (tutorById(b.tutorId).grades[b.subject] || 0) - (tutorById(a.tutorId).grades[a.subject] || 0),
      price: (a, b) => (a.incentive === 'pago' ? a.rate : 0) - (b.incentive === 'pago' ? b.rate : 0),
      soon: (a, b) => ((nextSlot(a.tutorId, offerAvail(a)) || 9e15) - (nextSlot(b.tutorId, offerAvail(b)) || 9e15))
    };
    return list.sort(sorters[f.sort] || sorters.recommended);
  }

  function renderResults() {
    const f = S.filters;
    const list = filteredOffers();
    const chips = [];
    if (f.q) chips.push(['q', '“' + f.q + '”']);
    if (f.subject !== 'all') chips.push(['subject', subjectById(f.subject).short]);
    if (f.modality !== 'all') chips.push(['modality', f.modality === 'presencial' ? 'Presencial' : 'Virtual']);
    if (f.cost !== 'all') chips.push(['cost', f.cost === 'gratis' ? 'Gratuitas' : 'Remuneradas']);
    if (f.minGrade) chips.push(['minGrade', 'Nota ≥ 4.5']);
    const head = $('#results-head');
    head.innerHTML = '<p><b>' + list.length + '</b> ' + (list.length === 1 ? 'tutor disponible' : 'tutores disponibles') + '</p>' +
      (chips.length ? '<div class="active-chips">' + chips.map((c) => '<button type="button" class="chip chip-active" data-action="clear-filter" data-key="' + c[0] + '">' + esc(c[1]) + I('x', 12) + '</button>').join('') + '<button type="button" class="link" data-action="clear-all">Limpiar filtros</button></div>' : '<span class="muted">Ordenados por compatibilidad con tu búsqueda, nota y reputación</span>');
    const cards = $('#cards');
    if (!list.length) {
      cards.innerHTML = '<div class="empty">' +
        '<div class="empty-icon">' + I('search', 28) + '</div>' +
        '<h3>Aún no hay tutores para esa búsqueda</h3>' +
        '<p>Prueba quitando un filtro o buscando por asignatura. También podemos avisarte apenas un tutor verificado publique ese tema.</p>' +
        '<div class="empty-actions"><button class="btn btn-secondary" data-action="clear-all">Limpiar filtros</button><button class="btn btn-primary" data-action="notify-me">' + I('bell', 16) + 'Avisarme</button></div>' +
      '</div>';
    } else {
      cards.innerHTML = list.map((o) => offerCard(o)).join('');
    }
    PL.hydrateIcons(head); PL.hydrateIcons(cards);
  }

  /* ---------- Perfil del tutor (drawer) ---------- */
  function openProfile(offerId) {
    const o = offerById(offerId), t = tutorById(o.tutorId);
    const verified = Object.keys(t.grades).filter((k) => t.grades[k] >= D.rules.minGrade).sort((a, b) => t.grades[b] - t.grades[a]);
    const others = S.offers.filter((x) => x.tutorId === t.id && x.id !== o.id);
    const avail = offerAvail(o);
    const days = [1, 2, 3, 4, 5, 6];
    openDrawer('' +
      '<div class="drawer-head" style="--h:' + t.hue + '">' +
        '<button class="icon-btn on-dark" data-close type="button" aria-label="Cerrar">' + I('x') + '</button>' +
        '<div class="dh-id">' + avatar(t, 76, 'ring') +
          '<div><h3>' + esc(t.name) + I('shield-check', 20, 'verified') + '</h3><p>' + esc(t.program) + ' · ' + t.semester + '.º semestre</p>' +
          '<div class="dh-tags">' + incentiveTag(o) + '<span class="tag tag-ghost">' + modalityLabel(o.modality) + '</span></div></div>' +
        '</div>' +
      '</div>' +
      '<div class="drawer-body">' +
        '<div class="stat-row">' +
          '<div><b>' + I('star', 16, 'star fill') + t.rating.toFixed(1) + '</b><span>' + t.reviews + ' reseñas</span></div>' +
          '<div><b>' + t.sessions + '</b><span>sesiones dadas</span></div>' +
          '<div><b>' + t.attendance + '%</b><span>asistencia</span></div>' +
          '<div><b>' + t.response + '<small>min</small></b><span>respuesta</span></div>' +
        '</div>' +
        '<section><h4>Sobre mí</h4><p>' + esc(t.bio) + '</p></section>' +
        '<section><h4>' + I('shield-check', 16) + 'Notas de aprobación verificadas</h4>' +
          '<p class="hint">Validadas con Admisiones y Registro. Solo se publican asignaturas aprobadas con nota ≥ ' + D.rules.minGrade.toFixed(1) + '.</p>' +
          '<ul class="grades">' + verified.map((k) => '<li class="' + (k === o.subject ? 'current' : '') + '"><span>' + esc(subjectById(k).name) + '</span><div class="gbar"><span style="width:' + (t.grades[k] / 5 * 100) + '%"></span></div><b class="mono">' + t.grades[k].toFixed(1) + '</b></li>').join('') + '</ul>' +
        '</section>' +
        '<section><h4>Temario que domina en ' + esc(subjectById(o.subject).short) + '</h4><div class="topics">' + o.topics.map((tp) => '<span class="chip">' + esc(tp) + '</span>').join('') + '</div>' +
          (others.length ? '<p class="hint mt">También enseña: ' + others.map((x) => '<button class="link" data-action="profile" data-offer="' + x.id + '">' + esc(subjectById(x.subject).name) + '</button>').join(', ') + '</p>' : '') +
        '</section>' +
        '<section><h4>Metodología</h4><p>' + esc(o.method || t.method) + '</p></section>' +
        '<section><h4>Disponibilidad semanal</h4><div class="week-mini">' + days.map((d) => '<div class="wm-col"><span>' + WD[d] + '</span>' + ((avail[d] || []).map((tm) => '<em class="mono">' + tm + '</em>').join('') || '<i>—</i>') + '</div>').join('') + '</div></section>' +
        '<section><h4>Reseñas verificadas</h4><p class="hint">Solo puede reseñar quien completó una sesión con el tutor.</p><ul class="reviews">' +
          t.reviewsList.map((r) => '<li><header><span class="avatar xs" style="--h:' + ((r.author.charCodeAt(0) * 37) % 360) + '">' + esc(initials(r.author)) + '</span><b>' + esc(r.author) + '</b>' + stars(r.rating, 13) + '<small>' + esc(r.when) + '</small></header><p>' + esc(r.text) + '</p><span class="verified-session">' + I('check-circle', 12) + 'Sesión completada · ' + esc(subjectById(r.subject).short) + '</span></li>').join('') +
        '</ul></section>' +
      '</div>' +
      '<div class="drawer-foot"><div class="price-block">' + (o.incentive === 'pago' ? '<b class="mono">' + COP(o.rate) + '</b><span>por hora · pagas al tutor</span>' : '<b>Gratis para ti</b><span>' + (o.incentive === 'social' ? 'El tutor suma horas de bienestar' : 'El tutor suma certificación pedagógica') + '</span>') + '</div>' +
        '<button class="btn btn-primary lg" data-action="book" data-offer="' + o.id + '" type="button">Agendar tutoría' + I('arrow-right', 18) + '</button></div>'
    );
  }

  /* ---------- Reserva en 3 pasos ---------- */
  function openBooking(offerId) {
    const o = offerById(offerId);
    const m = matchedTopics(o);
    S.bk = { offerId: offerId, step: 1, topic: m[0] || null, modality: o.modality[0], day: null, slot: null, note: '', file: '', commit: false };
    showModal('', 'booking');
    renderBooking();
  }

  function renderBooking() {
    const bk = S.bk; if (!bk) return;
    const o = offerById(bk.offerId), t = tutorById(o.tutorId), s = subjectById(o.subject);
    const steps = ['Tema', 'Horario', 'Confirmar'];
    const head = '<header class="m-head">' +
      '<div class="m-tutor">' + avatar(t, 44) + '<div><small>Agendar tutoría con</small><b>' + esc(t.name) + '</b><span>' + esc(s.name) + ' · nota ' + (t.grades[o.subject] || 0).toFixed(1) + '</span></div></div>' +
      '<button class="icon-btn" data-close type="button" aria-label="Cerrar">' + I('x') + '</button></header>';
    const stepper = bk.step <= 3 ? '<ol class="stepper">' + steps.map((st, i) => '<li class="' + (i + 1 < bk.step ? 'done' : i + 1 === bk.step ? 'active' : '') + '"><span>' + (i + 1 < bk.step ? I('check', 13) : i + 1) + '</span>' + st + '</li>').join('') + '</ol>' : '';
    let body = '', foot = '';

    if (bk.step === 1) {
      body = '<label class="m-label">¿Qué tema quieres reforzar?</label>' +
        '<div class="choice-chips">' + o.topics.concat(['Otro tema']).map((tp) => '<button type="button" class="chip chip-select ' + (bk.topic === tp ? 'on' : '') + '" data-bk="topic" data-v="' + esc(tp) + '">' + (bk.topic === tp ? I('check', 13) : '') + esc(tp) + '</button>').join('') + '</div>' +
        '<label class="m-label">Modalidad</label>' +
        '<div class="option-cards">' +
          (o.modality.indexOf('presencial') >= 0 ? optionCard('presencial', 'map-pin', 'Presencial en campus', t.place) : '') +
          (o.modality.indexOf('virtual') >= 0 ? optionCard('virtual', 'video', 'Virtual', 'Google Meet · enlace automático') : '') +
        '</div>' +
        '<label class="m-label">Cuéntale al tutor qué necesitas <span class="muted">(opcional)</span></label>' +
        '<textarea data-bk-input="note" rows="3" placeholder="Ej: tengo parcial el viernes y no entiendo el recorrido inorden…">' + esc(bk.note) + '</textarea>' +
        '<label class="file-drop">' + I('paperclip', 16) + '<span>' + (bk.file ? '<b>' + esc(bk.file) + '</b> adjunto' : 'Adjuntar taller o código (PDF, imagen, .java)') + '</span><input type="file" data-bk-file></label>';
      foot = '<button class="btn btn-ghost" data-close type="button">Cancelar</button><button class="btn btn-primary" data-bk-next type="button"' + (bk.topic ? '' : ' disabled') + '>Continuar' + I('arrow-right', 16) + '</button>';
    }

    if (bk.step === 2) {
      const days = slotsByDay(t.id, offerAvail(o));
      if (!bk.day && days.length) bk.day = days[0].date;
      const cur = days.find((d) => bk.day && sameDay(d.date, bk.day)) || days[0];
      body = '<label class="m-label">Elige un día</label>' +
        '<div class="day-pills">' + days.map((d) => {
          const free = d.slots.filter((x) => !x.past && !x.taken).length;
          return '<button type="button" class="day-pill ' + (cur && sameDay(d.date, cur.date) ? 'on' : '') + '" data-bk="day" data-v="' + d.date.getTime() + '"' + (free ? '' : ' disabled') + '><span>' + (fmtDay(d.date) === 'Hoy' || fmtDay(d.date) === 'Mañana' ? fmtDay(d.date) : WD[d.date.getDay()]) + '</span><b>' + d.date.getDate() + '</b><small>' + (free ? free + (free === 1 ? ' cupo' : ' cupos') : 'Lleno') + '</small></button>';
        }).join('') + '</div>' +
        '<label class="m-label">Bloques de 1 hora disponibles</label>' +
        '<div class="slot-grid">' + (cur ? cur.slots.map((x) => {
          const dis = x.past || x.taken;
          return '<button type="button" class="slot ' + (bk.slot === x.time ? 'on' : '') + '" data-bk="slot" data-v="' + x.time + '"' + (dis ? ' disabled' : '') + '><b class="mono">' + x.time + '</b><small>' + (x.taken ? 'Ocupado' : x.past ? 'No disponible' : 'hasta ' + pad(Number(x.time.slice(0, 2)) + 1) + ':00') + '</small></button>';
        }).join('') : '<p class="muted">El tutor no tiene cupos en los próximos días.</p>') + '</div>' +
        '<p class="m-hint">' + I('info', 14) + 'Solo ves bloques libres del tutor que no se cruzan con tu agenda.</p>';
      foot = '<button class="btn btn-ghost" data-bk-back type="button">' + I('arrow-left', 16) + 'Atrás</button><button class="btn btn-primary" data-bk-next type="button"' + (bk.slot ? '' : ' disabled') + '>Continuar' + I('arrow-right', 16) + '</button>';
    }

    if (bk.step === 3) {
      const start = at(bk.day, bk.slot);
      const place = bk.modality === 'presencial' ? t.place : 'Google Meet (enlace al confirmar)';
      body = '<div class="summary">' +
          sumRow('calendar', 'Fecha y hora', fmtDay(start, true) + ' · ' + bk.slot + ' – ' + pad(Number(bk.slot.slice(0, 2)) + 1) + ':00') +
          sumRow('book-open', 'Tema', bk.topic + ' · ' + s.short) +
          sumRow(bk.modality === 'presencial' ? 'map-pin' : 'video', bk.modality === 'presencial' ? 'Lugar' : 'Modalidad', place) +
          (bk.file ? sumRow('paperclip', 'Adjunto', bk.file) : '') +
        '</div>' +
        '<div class="cost-box ' + (o.incentive === 'pago' ? '' : 'free') + '">' +
          (o.incentive === 'pago'
            ? '<div><span>Tarifa del tutor (1 h)</span><b class="mono">' + COP(o.rate) + '</b></div><small>Pagas solo si la sesión se realiza. PeerLearn no te cobra cargos adicionales.</small>'
            : '<div><span>Costo para ti</span><b class="mono">$0</b></div><small>' + (o.incentive === 'social' ? 'Tutoría de servicio social avalada por Bienestar Universitario.' : 'El tutor acumula certificación pedagógica por esta sesión.') + '</small>') +
        '</div>' +
        '<div class="policy">' + I('shield-check', 18) +
          '<div><b>Compromiso de asistencia</b><span>Te recordamos 24 h y 1 h antes. Cancelación gratuita hasta ' + D.rules.freeCancelHours + ' h antes; las ausencias repetidas limitan nuevas reservas, para cuidar el tiempo de los tutores.</span></div>' +
        '</div>' +
        '<label class="check"><input type="checkbox" data-bk-commit' + (bk.commit ? ' checked' : '') + '><span class="box">' + I('check', 13) + '</span>Me comprometo a asistir o cancelar con anticipación</label>';
      foot = '<button class="btn btn-ghost" data-bk-back type="button">' + I('arrow-left', 16) + 'Atrás</button><button class="btn btn-primary" data-bk-confirm type="button"' + (bk.commit ? '' : ' disabled') + '>' + I('check', 16) + 'Confirmar reserva</button>';
    }

    if (bk.step === 4) {
      const b = S.bookings.find((x) => x.id === bk.bookingId);
      body = '<div class="success">' +
        '<div class="success-mark"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-15"/></svg></div>' +
        '<h3>¡Solicitud enviada!</h3>' +
        '<p>' + esc(first(t.name)) + ' recibirá tu solicitud y la confirmará en minutos. Ya la agregamos a tu agenda.</p>' +
        '<div class="success-card">' + avatar(t, 40) + '<div><b>' + esc(b.topic) + ' · ' + esc(s.short) + '</b><span>' + fmtDay(b.start, true) + ' · ' + fmtTime(b.start) + ' · ' + (b.modality === 'presencial' ? esc(t.place) : 'Google Meet') + '</span></div><span class="status-chip st-pendiente">Pendiente</span></div>' +
      '</div>';
      foot = '<button class="btn btn-ghost" data-close type="button">Seguir explorando</button><button class="btn btn-primary" data-action="goto-agenda" type="button">' + I('calendar', 16) + 'Ver en mi agenda</button>';
    }

    setModal(head + stepper + '<div class="m-body">' + body + '</div><footer class="m-foot">' + foot + '</footer>', 'booking');
  }
  function optionCard(v, icon, title, sub) {
    const on = S.bk.modality === v;
    return '<button type="button" class="option-card ' + (on ? 'on' : '') + '" data-bk="modality" data-v="' + v + '"><span class="oc-icon">' + I(icon, 18) + '</span><span><b>' + title + '</b><small>' + esc(sub) + '</small></span><span class="radio"></span></button>';
  }
  function sumRow(icon, label, val) { return '<div class="sum-row"><span class="sr-icon">' + I(icon, 16) + '</span><span>' + label + '</span><b>' + esc(val) + '</b></div>'; }

  function confirmBooking() {
    const bk = S.bk, o = offerById(bk.offerId), t = tutorById(o.tutorId), s = subjectById(o.subject);
    const start = at(bk.day, bk.slot);
    const b = { id: 'b' + Date.now(), offerId: o.id, tutorId: t.id, subject: o.subject, topic: bk.topic, start: start, modality: bk.modality, location: bk.modality === 'presencial' ? t.place : 'Google Meet', status: 'pendiente', note: bk.note, rate: o.incentive === 'pago' ? o.rate : 0, isNew: true };
    S.bookings.push(b);
    saveState();
    bk.step = 4; bk.bookingId = b.id;
    renderBooking();
    updateBadges();
    // El tutor confirma unos segundos después (simulación en vivo)
    setTimeout(() => {
      if (b.status !== 'pendiente') return;
      b.status = 'confirmada';
      saveState();
      addNotif({ icon: 'check-circle', tone: 'emerald', title: first(t.name) + ' confirmó tu tutoría', body: s.short + ' · ' + fmtDay(start) + ' ' + fmtTime(start) });
      toast({ title: first(t.name) + ' confirmó tu tutoría', body: s.short + ' · ' + fmtDay(start, true) + ' · ' + fmtTime(start), action: { label: 'Ver agenda', fn: () => { closeModal(); go('agenda'); } } });
      if (S.view === 'agenda' && !modal().classList.contains('open')) render();
      updateBadges();
    }, 4200);
  }

  /* =======================================================================
     VISTA 2 · MI AGENDA
     ======================================================================= */
  const H0 = 7, H1 = 21, RH = 52;

  function renderAgenda() {
    const start = S.agendaStart, end = addDays(start, 7), today = today0(), now = new Date();
    const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(start, i));
    const evs = S.bookings.filter((b) => b.status !== 'cancelada' && b.start >= start && b.start < end);
    const last = addDays(start, 6);
    const range = start.getDate() + (start.getMonth() !== last.getMonth() ? ' ' + MON[start.getMonth()] : '') + ' – ' + last.getDate() + ' ' + MON[last.getMonth()] + ' ' + last.getFullYear();
    const hours = []; for (let h = H0; h < H1; h++) hours.push(h);

    const upcoming = S.bookings.filter((b) => (b.status === 'confirmada' || b.status === 'pendiente') && b.start > now).sort((a, b) => a.start - b.start);
    const next = upcoming[0];
    const toReview = S.bookings.filter((b) => b.status === 'completada' && !b.reviewed);
    const done = S.bookings.filter((b) => b.status === 'completada');
    const subjectsDone = Array.from(new Set(done.map((b) => b.subject)));
    const lastDone = done.slice().sort((a, b) => b.start - a.start)[0];

    const eventBlock = (b) => {
      const t = tutorById(b.tutorId), s = subjectById(b.subject);
      const top = (b.start.getHours() - H0 + b.start.getMinutes() / 60) * RH;
      return '<button type="button" class="ev ev-' + b.status + (b.isNew ? ' ev-new' : '') + '" style="top:' + top + 'px;height:' + (RH - 4) + 'px" data-action="event" data-id="' + b.id + '">' +
        '<b>' + fmtTime(b.start) + ' · ' + esc(s.short) + '</b><span>' + I(b.modality === 'presencial' ? 'map-pin' : 'video', 11) + esc(first(t.name)) + ' · ' + esc(b.topic) + '</span></button>';
    };
    const nowLine = (d) => {
      if (!sameDay(d, now)) return '';
      const h = now.getHours() + now.getMinutes() / 60;
      if (h < H0 || h > H1) return '';
      return '<span class="now-line" style="top:' + ((h - H0) * RH) + 'px"></span>';
    };

    return '' +
      '<section class="view view-agenda">' +
        '<div class="agenda-layout">' +
          '<div class="card cal">' +
            '<div class="cal-toolbar">' +
              '<div><h3>' + range + '</h3><p>' + evs.length + (evs.length === 1 ? ' tutoría' : ' tutorías') + ' en estos 7 días</p></div>' +
              '<div class="legend"><span><i class="lg confirmada"></i>Confirmada</span><span><i class="lg pendiente"></i>Pendiente</span><span><i class="lg completada"></i>Realizada</span></div>' +
              '<div class="cal-nav"><button class="icon-btn" data-action="cal-prev" type="button" aria-label="Anterior">' + I('chevron-left') + '</button><button class="btn btn-secondary sm" data-action="cal-today" type="button">Hoy</button><button class="icon-btn" data-action="cal-next" type="button" aria-label="Siguiente">' + I('chevron-right') + '</button></div>' +
            '</div>' +
            '<div class="cal-grid" style="--rh:' + RH + 'px;--rows:' + (H1 - H0) + '">' +
              '<div class="cal-head"><div class="tz mono">GMT-5</div>' + days.map((d) => '<div class="dh' + (sameDay(d, today) ? ' today' : '') + (d.getDay() === 0 ? ' off' : '') + '"><span>' + WD[d.getDay()] + '</span><b>' + d.getDate() + '</b></div>').join('') + '</div>' +
              '<div class="cal-body">' +
                '<div class="hours">' + hours.map((h) => '<span class="mono">' + pad(h) + ':00</span>').join('') + '</div>' +
                days.map((d) => '<div class="col' + (d.getDay() === 0 ? ' off' : '') + (sameDay(d, today) ? ' today' : '') + '">' + evs.filter((b) => sameDay(b.start, d)).map(eventBlock).join('') + nowLine(d) + '</div>').join('') +
              '</div>' +
            '</div>' +
          '</div>' +

          '<aside class="agenda-side">' +
            (next ? nextCard(next) : '<div class="card next-card empty-next"><h4>Sin tutorías próximas</h4><p>Busca un tema y agenda tu primera sesión.</p><button class="btn btn-primary" data-nav-go="explorar" type="button">Explorar tutores</button></div>') +
            '<div class="card side-card"><h4>' + I('star', 16) + 'Por calificar</h4>' +
              (toReview.length ? '<ul class="review-list">' + toReview.map((b) => { const t = tutorById(b.tutorId); return '<li>' + avatar(t, 36) + '<div><b>' + esc(subjectById(b.subject).short) + ' · ' + esc(b.topic) + '</b><span>con ' + esc(first(t.name)) + ' · ' + fmtDay(b.start) + '</span></div><button class="btn btn-gold sm" data-action="rate" data-id="' + b.id + '" type="button">Calificar</button></li>'; }).join('') + '</ul><p class="hint">Tu reseña ayuda a otros estudiantes a elegir con confianza.</p>'
                : '<p class="muted small">Estás al día. ¡Gracias por calificar!</p>') +
            '</div>' +
            '<div class="card side-card"><h4>' + I('trending-up', 16) + 'Tu progreso este semestre</h4>' +
              '<div class="progress-stats"><div><b class="mono">' + done.length + '</b><span>tutorías realizadas</span></div><div><b class="mono">' + subjectsDone.length + '</b><span>asignaturas reforzadas</span></div><div><b class="mono">' + done.length + '<small>h</small></b><span>estudio acompañado</span></div></div>' +
              (lastDone ? '<button class="repeat" data-action="book" data-offer="' + lastDone.offerId + '" type="button">' + avatar(tutorById(lastDone.tutorId), 32) + '<span><b>Repetir con ' + esc(first(tutorById(lastDone.tutorId).name)) + '</b><small>' + esc(subjectById(lastDone.subject).name) + '</small></span>' + I('repeat', 16) + '</button>' : '') +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</section>';
  }

  function nextCard(b) {
    const t = tutorById(b.tutorId), s = subjectById(b.subject);
    return '<div class="card next-card">' +
      '<div class="nc-top"><span class="eyebrow mono">Próxima tutoría</span><span class="countdown mono">' + fmtRel(b.start) + '</span></div>' +
      '<h3>' + esc(s.name) + '</h3><p class="nc-topic">' + esc(b.topic) + '</p>' +
      '<div class="nc-rows">' +
        '<div>' + I('calendar', 15) + fmtDay(b.start, true) + ' · ' + fmtTime(b.start) + ' – ' + pad(b.start.getHours() + 1) + ':00</div>' +
        '<div>' + I(b.modality === 'presencial' ? 'map-pin' : 'video', 15) + esc(b.modality === 'presencial' ? b.location : 'Google Meet · enlace activo 10 min antes') + '</div>' +
        '<div class="nc-tutor">' + avatar(t, 28) + esc(t.name) + '</div>' +
      '</div>' +
      (b.status === 'pendiente'
        ? '<div class="nc-status pend">' + I('clock', 15) + 'Esperando confirmación del tutor</div>'
        : b.attendance
          ? '<div class="nc-status ok">' + I('check-circle', 15) + 'Asistencia confirmada · te recordaremos 1 h antes</div>'
          : '<button class="btn btn-gold block" data-action="attend" data-id="' + b.id + '" type="button">' + I('check', 16) + 'Confirmar asistencia</button>') +
      '<button class="btn btn-primary block" data-action="join" data-id="' + b.id + '" type="button" style="margin-top:8px;">' + I('video', 15) + 'Entrar a Sala Virtual en Vivo</button>' +
      '<button class="link on-dark" data-action="event" data-id="' + b.id + '" type="button">Ver detalles' + I('arrow-right', 14) + '</button>' +
    '</div>';
  }

  function openEvent(id) {
    const b = S.bookings.find((x) => x.id === id); if (!b) return;
    const t = tutorById(b.tutorId), s = subjectById(b.subject), now = new Date();
    const future = b.start > now;
    const hoursLeft = (b.start - now) / 3600000;
    const label = { confirmada: 'Confirmada', pendiente: 'Pendiente', completada: 'Realizada', cancelada: 'Cancelada' }[b.status];
    let actions = '';
    if (b.status === 'completada') {
      actions = b.reviewed ? '<div class="rated">Tu calificación ' + stars(b.rating, 16) + '</div>' : '<button class="btn btn-gold" data-action="rate" data-id="' + b.id + '" type="button">' + I('star', 16) + 'Calificar sesión</button>';
    } else if (future) {
      actions = '<button class="btn btn-danger-ghost" data-action="cancel" data-id="' + b.id + '" type="button">Cancelar</button>';
      if (b.status === 'confirmada') {
        actions += b.modality === 'virtual' ? '<button class="btn btn-primary" data-action="join" data-id="' + b.id + '" type="button">' + I('video', 16) + 'Entrar a Sala Virtual</button>' : '<button class="btn btn-secondary" data-action="map" data-id="' + b.id + '" type="button">' + I('map-pin', 16) + 'Cómo llegar</button>';
        actions += b.attendance ? '<span class="status-chip st-confirmada">' + I('check', 12) + 'Asistencia confirmada</span>' : '<button class="btn btn-primary" data-action="attend" data-id="' + b.id + '" type="button">' + I('check', 16) + 'Confirmar asistencia</button>';
      }
    }
    showModal('' +
      '<header class="m-head ev-head st-' + b.status + '">' +
        '<div><span class="status-chip st-' + b.status + '">' + label + '</span><h3>' + esc(s.name) + '</h3><p>' + esc(b.topic) + '</p></div>' +
        '<button class="icon-btn" data-close type="button" aria-label="Cerrar">' + I('x') + '</button>' +
      '</header>' +
      '<div class="m-body">' +
        '<div class="summary">' +
          sumRow('calendar', 'Fecha', fmtDay(b.start, true) + ' · ' + fmtTime(b.start) + ' – ' + pad(b.start.getHours() + 1) + ':00') +
          sumRow('user', 'Tutor', t.name + ' · nota ' + (t.grades[b.subject] || 0).toFixed(1)) +
          sumRow(b.modality === 'presencial' ? 'map-pin' : 'video', b.modality === 'presencial' ? 'Lugar' : 'Modalidad', b.modality === 'presencial' ? b.location : 'Virtual · Google Meet') +
          sumRow('coins', 'Costo', b.rate ? COP(b.rate) : 'Gratis · ' + (offerById(b.offerId) && offerById(b.offerId).incentive === 'creditos' ? 'certificación' : 'servicio social')) +
          (b.note ? sumRow('message', 'Tu nota', b.note) : '') +
        '</div>' +
        (b.status === 'pendiente' ? '<p class="m-hint">' + I('clock', 14) + 'El tutor aún no confirma. Si no responde en 12 h, te sugerimos otros tutores con cupo.</p>' : '') +
        (future && b.status !== 'cancelada' && hoursLeft < D.rules.freeCancelHours ? '<p class="m-hint warn">' + I('alert', 14) + 'Faltan menos de ' + D.rules.freeCancelHours + ' h: cancelar ahora cuenta como ausencia.</p>' : '') +
      '</div>' +
      '<footer class="m-foot spread">' +
        (b.status === 'confirmada' && future ? '<button class="link muted" data-action="simulate-done" data-id="' + b.id + '" type="button">Demo · marcar como realizada</button>' : '<span></span>') +
        '<div class="m-actions">' + actions + '</div>' +
      '</footer>', 'event');
  }

  /* ---------- Calificación ---------- */
  const RT_LABELS = ['', 'Mala', 'Regular', 'Buena', 'Muy buena', 'Excelente'];
  const RT_TAGS = ['Explica claro', 'Domina el tema', 'Puntual', 'Paciente', 'Buen material', 'Resolvió mi duda'];
  function openRating(id) {
    S.rt = { id: id, stars: 0, tags: [], comment: '' };
    showModal('', 'rating');
    renderRating();
  }
  function renderRating() {
    const rt = S.rt; if (!rt) return;
    const b = S.bookings.find((x) => x.id === rt.id), t = tutorById(b.tutorId), s = subjectById(b.subject);
    let st = '';
    for (let i = 1; i <= 5; i++) st += '<button type="button" class="rt-star ' + (i <= rt.stars ? 'on' : '') + '" data-rt-star="' + i + '" aria-label="' + i + ' estrellas">' + I('star', 34, 'star ' + (i <= rt.stars ? 'fill' : '')) + '</button>';
    setModal('' +
      '<header class="m-head"><div class="m-tutor">' + avatar(t, 44) + '<div><small>Califica tu sesión con</small><b>' + esc(t.name) + '</b><span>' + esc(s.short) + ' · ' + esc(b.topic) + ' · ' + fmtDay(b.start) + '</span></div></div><button class="icon-btn" data-close type="button" aria-label="Cerrar">' + I('x') + '</button></header>' +
      '<div class="m-body center">' +
        '<div class="rt-stars">' + st + '</div><p class="rt-label">' + (rt.stars ? RT_LABELS[rt.stars] : 'Toca para calificar') + '</p>' +
        '<label class="m-label">¿Qué destacas?</label>' +
        '<div class="choice-chips center">' + RT_TAGS.map((tg) => '<button type="button" class="chip chip-select ' + (rt.tags.indexOf(tg) >= 0 ? 'on' : '') + '" data-rt-tag="' + esc(tg) + '">' + esc(tg) + '</button>').join('') + '</div>' +
        '<textarea data-rt-input rows="3" placeholder="Cuéntale a otros estudiantes cómo te fue (opcional)">' + esc(rt.comment) + '</textarea>' +
        '<p class="m-hint">' + I('shield-check', 14) + 'Reseña verificada: solo quienes completan una sesión pueden calificar.</p>' +
      '</div>' +
      '<footer class="m-foot"><button class="btn btn-ghost" data-close type="button">Más tarde</button><button class="btn btn-primary" data-rt-submit type="button"' + (rt.stars ? '' : ' disabled') + '>Publicar reseña</button></footer>', 'rating');
  }
  function submitRating() {
    const rt = S.rt, b = S.bookings.find((x) => x.id === rt.id), t = tutorById(b.tutorId);
    b.reviewed = true; b.rating = rt.stars;
    t.rating = Math.round(((t.rating * t.reviews + rt.stars) / (t.reviews + 1)) * 10) / 10;
    t.reviews += 1;
    t.reviewsList.unshift({ author: 'Juan C.', subject: b.subject, rating: rt.stars, text: rt.comment || (rt.tags.length ? rt.tags.join(' · ') + '.' : 'Muy buena sesión.'), when: 'justo ahora' });
    closeModal();
    saveState();
    toast({ title: '¡Gracias por tu reseña!', body: 'Ya es visible en el perfil de ' + first(t.name) + ' y ayuda a otros a elegir con confianza.' });
    render();
  }

  /* =======================================================================
     Sala Virtual de Tutoría (Simulador WebRTC en Vivo)
     ======================================================================= */
  function openMeetingRoom(id) {
    const b = S.bookings.find((x) => x.id === id) || S.bookings[0];
    const t = tutorById(b.tutorId), s = subjectById(b.subject);
    const pin = b.attendancePin || '4829';
    b.attendancePin = pin;

    const html = '' +
      '<div class="room-header">' +
        '<div class="room-title">' +
          '<span class="room-live-badge"><span class="pulse"></span>En vivo</span>' +
          '<div><b>' + esc(s.name) + ' · ' + esc(b.topic) + '</b><small style="display:block;color:#94A3B8;">Tutor: ' + esc(t.name) + ' (Promedio ' + (t.grades[b.subject] || 4.5).toFixed(1) + ')</small></div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<span class="mono" style="background:rgba(255,255,255,0.1);padding:4px 10px;border-radius:4px;font-size:12px;color:#FBBF24;">' + I('clock', 14) + ' 00:24:18</span>' +
          '<button class="btn btn-danger-ghost sm" data-close type="button" style="border:1px solid rgba(239,68,68,0.4);">' + I('x', 14) + ' Salir</button>' +
        '</div>' +
      '</div>' +
      '<div class="room-grid">' +
        '<div class="room-videos">' +
          '<div class="video-tile peer">' +
            '<div class="avatar-feed speaking-ring">' + esc(t.initials) + '</div>' +
            '<div class="video-label"><span style="color:#10B981;">●</span> ' + esc(t.name) + ' (Tutor par)</div>' +
          '</div>' +
          '<div class="video-tile">' +
            '<div class="avatar-feed" style="background:#2563EB;">JC</div>' +
            '<div class="video-label">Tú (Juan Carrascal)</div>' +
          '</div>' +
          '<div style="display:flex;justify-content:center;gap:8px;padding-top:4px;">' +
            '<button class="icon-btn" type="button" title="Micrófono" onclick="this.classList.toggle(\'on-dark\');PL.app.toast({type:\'info\',title:\'Micrófono alternado\'})">' + I('sparkles', 16) + '</button>' +
            '<button class="icon-btn" type="button" title="Cámara" onclick="PL.app.toast({type:\'info\',title:\'Cámara activa\'})">' + I('video', 16) + '</button>' +
            '<button class="icon-btn" type="button" title="Compartir pantalla" onclick="PL.app.toast({type:\'info\',title:\'Compartiendo pantalla colaborativa\'})">' + I('maximize', 16) + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="room-stage">' +
          '<div class="stage-tabs">' +
            '<button class="stage-tab active" id="tab-btn-code" onclick="document.getElementById(\'room-code-panel\').hidden=false;document.getElementById(\'room-chat-panel\').hidden=true;this.classList.add(\'active\');document.getElementById(\'tab-btn-chat\').classList.remove(\'active\');">' + I('file-text', 14) + 'Editor & Pizarra Python</button>' +
            '<button class="stage-tab" id="tab-btn-chat" onclick="document.getElementById(\'room-code-panel\').hidden=true;document.getElementById(\'room-chat-panel\').hidden=false;this.classList.add(\'active\');document.getElementById(\'tab-btn-code\').classList.remove(\'active\');">' + I('message', 14) + 'Chat de la sesión</button>' +
          '</div>' +
          '<div class="stage-body" id="room-code-panel">' +
            '<textarea class="code-box" spellcheck="false"># PeerLearn · Sesión en Vivo (I.U. Pascual Bravo)\n# Asignatura: ' + s.name + ' · Tema: ' + b.topic + '\n\nclass NodoArbol:\n    def __init__(self, valor):\n        self.valor = valor\n        self.izq = None\n        self.der = None\n\ndef recorrido_inorden(raiz):\n    # 1. Visitar subárbol izquierdo\n    if raiz.izq:\n        recorrido_inorden(raiz.izq)\n    # 2. Visitar raíz actual\n    print(raiz.valor, end=" -> ")\n    # 3. Visitar subárbol derecho\n    if raiz.der:\n        recorrido_inorden(raiz.der)\n\n# Prueba con el árbol del parcial:\narbol = NodoArbol(10)\narbol.izq = NodoArbol(5)\narbol.der = NodoArbol(15)\nprint("Recorrido validado con el tutor:")\nrecorrido_inorden(arbol)</textarea>' +
            '<p class="muted small" style="margin-top:6px;">' + I('check-circle', 13) + ' Pizarra colaborativa compartida en tiempo real con ' + esc(t.name) + '.</p>' +
          '</div>' +
          '<div class="stage-body" id="room-chat-panel" hidden>' +
            '<div class="chat-stream" id="room-chat-stream">' +
              '<div class="chat-msg"><b>' + esc(t.name) + ' (15:02):</b> ¡Hola Juan! Ya revisé el ejercicio 3 del parcial. Comencemos por la condición de parada del recorrido inorden.</div>' +
              '<div class="chat-msg mine"><b>Tú (15:03):</b> Perfecto Laura, me enredo siempre cuando el nodo raíz no tiene hijo izquierdo.</div>' +
              '<div class="chat-msg"><b>' + esc(t.name) + ' (15:04):</b> Revisa la línea 9 de la pizarra, justo ahí manejamos el caso base con <code>if raiz.izq:</code>.</div>' +
            '</div>' +
            '<form class="chat-input-bar" onsubmit="event.preventDefault();const inp=this.querySelector(\'input\');if(!inp.value.trim())return;const s=document.getElementById(\'room-chat-stream\');s.innerHTML+=\'<div class=\\\'chat-msg mine\\\'><b>Tú:</b> \'+inp.value+\'</div>\';inp.value=\'\';s.scrollTop=s.scrollHeight;setTimeout(()=>{s.innerHTML+=\'<div class=\\\'chat-msg\\\'><b>' + esc(t.name) + ':</b> ¡Exacto! Esa es la clave para que la recursión no caiga en bucle infinito.</div>\';s.scrollTop=s.scrollHeight;},1000);">' +
              '<input type="text" placeholder="Escribe un mensaje o duda para el tutor...">' +
              '<button class="btn btn-primary sm" type="submit">' + I('send', 14) + '</button>' +
            '</form>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="room-controls">' +
        '<div class="pin-banner">' +
          I('shield-check', 18) +
          '<span>PIN de asistencia de la sesión: <strong class="pin-val">' + pin + '</strong></span>' +
          '<span class="muted small">(Dicta este PIN al tutor para certificar la sesión)</span>' +
        '</div>' +
        '<div style="display:flex;gap:8px;">' +
          '<button class="btn btn-gold" type="button" data-room-verify="' + b.id + '">' + I('check-circle', 16) + ' Validar asistencia y finalizar</button>' +
        '</div>' +
      '</div>';

    showModal(html, 'room');
  }

  /* =======================================================================
     Ubicación en Campus (Punto de Encuentro)
     ======================================================================= */
  function openCampusMap(id) {
    const b = S.bookings.find((x) => x.id === id);
    const html = '' +
      '<header class="m-head"><div><h3>Punto de encuentro en campus</h3><p>I.U. Pascual Bravo · Medellín</p></div><button class="icon-btn" data-close type="button">' + I('x') + '</button></header>' +
      '<div class="m-body">' +
        '<div style="background:#0F172A;color:#fff;padding:24px;border-radius:6px;text-align:center;margin-bottom:14px;border:1px solid var(--c-border);">' +
          I('map-pin', 36) +
          '<h4 style="margin:10px 0 4px;font-size:16px;color:#FBBF24;">' + esc(b ? b.location : 'Biblioteca Central · Bloque 4') + '</h4>' +
          '<p style="font-size:12px;color:#94A3B8;">Mesa de trabajo 3 · Zona silenciosa de estudio grupal</p>' +
        '</div>' +
        '<div class="summary">' +
          sumRow('building', 'Campus', 'Sede Robledo · Calle 73 # 73A - 226') +
          sumRow('clock', 'Recomendación', 'Llegar 5 minutos antes con carnet institucional') +
          sumRow('shield-check', 'Seguridad', 'Espacio monitoreado con wifi institucional EDURoam') +
        '</div>' +
      '</div>' +
      '<footer class="m-foot"><button class="btn btn-primary block" data-close type="button">Entendido</button></footer>';
    showModal(html, 'map');
  }

  /* =======================================================================
     Certificado Oficial de Bienestar Universitario
     ======================================================================= */
  function openCertificateModal() {
    const html = '' +
      '<header class="m-head"><div><h3>Certificación Oficial de Permanencia</h3><p>Bienestar Universitario · I.U. Pascual Bravo</p></div><button class="icon-btn" data-close type="button">' + I('x') + '</button></header>' +
      '<div class="m-body" style="padding:10px;">' +
        '<div class="cert-sheet">' +
          '<div class="cert-head">' +
            '<div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:var(--c-gold-primary);font-weight:700;">Institución Universitaria Pascual Bravo</div>' +
            '<h3 style="margin-top:4px;">Certificado de Horas de Servicio Social y Tutoría Par</h3>' +
            '<div style="font-size:11px;color:gray;">Acreditación Institucional de Alta Calidad · Medellín, Colombia</div>' +
          '</div>' +
          '<div class="cert-body">' +
            '<p>La Dirección Académica y el Departamento de Bienestar Universitario certifican que el/la estudiante <strong>Laura Restrepo Calle</strong>, identificado/a con carnet institucional <strong>#PB-2023-1082</strong> del programa de <strong>Ingeniería de Software</strong>, cumplió satisfactoriamente con sus horas de acompañamiento pedagógico:</p>' +
            '<div class="cert-meta-grid">' +
              '<div><small style="text-transform:uppercase;font-size:10px;color:gray;">Horas Acreditadas</small><br><strong style="font-size:16px;color:var(--c-gold-primary);">18 Horas de Servicio Social</strong></div>' +
              '<div><small style="text-transform:uppercase;font-size:10px;color:gray;">Calificación Promedio Par</small><br><strong style="font-size:16px;color:#10B981;">4.9 / 5.0 (100% Satisfacción)</strong></div>' +
              '<div><small style="text-transform:uppercase;font-size:10px;color:gray;">Asignaturas Críticas</small><br><strong>Estructuras de Datos · Lógica</strong></div>' +
              '<div><small style="text-transform:uppercase;font-size:10px;color:gray;">Código de Validación</small><br><span class="mono" style="font-size:11px;">PB-PL-2026-8492-VERIFIED</span></div>' +
            '</div>' +
            '<p style="font-size:12px;color:gray;">Este documento convalida las horas requeridas para la renovación de beca y servicio social de permanencia estudiantil conforme a la Resolución Rectoral 412 de 2026.</p>' +
          '</div>' +
          '<div class="cert-foot">' +
            '<div class="cert-sig"><strong>Dra. Claudia Vélez M.</strong><br><small>Directora de Bienestar</small></div>' +
            '<div style="text-align:center;"><svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="7" y="7" width="1" height="1"/><rect x="18" y="7" width="1" height="1"/><rect x="7" y="18" width="1" height="1"/></svg><div style="font-size:9px;color:gray;">QR Validación</div></div>' +
            '<div class="cert-sig"><strong>Ing. Ricardo Ruiz G.</strong><br><small>Coordinación Académica</small></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<footer class="m-foot" style="justify-content:space-between;">' +
        '<span class="muted small">Válido para archivo digital institucional</span>' +
        '<div style="display:flex;gap:8px;">' +
          '<button class="btn btn-secondary" data-close type="button">Cerrar</button>' +
          '<button class="btn btn-primary" type="button" onclick="window.print()">' + I('download', 16) + ' Imprimir / Guardar PDF</button>' +
        '</div>' +
      '</footer>';
    showModal(html, 'cert');
  }

  /* =======================================================================
     VISTA 3 · PORTAL DEL TUTOR
     ======================================================================= */
  const BLOCKS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

  function tfOffer() {
    const tf = S.tf;
    const avail = {};
    tf.avail.forEach((k) => { const p = k.split('-'); (avail[p[0]] = avail[p[0]] || []).push(p[1]); });
    Object.keys(avail).forEach((k) => avail[k].sort());
    return {
      id: 'preview', tutorId: 't1', subject: tf.subject, topics: tf.topics.slice(), incentive: tf.incentive,
      rate: tf.incentive === 'pago' ? tf.rate : 0,
      modality: tf.modality === 'ambas' ? ['presencial', 'virtual'] : [tf.modality],
      avail: avail, method: tf.method
    };
  }

  function renderTutor() {
    const t = tutorById('t1');
    const pend = S.requests.filter((r) => r.status === 'pendiente').length;
    return '' +
      '<section class="view view-tutor">' +
        '<div class="tutor-hero">' +
          '<div class="th-id">' + avatar(t, 64, 'ring') + '<div><span class="eyebrow mono">Hola, Laura</span><h1>Tu espacio como tutora par</h1><p>' + I('shield-check', 15, 'verified') + 'Perfil verificado · ' + esc(t.program) + ' · ' + t.semester + '.º semestre</p></div></div>' +
          '<div class="th-stats">' +
            '<div><b class="mono">' + t.sessions + '</b><span>sesiones dadas</span></div>' +
            '<div><b class="mono">' + t.rating.toFixed(1) + I('star', 16, 'star fill') + '</b><span>calificación</span></div>' +
            '<div><b class="mono">96%</b><span>asistencia de tus estudiantes</span></div>' +
            '<div><b class="mono">' + t.response + '<small>min</small></b><span>tiempo de respuesta</span></div>' +
          '</div>' +
        '</div>' +

        '<div class="rewards">' +
          '<div class="reward r-pay"><span class="rw-icon">' + I('coins', 20) + '</span><div><small>Ingresos netos del semestre</small><b class="mono">$412.000</b><span>Comisión PeerLearn ya descontada</span></div></div>' +
          '<div class="reward r-social"><span class="rw-icon">' + I('heart', 20) + '</span><div><small>Horas de bienestar certificadas</small><b class="mono">18 h <em>/ ' + D.rules.certificateHours + ' h</em></b><div class="bar"><span style="width:' + (18 / D.rules.certificateHours * 100) + '%"></span></div></div></div>' +
          '<div class="reward r-credit"><span class="rw-icon">' + I('award', 20) + '</span><div><small>Certificación pedagógica</small><b>En curso</b><span>2 de 3 requisitos cumplidos</span></div></div>' +
        '</div>' +

        '<div class="tutor-layout">' +
          '<div class="card form-card" id="tf-card">' + tutorFormHTML() + '</div>' +
          '<aside class="tutor-side">' +
            '<div class="preview-box"><div class="pb-head"><h4>' + I('eye', 16) + 'Así te verán en el catálogo</h4><span class="live mono"><i></i>En vivo</span></div><div id="tf-preview">' + offerCard(tfOffer(), { preview: true }) + '</div></div>' +
            '<div class="card side-card"><h4>' + I('users', 16) + 'Solicitudes entrantes ' + (pend ? '<span class="count">' + pend + '</span>' : '') + '</h4><ul class="requests">' + S.requests.map(requestItem).join('') + '</ul></div>' +
            '<div class="card side-card"><h4>' + I('shield-check', 16) + 'Protección contra ausencias</h4>' +
              policyToggle('reminders', 'Recordatorios automáticos', '24 h y 1 h antes de cada sesión') +
              policyToggle('confirm2h', 'Confirmación obligatoria', 'El estudiante confirma 2 h antes o se libera el cupo') +
              policyToggle('limitNoShows', 'Límite por ausencias', 'Tras 2 ausencias, el estudiante no puede reservar por 7 días') +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</section>';
  }

  function policyToggle(key, title, sub) {
    return '<label class="policy-row"><span><b>' + title + '</b><small>' + sub + '</small></span><span class="switch"><input type="checkbox" data-policy="' + key + '"' + (S.policy[key] ? ' checked' : '') + '><span class="track"></span></span></label>';
  }

  function requestItem(r) {
    const s = subjectById(r.subject), d = workday(r.dayOffset);
    const status = r.status === 'aceptada' ? '<span class="status-chip st-confirmada">' + I('check', 12) + 'Aceptada</span>' : r.status === 'rechazada' ? '<span class="status-chip st-cancelada">Rechazada</span>' : r.status === 'propuesta' ? '<span class="status-chip st-pendiente">Nuevo horario propuesto</span>' : '';
    return '<li class="req ' + r.status + '">' +
      '<header>' + avatar({ name: r.student, initials: r.initials, hue: r.hue }, 36) + '<div><b>' + esc(r.student) + '</b><span>' + r.semester + '.º sem · ' + esc(s.short) + ' · ' + esc(r.topic) + '</span></div></header>' +
      '<div class="req-meta"><span>' + I('calendar', 13) + fmtDay(d) + ' · ' + r.time + '</span><span>' + I(r.modality === 'presencial' ? 'map-pin' : 'video', 13) + (r.modality === 'presencial' ? 'Presencial' : 'Virtual') + '</span></div>' +
      '<p class="req-note">“' + esc(r.note) + '”</p>' +
      (r.status === 'pendiente' ? '<div class="req-actions"><button class="btn btn-ghost sm" data-req="decline" data-id="' + r.id + '" type="button">Rechazar</button><button class="btn btn-secondary sm" data-req="propose" data-id="' + r.id + '" type="button">Otro horario</button><button class="btn btn-primary sm" data-req="accept" data-id="' + r.id + '" type="button">' + I('check', 14) + 'Aceptar</button></div>' : '<div class="req-actions">' + status + '</div>') +
    '</li>';
  }

  function tutorFormHTML() {
    const tf = S.tf, t = tutorById('t1');
    if (tf.published) {
      const o = offerById(tf.published), s = subjectById(o.subject);
      return '<div class="publish-success">' +
        '<div class="success-mark"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-15"/></svg></div>' +
        '<h3>¡Tu oferta está publicada!</h3>' +
        '<p><b>' + esc(s.name) + '</b> ya aparece en el catálogo de estudiantes' + (o.incentive === 'social' ? ' como tutoría <b>gratuita de servicio social</b>. Cada hora se certifica con Bienestar Universitario.' : o.incentive === 'creditos' ? ' como tutoría <b>gratuita con certificación pedagógica</b>.' : ' a <b>' + COP(o.rate) + '/h</b>. Recibirás ' + COP(o.rate * (1 - D.rules.commission)) + ' netos por sesión.') + '</p>' +
        '<div class="ps-actions"><button class="btn btn-secondary" data-tf-action="again" type="button">' + I('plus', 16) + 'Publicar otra</button><button class="btn btn-primary" data-tf-action="view" type="button">' + I('eye', 16) + 'Ver en el catálogo</button></div>' +
      '</div>';
    }
    const subs = Object.keys(t.grades).sort((a, b) => t.grades[b] - t.grades[a]);
    const subj = subjectById(tf.subject);
    const suggestions = subj.topics.concat(tf.topics.filter((x) => subj.topics.indexOf(x) < 0));
    const inc = (v, icon, title, sub) => '<button type="button" class="inc-card inc-' + v + (tf.incentive === v ? ' on' : '') + '" data-tf="incentive" data-v="' + v + '"><span class="ic-icon">' + I(icon, 20) + '</span><b>' + title + '</b><small>' + sub + '</small><span class="radio"></span></button>';
    return '' +
      '<header class="fc-head"><div><h3>Publicar nueva oferta de tutoría</h3><p>Configura qué enseñas, cuándo y cómo quieres ser recompensada.</p></div><span class="step-count mono">6 pasos · 2 min</span></header>' +

      '<div class="fc-step"><span class="fs-n mono">1</span><div class="fs-body"><label class="m-label">Asignatura</label><p class="hint">Solo puedes ofrecer asignaturas aprobadas con nota ≥ ' + D.rules.minGrade.toFixed(1) + ' (validadas con Registro).</p>' +
        '<div class="subject-grid">' + subs.map((k) => {
          const g = t.grades[k], ok = g >= D.rules.minGrade;
          return '<button type="button" class="subj-opt ' + (tf.subject === k ? 'on' : '') + (ok ? '' : ' locked') + '" data-tf="subject" data-v="' + k + '"' + (ok ? '' : ' disabled') + '><span>' + esc(subjectById(k).name) + '</span><b class="mono">' + (ok ? g.toFixed(1) : I('lock', 13) + g.toFixed(1)) + '</b>' + (ok ? '' : '<small>Requiere ≥ 4.0</small>') + '</button>';
        }).join('') + '</div></div></div>' +

      '<div class="fc-step"><span class="fs-n mono">2</span><div class="fs-body"><label class="m-label">Micro-temas que dominas <span class="muted">(' + tf.topics.length + ' seleccionados)</span></label><p class="hint">Los estudiantes buscan por tema puntual, no solo por materia.</p>' +
        '<div class="choice-chips">' + suggestions.map((tp) => '<button type="button" class="chip chip-select ' + (tf.topics.indexOf(tp) >= 0 ? 'on' : '') + '" data-tf="topic" data-v="' + esc(tp) + '">' + (tf.topics.indexOf(tp) >= 0 ? I('check', 13) : I('plus', 13)) + esc(tp) + '</button>').join('') + '</div>' +
        '<div class="add-topic"><input type="text" data-tf-input="customTopic" placeholder="Agregar otro tema… (Enter)" value="' + esc(tf.customTopic) + '"><button class="btn btn-secondary sm" data-tf-action="add-topic" type="button">' + I('plus', 14) + 'Agregar</button></div>' +
      '</div></div>' +

      '<div class="fc-step"><span class="fs-n mono">3</span><div class="fs-body"><label class="m-label">Modalidad</label>' +
        '<div class="seg wide" data-tf-seg="modality">' + [['ambas', 'Presencial y virtual'], ['presencial', 'Solo presencial'], ['virtual', 'Solo virtual']].map((m) => '<button type="button" class="' + (tf.modality === m[0] ? 'on' : '') + '" data-v="' + m[0] + '">' + m[1] + '</button>').join('') + '</div>' +
      '</div></div>' +

      '<div class="fc-step"><span class="fs-n mono">4</span><div class="fs-body"><label class="m-label">¿Cómo quieres ser recompensada?</label><p class="hint">Cada tutor valora algo distinto: tú eliges el incentivo de cada oferta.</p>' +
        '<div class="inc-grid">' +
          inc('pago', 'coins', 'Remuneración', 'Defines tu tarifa por hora') +
          inc('social', 'heart', 'Horas de bienestar', 'Servicio social certificado') +
          inc('creditos', 'award', 'Certificación', 'Experiencia pedagógica para tu hoja de vida') +
        '</div>' +
        '<div id="tf-incentive-detail">' + incentiveDetail() + '</div>' +
      '</div></div>' +

      '<div class="fc-step"><span class="fs-n mono">5</span><div class="fs-body"><label class="m-label">Disponibilidad semanal recurrente <span class="muted">(' + tf.avail.length + ' bloques)</span></label><p class="hint">Toca los bloques en los que puedes dar tutorías. Los estudiantes reservan directamente sobre ellos.</p>' +
        '<div class="avail-grid"><span></span>' + [1, 2, 3, 4, 5, 6].map((d) => '<span class="ag-day">' + WD[d] + '</span>').join('') +
          BLOCKS.map((b) => '<span class="ag-time mono">' + b + '</span>' + [1, 2, 3, 4, 5, 6].map((d) => { const k = d + '-' + b; return '<button type="button" class="ag-cell ' + (tf.avail.indexOf(k) >= 0 ? 'on' : '') + '" data-tf="avail" data-v="' + k + '" aria-label="' + WDL[d] + ' ' + b + '">' + (tf.avail.indexOf(k) >= 0 ? I('check', 14) : '') + '</button>'; }).join('')).join('') +
        '</div>' +
      '</div></div>' +

      '<div class="fc-step"><span class="fs-n mono">6</span><div class="fs-body"><label class="m-label">Metodología</label>' +
        '<textarea data-tf-input="method" rows="3" placeholder="¿Cómo preparas tus sesiones?">' + esc(tf.method) + '</textarea>' +
      '</div></div>' +

      '<footer class="fc-foot"><p class="muted small">' + I('info', 14) + 'Al publicar aceptas el código de conducta de tutores pares.</p><button class="btn btn-primary lg" data-tf-action="publish" type="button">' + I('send', 16) + 'Publicar oferta</button></footer>';
  }

  function incentiveDetail() {
    const tf = S.tf;
    if (tf.incentive === 'pago') {
      const fee = tf.rate * D.rules.commission;
      return '<div class="inc-detail pay">' +
        '<div class="rate-row"><label>Tarifa por hora</label><div class="stepper-input"><button type="button" data-tf-action="rate-down" aria-label="Bajar">' + I('minus', 16) + '</button><input type="number" min="10000" max="60000" step="1000" data-tf-input="rate" value="' + tf.rate + '"><button type="button" data-tf-action="rate-up" aria-label="Subir">' + I('plus', 16) + '</button></div><span class="muted small">Rango sugerido $15.000 – $30.000</span></div>' +
        '<div class="breakdown"><div><span>El estudiante paga</span><b class="mono">' + COP(tf.rate) + '</b></div><div><span>Comisión PeerLearn (' + Math.round(D.rules.commission * 100) + '%)<sup>*</sup></span><b class="mono neg">− ' + COP(fee) + '</b></div><div class="total"><span>Recibes por sesión</span><b class="mono">' + COP(tf.rate - fee) + '</b></div></div>' +
        '<p class="hint">* Porcentaje supuesto para el piloto. Solo se cobra sobre sesiones completadas.</p>' +
      '</div>';
    }
    if (tf.incentive === 'social') return '<div class="inc-detail social">' + I('heart', 18) + '<div><b>Gratis para el estudiante · 0% de comisión</b><span>Bienestar Universitario certifica cada hora completada. Llevas 18 de ' + D.rules.certificateHours + ' h para tu certificado.</span></div></div>';
    return '<div class="inc-detail credit">' + I('award', 18) + '<div><b>Gratis para el estudiante · 0% de comisión</b><span>Acumulas experiencia pedagógica certificable, sujeta al aval de la coordinación académica.</span></div></div>';
  }

  function refreshTutorForm(full) {
    if (full) { $('#tf-card').innerHTML = tutorFormHTML(); PL.hydrateIcons($('#tf-card')); }
    const p = $('#tf-preview');
    if (p) { p.innerHTML = offerCard(tfOffer(), { preview: true }); PL.hydrateIcons(p); }
  }

  function publishOffer() {
    const tf = S.tf;
    if (!tf.topics.length) return toast({ type: 'warn', title: 'Agrega al menos un micro-tema', body: 'Los estudiantes buscan por tema puntual.' });
    if (!tf.avail.length) return toast({ type: 'warn', title: 'Selecciona tu disponibilidad', body: 'Marca al menos un bloque horario.' });
    if (tf.incentive === 'pago' && (tf.rate < 10000 || tf.rate > 60000)) return toast({ type: 'warn', title: 'Revisa la tarifa', body: 'Debe estar entre $10.000 y $60.000.' });
    const o = tfOffer();
    o.id = 'o' + Date.now();
    o.isNew = true;
    S.offers.unshift(o);
    saveState();
    tf.published = o.id;
    refreshTutorForm(true);
    $('#tf-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast({ title: 'Oferta publicada en el catálogo', body: subjectById(o.subject).name + ' · ' + (o.incentive === 'pago' ? COP(o.rate) + '/h' : 'gratuita'), action: { label: 'Verla', fn: () => viewPublished() } });
  }
  function viewPublished() {
    S.highlight = S.tf.published;
    S.filters = { q: '', subject: 'all', modality: 'all', cost: 'all', minGrade: false, sort: 'recommended' };
    go('explorar');
  }

  /* =======================================================================
     VISTA 4 · PANEL INSTITUCIONAL
     ======================================================================= */
  function instSlice() {
    const w = D.weekly;
    if (S.instRange === 'semana') return w.slice(-1);
    if (S.instRange === '30d') return w.slice(-4);
    return w;
  }
  function sparkline(arr, color) {
    const W = 96, H = 30, max = Math.max.apply(null, arr), min = Math.min.apply(null, arr);
    const pts = arr.map((v, i) => (i / (arr.length - 1)) * W + ',' + (H - 3 - ((v - min) / (max - min || 1)) * (H - 6))).join(' ');
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function renderInst() {
    const all = D.weekly.reduce((a, b) => a + b, 0);
    const slice = instSlice();
    const sessions = slice.reduce((a, b) => a + b, 0);
    const f = sessions / all;
    const verifiedCount = 39 + D.tutors.length + S.applicants.filter((a) => a.status === 'verificado').length;
    const kpi = (icon, tone, label, value, delta, spark) => '<div class="kpi-card"><div class="kc-top"><span class="kc-icon tone-' + tone + '">' + I(icon, 18) + '</span>' + (spark || '') + '</div><b class="mono">' + value + '</b><span>' + label + '</span>' + (delta ? '<em class="delta">' + I('trending-up', 12) + delta + '</em>' : '') + '</div>';
    const rangeBtn = (v, l) => '<button type="button" class="' + (S.instRange === v ? 'on' : '') + '" data-range="' + v + '">' + l + '</button>';

    return '' +
      '<section class="view view-inst">' +
        '<div class="inst-head">' +
          '<div><span class="eyebrow mono">Piloto 2026-2 · I.U. Pascual Bravo</span><h1>Panel de acompañamiento académico</h1><p>Seguimiento agregado y anónimo de las tutorías entre pares en asignaturas críticas.</p></div>' +
          '<div class="inst-actions"><div class="seg">' + rangeBtn('semestre', 'Semestre') + rangeBtn('30d', 'Últimas 4 semanas') + rangeBtn('semana', 'Esta semana') + '</div><button class="btn btn-secondary" data-action="export" type="button">' + I('download', 16) + 'Exportar reporte</button></div>' +
        '</div>' +
        '<div class="notice">' + I('info', 16) + '<span><b>Datos simulados para la demostración.</b> En el piloto, estos indicadores se calcularán automáticamente desde la plataforma; la reprobación requiere datos agregados de Registro Académico.</span></div>' +

        '<div class="kpi-grid">' +
          kpi('users', 'blue', 'estudiantes acompañados', Math.round(312 * Math.max(f, 0.12)).toLocaleString('es-CO'), '+18% vs. periodo anterior', sparkline([8, 12, 15, 14, 19, 23, 28, 31], '#2563EB')) +
          kpi('check-circle', 'emerald', 'sesiones completadas', sessions.toLocaleString('es-CO'), '', sparkline(slice.length > 1 ? slice : [slice[0] * 0.8, slice[0]], '#10B981')) +
          kpi('clock', 'violet', 'tasa de asistencia', '92%', '+6 pts con recordatorios', '') +
          kpi('heart', 'rose', 'horas de bienestar certificadas', Math.round(436 * f).toLocaleString('es-CO') + ' h', '', '') +
          kpi('star', 'gold', 'satisfacción promedio', '4.8<small>/5</small>', '', '') +
          kpi('shield-check', 'navy', 'tutores verificados', String(verifiedCount), '', '') +
        '</div>' +

        '<div class="inst-row">' +
          '<div class="card chart-card"><div class="cc-head"><div><h3>Sesiones completadas por semana</h3><p>Semanas 1 a 16 del semestre</p></div><div class="legend"><span><i class="lg blue"></i>Semana regular</span><span><i class="lg gold"></i>Semana de parciales</span></div></div>' + barChart() + '</div>' +
          '<div class="card donut-card"><div class="cc-head"><div><h3>Incentivo elegido por los tutores</h3><p>Red de 47 tutores verificados</p></div></div>' + donut() + '</div>' +
        '</div>' +

        '<div class="inst-row">' +
          '<div class="card heat-card"><div class="cc-head"><div><h3>Demanda por asignatura crítica</h3><p>Sesiones por semana · más oscuro = más demanda</p></div></div>' + heatmap() + '</div>' +
          '<div class="card topics-card"><div class="cc-head"><div><h3>Temas con más consultas</h3><p>Insumo para docentes: dónde se traban los estudiantes</p></div></div>' +
            '<ol class="rank">' + D.topTopics.map((t, i) => '<li><span class="rk mono">' + pad(i + 1) + '</span><div><b>' + esc(t.topic) + '</b><small>' + esc(subjectById(t.subject).name) + '</small><div class="rbar"><span style="width:' + (t.count / D.topTopics[0].count * 100) + '%"></span></div></div><em class="mono">' + t.count + '</em></li>').join('') + '</ol>' +
            '<button class="btn btn-secondary block" data-action="share-teachers" type="button">' + I('send', 16) + 'Compartir con coordinadores de programa</button>' +
          '</div>' +
        '</div>' +

        '<div class="card table-card"><div class="cc-head"><div><h3>Validación y calidad de tutores</h3><p>Regla: nota de aprobación ≥ 4.0 · calificación mínima 4.0 tras 5 sesiones</p></div></div>' + validationTable() + '</div>' +

        '<div class="card table-card"><div class="cc-head"><div><h3>Indicadores del piloto</h3><p>Definidos en el plan de trabajo del proyecto</p></div></div>' +
          '<table class="tbl"><thead><tr><th>Indicador</th><th>Línea base</th><th>Meta del piloto</th><th>Fuente</th></tr></thead><tbody>' +
          D.kpiTargets.map((k) => '<tr><td><b>' + esc(k.name) + '</b></td><td class="muted">' + esc(k.base) + '</td><td><span class="target mono">' + esc(k.target) + '</span></td><td class="muted">' + esc(k.source) + '</td></tr>').join('') +
          '</tbody></table>' +
        '</div>' +
      '</section>';
  }

  function barChart() {
    const data = D.weekly, W = 680, H = 250, pl = 36, pb = 28, pt = 22, max = 160;
    const bw = (W - pl - 8) / data.length;
    const range = S.instRange === 'semana' ? [15, 15] : S.instRange === '30d' ? [12, 15] : [0, 15];
    let g = '';
    [0, 40, 80, 120, 160].forEach((v) => { const y = H - pb - (v / max) * (H - pb - pt); g += '<line x1="' + pl + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" class="grid"/><text x="' + (pl - 8) + '" y="' + (y + 4) + '" class="axis" text-anchor="end">' + v + '</text>'; });
    data.forEach((v, i) => {
      const h = (v / max) * (H - pb - pt), x = pl + i * bw + bw * 0.18, y = H - pb - h, exam = D.examWeeks.indexOf(i + 1) >= 0;
      const dim = i < range[0] || i > range[1];
      g += '<g class="bar-g' + (dim ? ' dim' : '') + '"><rect x="' + x + '" y="' + y + '" width="' + (bw * 0.64) + '" height="' + h + '" rx="5" class="' + (exam ? 'bar exam' : 'bar') + '"/><text x="' + (x + bw * 0.32) + '" y="' + (y - 7) + '" class="val" text-anchor="middle">' + v + '</text><text x="' + (x + bw * 0.32) + '" y="' + (H - 8) + '" class="axis" text-anchor="middle">S' + (i + 1) + '</text></g>';
      if (exam) g += '<text x="' + (x + bw * 0.32) + '" y="' + (y - 22) + '" class="ann" text-anchor="middle">Parciales</text>';
    });
    return '<svg class="bars" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Sesiones por semana">' + g + '</svg>';
  }

  function donut() {
    const parts = [['Horas de bienestar', 46, '#10B981'], ['Remuneración', 41, '#2563EB'], ['Certificación', 13, '#7C5CFF']];
    const R = 70, C = 2 * Math.PI * R;
    let off = 0, arcs = '';
    parts.forEach((p) => { const len = (p[1] / 100) * C; arcs += '<circle r="' + R + '" cx="90" cy="90" fill="none" stroke="' + p[2] + '" stroke-width="22" stroke-dasharray="' + (len - 3) + ' ' + (C - len + 3) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 90 90)"/>'; off += len; });
    return '<div class="donut-wrap"><svg viewBox="0 0 180 180" class="donut">' + arcs + '<text x="90" y="86" text-anchor="middle" class="d-big">59%</text><text x="90" y="106" text-anchor="middle" class="d-sm">gratis para el estudiante</text></svg>' +
      '<ul class="d-legend">' + parts.map((p) => '<li><i style="background:' + p[2] + '"></i><span>' + p[0] + '</span><b class="mono">' + p[1] + '%</b></li>').join('') + '</ul></div>' +
      '<p class="hint center">0% de comisión en tutorías de servicio social y certificación.</p>';
  }

  function heatmap() {
    const subs = D.subjects;
    const vals = subs.map((s, si) => D.weekly.map((w, wi) => Math.round((D.demandBase[s.id] * w / 3.2) * (0.82 + (((si * 7 + wi * 13) % 10) / 26)))));
    const max = Math.max.apply(null, vals.map((r) => Math.max.apply(null, r)));
    return '<div class="heat"><div class="heat-row head"><span></span>' + D.weekly.map((_, i) => '<em class="mono' + (D.examWeeks.indexOf(i + 1) >= 0 ? ' exam' : '') + '">' + (i + 1) + '</em>').join('') + '</div>' +
      subs.map((s, si) => '<div class="heat-row"><span>' + esc(s.short) + '</span>' + vals[si].map((v, wi) => '<i style="--a:' + (0.08 + (v / max) * 0.92).toFixed(2) + '" title="' + esc(s.name) + ' · semana ' + (wi + 1) + ': ' + v + ' sesiones"></i>').join('') + '</div>').join('') +
      '</div>';
  }

  function validationTable() {
    const rows = D.tutors.slice(0, 5).map((t) => {
      const o = S.offers.find((x) => x.tutorId === t.id);
      return '<tr><td><div class="cell-user">' + avatar(t, 32) + '<div><b>' + esc(t.name) + '</b><small>' + esc(t.program) + ' · ' + t.semester + '.º</small></div></div></td><td>' + esc(subjectById(o.subject).short) + '</td><td class="mono"><b>' + t.grades[o.subject].toFixed(1) + '</b></td><td class="mono">' + t.rating.toFixed(1) + ' ★</td><td class="mono">' + t.attendance + '%</td><td><span class="status-chip st-confirmada">' + I('shield-check', 12) + 'Verificado</span></td><td></td></tr>';
    });
    S.applicants.forEach((a) => {
      const ok = a.grade >= D.rules.minGrade;
      let st, act = '';
      if (a.status === 'verificado') st = '<span class="status-chip st-confirmada">' + I('shield-check', 12) + 'Verificado</span>';
      else if (a.status === 'rechazado' || !ok) st = '<span class="status-chip st-cancelada">' + I('x', 12) + 'No cumple · nota &lt; 4.0</span>';
      else { st = '<span class="status-chip st-pendiente">' + I('clock', 12) + 'En revisión</span>'; act = '<div class="row-actions"><button class="btn btn-ghost sm" data-app="reject" data-id="' + a.id + '" type="button">Rechazar</button><button class="btn btn-primary sm" data-app="approve" data-id="' + a.id + '" type="button">Aprobar</button></div>'; }
      rows.push('<tr class="' + (a.status === 'revision' && ok ? 'row-review' : '') + '"><td><div class="cell-user">' + avatar({ name: a.name, hue: (a.name.charCodeAt(0) * 41) % 360 }, 32) + '<div><b>' + esc(a.name) + '</b><small>' + esc(a.program) + ' · ' + a.semester + '.º</small></div></div></td><td>' + esc(subjectById(a.subject).short) + '</td><td class="mono"><b class="' + (ok ? '' : 'neg') + '">' + a.grade.toFixed(1) + '</b></td><td class="muted">Nuevo</td><td class="muted">—</td><td>' + st + '</td><td>' + act + '</td></tr>');
    });
    return '<table class="tbl"><thead><tr><th>Tutor</th><th>Asignatura</th><th>Nota</th><th>Calificación</th><th>Asistencia</th><th>Estado</th><th></th></tr></thead><tbody>' + rows.join('') + '</tbody></table>';
  }

  /* =======================================================================
     Eventos
     ======================================================================= */
  function onHostClick(e) {
    const el = e.target.closest('[data-action],[data-filter] button,[data-range],[data-req],[data-app],[data-tf],[data-tf-action],[data-tf-seg] button,[data-nav-go]');
    if (!el) return;
    const a = el.dataset.action;

    // Filtros segmentados (Explorar)
    const segF = el.closest('[data-filter]');
    if (segF && el.tagName === 'BUTTON' && !a) { S.filters[segF.dataset.filter] = el.dataset.v; $$('button', segF).forEach((b) => b.classList.toggle('on', b === el)); renderResults(); return; }
    if (el.dataset.navGo) return go(el.dataset.navGo);
    if (el.dataset.range) { S.instRange = el.dataset.range; render(); return; }

    // Solicitudes (portal tutor)
    if (el.dataset.req) {
      const r = S.requests.find((x) => x.id === el.dataset.id);
      if (el.dataset.req === 'accept') { r.status = 'aceptada'; toast({ title: 'Sesión con ' + first(r.student) + ' confirmada', body: 'Le enviamos la confirmación y recordatorios automáticos.' }); }
      if (el.dataset.req === 'decline') { r.status = 'rechazada'; toast({ type: 'info', title: 'Solicitud rechazada', body: 'Le sugerimos a ' + first(r.student) + ' otros tutores con cupo.' }); }
      if (el.dataset.req === 'propose') { r.status = 'propuesta'; toast({ type: 'info', title: 'Propuesta enviada', body: first(r.student) + ' verá tus otros bloques libres.' }); }
      const li = el.closest('.req'); li.outerHTML = requestItem(r); PL.hydrateIcons($('.requests')); updateBadges();
      const c = $('.side-card .count'); const n = S.requests.filter((x) => x.status === 'pendiente').length; if (c) { if (n) c.textContent = n; else c.remove(); }
      return;
    }
    // Validación de tutores (panel institucional)
    if (el.dataset.app) {
      const ap = S.applicants.find((x) => x.id === el.dataset.id);
      if (el.dataset.app === 'approve') { ap.status = 'verificado'; toast({ title: ap.name + ' ahora es tutor verificado', body: 'Se le notificó por correo institucional.' }); }
      else { ap.status = 'rechazado'; toast({ type: 'info', title: 'Postulación rechazada', body: 'Se notificó a ' + first(ap.name) + ' con el motivo.' }); }
      render(); return;
    }
    // Formulario del tutor
    if (el.dataset.tf) {
      const tf = S.tf, v = el.dataset.v;
      if (el.dataset.tf === 'subject') { if (tf.subject !== v) { tf.subject = v; tf.topics = subjectById(v).topics.slice(0, 2); } }
      if (el.dataset.tf === 'topic') { const i = tf.topics.indexOf(v); if (i >= 0) tf.topics.splice(i, 1); else tf.topics.push(v); }
      if (el.dataset.tf === 'incentive') tf.incentive = v;
      if (el.dataset.tf === 'avail') { const i = tf.avail.indexOf(v); if (i >= 0) tf.avail.splice(i, 1); else tf.avail.push(v); }
      const y = window.scrollY; refreshTutorForm(true); window.scrollTo(0, y);
      return;
    }
    const tfSeg = el.closest('[data-tf-seg]');
    if (tfSeg && !el.dataset.tfAction) { S.tf[tfSeg.dataset.tfSeg] = el.dataset.v; $$('button', tfSeg).forEach((b) => b.classList.toggle('on', b === el)); refreshTutorForm(false); return; }
    if (el.dataset.tfAction) {
      const tf = S.tf, act = el.dataset.tfAction;
      if (act === 'publish') return publishOffer();
      if (act === 'view') return viewPublished();
      if (act === 'again') { tf.published = null; return refreshTutorForm(true); }
      if (act === 'add-topic') return addCustomTopic();
      if (act === 'rate-up' || act === 'rate-down') {
        tf.rate = Math.min(60000, Math.max(10000, tf.rate + (act === 'rate-up' ? 1000 : -1000)));
        $('#tf-incentive-detail').innerHTML = incentiveDetail(); PL.hydrateIcons($('#tf-incentive-detail')); refreshTutorForm(false);
      }
      return;
    }

    switch (a) {
      case 'quick': S.filters.q = el.dataset.q; $('#q').value = el.dataset.q; renderResults(); break;
      case 'clear-filter': { const k = el.dataset.key; S.filters[k] = k === 'q' ? '' : k === 'minGrade' ? false : 'all'; render(); break; }
      case 'clear-all': S.filters = { q: '', subject: 'all', modality: 'all', cost: 'all', minGrade: false, sort: S.filters.sort }; render(); break;
      case 'notify-me': toast({ type: 'info', title: 'Te avisaremos', body: 'Recibirás una notificación cuando un tutor verificado publique ese tema.' }); break;
      case 'profile': openProfile(el.dataset.offer); break;
      case 'book': openBooking(el.dataset.offer); break;
      case 'event': openEvent(el.dataset.id); break;
      case 'join': openMeetingRoom(el.dataset.id); break;
      case 'map': openCampusMap(el.dataset.id); break;
      case 'rate': openRating(el.dataset.id); break;
      case 'attend': doAttend(el.dataset.id); break;
      case 'cal-prev': S.agendaStart = addDays(S.agendaStart, -7); render(); break;
      case 'cal-next': S.agendaStart = addDays(S.agendaStart, 7); render(); break;
      case 'cal-today': S.agendaStart = today0(); render(); break;
      case 'export': openCertificateModal(); break;
      case 'share-teachers': toast({ title: 'Reporte compartido', body: 'Los coordinadores de Software y Ciencias Básicas recibirán los temas críticos de la semana.' }); break;
    }
  }

  function doAttend(id) {
    const b = S.bookings.find((x) => x.id === id);
    b.attendance = true;
    saveState();
    closeModal();
    toast({ title: 'Asistencia confirmada', body: first(tutorById(b.tutorId).name) + ' sabe que vas. Te recordaremos 1 h antes.' });
    render();
  }

  function addCustomTopic() {
    const tf = S.tf, v = (tf.customTopic || '').trim();
    if (!v) return;
    if (tf.topics.indexOf(v) < 0) tf.topics.push(v);
    tf.customTopic = '';
    refreshTutorForm(true);
    const inp = $('[data-tf-input="customTopic"]'); if (inp) inp.focus();
  }

  function onModalClick(e) {
    const m = modal();
    if (e.target === m || e.target.closest('[data-close]')) return closeModal();
    const vBtn = e.target.closest('[data-room-verify]');
    if (vBtn) {
      const id = vBtn.dataset.roomVerify;
      const b = S.bookings.find((x) => x.id === id) || S.bookings[0];
      b.status = 'completada';
      b.attendance = true;
      b.reviewed = false;
      saveState();
      closeModal();
      render();
      toast({ type: 'success', title: '¡Asistencia confirmada con PIN!', body: 'La sesión se acreditó en SIA. Califica a tu tutor para finalizar.' });
      return openRating(b.id);
    }
    const el = e.target.closest('button,[data-bk-file]');
    if (!el) return;
    // Reserva
    if (S.bk) {
      const bk = S.bk;
      if (el.dataset.bk) {
        const k = el.dataset.bk, v = el.dataset.v;
        if (k === 'day') { bk.day = new Date(Number(v)); bk.slot = null; }
        else bk[k] = v;
        return renderBooking();
      }
      if (el.hasAttribute('data-bk-next')) { bk.step++; return renderBooking(); }
      if (el.hasAttribute('data-bk-back')) { bk.step--; return renderBooking(); }
      if (el.hasAttribute('data-bk-confirm')) return confirmBooking();
    }
    // Calificación
    if (S.rt) {
      if (el.dataset.rtStar) { S.rt.stars = Number(el.dataset.rtStar); return renderRating(); }
      if (el.dataset.rtTag) { const i = S.rt.tags.indexOf(el.dataset.rtTag); if (i >= 0) S.rt.tags.splice(i, 1); else S.rt.tags.push(el.dataset.rtTag); return renderRating(); }
      if (el.hasAttribute('data-rt-submit')) return submitRating();
    }
    const a = el.dataset.action;
    if (a === 'goto-agenda') { const b = S.bookings.find((x) => x.id === (S.bk && S.bk.bookingId)); closeModal(); if (b) S.agendaStart = today0(); return go('agenda'); }
    if (a === 'rate') { const id = el.dataset.id; closeModal(); return openRating(id); }
    if (a === 'attend') return doAttend(el.dataset.id);
    if (a === 'cancel') {
      const b = S.bookings.find((x) => x.id === el.dataset.id);
      const late = (b.start - new Date()) / 3600000 < D.rules.freeCancelHours;
      b.status = 'cancelada'; saveState(); closeModal(); render();
      return toast({ type: late ? 'warn' : 'info', title: 'Tutoría cancelada', body: late ? 'Cancelación tardía: cuenta como ausencia.' : 'Sin penalización. El cupo quedó libre para otro estudiante.' });
    }
    if (a === 'join') { closeModal(); return openMeetingRoom(el.dataset.id); }
    if (a === 'map') { closeModal(); return openCampusMap(el.dataset.id); }
    if (a === 'simulate-done') {
      const b = S.bookings.find((x) => x.id === el.dataset.id);
      b.status = 'completada'; b.reviewed = false;
      b.start = new Date(Date.now() - 2 * 3600000); b.start.setMinutes(0, 0, 0);
      saveState(); closeModal(); render(); return openRating(b.id);
    }
  }

  function onModalInput(e) {
    const el = e.target;
    if (S.bk && el.dataset.bkInput) S.bk[el.dataset.bkInput] = el.value;
    if (S.bk && el.hasAttribute('data-bk-commit')) { S.bk.commit = el.checked; const btn = $('[data-bk-confirm]'); if (btn) btn.disabled = !el.checked; }
    if (S.bk && el.hasAttribute('data-bk-file') && el.files && el.files[0]) { S.bk.file = el.files[0].name; renderBooking(); }
    if (S.rt && el.hasAttribute('data-rt-input')) S.rt.comment = el.value;
  }

  function onHostInput(e) {
    const el = e.target;
    if (el.id === 'q') { S.filters.q = el.value; renderResults(); return; }
    if (el.id === 'f-subject') { S.filters.subject = el.value; renderResults(); return; }
    if (el.id === 'f-sort') { S.filters.sort = el.value; renderResults(); return; }
    if (el.id === 'f-grade') { S.filters.minGrade = el.checked; renderResults(); return; }
    if (el.dataset.policy) {
      S.policy[el.dataset.policy] = el.checked;
      if (e.type === 'change') toast({ type: 'info', title: el.checked ? 'Regla activada' : 'Regla desactivada', body: el.closest('.policy-row').querySelector('b').textContent });
      return;
    }
    if (el.dataset.tfInput) {
      const k = el.dataset.tfInput;
      if (k === 'rate') {
        S.tf.rate = Number(el.value) || 0;
        if (e.type === 'change') { S.tf.rate = Math.min(60000, Math.max(10000, Math.round(S.tf.rate / 1000) * 1000)); $('#tf-incentive-detail').innerHTML = incentiveDetail(); PL.hydrateIcons($('#tf-incentive-detail')); }
        else { const bd = $('.breakdown'); if (bd) { const fee = S.tf.rate * D.rules.commission; bd.innerHTML = '<div><span>El estudiante paga</span><b class="mono">' + COP(S.tf.rate) + '</b></div><div><span>Comisión PeerLearn (' + Math.round(D.rules.commission * 100) + '%)<sup>*</sup></span><b class="mono neg">− ' + COP(fee) + '</b></div><div class="total"><span>Recibes por sesión</span><b class="mono">' + COP(S.tf.rate - fee) + '</b></div>'; } }
      } else S.tf[k] = el.value;
      refreshTutorForm(false);
    }
  }

  /* =======================================================================
     Control de Tema (Modo Oscuro / Claro)
     ======================================================================= */
  PL.getTheme = function () {
    try {
      return localStorage.getItem('peerlearn_theme') || 'dark';
    } catch (_) {
      return 'dark';
    }
  };

  PL.setTheme = function (theme) {
    const isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.body.classList.toggle('theme-dark', isDark);
    try {
      localStorage.setItem('peerlearn_theme', isDark ? 'dark' : 'light');
    } catch (_) {}
  };

  PL.toggleTheme = function () {
    const next = PL.getTheme() === 'dark' ? 'light' : 'dark';
    PL.setTheme(next);
    toast({ type: 'info', title: next === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado' });
  };

  /* =======================================================================
     Arranque
     ======================================================================= */
  function init() {
    PL.setTheme(PL.getTheme());
    seed();
    PL.hydrateIcons(document);

    const host = $('#view-host');
    host.addEventListener('click', onHostClick);
    host.addEventListener('input', onHostInput);
    host.addEventListener('change', onHostInput);
    host.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.dataset && e.target.dataset.tfInput === 'customTopic') { e.preventDefault(); addCustomTopic(); }
    });

    const m = modal();
    m.addEventListener('click', onModalClick);
    m.addEventListener('input', onModalInput);
    m.addEventListener('change', onModalInput);

    $('#drawer').addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) return closeDrawer();
      const el = e.target.closest('[data-action]'); if (!el) return;
      if (el.dataset.action === 'book') { closeDrawer(); openBooking(el.dataset.offer); }
      if (el.dataset.action === 'profile') openProfile(el.dataset.offer);
    });
    $('#drawer-backdrop').addEventListener('click', closeDrawer);

    $('#bell').addEventListener('click', (e) => { e.stopPropagation(); const p = $('#notif-pop'); renderNotifs(); PL.hydrateIcons(p); p.classList.toggle('open'); });
    $('#notif-pop').addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target.closest('[data-notif="read"]')) { S.notifs.forEach((n) => { n.unread = false; }); renderNotifs(); PL.hydrateIcons($('#notif-pop')); updateBadges(); }
    });
    document.addEventListener('click', () => {
      $('#notif-pop').classList.remove('open');
      const pd = $('#persona-dropdown');
      if (pd) pd.classList.remove('open');
    });

    // Selector de roles en vivo (#persona)
    $('#persona').addEventListener('click', (e) => {
      e.stopPropagation();
      const opt = e.target.closest('[data-set-persona]');
      if (opt) {
        const pk = opt.dataset.setPersona;
        if (pk === 'student') go('explorar');
        else if (pk === 'tutor') go('tutor');
        else if (pk === 'inst') go('institucion');
        const pd = $('#persona-dropdown');
        if (pd) pd.classList.remove('open');
        toast({ type: 'info', title: 'Cambiaste de vista', body: 'Ahora navegas como ' + D.personas[pk].name });
        return;
      }
      const pd = $('#persona-dropdown');
      if (pd) pd.classList.toggle('open');
    });

    // Botones de cambio de tema (sol / luna)
    document.addEventListener('click', (e) => {
      if (e.target.closest('.theme-toggle-btn')) {
        e.preventDefault();
        PL.toggleTheme();
      }
    });

    // Botones globales de cambio de modo (pitch ⇄ app)
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-mode]');
      if (b) { e.preventDefault(); PL.setMode(b.dataset.mode); }
    });

    document.addEventListener('keydown', (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
      if (e.key === 'Escape') { if (modal().classList.contains('open')) closeModal(); else closeDrawer(); $('#notif-pop').classList.remove('open'); return; }
      if (typing) return;
      if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        PL.toggleTheme();
        return;
      }
      if (!document.body.classList.contains('mode-app')) return;
      if (e.key === '/' && S.view === 'explorar') { e.preventDefault(); const q = $('#q'); if (q) q.focus(); }
      if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey) PL.setMode('pitch');
    });

    window.addEventListener('hashchange', route);
    route();
    // Refresca cuenta regresiva de la agenda cada minuto
    setInterval(() => { if (S.view === 'agenda' && document.body.classList.contains('mode-app') && !modal().classList.contains('open')) { const c = $('.countdown'); const up = S.bookings.filter((b) => (b.status === 'confirmada' || b.status === 'pendiente') && b.start > new Date()).sort((a, b) => a.start - b.start)[0]; if (c && up) c.textContent = fmtRel(up.start); } }, 60000);
  }

  PL.app = { go: go, toast: toast, state: S };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

