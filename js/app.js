// ────────────────────────────────────────────
// Entry point de la aplicación
// Inicializa el store, carga persistencia,
// y expone el store global para todos los módulos UI.
// ────────────────────────────────────────────

import { createStore } from './state.js';
import { CATALOGO_PIEZAS, CATALOGO_CERAS, DEFAULT_SETTINGS } from './catalog.js';
import { calcularPiezaCompleta } from './calculator.js';
import * as storage from './storage.js';
import { mountCalculator } from './ui/calculator-ui.js';
import { mountCatalog } from './ui/catalog-ui.js';
import { mountCandles } from './ui/candles-ui.js';
import { mountSettings } from './ui/settings-ui.js';
import { mountCombo } from './ui/combo-ui.js';
import { mountQuote } from './ui/quote-ui.js';
import { mountHistory } from './ui/history-ui.js';
import { showPanel } from './ui/renderer.js';

// ─── Datos iniciales: merge de defaults + localStorage ───

const savedSettings = storage.loadSettings();
const savedCatalog  = storage.loadCatalog() || CATALOGO_PIEZAS;
const savedHistory  = storage.loadHistory();
const savedState    = storage.loadState();

const initialState = {
  // UI
  activePanel: savedState.activePanel || 'calculator',
  darkMode: savedState.darkMode || false,

  // Datos editables por el usuario
  catalog: savedCatalog,
  settings: savedSettings,

  // Catálogos de solo lectura (referencia)
  catalogCeras: CATALOGO_CERAS,

  // Cálculo actual
  currentCalculation: null,

  // Historial
  history: savedHistory,

  // Bandera de inicialización
  ready: false,
};

// ─── Crear store ───

const store = createStore(initialState, {

  /** Auto-persistencia: guardar cambios relevantes en localStorage */
  onChange(state) {
    storage.saveState({
      activePanel: state.activePanel,
      darkMode: state.darkMode,
    });
    storage.saveSettings(state.settings);
  },
});

// ─── Acciones de negocio ───

/**
 * Calcula una pieza individual y guarda el resultado en el estado.
 * No persiste en historial — eso lo decide la UI.
 */
function actionCalcularPieza(state, params) {
  const resultado = calcularPiezaCompleta(params);

  return {
    currentCalculation: {
      tipo: 'pieza',
      nombre: params.nombre || 'Pieza sin nombre',
      params,
      ...resultado,
    },
  };
}

/**
 * Guarda el cálculo actual en el historial.
 */
function actionGuardarEnHistorial(state) {
  if (!state.currentCalculation) return null;

  const entry = {
    tipo: state.currentCalculation.tipo,
    nombre: state.currentCalculation.nombre,
    canal: state.currentCalculation.params?.canal || null,
    precioFinal: state.currentCalculation.precioFinal,
    margenAplicado: state.currentCalculation.params?.margen || null,
    resultado: state.currentCalculation,
  };

  storage.addToHistory(entry);

  return {
    history: [entry, ...state.history],
  };
}

/**
 * Cambia el panel activo (navegación entre tabs).
 */
function actionSetActivePanel(state, panelId) {
  return { activePanel: panelId };
}

/**
 * Alterna dark mode.
 */
function actionToggleDarkMode(state) {
  const next = !state.darkMode;
  document.documentElement.setAttribute('data-theme', next ? 'dark' : '');
  return { darkMode: next };
}

// ─── Registrar acciones en el store ───

const rawDispatch = store.dispatch;
store.dispatch = function (action, payload) {
  if (action === 'calcularPieza')    return rawDispatch((s) => actionCalcularPieza(s, payload));
  if (action === 'guardarHistorial') return rawDispatch(actionGuardarEnHistorial);
  if (action === 'setActivePanel')   return rawDispatch((s) => actionSetActivePanel(s, payload));
  if (action === 'toggleDarkMode')   return rawDispatch(actionToggleDarkMode);
  return rawDispatch(action, payload);
};

// ─── Restaurar dark mode y tema al iniciar ───

if (initialState.darkMode) {
  document.documentElement.setAttribute('data-theme', 'dark');
}

// ─── Montar UI ───

const mountedCleanups = new Map();

function mountPanel(panelId) {
  if (mountedCleanups.has(panelId)) return;

  switch (panelId) {
    case 'calculator': {
      const cleanup = mountCalculator();
      mountedCleanups.set('calculator', cleanup);
      break;
    }
    case 'catalog': {
      const cleanup = mountCatalog();
      mountedCleanups.set('catalog', cleanup);
      break;
    }
    case 'candles': {
      const cleanup = mountCandles();
      mountedCleanups.set('candles', cleanup);
      break;
    }
    case 'settings': {
      const cleanup = mountSettings();
      mountedCleanups.set('settings', cleanup);
      break;
    }
    case 'combos': {
      const cleanup = mountCombo();
      mountedCleanups.set('combos', cleanup);
      break;
    }
    case 'quote': {
      const cleanup = mountQuote();
      mountedCleanups.set('quote', cleanup);
      break;
    }
    case 'history': {
      const cleanup = mountHistory();
      mountedCleanups.set('history', cleanup);
      break;
    }
  }
}

function navigateTo(panelId) {
  if (!panelId) return;

  // 1. Mostrar el panel solicitado
  showPanel(panelId);

  // 2. Montar el panel si no está montado
  try {
    mountPanel(panelId);
  } catch (err) {
    console.error('[navigateTo] mountPanel error:', err);
  }

  // 3. Actualizar tabs de navegación
  const allTabs = document.querySelectorAll('.nav-tab');
  allTabs.forEach((tab) => {
    tab.classList.toggle('nav-tab--active', tab.dataset.panel === panelId);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 4. Actualizar estado global
  store.setState({ activePanel: panelId });
}

// ─── Eventos de navegación ───

document.querySelectorAll('.nav-tab').forEach((tab) => {
  tab.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigateTo(tab.dataset.panel);
  });
});

// ─── Sincronizar tabs con estado del store ───

store.subscribe((state) => {
  const panel = state.activePanel;
  if (!panel) return;
  const allTabs = document.querySelectorAll('.nav-tab');
  allTabs.forEach((tab) => {
    tab.classList.toggle('nav-tab--active', tab.dataset.panel === panel);
  });
});

// ─── Dark mode toggle ───

const themeSwitch = document.getElementById('theme-switch');
if (themeSwitch) {
  themeSwitch.checked = initialState.darkMode;

  themeSwitch.addEventListener('change', () => {
    store.dispatch('toggleDarkMode');
  });
}

// ─── Botón settings ───

const settingsBtn = document.getElementById('btn-settings');
if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    navigateTo('settings');
  });
}

// ─── Iniciar con panel activo ───

const startPanel = initialState.activePanel;
navigateTo(startPanel);

// Si el panel activo es uno que no tiene UI aún (settings, combos, etc.)
// mostrar un estado placeholder para que no se vea vacío
  if (!mountedCleanups.has(startPanel)) {
    const panel = document.getElementById(startPanel);
    if (panel && !['calculator', 'catalog', 'candles', 'settings', 'combos', 'quote', 'history'].includes(startPanel)) {
      panel.innerHTML = `
        <h2 class="section-title">En desarrollo</h2>
        <p class="section-subtitle">Esta sección estará disponible próximamente.</p>
      `;
    }
  }

// ─── Marcar como listo ───

store.setState({ ready: true });

// ─── Verificación — motor de cálculo ───

console.log('%cApp lista — Craft Cost Calculator', 'color: #7D9B76; font-weight: bold;');
console.log('%cPiezas: %d | Figuras cera: %d | Historial: %d',
  'color: #6B5A50;',
  store.getState().catalog.length,
  store.getState().catalogCeras.length,
  store.getState().history.length,
);

const testCorazon = calcularPiezaCompleta({
  peso_g: 152, tamano: 'chica', precioYesoPorG: 0.025, minutos: 15,
  tarifaPorMinuto: 1.16, conColor: true, conDetalleFino: false,
  conSellador: false, ajusteDesmolde: 0, ajusteEsfuerzo: 0,
  margen: 0.45, recargoUrgencia: 0,
});

const ok = testCorazon.precioFinal === 60
  && testCorazon.costoBase === 31.20
  && testCorazon.desglose.costoYeso === 3.80;

if (ok) {
  console.log('%cMotor de cálculo verificado — Corazón trenzado = $60', 'color: #5D8A5B;');
} else {
  console.log('%cMotor de cálculo difiere del documento', 'color: #D4A34A;');
}

export { store, navigateTo };
