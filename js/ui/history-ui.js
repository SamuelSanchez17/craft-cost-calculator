/**
 * Panel de historial de calculos.
 * Lista cronologica inversa con filtros por tipo y busqueda.
 * Acciones: reutilizar calculo, generar cotizacion, eliminar.
 * Exportacion CSV y limpieza total.
 * Se monta sobre #history en el DOM.
 */

import { store, navigateTo } from '../app.js';
import * as storage from '../storage.js';
import { downloadHistoryCSV, generateQuoteText, copyToClipboard } from '../utils/export.js';
import { formatMXN, formatMXNShort, formatDate, capitalize, formatPercent } from '../utils/format.js';
import { debounce } from '../utils/debounce.js';
import { el, clear, qs, qsAll, on, delegate } from './renderer.js';
import {
  iconHistory,
  iconSearch,
  iconTrash,
  iconFileText,
  iconDownload,
  iconPlus,
  iconCheck,
  iconArrowRight,
  iconClock,
  iconSave,
  iconInfo,
  iconDollar,
  iconRefresh,
  iconWarning,
} from './icons.js';

// ─── Labels ───

const TIPO_LABELS = { pieza: 'Pieza', combo: 'Combo', vela: 'Vela' };
const CANAL_LABELS = {
  venta_directa:    'Venta directa',
  bazar:            'Bazar',
  mayoreo_diversas: 'Mayoreo',
  mayoreo_6_iguales:'Mayoreo 6+',
};

// ─── State local ───

let container = null;
let filterText = '';
let filterType = 'todos'; // 'todos' | 'pieza' | 'combo' | 'vela'
let confirmDeleteAll = false;

// ─── Filtered data ───

function getFilteredHistory() {
  const history = store.getState().history || [];
  let filtered = [...history];

  if (filterType !== 'todos') {
    filtered = filtered.filter((h) => h.tipo === filterType);
  }

  if (filterText.trim()) {
    const q = filterText.toLowerCase().trim();
    filtered = filtered.filter((h) =>
      (h.nombre || '').toLowerCase().includes(q)
    );
  }

  return filtered;
}

function getCounts() {
  const history = store.getState().history || [];
  return {
    todos: history.length,
    pieza: history.filter((h) => h.tipo === 'pieza').length,
    combo: history.filter((h) => h.tipo === 'combo').length,
    vela:  history.filter((h) => h.tipo === 'vela').length,
  };
}

// ─── Render ───

function renderFilterBar() {
  const counts = getCounts();
  const types = [
    { key: 'todos', label: 'Todos',   count: counts.todos },
    { key: 'pieza', label: 'Piezas',   count: counts.pieza },
    { key: 'combo', label: 'Combos',   count: counts.combo },
    { key: 'vela',  label: 'Velas',    count: counts.vela },
  ];

  const searchInput = el('input', {
    className: 'history-filters__search-input',
    type: 'text',
    placeholder: 'Buscar por nombre...',
    value: filterText,
  });

  const handleSearch = debounce((q) => {
    filterText = q;
    refreshList();
  }, 200);

  on(searchInput, 'input', () => handleSearch(searchInput.value));

  const searchField = el('div', { className: 'history-filters__search' },
    el('span', { className: 'history-filters__search-icon' }, iconSearch({ size: 16, stroke: 1.75 })),
    searchInput,
  );

  const chips = types.map((t) => {
    const cls = t.key === filterType
      ? 'history-filters__chip history-filters__chip--active'
      : 'history-filters__chip';

    const chip = el('button', { className: cls, 'data-type': t.key },
      `${t.label} (${t.count})`,
    );

    on(chip, 'click', () => {
      filterType = t.key;
      confirmDeleteAll = false;
      refreshUI();
    });

    return chip;
  });

  const chipsRow = el('div', { className: 'history-filters__chips' }, ...chips);

  const filtered = getFilteredHistory();
  const countLabel = el('div', { className: 'history-filters__count' },
    `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`,
  );

  return el('div', { className: 'history-filters' }, searchField, chipsRow, countLabel);
}

function renderToolbar() {
  const history = store.getState().history || [];
  if (history.length === 0) return null;

  const hasFilter = filterType !== 'todos' || filterText.trim() !== '';

  const exportBtn = el('button', {
    className: 'history-item__action-btn',
    title: 'Exportar a CSV',
  },
    iconDownload({ size: 14, stroke: 2 }), ' CSV',
  );

  on(exportBtn, 'click', () => {
    const data = hasFilter ? getFilteredHistory() : history;
    downloadHistoryCSV(data);
  });

  const clearBtn = el('button', {
    className: 'history-toolbar__clear-btn',
  }, iconTrash({ size: 14, stroke: 1.75 }), ' Limpiar todo');
  // ^--- corrige: usa el icono adecuado
  // En realidad voy a dejar el icono trash porque está importado

  on(clearBtn, 'click', () => {
    confirmDeleteAll = !confirmDeleteAll;

    if (confirmDeleteAll) {
      clearBtn.textContent = '';
      clearBtn.appendChild(iconWarning({ size: 14, stroke: 1.75 }));
      clearBtn.appendChild(document.createTextNode(' Confirmar'));
    } else {
      storage.clearHistory();
      store.setState({ history: [] });
    }
    refreshUI();
  });

  return el('div', { className: 'history-toolbar' },
    el('div', { style: { display: 'flex', gap: 'var(--space-2)' } },
      exportBtn,
    ),
    clearBtn,
  );
}

function renderHistoryItem(entry, index) {
  const tipo = entry.tipo || 'pieza';
  const nombre = entry.nombre || 'Sin nombre';
  const canal = entry.canal || '';
  const canalNombre = CANAL_LABELS[canal] || '';
  const precio = entry.precioFinal ?? entry.resultado?.precioFinal ?? 0;
  const ganancia = entry.gananciaMXN ?? entry.resultado?.gananciaMXN ?? 0;

  const main = el('div', { className: 'history-item__main' },
    el('div', { className: 'history-item__info' },
      el('div', { className: 'history-item__name' }, nombre),
      el('div', { className: 'history-item__meta' },
        el('span', { className: `history-badge history-badge--${tipo}` }, TIPO_LABELS[tipo]),
        canalNombre ? el('span', { className: 'history-canal' }, canalNombre) : null,
        el('span', { className: 'history-item__date' },
          iconClock({ size: 12, stroke: 1.5 }),
          ' ' + formatDate(entry.fecha),
        ),
      ),
    ),
    el('div', null,
      el('div', { className: 'history-item__price' }, formatMXNShort(precio)),
      ganancia > 0 ? el('span', { className: 'history-item__ganancia' },
        '+' + formatMXNShort(ganancia),
      ) : null,
    ),
  );

  // Actions row
  const reuseBtn = el('button', {
    className: 'history-item__action-btn history-item__action-btn--reuse',
    title: 'Usar de nuevo',
  },
    iconRefresh({ size: 14, stroke: 2 }), ' Usar de nuevo',
  );

  on(reuseBtn, 'click', (e) => {
    e.stopPropagation();
    store.setState({
      reuseParams: {
        nombre: entry.nombre,
        params: entry.params || null,
      },
    });

    navigateTo('calculator');

    setTimeout(() => {
      const input = qs('.piece-selector__input');
      if (input && nombre) {
        input.value = nombre;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      }
    }, 200);
  });

  const quoteBtn = el('button', {
    className: 'history-item__action-btn history-item__action-btn--quote',
    title: 'Crear cotizacion',
  },
    iconFileText({ size: 14, stroke: 2 }), ' Cotizacion',
  );

  on(quoteBtn, 'click', (e) => {
    e.stopPropagation();
    const preload = [{
      id: entry.id || Date.now(),
      nombre,
      cantidad: 1,
      precioUnitario: precio,
      subtotal: precio,
      fecha: entry.fecha || new Date().toISOString(),
    }];
    try {
      sessionStorage.setItem('cc_quotePreload', JSON.stringify(preload));
    } catch {}
    store.setState({ quotePreload: preload });
    console.log('[history] Cotización - navegando a quote con preload:', preload);
    navigateTo('quote');
  });

  const deleteBtn = el('button', {
    className: 'history-item__action-btn history-item__action-btn--delete',
    title: 'Eliminar',
    'data-id': entry.id,
  },
    iconTrash({ size: 14, stroke: 2 }), ' Eliminar',
  );

  on(deleteBtn, 'click', (e) => {
    e.stopPropagation();
    const id = entry.id;
    storage.removeFromHistory(id);
    const updated = store.getState().history.filter((h) => h.id !== id);
    store.setState({ history: updated });
  });

  const actions = el('div', { className: 'history-item__actions' },
    reuseBtn, quoteBtn, deleteBtn,
  );

  return el('div', { className: 'history-item', key: entry.id }, main, actions);
}

function renderEmptyState() {
  const history = store.getState().history || [];
  const hasItems = history.length > 0;
  const isFiltered = filterType !== 'todos' || filterText.trim() !== '';

  if (isFiltered) {
    return el('div', { className: 'history-empty' },
      el('div', { className: 'history-empty__icon' }, iconSearch({ size: 48, stroke: 1.5 })),
      el('div', { className: 'history-empty__title' }, 'Sin resultados'),
      el('div', { className: 'history-empty__text' },
        'No hay calculos que coincidan con los filtros. Prueba con otros terminos.',
      ),
    );
  }

  if (!hasItems) {
    return el('div', { className: 'history-empty' },
      el('div', { className: 'history-empty__icon' }, iconSave({ size: 48, stroke: 1.5 })),
      el('div', { className: 'history-empty__title' }, 'Sin historial'),
      el('div', { className: 'history-empty__text' },
        'Cuando calcules y guardes una pieza, aparecera aqui para consultarla despues.',
      ),
    );
  }

  return null;
}

function renderList() {
  const filtered = getFilteredHistory();
  const empty = renderEmptyState();
  if (empty) return empty;

  const items = filtered.map((entry, i) => renderHistoryItem(entry, i));
  return el('div', { className: 'history-list' }, ...items);
}

// ─── Refresh ───

function refreshList() {
  const listContainer = qs('#history-list-area', container);
  if (!listContainer) return;

  clear(listContainer);
  const list = renderList();
  if (list) listContainer.appendChild(list);
}

function refreshUI() {
  if (!container) return;

  const contentEl = qs('#history-content', container);
  if (!contentEl) return;

  clear(contentEl);

  contentEl.appendChild(renderFilterBar());

  const toolbar = renderToolbar();
  if (toolbar) contentEl.appendChild(toolbar);

  const listArea = el('div', { id: 'history-list-area' });
  const list = renderList();
  if (list) listArea.appendChild(list);
  contentEl.appendChild(listArea);
}

// ─── Mount ───

export function mountHistory() {
  container = document.getElementById('history');
  if (!container) {
    console.warn('[history-ui] No se encontro #history en el DOM');
    return () => {};
  }

  clear(container);
  filterText = '';
  filterType = 'todos';
  confirmDeleteAll = false;

  container.appendChild(el('h2', { className: 'section-title' }, 'Historial'));
  container.appendChild(el('p', { className: 'section-subtitle' },
    'Todos los calculos guardados. Podes reutilizarlos, generar cotizaciones o exportarlos.',
  ));

  const contentEl = el('div', { id: 'history-content' });
  container.appendChild(contentEl);

  refreshUI();

  const unsubscribe = store.subscribe(() => {
    refreshUI();
  });

  return () => {
    unsubscribe();
    clear(container);
  };
}
