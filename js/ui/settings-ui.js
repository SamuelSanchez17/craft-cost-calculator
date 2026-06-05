/**
 * Panel de configuración de precios y costos.
 * Permite editar yesos, tarifas, costos por tamaño,
 * configuración de velas, y restaurar defaults.
 * Se monta sobre #settings en el DOM.
 */

import { store } from '../app.js';
import { DEFAULT_SETTINGS } from '../catalog.js';
import { formatMXN, formatMXNShort, formatPercent } from '../utils/format.js';
import { saveSettings, resetSettings } from '../storage.js';
import { el, clear, qs, on } from './renderer.js';
import {
  iconSliders,
  iconPlus,
  iconClose,
  iconRefresh,
  iconSave,
  iconCheck,
  iconWeight,
  iconDollar,
  iconPalette,
  iconShield,
  iconSparkles,
  iconMapPin,
  iconFlame,
  iconWarning,
  iconPercent,
  iconRuler,
  iconThermometer,
} from './icons.js';

let container = null;

// ─── Helpers ───

function persistSettings(settings) {
  saveSettings(settings);
  store.setState({ settings });
}

function cloneSettings() {
  return JSON.parse(JSON.stringify(store.getState().settings));
}

// ─── Sección: Yesos ───

function renderYesosSection() {
  const settings = cloneSettings();
  const grid = el('div', { className: 'settings-yeso-grid' });

  settings.yesos.forEach((yeso, index) => {
    const card = renderYesoCard(yeso, index, settings);
    grid.appendChild(card);
  });

  // Tarjeta "Agregar"
  const addCard = el('div', { className: 'settings-yeso-card settings-yeso-card--add' },
    el('div', { className: 'settings-yeso-card--add__icon' }, iconPlus({ size: 24, stroke: 2 })),
    el('span', { className: 'settings-yeso-card--add__label' }, 'Nuevo yeso')
  );

  on(addCard, 'click', () => openNewYesoModal(settings));
  grid.appendChild(addCard);

  return el('div', { className: 'settings-section' },
    el('div', { className: 'settings-section__header' },
      el('h3', { className: 'settings-section__title' },
        iconWeight({ size: 16 }), ' Tipos de yeso'
      )
    ),
    grid
  );
}

function renderYesoCard(yeso, index, settings) {
  const precioPorG = yeso.precioPresentacion / yeso.presentacionG;

  const card = el('div', { className: 'settings-yeso-card' });

  const header = el('div', { className: 'settings-yeso-card__header' },
    el('span', { className: 'settings-yeso-card__name' }, yeso.nombre),
    el('span', { className: 'settings-yeso-card__price-badge' }, `$${precioPorG.toFixed(4)}/g`)
  );

  // Precio presentación
  const fieldPrecio = el('div', { className: 'settings-yeso-card__field' },
    el('label', { className: 'settings-yeso-card__label' }, 'Precio presentación'),
    el('input', {
      className: 'settings-yeso-card__input',
      type: 'number',
      step: '0.01',
      value: yeso.precioPresentacion,
      'data-index': index,
      'data-field': 'precioPresentacion',
    }),
    el('span', { className: 'settings-yeso-card__hint' }, 'MXN')
  );

  // Gramos presentación
  const fieldGramos = el('div', { className: 'settings-yeso-card__field' },
    el('label', { className: 'settings-yeso-card__label' }, 'Gramos presentación'),
    el('input', {
      className: 'settings-yeso-card__input',
      type: 'number',
      step: '1',
      value: yeso.presentacionG,
      'data-index': index,
      'data-field': 'presentacionG',
    }),
    el('span', { className: 'settings-yeso-card__hint' }, 'g')
  );

  card.appendChild(header);
  card.appendChild(fieldPrecio);
  card.appendChild(fieldGramos);

  // Eventos de edición
  const inputs = card.querySelectorAll('input');
  inputs.forEach((input) => {
    on(input, 'change', () => {
      const idx = Number(input.dataset.index);
      const field = input.dataset.field;
      const val = Number(input.value);
      if (val > 0) {
        const next = cloneSettings();
        next.yesos[idx][field] = val;
        // Recalcular precioPorGramo
        next.yesos[idx].precioPorGramo =
          next.yesos[idx].precioPresentacion / next.yesos[idx].presentacionG;
        persistSettings(next);
        // Actualizar badge
        const badge = card.querySelector('.settings-yeso-card__price-badge');
        if (badge) {
          badge.textContent = `$${next.yesos[idx].precioPorGramo.toFixed(4)}/g`;
        }
      }
    });
  });

  return card;
}

function openNewYesoModal(settings) {
  const existing = qs('.settings-modal-overlay');
  if (existing) existing.remove();

  const title = el('h2', { className: 'settings-modal__title' }, 'Nuevo tipo de yeso');
  const closeBtn = el('button', { className: 'settings-modal__close' }, iconClose({ size: 16 }));

  const nombreInput = el('input', {
    className: 'form-input',
    type: 'text',
    placeholder: 'Nombre del yeso',
    id: 'modal-yeso-nombre',
  });

  const precioInput = el('input', {
    className: 'form-input',
    type: 'number',
    placeholder: 'Precio de la presentación',
    id: 'modal-yeso-precio',
    step: '0.01',
    min: '0.01',
  });

  const gramosInput = el('input', {
    className: 'form-input',
    type: 'number',
    placeholder: 'Gramos de la presentación',
    id: 'modal-yeso-gramos',
    step: '1',
    min: '1',
  });

  const cancelBtn = el('button', { className: 'btn btn--secondary btn--full' }, 'Cancelar');
  const saveBtn = el('button', { className: 'btn btn--primary btn--full' }, 'Agregar yeso');

  const modal = el('div', { className: 'settings-modal' },
    el('div', { className: 'settings-modal__header' }, title, closeBtn),
    el('div', { className: 'settings-modal__body' },
      el('div', { className: 'form-group' },
        el('label', { className: 'form-label' }, 'Nombre'),
        nombreInput,
      ),
      el('div', { className: 'form-group' },
        el('label', { className: 'form-label' }, 'Precio presentación (MXN)'),
        precioInput,
      ),
      el('div', { className: 'form-group' },
        el('label', { className: 'form-label' }, 'Gramos presentación'),
        gramosInput,
      ),
      el('div', { className: 'form-hint' },
        'El costo por gramo se calcula automáticamente: Precio ÷ Gramos.'
      ),
    ),
    el('div', { className: 'settings-modal__footer' }, cancelBtn, saveBtn),
  );

  const overlay = el('div', { className: 'settings-modal-overlay' }, modal);

  function close() { overlay.remove(); }

  on(closeBtn, 'click', close);
  on(cancelBtn, 'click', close);
  on(overlay, 'click', (e) => { if (e.target === overlay) close(); });

  on(saveBtn, 'click', () => {
    const nombre = nombreInput.value.trim();
    const precio = Number(precioInput.value);
    const gramos = Number(gramosInput.value);

    if (!nombre || precio <= 0 || gramos <= 0) {
      if (!nombre) nombreInput.style.borderColor = 'var(--color-error)';
      if (precio <= 0) precioInput.style.borderColor = 'var(--color-error)';
      if (gramos <= 0) gramosInput.style.borderColor = 'var(--color-error)';
      return;
    }

    const next = cloneSettings();
    const id = 'yeso_' + Date.now();
    next.yesos.push({
      id,
      nombre,
      presentacionG: gramos,
      precioPresentacion: precio,
      precioPorGramo: precio / gramos,
    });

    persistSettings(next);
    refreshYesosSection();
    close();
  });

  document.body.appendChild(overlay);
  setTimeout(() => nombreInput.focus(), 100);
}

function refreshYesosSection() {
  const sections = document.querySelectorAll('.settings-section');
  for (const section of sections) {
    if (section.querySelector('.settings-yeso-grid')) {
      section.replaceWith(renderYesosSection());
      return;
    }
  }
}

// ─── Sección: Costos por tamaño ───

function renderCostosTable(title, iconEl, items, keys, settingsKey) {
  const thead = el('thead', { className: 'settings-table__head' },
    el('tr', null,
      el('th', null, 'Tamaño'),
      el('th', { style: { textAlign: 'right' } }, 'Costo (MXN)')
    )
  );

  const rows = keys.map((tamano) => {
    const val = items[tamano] || 0;
    const input = el('input', {
      className: 'settings-table__input',
      type: 'number',
      step: '0.01',
      value: val,
      'data-tamano': tamano,
      'data-key': settingsKey,
    });

    on(input, 'change', () => {
      const next = cloneSettings();
      next[settingsKey][tamano] = Number(input.value);
      persistSettings(next);
    });

    const badgeClass = tamano === 'chica' ? 'badge--chica' :
                       tamano === 'mediana' ? 'badge--mediana' : 'badge--grande';

    return el('tr', null,
      el('td', null,
        el('span', { className: `settings-table__size-badge ${badgeClass}` },
          tamano.charAt(0).toUpperCase() + tamano.slice(1)
        )
      ),
      el('td', null, input)
    );
  });

  const tbody = el('tbody', { className: 'settings-table__body' }, ...rows);
  const table = el('table', { className: 'settings-table' }, thead, tbody);

  return el('div', { className: 'settings-section' },
    el('div', { className: 'settings-section__header' },
      el('h3', { className: 'settings-section__title' }, iconEl, ' ', title)
    ),
    table
  );
}

// ─── Sección: Tarifas de zona ───

function renderZonasSection() {
  const settings = cloneSettings();

  const rows = Object.entries(settings.tarifasZona).map(([key, val]) => {
    const name = key === 'pueblo' ? 'Pueblo' : 'Ciudad';

    const input = el('input', {
      className: 'settings-zona-row__input',
      type: 'number',
      step: '0.01',
      value: val,
      'data-key': key,
    });

    on(input, 'change', () => {
      const next = cloneSettings();
      next.tarifasZona[key] = Number(input.value);
      persistSettings(next);
    });

    return el('div', { className: 'settings-zona-row' },
      el('div', { className: 'settings-zona-row__info' },
        el('span', { className: 'settings-zona-row__name' }, name),
        el('span', { className: 'settings-zona-row__hint' }, 'Tarifa por minuto de mano de obra')
      ),
      el('div', { className: 'settings-zona-row__input-wrap' },
        input,
        el('span', { className: 'settings-zona-row__unit' }, '$/min')
      )
    );
  });

  return el('div', { className: 'settings-section' },
    el('div', { className: 'settings-section__header' },
      el('h3', { className: 'settings-section__title' },
        iconMapPin({ size: 16 }), ' Tarifas de zona'
      )
    ),
    ...rows
  );
}

// ─── Sección: Configuración de velas ───

function renderVelasSection() {
  const settings = cloneSettings();
  const v = settings.velas;

  const fields = [
    { key: 'precioCeraPorGramo', label: 'Precio cera', unit: '$/g', icon: iconFlame },
    { key: 'precioAromaPorGramo', label: 'Precio aroma', unit: '$/g', icon: iconDroplet },
    { key: 'costoColorFijo', label: 'Costo color', unit: 'MXN', icon: iconPalette },
    { key: 'costoPabiloFijo', label: 'Costo pabilo', unit: 'MXN', icon: iconShield },
    { key: 'costoFijo', label: 'Costo fijo', unit: 'MXN', icon: iconDollar },
    { key: 'extraDecorarMinutos', label: 'Extra decorar', unit: 'min', icon: iconSparkles },
  ];

  const grid = el('div', { className: 'settings-vela-grid' });

  fields.forEach((f) => {
    const input = el('input', {
      className: 'settings-vela-field__input',
      type: 'number',
      step: f.key.includes('Minutos') ? '1' : '0.0001',
      value: v[f.key],
      'data-key': f.key,
    });

    on(input, 'change', () => {
      const next = cloneSettings();
      next.velas[f.key] = Number(input.value);
      persistSettings(next);
    });

    grid.appendChild(
      el('div', { className: 'settings-vela-field' },
        el('label', { className: 'settings-vela-field__label' }, f.label),
        input,
        el('span', { className: 'settings-vela-field__unit' }, f.unit)
      )
    );
  });

  return el('div', { className: 'settings-section' },
    el('div', { className: 'settings-section__header' },
      el('h3', { className: 'settings-section__title' },
        iconFlame({ size: 16 }), ' Insumos de velas'
      )
    ),
    grid
  );
}

// ─── Sección: Márgenes de canal ───

function renderMargenesSection() {
  const settings = cloneSettings();

  const rows = Object.entries(settings.margenesCanal).map(([key, val]) => {
    const name = key === 'venta_directa' ? 'Venta directa' :
                 key === 'bazar' ? 'Bazar / evento' :
                 key === 'mayoreo_diversas' ? 'Mayoreo (piezas diversas)' :
                 'Mayoreo (6+ piezas iguales)';

    const input = el('input', {
      className: 'settings-zona-row__input',
      type: 'number',
      step: '0.01',
      min: '0',
      max: '0.99',
      value: val,
      'data-key': key,
    });

    on(input, 'change', () => {
      const next = cloneSettings();
      let v = Number(input.value);
      if (v < 0) v = 0;
      if (v >= 1) v = 0.99;
      next.margenesCanal[key] = v;
      persistSettings(next);
    });

    return el('div', { className: 'settings-zona-row' },
      el('div', { className: 'settings-zona-row__info' },
        el('span', { className: 'settings-zona-row__name' }, name),
        el('span', { className: 'settings-zona-row__hint' },
          `Margen sobre precio de venta: ${formatPercent(val, 0)}`
        )
      ),
      el('div', { className: 'settings-zona-row__input-wrap' },
        input,
        el('span', { className: 'settings-zona-row__unit' }, 'fracción')
      )
    );
  });

  return el('div', { className: 'settings-section' },
    el('div', { className: 'settings-section__header' },
      el('h3', { className: 'settings-section__title' },
        iconPercent({ size: 16 }), ' Márgenes por canal'
      )
    ),
    ...rows
  );
}

// ─── Acciones globales ───

function renderActions() {
  const saveBtn = el('button', { className: 'btn btn--primary btn--full' },
    iconSave({ size: 16 }), ' Guardar cambios'
  );

  const resetBtn = el('button', { className: 'btn btn--danger btn--full' },
    iconRefresh({ size: 16 }), ' Restaurar defaults'
  );

  on(saveBtn, 'click', () => {
    const settings = cloneSettings();
    saveSettings(settings);
    saveBtn.innerHTML = '';
    saveBtn.appendChild(iconCheck({ size: 16 }));
    saveBtn.appendChild(document.createTextNode(' Guardado'));
    saveBtn.style.background = 'var(--color-salvia)';
    setTimeout(() => {
      saveBtn.innerHTML = '';
      saveBtn.appendChild(iconSave({ size: 16 }));
      saveBtn.appendChild(document.createTextNode(' Guardar cambios'));
      saveBtn.style.background = '';
    }, 2000);
  });

  on(resetBtn, 'click', () => {
    openResetConfirm();
  });

  return el('div', { className: 'settings-actions' }, saveBtn, resetBtn);
}

function openResetConfirm() {
  const existing = qs('.settings-modal-overlay');
  if (existing) existing.remove();

  const content = el('div', { className: 'catalog-confirm' },
    el('div', { className: 'catalog-confirm__icon', style: { color: 'var(--color-warning)' } },
      iconWarning({ size: 40 })
    ),
    el('h3', { className: 'catalog-confirm__title' }, '¿Restaurar defaults?'),
    el('p', { className: 'catalog-confirm__text' },
      'Se perderán todos los precios personalizados y se restaurarán los valores de fábrica. Esta acción no se puede deshacer.'
    ),
    el('div', { className: 'catalog-confirm__actions' },
      el('button', { className: 'btn btn--secondary', id: 'confirm-cancel' }, 'Cancelar'),
      el('button', { className: 'btn btn--danger', id: 'confirm-reset' }, 'Restaurar')
    ),
  );

  const modal = el('div', { className: 'catalog-modal' }, content);
  const overlay = el('div', { className: 'catalog-modal-overlay' }, modal);

  function close() { overlay.remove(); }

  on(qs('#confirm-cancel', modal), 'click', close);
  on(overlay, 'click', (e) => { if (e.target === overlay) close(); });

  on(qs('#confirm-reset', modal), 'click', () => {
    const defaults = resetSettings();
    store.setState({ settings: defaults });
    // Re-montar settings para reflejar cambios
    mountSettings();
    close();
  });

  document.body.appendChild(overlay);
}

// ─── Montaje ───

export function mountSettings() {
  container = document.getElementById('settings');
  if (!container) {
    console.warn('[settings-ui] No se encontró #settings en el DOM');
    return () => {};
  }

  clear(container);

  container.appendChild(el('h2', { className: 'section-title' }, 'Configuración'));
  container.appendChild(el('p', { className: 'section-subtitle' }, 'Ajusta precios de materiales, tarifas y costos según tus proveedores actuales.'));

  const settings = cloneSettings();

  container.appendChild(renderYesosSection());

  container.appendChild(renderCostosTable(
    'Costo de color',
    iconPalette({ size: 16 }),
    settings.costosColor,
    ['chica', 'mediana', 'grande'],
    'costosColor'
  ));

  container.appendChild(renderCostosTable(
    'Costo de sellador',
    iconShield({ size: 16 }),
    settings.costosSellador,
    ['chica', 'mediana', 'grande'],
    'costosSellador'
  ));

  container.appendChild(renderCostosTable(
    'Costo de detalle fino',
    iconSparkles({ size: 16 }),
    settings.costosDetalleFino,
    ['chica', 'mediana', 'grande'],
    'costosDetalleFino'
  ));

  container.appendChild(renderZonasSection());
  container.appendChild(renderMargenesSection());
  container.appendChild(renderVelasSection());
  container.appendChild(renderActions());

  return () => {
    clear(container);
  };
}

// Lazy icon helper
function iconDroplet(attrs) {
  const el2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el2.setAttribute('viewBox', '0 0 24 24');
  el2.setAttribute('width', attrs.size || 20);
  el2.setAttribute('height', attrs.size || 20);
  el2.setAttribute('fill', 'none');
  el2.setAttribute('stroke', 'currentColor');
  el2.setAttribute('stroke-width', '2');
  el2.setAttribute('stroke-linecap', 'round');
  el2.setAttribute('stroke-linejoin', 'round');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z');
  el2.appendChild(path);
  return el2;
}
