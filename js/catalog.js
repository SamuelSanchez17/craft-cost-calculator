// ────────────────────────────────────────────
// Catálogo de datos maestros
// ────────────────────────────────────────────

export const YESOS = {
  tigre:   { id: 'tigre',   nombre: 'Yeso del Tigre',   precioPorGramo: 0.010 },
  redimix: { id: 'redimix', nombre: 'Yeso Redimix',     precioPorGramo: 0.025 },
  aksi:    { id: 'aksi',    nombre: 'Yeso AKSi',        precioPorGramo: 0.023 },
};

export const COSTO_FIJO_POR_PIEZA = 5.00;

export const TARIFAS_ZONA = {
  pueblo: { id: 'pueblo', nombre: 'Pueblo', tarifaPorMinuto: 1.16 },
  ciudad: { id: 'ciudad', nombre: 'Ciudad',                    tarifaPorMinuto: 1.33 },
};

export const COSTOS_COLOR = {
  chica:   5.00,
  mediana: 10.00,
  grande:  15.00,
};

export const COSTOS_SELLADOR = {
  chica:   8.00,
  mediana: 12.00,
  grande:  18.00,
};

export const COSTOS_DETALLE_FINO = {
  chica:   5.00,
  mediana: 10.00,
  grande:  20.00,
};

export const MARGENES_CANAL = {
  venta_directa:    { id: 'venta_directa',    nombre: 'Venta directa',               margen: 0.55 },
  bazar:            { id: 'bazar',            nombre: 'Bazar / evento',              margen: 0.45 },
  mayoreo_diversas: { id: 'mayoreo_diversas', nombre: 'Mayoreo (piezas diversas)',   margen: 0.15 },
  mayoreo_6_iguales:{ id: 'mayoreo_6_iguales',nombre: 'Mayoreo (6+ piezas iguales)', margen: 0.20 },
};

export const RECARGOS_URGENCIA = {
  normal:       { id: 'normal',       nombre: '5+ días',     recargo: 0.00 },
  tres_dias:    { id: 'tres_dias',    nombre: '3 días',       recargo: 0.20 },
  uno_dos_dias: { id: 'uno_dos_dias', nombre: '1–2 días',     recargo: 0.30 },
};

export const AJUSTES_DESMOLDE = {
  normal:      { id: 'normal',      nombre: 'Normal',                       valor: 0.00 },
  dificil:     { id: 'dificil',     nombre: 'Desmolde difícil',             valor: 5.00 },
  muy_dificil: { id: 'muy_dificil', nombre: 'Muy difícil / moldea manos',   valor: 10.00 },
  lastima:     { id: 'lastima',     nombre: 'Lastima uñas o dedos',         valor: 5.00 },
};

// ─── Catálogo de piezas de yeso ───
// Sección 1 del doc. Tamaño ASIGNADO, NO derivado del peso.

export const CATALOGO_PIEZAS = [
  { id: 1,  nombre: 'Base má maceta grande',        peso: 164, tamano: 'mediana', minutos: 40 },
  { id: 2,  nombre: 'Conejo',                        peso: 100, tamano: 'chica',   minutos: 10 },
  { id: 3,  nombre: 'Corazón con tapa',              peso: 73,  tamano: 'chica',   minutos: 15 },
  { id: 4,  nombre: 'Corazón grande maceta',         peso: 275, tamano: 'grande',  minutos: 15 },
  { id: 5,  nombre: 'Corazón tazón',                 peso: 40,  tamano: 'chica',   minutos: 15 },
  { id: 6,  nombre: 'Corazón trenzado',              peso: 152, tamano: 'chica',   minutos: 15 },
  { id: 7,  nombre: 'Florero',                       peso: 277, tamano: 'chica',   minutos: 25 },
  { id: 8,  nombre: 'Maceta circular grande',        peso: 520, tamano: 'grande',  minutos: 25 },
  { id: 9,  nombre: 'Maceta pequeña má',             peso: 115, tamano: 'chica',   minutos: 15 },
  { id: 10, nombre: 'Maceta super mini',             peso: 14,  tamano: 'chica',   minutos: 15 },
  { id: 11, nombre: 'Macetas 4 formas',              peso: 81,  tamano: 'chica',   minutos: 15 },
  { id: 12, nombre: 'Muñequita shh',                 peso: 166, tamano: 'chica',   minutos: 20 },
  { id: 13, nombre: 'Muñequita de pelo liso',        peso: 266, tamano: 'chica',   minutos: 20 },
  { id: 14, nombre: 'Muñequita dormida',             peso: 160, tamano: 'chica',   minutos: 20 },
  { id: 15, nombre: 'Tapa circular maceta grande',   peso: 368, tamano: 'grande',  minutos: 15 },
  { id: 16, nombre: 'Tapa de maceta pequeña',        peso: 69,  tamano: 'chica',   minutos: 15 },
  { id: 17, nombre: 'Tapa maceta má',                peso: 146, tamano: 'mediana', minutos: 15 },
];

// ─── Catálogo de figuras de cera ───

export const CATALOGO_CERAS = [
  { id: 'c1',  nombre: 'Oso liso',                tamano: 'pequena', peso: 31.1,  costoUnitario: 39.50 },
  { id: 'c2',  nombre: 'Osito con pelo',           tamano: 'pequena', peso: 9.8,   costoUnitario: 34.80 },
  { id: 'c3',  nombre: 'Rosa grande',              tamano: 'mediana', peso: 19.9,  costoUnitario: 37.10 },
  { id: 'c4',  nombre: 'Rosa mediana',             tamano: 'mediana', peso: 19.2,  costoUnitario: 36.90 },
  { id: 'c5',  nombre: 'Rosas pequeñitas',         tamano: 'pequena', peso: 9,     costoUnitario: 32.80 },
  { id: 'c6',  nombre: 'Mariposa pequeña',         tamano: 'pequena', peso: 6,     costoUnitario: 32.40 },
  { id: 'c7',  nombre: 'Corazón sólido maya',      tamano: 'mediana', peso: 22.5,  costoUnitario: 38.10 },
  { id: 'c8',  nombre: 'Peonía pequeña 2 colores', tamano: 'pequena', peso: 32.6,  costoUnitario: 42.10 },
  { id: 'c9',  nombre: 'Peonía pequeña',           tamano: 'pequena', peso: 28.4,  costoUnitario: 38.90 },
  { id: 'c10', nombre: 'Peonía grande',            tamano: 'grande',  peso: 79.5,  costoUnitario: 67.80 },
  { id: 'c11', nombre: 'Tulipán pequeño',          tamano: 'pequena', peso: 21.5,  costoUnitario: 36.30 },
  { id: 'c12', nombre: 'Flor pétalos juntos',      tamano: 'mediana', peso: 19.6,  costoUnitario: 37.00 },
  { id: 'c13', nombre: 'Corazón tejido mediano',   tamano: 'mediana', peso: 53.5,  costoUnitario: 48.90 },
  { id: 'c14', nombre: 'Corazón tejido grande',    tamano: 'grande',  peso: 141.3, costoUnitario: 78.40 },
  { id: 'c15', nombre: 'Vela horizontal corazón',  tamano: 'mediana', peso: 68.1,  costoUnitario: 51.30 },
];

// ─── Configuración por defecto para velas ───

export const CONFIG_VELAS = {
  precioCeraPorGramo:  0.1215, 
  precioAromaPorGramo: 0.08,    // Aproximado — ajustable en settings
  costoColorFijo:      0.50,
  costoPabiloFijo:     1.00,
  costoFijo:           5.00,
  extraDecorarMinutos: 5,       // +5 min sobre MO base para decorado
};

// ─── Configuración base de settings editables ───
// Son los valores que el usuario puede modificar desde el panel de settings.
// Se persisten en localStorage. Si no hay datos guardados, se usan estos.

export const DEFAULT_SETTINGS = {
  yesos: [
    { id: 'tigre',   nombre: 'Yeso del Tigre',   presentacionG: 40000, precioPresentacion: 400, precioPorGramo: 0.010 },
    { id: 'redimix', nombre: 'Yeso Redimix',     presentacionG: 1500,  precioPresentacion: 37.50, precioPorGramo: 0.025 },
    { id: 'aksi',    nombre: 'Yeso AKSi',        presentacionG: 1500,  precioPresentacion: 35.00, precioPorGramo: 0.023 },
  ],
  tarifasZona: {
    pueblo: 1.16,
    ciudad: 1.33,
  },
  costosColor: {
    chica:   5.00,
    mediana: 10.00,
    grande:  15.00,
  },
  costosSellador: {
    chica:   8.00,
    mediana: 12.00,
    grande:  18.00,
  },
  costosDetalleFino: {
    chica:   5.00,
    mediana: 10.00,
    grande:  20.00,
  },
  margenesCanal: {
    venta_directa:    0.55,
    bazar:            0.45,
    mayoreo_diversas: 0.15,
    mayoreo_6_iguales: 0.20,
  },
  recargosUrgencia: {
    normal:       0.00,
    tres_dias:    0.20,
    uno_dos_dias: 0.30,
  },
  ajustesDesmolde: {
    normal:      0.00,
    dificil:     5.00,
    muy_dificil: 10.00,
    lastima:     5.00,
  },
  velas: {
    precioCeraPorGramo:  0.1215,
    precioAromaPorGramo: 0.08,
    costoColorFijo:      0.50,
    costoPabiloFijo:     1.00,
    costoFijo:           5.00,
    extraDecorarMinutos: 5,
  },
};

// ─── Nombres para humanos de cada canal y urgencia ───
// Útil para mostrar en UI sin necesidad de buscar en objetos anidados.

export const ETIQUETAS_CANAL = {
  venta_directa:    'Venta directa (55%)',
  bazar:            'Bazar / evento (45%)',
  mayoreo_diversas: 'Mayoreo piezas diversas (15%)',
  mayoreo_6_iguales:'Mayoreo 6+ piezas iguales (20%)',
};

export const ETIQUETAS_URGENCIA = {
  normal:       '5+ días (sin recargo)',
  tres_dias:    '3 días (+20%)',
  uno_dos_dias: '1–2 días (+30%)',
};

export const ETIQUETAS_DESMOLDE = {
  normal:      'Normal',
  dificil:     'Difícil (+$5)',
  muy_dificil: 'Muy difícil / moldea manos (+$10)',
  lastima:     'Lastima uñas o dedos (+$5)',
};
