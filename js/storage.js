// ────────────────────────────────────────────
// Capa de persistencia — localStorage
// Keys con prefijo cc_ para evitar colisiones.
// Fallback silencioso a defaults si localStorage
// no disponible (modo incógnito, quota llena).
// ────────────────────────────────────────────

import { DEFAULT_SETTINGS } from './catalog.js';

const STORAGE_PREFIX = 'cc_';
const HISTORY_MAX = 50;

// ─── Helpers internos ───

/**
 * Intenta acceder a localStorage. Retorna false si no disponible.
 */
function storageAvailable() {
  try {
    const key = `${STORAGE_PREFIX}test`;
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function getItem(key) {
  if (!storageAvailable()) return null;
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setItem(key, value) {
  if (!storageAvailable()) return false;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.warn('[storage] localStorage quota exceeded — trying cleanup');
      try {
        const history = getItem('history');
        if (history && history.length > 10) {
          history.length = 10;
          localStorage.setItem(`${STORAGE_PREFIX}history`, JSON.stringify(history));
          localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
          return true;
        }
      } catch {
        // Still failed — give up silently
      }
    }
    return false;
  }
}

function removeItem(key) {
  if (!storageAvailable()) return false;
  localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  return true;
}

// ─── Estado global ───

/**
 * Carga el estado completo de la app.
 * Si no hay datos previos, retorna los defaults.
 */
export function loadState() {
  const stored = getItem('state');
  if (stored) return stored;

  return {
    activePanel: 'calculator',
    darkMode: false,
  };
}

/**
 * Persiste el estado completo.
 */
export function saveState(state) {
  return setItem('state', state);
}

// ─── Catálogo personalizado ───

/**
 * Carga el catálogo de piezas guardado por el usuario.
 * Si nunca se ha guardado, retorna null (la app usará el default de catalog.js).
 */
export function loadCatalog() {
  return getItem('catalog');
}

/**
 * Guarda el catálogo completo (incluye piezas nuevas/eliminadas/modificadas).
 */
export function saveCatalog(catalog) {
  return setItem('catalog', catalog);
}

// ─── Settings editables ───

/**
 * Carga los settings editables (precios yeso, tarifas, etc.).
 * Si no hay datos, retorna DEFAULT_SETTINGS.
 */
export function loadSettings() {
  return getItem('settings') || { ...DEFAULT_SETTINGS };
}

/**
 * Guarda los settings.
 */
export function saveSettings(settings) {
  return setItem('settings', settings);
}

/**
 * Restaura los settings a los defaults de fábrica.
 */
export function resetSettings() {
  removeItem('settings');
  return { ...DEFAULT_SETTINGS };
}

// ─── Historial de cálculos ───

/**
 * Carga el historial de cálculos guardados.
 * Siempre retorna un array (vacío si no hay historial).
 */
export function loadHistory() {
  return getItem('history') || [];
}

/**
 * Agrega un cálculo al historial.
 * Mantiene máximo HISTORY_MAX entradas (las más recientes).
 *
 * @param {Object} entry — { id, fecha, tipo: 'pieza'|'combo'|'vela', nombre, canal, precioFinal, desglose, params }
 */
export function addToHistory(entry) {
  const history = loadHistory();
  const item = {
    ...entry,
    id: entry.id || Date.now(),
    fecha: entry.fecha || new Date().toISOString(),
  };

  history.unshift(item);

  if (history.length > HISTORY_MAX) {
    history.length = HISTORY_MAX;
  }

  return setItem('history', history);
}

/**
 * Elimina un item del historial por id.
 */
export function removeFromHistory(id) {
  const history = loadHistory();
  const filtered = history.filter((item) => item.id !== id);
  return setItem('history', filtered);
}

/**
 * Elimina todo el historial.
 */
export function clearHistory() {
  return setItem('history', []);
}

// ─── Cotizaciones guardadas ───

/**
 * Carga las cotizaciones guardadas.
 */
export function loadQuotes() {
  return getItem('quotes') || [];
}

/**
 * Guarda una cotización.
 */
export function saveQuote(quote) {
  const quotes = loadQuotes();
  quotes.unshift({
    ...quote,
    id: quote.id || Date.now(),
    fecha: quote.fecha || new Date().toISOString(),
  });
  return setItem('quotes', quotes);
}

/**
 * Elimina una cotización.
 */
export function removeQuote(id) {
  const quotes = loadQuotes();
  return setItem('quotes', quotes.filter((q) => q.id !== id));
}

// ─── Funciones de utilidad ───

/**
 * Obtiene el espacio usado en localStorage (bytes aprox).
 */
export function getStorageUsage() {
  if (!storageAvailable()) return 0;
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      total += key.length + (localStorage.getItem(key) || '').length;
    }
  }
  return total * 2; // UTF-16 chars → bytes aprox
}

/**
 * Verifica si hay datos previos en localStorage.
 * Útil para decidir si mostrar onboarding o no.
 */
export function hasExistingData() {
  return getItem('catalog') !== null || getItem('settings') !== null;
}

/**
 * Borra TODOS los datos de la app del localStorage.
 * Usar con confirmación previa.
 */
export function clearAllData() {
  if (!storageAvailable()) return;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach((k) => localStorage.removeItem(k));
}
