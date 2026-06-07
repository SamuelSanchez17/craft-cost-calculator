// ────────────────────────────────────────────
// Motor de cálculo — Piezas, Velas, Combos
// Sin dependencias de UI ni DOM. Pura lógica.
// ────────────────────────────────────────────

import {
  COSTO_FIJO_POR_PIEZA,
  COSTOS_COLOR,
  COSTOS_SELLADOR,
  COSTOS_DETALLE_FINO,
  CONFIG_VELAS,
} from './catalog.js';

/**
 * Redondea hacia arriba al siguiente múltiplo de 5.
 * Math.ceil(price / 5) * 5
 * Si precio es 0 o negativo, retorna 0.
 */
export function redondearA5(precio) {
  if (!precio || precio <= 0) return 0;
  return Math.ceil(precio / 5) * 5;
}

/**
 * Redondea a 2 decimales estándar.
 */
function redondear2(n) {
  return Math.round(n * 100) / 100;
}

// ────────────────────────────────────────────
// CÁLCULO DE PIEZA DE YESO
// ────────────────────────────────────────────

/**
 * Calcula el costo base y precio final de una pieza de yeso.
 *
 * @param {Object} params
 * @param {number} params.peso_g          — peso en gramos
 * @param {string} params.tamano          — 'chica' | 'mediana' | 'grande'
 * @param {number} params.precioYesoPorG  — $/g del yeso elegido (de settings)
 * @param {number} params.minutos         — minutos estimados de mano de obra
 * @param {number} params.tarifaPorMinuto — $/min según zona (de settings)
 * @param {boolean} params.conColor       — ¿lleva pintura?
 * @param {boolean} params.conDetalleFino — ¿lleva detalle fino?
 * @param {boolean} params.conSellador    — ¿lleva sellador?
 * @param {number} [params.ajusteDesmolde=0] — ajuste por dificultad de desmolde ($)
 * @param {number} [params.ajusteEsfuerzo=0]  — ajuste por esfuerzo extra ($)
 * @param {number} [params.minutosExtra=0]    — minutos adicionales de MO
 * @param {Object} [params.costosColor]       — override de tabla de color
 * @param {Object} [params.costosSellador]    — override de tabla de sellador
 * @param {Object} [params.costosDetalleFino] — override de tabla de detalle fino
 * @returns {{ desglose: Object, costoBase: number, precioMinimo: number, precioFinal: number, gananciaMXN: number, gananciaPct: number }}
 */
export function calcularCosto(params) {
  const {
    peso_g,
    tamano,
    precioYesoPorG,
    minutos,
    tarifaPorMinuto,
    conColor,
    conDetalleFino,
    conSellador,
    ajusteDesmolde = 0,
    ajusteEsfuerzo = 0,
    minutosExtra = 0,
    costosColor = COSTOS_COLOR,
    costosSellador = COSTOS_SELLADOR,
    costosDetalleFino = COSTOS_DETALLE_FINO,
  } = params;

  const safeMinutos = Math.max(0, Number(minutos) || 0);
  const safeMinutosExtra = Math.max(0, Number(minutosExtra) || 0);
  const safePeso = Math.max(0, Number(peso_g) || 0);
  const safePrecioYeso = Math.max(0, Number(precioYesoPorG) || 0);
  const safeTarifa = Math.max(0, Number(tarifaPorMinuto) || 0);
  const safeAjusteDesmolde = Math.max(0, Number(ajusteDesmolde) || 0);
  const safeAjusteEsfuerzo = Math.max(0, Number(ajusteEsfuerzo) || 0);

  const costoYeso       = redondear2(safePeso * safePrecioYeso);
  const costosFijos     = COSTO_FIJO_POR_PIEZA;
  const manoDeObra      = redondear2((safeMinutos + safeMinutosExtra) * safeTarifa);
  const costoColor      = conColor ? (costosColor[tamano] || 0) : 0;
  const costoDetalle    = conDetalleFino ? (costosDetalleFino[tamano] || 0) : 0;
  const costoSellador   = conSellador ? (costosSellador[tamano] || 0) : 0;

  const costoBase = redondear2(
    costoYeso
    + costosFijos
    + manoDeObra
    + costoColor
    + costoDetalle
    + costoSellador
    + safeAjusteDesmolde
    + safeAjusteEsfuerzo
  );

  return {
    desglose: {
      costoYeso,
      costosFijos,
      manoDeObra,
      costoColor,
      costoDetalle,
      costoSellador,
      ajusteDesmolde: safeAjusteDesmolde,
      ajusteEsfuerzo: safeAjusteEsfuerzo,
    },
    costoBase,
  };
}

// ────────────────────────────────────────────
// PRECIO FINAL (margen + urgencia + redondeo)
// ────────────────────────────────────────────

/**
 * Aplica margen de canal y recargo por urgencia al costo base,
 * y redondea al siguiente múltiplo de $5.
 *
 * @param {number} costoBase       — de calcularCosto()
 * @param {number} margen          — fracción (ej. 0.45 para 45%)
 * @param {number} [recargoUrgencia=0] — fracción (ej. 0.20 para 20%)
 * @returns {{ costoAjustado: number, precioMinimo: number, precioFinal: number, gananciaMXN: number, gananciaPct: number }}
 */
export function calcularPrecioFinal({ costoBase, margen, recargoUrgencia = 0 }) {
  const safeCostoBase = Math.max(0, Number(costoBase) || 0);
  const safeMargen = Math.max(0, Math.min(0.99, Number(margen) || 0));
  const safeRecargo = Math.max(0, Number(recargoUrgencia) || 0);

  const costoAjustado = redondear2(safeCostoBase * (1 + safeRecargo));
  const denominador = 1 - safeMargen;
  const precioMinimo = denominador > 0 ? redondear2(costoAjustado / denominador) : costoAjustado;
  const precioFinal   = redondearA5(precioMinimo);
  const gananciaMXN   = redondear2(Math.max(0, precioFinal - costoAjustado));
  const gananciaPct   = precioFinal > 0 ? redondear2((gananciaMXN / precioFinal) * 100) : 0;

  return {
    costoAjustado,
    precioMinimo,
    precioFinal,
    gananciaMXN,
    gananciaPct,
  };
}

/**
 * Función completa: pieza → precio final en un solo paso.
 * Útil para la UI de calculadora individual.
 */
export function calcularPiezaCompleta(params) {
  const { margen, recargoUrgencia, ...costoParams } = params;
  const { desglose, costoBase } = calcularCosto(costoParams);
  const precio = calcularPrecioFinal({ costoBase, margen, recargoUrgencia });

  return { desglose, costoBase, ...precio };
}

// ────────────────────────────────────────────
// CÁLCULO DE VELAS
// ────────────────────────────────────────────

/**
 * Calcula el costo de una vela individual.
 *
 * @param {Object} params
 * @param {number} params.pesoCeraG        — gramos de cera
 * @param {number} params.pesoAromaG       — gramos de aroma
 * @param {number} params.minutos          — minutos de MO base
 * @param {number} params.tarifaPorMinuto  — $/min de la zona
 * @param {number} [params.capas=1]        — si tiene múltiples capas, multiplica costo
 * @param {boolean} [params.conColor=true] — costo fijo $0.50
 * @param {boolean} [params.conPabilo=true]— costo fijo $1.00
 * @param {boolean} [params.conDecorado=false] — +5 min extra si lleva decorado
 * @param {Object} [params.config]         — overrides de CONFIG_VELAS
 * @returns {{ desglose: Object, costoBase: number }}
 */
export function calcularVela(params) {
  const {
    pesoCeraG,
    pesoAromaG,
    minutos,
    tarifaPorMinuto,
    capas = 1,
    conColor = true,
    conPabilo = true,
    conDecorado = false,
    config = {},
  } = params;

  const cfg = { ...CONFIG_VELAS, ...config };

  const safePesoCera = Math.max(0, Number(pesoCeraG) || 0);
  const safePesoAroma = Math.max(0, Number(pesoAromaG) || 0);
  const safeMinutos = Math.max(0, Number(minutos) || 0);
  const safeTarifa = Math.max(0, Number(tarifaPorMinuto) || 0);
  const safeCapas = Math.max(1, Number(capas) || 1);

  const costoCera     = redondear2(safePesoCera * cfg.precioCeraPorGramo);
  const costoAroma    = redondear2(safePesoAroma * cfg.precioAromaPorGramo);
  const costoColor    = conColor ? cfg.costoColorFijo : 0;
  const costoPabilo   = conPabilo ? cfg.costoPabiloFijo : 0;
  const costosFijos   = cfg.costoFijo;
  const minutosTotal  = safeMinutos + (conDecorado ? cfg.extraDecorarMinutos : 0);
  const manoDeObra    = redondear2(minutosTotal * safeTarifa);

  const costoBase = redondear2(
    (costoCera + costoAroma + costoColor + costoPabilo + costosFijos + manoDeObra) * safeCapas
  );

  return {
    desglose: {
      costoCera,
      costoAroma,
      costoColor,
      costoPabilo,
      costosFijos,
      manoDeObra,
      capas: safeCapas,
    },
    costoBase,
  };
}

/**
 * Vela completa con precio final.
 */
export function calcularVelaCompleta(params) {
  const { margen, recargoUrgencia, ...velaParams } = params;
  const { desglose, costoBase } = calcularVela(velaParams);
  const precio = calcularPrecioFinal({ costoBase, margen, recargoUrgencia });

  return { desglose, costoBase, ...precio };
}

// ────────────────────────────────────────────
// CÁLCULO DE COMBOS / ARREGLOS
// ────────────────────────────────────────────

const COSTO_ARMADO_COMBO = 3.00;

/**
 * Calcula el costo de un combo / arreglo floral.
 *
 * @param {Object[]} piezas — array de objetos con { costoBase } (resultado de calcularCosto)
 * @param {Object[]} ceras  — array de objetos con { costoUnitario } (del CATALOGO_CERAS)
 * @param {number} [cantidadPiezas=1] — multiplicador de cantidad por pieza (mismo item repetido)
 * @param {number} [cantidadCeras=1]  — multiplicador de cantidad por cera
 * @returns {number} costoBase del combo
 */
export function calcularCombo(piezas = [], ceras = []) {
  const sumaPiezas = piezas.reduce((acc, p) => acc + (p.costoBase || 0), 0);
  const sumaCeras  = ceras.reduce((acc, c)  => acc + (c.costoUnitario || 0), 0);

  return redondear2(sumaPiezas + sumaCeras + COSTO_ARMADO_COMBO);
}

/**
 * Combo completo con precio final.
 *
 * @param {Object[]} piezas
 * @param {Object[]} ceras
 * @param {number} margen
 * @param {number} [recargoUrgencia=0]
 */
export function calcularComboCompleto({ piezas, ceras, margen, recargoUrgencia = 0 }) {
  const costoBase = calcularCombo(piezas, ceras);
  const precio    = calcularPrecioFinal({ costoBase, margen, recargoUrgencia });

  return {
    costoBase,
    armado: COSTO_ARMADO_COMBO,
    sumaPiezas: redondear2(piezas.reduce((acc, p) => acc + (p.costoBase || 0), 0)),
    sumaCeras:  redondear2(ceras.reduce((acc, c)  => acc + (c.costoUnitario || 0), 0)),
    ...precio,
  };
}
