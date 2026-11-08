/* =========================================================================
   PeerLearn · Datos de la demo
   Datos SIMULADOS, coherentes con la investigación del proyecto
   (Trabajo emprendimiento.docx): asignaturas críticas, regla de nota mínima
   4.0, incentivos configurables y KPIs del piloto.
   ========================================================================= */
window.PL = window.PL || {};

PL.data = (function () {
  /* ---------- Reglas de negocio (supuestos del piloto) ---------- */
  const rules = {
    minGrade: 4.0,           // Andrés: “aprobó la materia con mínimo 4.0”
    commission: 0.10,        // % de comisión: SUPUESTO por validar en el piloto
    freeCancelHours: 12,     // Stiven: cancelaciones de último minuto
    certificateHours: 40     // Horas de bienestar para certificado (supuesto)
  };

  /* ---------- Asignaturas críticas y micro-temas ---------- */
  const subjects = [
    { id: 'logica',  name: 'Lógica de Programación',        short: 'Lógica',          area: 'Programación',     topics: ['Pseudocódigo', 'Condicionales', 'Ciclos for / while', 'Arreglos', 'Funciones', 'Diagramas de flujo'] },
    { id: 'edd',     name: 'Estructuras de Datos',          short: 'Estructuras',     area: 'Programación',     topics: ['Listas enlazadas', 'Pilas y colas', 'Árboles binarios', 'Recursión', 'Grafos', 'Complejidad Big-O'] },
    { id: 'poo',     name: 'Programación Orientada a Objetos', short: 'POO',          area: 'Programación',     topics: ['Clases y objetos', 'Herencia', 'Polimorfismo', 'Interfaces', 'Encapsulamiento', 'Java'] },
    { id: 'calculo', name: 'Cálculo Diferencial',           short: 'Cálculo',         area: 'Matemáticas',      topics: ['Límites', 'Continuidad', 'Derivadas', 'Regla de la cadena', 'Optimización', 'Razón de cambio'] },
    { id: 'matop',   name: 'Matemáticas Operativas',        short: 'Mat. Operativas', area: 'Matemáticas',      topics: ['Fracciones y potencias', 'Ecuaciones lineales', 'Funciones', 'Logaritmos', 'Trigonometría básica'] },
    { id: 'algebra', name: 'Álgebra Lineal',                short: 'Álgebra',         area: 'Matemáticas',      topics: ['Matrices', 'Determinantes', 'Sistemas de ecuaciones', 'Espacios vectoriales', 'Valores propios'] },
    { id: 'fisica',  name: 'Física Mecánica',               short: 'Física',          area: 'Ciencias básicas', topics: ['Vectores', 'Cinemática', 'Leyes de Newton', 'Trabajo y energía', 'Momento lineal'] },
    { id: 'mesp',    name: 'Matemáticas Especiales',        short: 'Mat. Especiales', area: 'Matemáticas',      topics: ['Ecuaciones diferenciales', 'Transformada de Laplace', 'Series de Fourier', 'Variable compleja'] }
  ];

  const places = ['Biblioteca · Cubículo 4', 'Biblioteca · Sala de estudio 2', 'Bloque 7 · Sala de monitorías', 'Bloque 3 · Laboratorio de cómputo'];

  /* ---------- Tutores pares (personas ficticias) ----------
     avail: disponibilidad semanal recurrente. Clave = día (1 lunes … 6 sábado). */
  const tutors = [
    {
      id: 't1', name: 'Laura Restrepo', program: 'Ingeniería de Software', semester: 8, hue: 221,
      grades: { edd: 4.8, poo: 4.7, logica: 4.9, calculo: 4.2, fisica: 3.7 },
      rating: 4.9, reviews: 38, sessions: 64, attendance: 98, response: 12,
      bio: 'Monitora del semillero de desarrollo. Antes de tocar código, dibujo cada estructura en el tablero hasta que tenga sentido.',
      method: 'Partimos de tu taller o de tu código real: 10 minutos de diagnóstico, lo resolvemos juntos y te dejo 3 ejercicios de refuerzo.',
      place: places[0],
      avail: { 1: ['14:00', '15:00', '16:00'], 3: ['10:00', '11:00'], 4: ['17:00'], 5: ['14:00', '15:00'] },
      reviewsList: [
        { author: 'Sara M.', subject: 'edd', rating: 5, text: 'Por fin entendí la recursión en árboles. Dibuja todo y no te hace sentir mal por preguntar.', when: 'hace 1 semana' },
        { author: 'Kevin A.', subject: 'edd', rating: 5, text: 'Revisó mi código línea por línea, justo lo que no podía hacer en la tutoría grupal.', when: 'hace 3 semanas' },
        { author: 'Daniela P.', subject: 'logica', rating: 4, text: 'Muy clara. La sesión se me hizo corta, la próxima reservo dos bloques.', when: 'hace 1 mes' }
      ]
    },
    {
      id: 't2', name: 'Santiago Ochoa', program: 'Ingeniería Eléctrica', semester: 7, hue: 160,
      grades: { calculo: 4.9, algebra: 4.5, fisica: 4.4, matop: 4.6 },
      rating: 4.8, reviews: 41, sessions: 72, attendance: 96, response: 20,
      bio: 'Me encanta explicar cálculo con ejemplos de la vida real. Si no lo entiendes con un método, buscamos otro.',
      method: 'Resolvemos ejercicios tipo parcial de menor a mayor dificultad. Traes tus dudas y salimos con un mapa de lo que debes repasar.',
      place: places[2],
      avail: { 1: ['10:00', '11:00'], 2: ['14:00', '15:00', '16:00'], 4: ['14:00', '15:00'], 6: ['09:00', '10:00'] },
      reviewsList: [
        { author: 'Juliana T.', subject: 'calculo', rating: 5, text: 'La regla de la cadena me parecía imposible. Con sus ejemplos la entendí en una sesión.', when: 'hace 4 días' },
        { author: 'Esteban R.', subject: 'calculo', rating: 5, text: 'Puntual y muy paciente. Además es gratis porque lo hace por horas sociales.', when: 'hace 2 semanas' }
      ]
    },
    {
      id: 't3', name: 'Camila Arango', program: 'Ingeniería de Software', semester: 9, hue: 330,
      grades: { logica: 5.0, poo: 4.6, edd: 4.4 },
      rating: 5.0, reviews: 27, sessions: 45, attendance: 100, response: 8,
      bio: 'Fui monitora de Lógica dos semestres. Sé exactamente en qué ejercicios se traba la gente de primer semestre.',
      method: 'Pensamos primero en pseudocódigo y después lo pasamos a código. Nada de memorizar: entender el porqué.',
      place: places[3],
      avail: { 2: ['08:00', '09:00'], 3: ['14:00', '15:00', '16:00'], 5: ['10:00', '11:00'] },
      reviewsList: [
        { author: 'Mateo L.', subject: 'logica', rating: 5, text: 'Me explicó ciclos como nadie. Pasé de no entender nada a sacar 4.2 en el parcial.', when: 'hace 6 días' },
        { author: 'Ana G.', subject: 'logica', rating: 5, text: 'Súper paciente. Te deja preguntar todo sin juzgar.', when: 'hace 2 semanas' }
      ]
    },
    {
      id: 't4', name: 'Tomás Henao', program: 'Ingeniería Mecánica', semester: 8, hue: 25,
      grades: { fisica: 4.6, calculo: 4.3, mesp: 4.1 },
      rating: 4.7, reviews: 29, sessions: 51, attendance: 95, response: 25,
      bio: 'Uso simulaciones y diagramas de cuerpo libre para que la física deje de ser fórmulas sueltas.',
      method: 'Cada sesión arranca con un diagrama. Si entiendes el dibujo, la ecuación sale sola.',
      place: places[1],
      avail: { 1: ['16:00', '17:00'], 3: ['16:00', '17:00'], 5: ['08:00', '09:00'] },
      reviewsList: [
        { author: 'Felipe C.', subject: 'fisica', rating: 5, text: 'Los diagramas de cuerpo libre por fin tienen sentido.', when: 'hace 1 semana' },
        { author: 'Laura V.', subject: 'fisica', rating: 4, text: 'Buen dominio del tema, aunque llegó 5 minutos tarde.', when: 'hace 1 mes' }
      ]
    },
    {
      id: 't5', name: 'Isabela Cardona', program: 'Ingeniería Industrial', semester: 6, hue: 280,
      grades: { matop: 4.7, algebra: 4.3, calculo: 4.1 },
      rating: 4.8, reviews: 19, sessions: 30, attendance: 97, response: 15,
      bio: 'Refuerzo bases de matemáticas para quienes llegan del colegio con vacíos. Sin afán y desde cero.',
      method: 'Diagnóstico corto, repaso de la base que falta y ejercicios guiados. Te llevas una guía resumen.',
      place: places[0],
      avail: { 2: ['10:00', '11:00'], 4: ['10:00', '11:00', '12:00'], 6: ['10:00'] },
      reviewsList: [
        { author: 'Andrés F.', subject: 'matop', rating: 5, text: 'Explica desde cero sin hacerte sentir mal. Recomendadísima para primer semestre.', when: 'hace 5 días' }
      ]
    },
    {
      id: 't6', name: 'Sebastián Vélez', program: 'Ingeniería de Software', semester: 9, hue: 200,
      grades: { poo: 4.9, edd: 4.6, logica: 4.7 },
      rating: 4.9, reviews: 33, sessions: 58, attendance: 97, response: 10,
      bio: 'Desarrollador junior en una empresa de software. Te enseño POO como se usa de verdad en la industria.',
      method: 'Programamos en vivo en Java. Compartes pantalla y refactorizamos tu propio proyecto.',
      place: places[3],
      avail: { 1: ['18:00', '19:00'], 2: ['18:00', '19:00'], 4: ['18:00', '19:00'] },
      reviewsList: [
        { author: 'Camilo B.', subject: 'poo', rating: 5, text: 'Me ayudó a entender polimorfismo con mi propio proyecto. Vale cada peso.', when: 'hace 3 días' },
        { author: 'Natalia S.', subject: 'poo', rating: 5, text: 'Explica con ejemplos reales de trabajo. Muy recomendado.', when: 'hace 3 semanas' }
      ]
    },
    {
      id: 't7', name: 'Manuela Zapata', program: 'Ingeniería Electrónica', semester: 7, hue: 145,
      grades: { algebra: 4.8, calculo: 4.5, matop: 4.4 },
      rating: 4.8, reviews: 22, sessions: 37, attendance: 99, response: 18,
      bio: 'Álgebra lineal es más visual de lo que parece. Uso GeoGebra para que veas las matrices moverse.',
      method: 'Teoría mínima, mucha práctica y visualizaciones. Ideal para preparar parciales.',
      place: places[1],
      avail: { 1: ['08:00', '09:00'], 3: ['08:00', '09:00'], 5: ['16:00', '17:00'] },
      reviewsList: [
        { author: 'Miguel Á.', subject: 'algebra', rating: 5, text: 'Con GeoGebra entendí los espacios vectoriales. Excelente.', when: 'hace 2 semanas' }
      ]
    },
    {
      id: 't8', name: 'Julián Correa', program: 'Ingeniería Eléctrica', semester: 10, hue: 45,
      grades: { mesp: 4.7, calculo: 4.6, algebra: 4.4, fisica: 4.2 },
      rating: 4.7, reviews: 24, sessions: 49, attendance: 94, response: 30,
      bio: 'Monitor informal de Matemáticas Especiales desde hace dos años. Laplace y Fourier sin miedo.',
      method: 'Banco de ejercicios de parciales anteriores, resueltos paso a paso con tips para el examen.',
      place: places[2],
      avail: { 2: ['16:00', '17:00'], 4: ['16:00', '17:00'], 6: ['11:00', '12:00'] },
      reviewsList: [
        { author: 'Sofía H.', subject: 'mesp', rating: 5, text: 'Me salvó el final de Especiales. Domina el tema de verdad.', when: 'hace 1 semana' }
      ]
    }
  ];

  /* ---------- Ofertas publicadas (lo que ve el estudiante en el catálogo) ----------
     incentive: 'pago' (remunerada) · 'social' (horas de bienestar) · 'creditos' (certificación) */
  const offers = [
    { id: 'o1', tutorId: 't1', subject: 'edd',     topics: ['Árboles binarios', 'Recursión', 'Listas enlazadas', 'Pilas y colas'], incentive: 'pago', rate: 22000, modality: ['presencial', 'virtual'] },
    { id: 'o2', tutorId: 't2', subject: 'calculo', topics: ['Límites', 'Derivadas', 'Regla de la cadena', 'Optimización'], incentive: 'social', rate: 0, modality: ['presencial'] },
    { id: 'o3', tutorId: 't3', subject: 'logica',  topics: ['Condicionales', 'Ciclos for / while', 'Arreglos', 'Pseudocódigo'], incentive: 'social', rate: 0, modality: ['presencial', 'virtual'] },
    { id: 'o4', tutorId: 't6', subject: 'poo',     topics: ['Clases y objetos', 'Herencia', 'Polimorfismo', 'Java'], incentive: 'pago', rate: 25000, modality: ['virtual'] },
    { id: 'o5', tutorId: 't5', subject: 'matop',   topics: ['Fracciones y potencias', 'Ecuaciones lineales', 'Funciones', 'Logaritmos'], incentive: 'creditos', rate: 0, modality: ['presencial', 'virtual'] },
    { id: 'o6', tutorId: 't4', subject: 'fisica',  topics: ['Vectores', 'Cinemática', 'Leyes de Newton', 'Trabajo y energía'], incentive: 'pago', rate: 20000, modality: ['presencial'] },
    { id: 'o7', tutorId: 't7', subject: 'algebra', topics: ['Matrices', 'Determinantes', 'Espacios vectoriales'], incentive: 'social', rate: 0, modality: ['presencial', 'virtual'] },
    { id: 'o8', tutorId: 't8', subject: 'mesp',    topics: ['Transformada de Laplace', 'Series de Fourier', 'Ecuaciones diferenciales'], incentive: 'pago', rate: 28000, modality: ['virtual'] },
    { id: 'o9', tutorId: 't6', subject: 'edd',     topics: ['Grafos', 'Complejidad Big-O', 'Recursión'], incentive: 'pago', rate: 25000, modality: ['virtual'] }
  ];

  /* ---------- Personas de la demo ---------- */
  const personas = {
    student: { name: 'Juan Carrascal', initials: 'JC', hue: 205, role: 'Estudiante', detail: 'Ing. de Software · 1.er semestre', subjects: ['logica', 'calculo', 'matop'] },
    tutor:   { name: 'Laura Restrepo', initials: 'LR', hue: 221, role: 'Tutora par', detail: 'Ing. de Software · 8.º semestre', tutorId: 't1' },
    inst:    { name: 'Bienestar Universitario', initials: 'BU', hue: 250, role: 'Institución', detail: 'Dirección Académica · I.U. Pascual Bravo' }
  };

  /* ---------- Solicitudes entrantes para la tutora (Portal del tutor) ---------- */
  const requests = [
    { id: 'r1', student: 'Sara Muñoz', initials: 'SM', hue: 12, semester: 3, subject: 'edd', topic: 'Árboles binarios', dayOffset: 1, time: '15:00', modality: 'presencial', note: 'Tengo parcial el viernes y no entiendo el recorrido inorden.', status: 'pendiente' },
    { id: 'r2', student: 'Kevin Álvarez', initials: 'KA', hue: 190, semester: 2, subject: 'logica', topic: 'Ciclos for / while', dayOffset: 2, time: '10:00', modality: 'virtual', note: 'Adjunto el taller 4. Me pierdo con los ciclos anidados.', status: 'pendiente' },
    { id: 'r3', student: 'Mariana Ríos', initials: 'MR', hue: 300, semester: 3, subject: 'edd', topic: 'Recursión', dayOffset: 3, time: '14:00', modality: 'presencial', note: 'Quiero repasar recursión antes del examen final.', status: 'pendiente' }
  ];

  /* ---------- Panel institucional (datos simulados del piloto) ---------- */
  // Sesiones completadas por semana del semestre. Semanas 8 y 16 = parciales.
  const weekly = [14, 22, 31, 38, 45, 52, 70, 124, 66, 58, 54, 61, 68, 79, 96, 142];
  const examWeeks = [8, 16];

  // Demanda relativa por asignatura (base) para el mapa de calor.
  const demandBase = { logica: 1.0, edd: 0.85, calculo: 0.95, matop: 0.7, poo: 0.6, algebra: 0.5, fisica: 0.55, mesp: 0.35 };

  const topTopics = [
    { topic: 'Árboles binarios', subject: 'edd', count: 142 },
    { topic: 'Regla de la cadena', subject: 'calculo', count: 128 },
    { topic: 'Ciclos for / while', subject: 'logica', count: 117 },
    { topic: 'Recursión', subject: 'edd', count: 96 },
    { topic: 'Límites', subject: 'calculo', count: 88 },
    { topic: 'Polimorfismo', subject: 'poo', count: 61 }
  ];

  const applicants = [
    { id: 'a1', name: 'Daniel Mesa', program: 'Ingeniería Mecánica', semester: 6, subject: 'calculo', grade: 4.3, rating: null, sessions: 0, status: 'revision' },
    { id: 'a2', name: 'Valeria Gil', program: 'Ingeniería de Software', semester: 5, subject: 'logica', grade: 3.8, rating: null, sessions: 0, status: 'rechazado' },
    { id: 'a3', name: 'Andrés Toro', program: 'Ingeniería Industrial', semester: 7, subject: 'matop', grade: 4.5, rating: null, sessions: 0, status: 'revision' }
  ];

  const kpiTargets = [
    { name: 'Reducción de reprobación (asignatura piloto)', base: 'Por medir · Registro Académico', target: 'Meta a definir con la institución', source: 'Registro Académico' },
    { name: 'Tutorías completadas / reservadas', base: '—', target: '≥ 85%', source: 'PeerLearn' },
    { name: 'Tasa de asistencia', base: '—', target: '≥ 90%', source: 'PeerLearn' },
    { name: 'Retención (estudiantes que repiten)', base: '—', target: '≥ 40%', source: 'PeerLearn' },
    { name: 'Satisfacción promedio', base: '—', target: '≥ 4.5 / 5', source: 'Reseñas verificadas' }
  ];

  return { rules, subjects, places, tutors, offers, personas, requests, weekly, examWeeks, demandBase, topTopics, applicants, kpiTargets };
})();

