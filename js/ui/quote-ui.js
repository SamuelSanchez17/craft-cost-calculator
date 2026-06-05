/**
 * Generador de cotizaciones.
 * Selecciona items del historial, construye tabla editable,
 * genera preview imprimible y exporta a texto/WhatsApp/imprimir.
 * Se monta sobre #quote en el DOM.
 */

import { store } from '../app.js';
import * as storage from '../storage.js';
import {
  formatMXN,
  formatMXNShort,
  formatDate,
  formatPercent,
  formatGramos,
  capitalize,
} from '../utils/format.js';
import { el, clear, qs, on, delegate } from './renderer.js';
import {
  iconClipboard,
  iconCheck,
  iconWarning,
  iconTrash,
  iconPlus,
  iconFileText,
  iconShare,
  iconDownload,
  iconHeart,
} from './icons.js';

let container = null;

/** @type {Array<{id: number, nombre: string, cantidad: number, precioUnitario: number, subtotal: number, fecha: string}>} */
let quoteItems = [];

function calcularTotales() {
  const subtotal = quoteItems.reduce((acc, i) => acc + i.subtotal, 0);
  return { subtotal: Math.round(subtotal * 100) / 100 };
}

// ─── WhatsApp text formatter ───

function toWhatsAppText() {
  const { subtotal } = calcularTotales();
  const fecha = formatDate(new Date().toISOString());

  const lines = [
    `*Cotizacion -- Yeso Artesanal*`,
    `_${fecha}_`,
    '',
  ];

  if (quoteItems.length === 0) {
    lines.push('_(sin items)_');
  } else {
    const nameCol = 22;

    quoteItems.forEach((item) => {
      const name = item.nombre.length > nameCol
        ? item.nombre.slice(0, nameCol - 2) + '..'
        : item.nombre.padEnd(nameCol, ' ');
      const qty = String(item.cantidad).padStart(3, ' ');
      const price = formatMXN(item.precioUnitario).padStart(10, ' ');
      const sub = formatMXN(item.subtotal).padStart(10, ' ');
      lines.push(`\`${name} x${qty} ${price} = ${sub}\``);
    });

    lines.push('');
    lines.push(`*TOTAL: ${formatMXN(subtotal)}*`);
  }

  lines.push('');
  lines.push('_Gracias por tu preferencia_');

  return lines.join('\n');
}

function toPlainText() {
  const { subtotal } = calcularTotales();
  const fecha = formatDate(new Date().toISOString());
  const sep = '-'.repeat(44);

  const lines = [
    'COTIZACION — Yeso Artesanal',
    `Fecha: ${fecha}`,
    sep,
  ];

  if (quoteItems.length === 0) {
    lines.push('(sin items)');
  } else {
    quoteItems.forEach((item) => {
      const name = item.nombre.length > 24
        ? item.nombre.slice(0, 22) + '..'
        : item.nombre;
      lines.push(
        `${name.padEnd(26)} x${String(item.cantidad).padStart(2)}  ${formatMXN(item.precioUnitario).padStart(9)}`
      );
    });
  }

  lines.push(sep);
  lines.push(`TOTAL: ${formatMXN(subtotal).padStart(33)}`);

  return lines.join('\n');
}

// ─── Render methods ───

function renderHistoryPicker() {
  const history = store.getState().history || [];

  if (history.length === 0) {
    return el('div', { className: 'quote-builder__section' },
      el('h3', { className: 'quote-builder__section-title' }, 'Calculos guardados'),
      el('div', { className: 'quote-items__empty' },
        'No hay calculos en el historial. ',
        el('br'),
        'Calcula piezas, combos o velas y guardalos para usarlos aqui.',
      ),
    );
  }

  const list = el('div', { className: 'quote-builder__history-list' });

  history.forEach((entry) => {
    const nombre = entry.nombre || 'Sin nombre';
    const precio = entry.precioFinal || 0;
    const fecha = entry.fecha ? formatDate(entry.fecha) : '';
    const tipo = entry.tipo === 'combo' ? 'Combo' : entry.tipo === 'vela' ? 'Vela' : 'Pieza';

    const item = el('div', {
      className: 'quote-builder__history-item',
      'data-id': entry.id,
    },
      el('div', null,
        el('div', { className: 'quote-builder__history-item-name' }, `${nombre}`),
        el('span', { className: 'badge', style: { fontSize: '10px' } }, tipo),
      ),
      el('span', { className: 'quote-builder__history-item-date' }, fecha),
      el('span', { className: 'quote-builder__history-item-price' }, formatMXNShort(precio)),
    );

    const alreadySelected = quoteItems.some((qi) => qi.id === entry.id);
    if (alreadySelected) {
      item.classList.add('quote-builder__history-item--selected');
    }

    list.appendChild(item);
  });

  return el('div', { className: 'quote-builder__section' },
    el('h3', { className: 'quote-builder__section-title' }, 'Agregar del historial'),
    list,
  );
}

function renderCurrentCalcSection() {
  const calc = store.getState().currentCalculation;
  if (!calc) return null;

  const nombre = calc.nombre || 'Sin nombre';
  const precio = calc.precioFinal || 0;

  const btn = el('button', {
    className: 'btn btn--secondary btn--sm',
    style: { marginTop: '8px' },
  },
    iconPlus({ size: 14, stroke: 2 }), ' Agregar calculo actual',
  );

  on(btn, 'click', () => {
    const id = `current_${Date.now()}`;
    quoteItems.push({
      id,
      nombre,
      cantidad: 1,
      precioUnitario: precio,
      subtotal: precio,
      fecha: new Date().toISOString(),
    });
    refreshUI();
  });

  return el('div', { className: 'quote-builder__section' },
    el('h3', { className: 'quote-builder__section-title' }, 'Calculo actual'),
    el('div', {
      className: 'flex items-center justify-between',
      style: {
        padding: 'var(--space-3)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
      }
    },
      el('div', null,
        el('div', { style: { fontSize: 'var(--text-sm)', color: 'var(--text-primary)' } }, nombre),
        el('div', { style: { fontSize: 'var(--text-xs)', color: 'var(--text-muted)' } }, 'Precio calculado'),
      ),
      el('span', {
        style: {
          fontFamily: 'var(--font-mono)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-terracota)',
          fontSize: 'var(--text-sm)',
        }
      }, formatMXNShort(precio)),
    ),
    btn,
  );
}

function renderItemsTable() {
  if (quoteItems.length === 0) {
    return el('div', { className: 'quote-builder__section' },
      el('h3', { className: 'quote-builder__section-title' }, 'Items de la cotizacion'),
      el('div', { className: 'quote-items__empty' },
        'Selecciona items del historial o agrega el calculo actual.',
      ),
    );
  }

  const headers = ['Item', 'Cant.', 'Precio', 'Subtotal', ''];

  const thead = el('thead', null,
    el('tr', null, ...headers.map((h) => el('th', null, h))),
  );

  const rows = quoteItems.map((item, idx) => {
    const qtyInput = el('input', {
      className: 'quote-items__qty-input',
      type: 'number',
      min: '1',
      max: '999',
      value: String(item.cantidad),
      'data-index': idx,
    });

    on(qtyInput, 'change', () => {
      const nuevo = Math.max(1, Math.min(999, parseInt(qtyInput.value, 10) || 1));
      item.cantidad = nuevo;
      item.subtotal = Math.round(nuevo * item.precioUnitario * 100) / 100;
      qtyInput.value = String(nuevo);
      refreshUI();
    });

    const removeBtn = el('button', {
      className: 'quote-items__remove-btn',
      title: 'Quitar item',
      'data-index': idx,
      'aria-label': 'Quitar item',
    }, iconTrash({ size: 16 }));

    on(removeBtn, 'click', () => {
      quoteItems.splice(idx, 1);
      refreshUI();
    });

    return el('tr', null,
      el('td', null, item.nombre),
      el('td', null, qtyInput),
      el('td', null, formatMXN(item.precioUnitario)),
      el('td', null, formatMXN(item.subtotal)),
      el('td', null, removeBtn),
    );
  });

  const { subtotal } = calcularTotales();

  const totalRow = el('tr', { className: 'quote-items__total-row' },
    el('td', { colSpan: '3' }, 'TOTAL'),
    el('td', null, formatMXN(subtotal)),
    el('td', null, ''),
  );

  const tbody = el('tbody', null, ...rows, totalRow);

  const table = el('table', { className: 'quote-items__table' }, thead, tbody);

  return el('div', { className: 'quote-builder__section' },
    el('h3', { className: 'quote-builder__section-title' }, 'Items de la cotizacion'),
    table,
  );
}

function renderPreview() {
  const preview = el('div', { className: 'quote-preview', id: 'quote-preview-area' });

  if (quoteItems.length === 0) {
    return preview;
  }

  const { subtotal } = calcularTotales();
  const fecha = formatDate(new Date().toISOString());

  const card = el('div', { className: 'quote-card' },
    el('div', { className: 'quote-card__header' },
      el('div', { className: 'quote-card__business' }, 'Yeso Artesanal'),
      el('div', { className: 'quote-card__subtitle' }, 'Cotizacion'),
      el('div', { className: 'quote-card__date' }, fecha),
    ),
    el('div', { className: 'quote-card__body' },
      el('table', { className: 'quote-card__items' },
        el('thead', null,
          el('tr', null,
            el('th', null, 'Pieza'),
            el('th', null, 'Cant.'),
            el('th', null, 'P. Unit.'),
            el('th', null, 'Subtotal'),
          ),
        ),
        el('tbody', null,
          ...quoteItems.map((item) =>
            el('tr', null,
              el('td', null, item.nombre),
              el('td', null, String(item.cantidad)),
              el('td', null, formatMXN(item.precioUnitario)),
              el('td', null, formatMXN(item.subtotal)),
            )
          ),
        ),
      ),
      el('div', { className: 'quote-card__total-section' },
        el('span', { className: 'quote-card__total-label' }, 'Total'),
        el('span', { className: 'quote-card__total-value' }, formatMXN(subtotal)),
      ),
      el('div', { className: 'quote-card__note' },
        'Gracias por tu preferencia. Precios sujetos a cambio sin previo aviso.',
      ),
    ),
  );

  preview.appendChild(card);
  preview.classList.add('quote-preview--visible');

  return preview;
}

function renderActions() {
  if (quoteItems.length === 0) return null;

  const copyBtn = el('button', {
    className: 'quote-actions__btn quote-actions__btn--copy',
    id: 'quote-btn-copy',
  }, iconClipboard({ size: 16 }), ' Copiar');

  const waBtn = el('button', {
    className: 'quote-actions__btn quote-actions__btn--whatsapp',
    id: 'quote-btn-whatsapp',
  },
    el('span', { style: { fontSize: '16px', lineHeight: 1, fontWeight: 'bold' } }, '+'), ' WhatsApp',
  );

  const printBtn = el('button', {
    className: 'quote-actions__btn quote-actions__btn--print',
    id: 'quote-btn-print',
  }, iconFileText({ size: 16 }), ' Imprimir');

  on(copyBtn, 'click', () => {
    const text = toWhatsAppText();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.innerHTML = '';
        copyBtn.appendChild(iconCheck({ size: 16 }));
        copyBtn.appendChild(document.createTextNode(' Copiado'));
        setTimeout(() => {
          copyBtn.innerHTML = '';
          copyBtn.appendChild(iconClipboard({ size: 16 }));
          copyBtn.appendChild(document.createTextNode(' Copiar'));
        }, 2000);
      }).catch(() => {
        copyBtn.innerHTML = '';
        copyBtn.appendChild(iconWarning({ size: 16 }));
        copyBtn.appendChild(document.createTextNode(' Error'));
      });
    }
  });

  on(waBtn, 'click', () => {
    const text = toWhatsAppText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
  });

  on(printBtn, 'click', () => {
    window.print();
  });

  const leftActions = el('div', { className: 'quote-actions' }, copyBtn, waBtn, printBtn);

  const saveBtn = el('button', {
    className: 'btn btn--primary btn--full',
    style: { marginTop: 'var(--space-2)' },
  },
    iconDownload({ size: 16 }), ' Guardar cotizacion',
  );

  on(saveBtn, 'click', () => {
    const { subtotal } = calcularTotales();
    storage.saveQuote({
      nombre: `Cotizacion ${formatDate(new Date().toISOString())}`,
      items: quoteItems.map((i) => ({ ...i })),
      total: subtotal,
    });

    saveBtn.innerHTML = '';
    saveBtn.appendChild(iconCheck({ size: 16 }));
    saveBtn.appendChild(document.createTextNode(' Guardada'));
    saveBtn.style.background = 'var(--color-salvia)';
    setTimeout(() => {
      saveBtn.innerHTML = '';
      saveBtn.appendChild(iconDownload({ size: 16 }));
      saveBtn.appendChild(document.createTextNode(' Guardar cotizacion'));
      saveBtn.style.background = '';
    }, 2000);
  });

  return el('div', null, leftActions, saveBtn);
}

// ─── Refresh ───

function refreshUI() {
  if (!container) return;

  const contentEl = qs('#quote-content', container);
  if (!contentEl) return;

  clear(contentEl);

  contentEl.appendChild(renderHistoryPicker());
  contentEl.appendChild(renderCurrentCalcSection());
  contentEl.appendChild(renderItemsTable());

  const preview = renderPreview();
  contentEl.appendChild(preview);

  const actions = renderActions();
  if (actions) contentEl.appendChild(actions);
}

// ─── Mount ───

export function mountQuote() {
  container = document.getElementById('quote');
  if (!container) {
    console.warn('[quote-ui] No se encontro #quote en el DOM');
    return () => {};
  }

  clear(container);

  const preload = store.getState().quotePreload;
  quoteItems = Array.isArray(preload) ? preload.map((item) => ({ ...item, subtotal: item.subtotal ?? item.precioUnitario * item.cantidad })) : [];

  if (preload) {
    store.setState({ quotePreload: null });
  }

  container.appendChild(el('h2', { className: 'section-title' }, 'Cotizacion'));
  container.appendChild(el('p', { className: 'section-subtitle' },
    'Selecciona piezas del historial para armar una cotizacion profesional.',
  ));

  const contentEl = el('div', { id: 'quote-content', className: 'quote-builder' });
  container.appendChild(contentEl);

  // Event delegation para seleccionar items del historial
  on(contentEl, 'click', (e) => {
    const historyItem = e.target.closest('.quote-builder__history-item');
    if (!historyItem) return;

    const id = historyItem.dataset.id;
    if (!id) return;

    const history = store.getState().history || [];
    const entry = history.find((h) => String(h.id) === String(id));
    if (!entry) return;

    const alreadyIdx = quoteItems.findIndex((qi) => String(qi.id) === String(id));

    if (alreadyIdx >= 0) {
      quoteItems.splice(alreadyIdx, 1);
    } else {
      const numericId = Number(id);
      quoteItems.push({
        id: isNaN(numericId) ? id : numericId,
        nombre: entry.nombre || 'Sin nombre',
        cantidad: 1,
        precioUnitario: entry.precioFinal || 0,
        subtotal: entry.precioFinal || 0,
        fecha: entry.fecha || new Date().toISOString(),
      });
    }

    refreshUI();
  });

  refreshUI();

  const unsubscribe = store.subscribe(() => {
    refreshUI();
  });

  return () => {
    unsubscribe();
    clear(container);
    quoteItems = [];
  };
}
