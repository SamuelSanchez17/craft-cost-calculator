/**
 * Combo Builder — Arreglos florales y combos
 * Permite ensamblar piezas de yeso + figuras de cera,
 * calcular costo total + armado, y precio con margen.
 * Se monta sobre #combos en el DOM.
 */

import { store } from '../app.js';
import { calcularCosto, calcularPrecioFinal } from '../calculator.js';
import { CATALOGO_CERAS, COSTO_FIJO_POR_PIEZA, MARGENES_CANAL } from '../catalog.js';
import { formatMXN, formatMXNShort, formatGramos, formatMinutos, capitalize } from '../utils/format.js';
import { addToHistory } from '../storage.js';
import { el, clear, qs, on } from './renderer.js';
import {
  iconBouquet,
  iconBox,
  iconCandle,
  iconPlus,
  iconTrash,
  iconClose,
  iconSliders,
  iconSave,
  iconCheck,
  iconShare,
  iconChevronDown,
  iconSearch,
  iconWeight,
  iconClock,
} from './icons.js';

let container = null;

// ─── Estado local del combo ───
let comboState = {
  nombre: '',
  canal: 'bazar',
  items: [], // { tipo, uid, refId, nombre, cantidad, config?, costoUnitario }
};

let activeAvailableTab = 'piezas';
let availableSearch = '';

// ─── Helpers ───

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function calcularCostoPieza(refId, config) {
  const catalog = store.getState().catalog;
  const settings = store.getState().settings;
  const pieza = catalog.find((p) => p.id === refId);
  if (!pieza) return 0;

  const yeso = settings.yesos.find((y) => y.id === config.yeso) || settings.yesos[0];
  const tarifa = settings.tarifasZona[config.zona] || 1.16;

  const resultado = calcularCosto({
    peso_g: pieza.peso,
    tamano: pieza.tamano,
    precioYesoPorG: yeso.precioPorGramo,
    minutos: pieza.minutos,
    tarifaPorMinuto: tarifa,
    conColor: config.conColor,
    conDetalleFino: config.conDetalle,
    conSellador: config.conSellador,
    ajusteDesmolde: config.ajusteDesmolde,
    ajusteEsfuerzo: config.ajusteEsfuerzo,
  });

  return resultado.costoBase;
}

function getItemCosto(item) {
  if (item.tipo === 'pieza') {
    return item.costoUnitario;
  }
  return item.costoUnitario;
}

function recalcularCombo() {
  let sumaPiezas = 0;
  let sumaCeras = 0;

  comboState.items.forEach((item) => {
    const costoTotalItem = item.costoUnitario * item.cantidad;
    if (item.tipo === 'pieza') {
      sumaPiezas += costoTotalItem;
    } else {
      sumaCeras += costoTotalItem;
    }
  });

  const costoBase = sumaPiezas + sumaCeras + 3.00;
  const margen = store.getState().settings.margenesCanal[comboState.canal] || 0.45;
  const precio = calcularPrecioFinal({ costoBase, margen, recargoUrgencia: 0 });

  return {
    sumaPiezas,
    sumaCeras,
    armado: 3.00,
    costoBase,
    ...precio,
  };
}

// ─── Renderizado panel izquierdo ───

function renderAvailablePanel() {
  const header = el('div', { className: 'combo-available__header' },
    el('h3', { className: 'combo-available__title' }, 'Agregar items'),
    renderTabs(),
    renderSearch()
  );

  const list = el('div', { className: 'combo-available__list' });
  renderAvailableList(list);

  return el('div', { className: 'combo-available' }, header, list);
}

function renderTabs() {
  const piezasTab = el('button', {
    className: `combo-tab ${activeAvailableTab === 'piezas' ? 'combo-tab--active' : ''}`,
  }, iconBox({ size: 14 }), ' Piezas');

  const cerasTab = el('button', {
    className: `combo-tab ${activeAvailableTab === 'ceras' ? 'combo-tab--active' : ''}`,
  }, iconCandle({ size: 14 }), ' Ceras');

  on(piezasTab, 'click', () => {
    activeAvailableTab = 'piezas';
    refreshComboBuilder();
  });
  on(cerasTab, 'click', () => {
    activeAvailableTab = 'ceras';
    refreshComboBuilder();
  });

  return el('div', { className: 'combo-tabs' }, piezasTab, cerasTab);
}

function renderSearch() {
  const input = el('input', {
    className: 'combo-search__input',
    type: 'text',
    placeholder: activeAvailableTab === 'piezas' ? 'Buscar pieza...' : 'Buscar figura...',
    value: availableSearch,
  });

  const icon = el('span', { className: 'combo-search__icon' });
  icon.appendChild(iconSearch({ size: 14 }));

  on(input, 'input', () => {
    availableSearch = input.value;
    const list = qs('.combo-available__list');
    if (list) renderAvailableList(list);
  });

  return el('div', { className: 'combo-search' }, icon, input);
}

function renderAvailableList(containerList) {
  clear(containerList);

  const q = availableSearch.toLowerCase().trim();

  if (activeAvailableTab === 'piezas') {
    const catalog = store.getState().catalog;
    const filtered = q ? catalog.filter((p) => p.nombre.toLowerCase().includes(q)) : catalog;

    if (filtered.length === 0) {
      containerList.appendChild(el('div', { className: 'combo-available__empty' }, 'Sin resultados'));
      return;
    }

    filtered.forEach((pieza) => {
      const item = el('div', { className: 'combo-item' },
        el('div', { className: 'combo-item__info' },
          el('span', { className: 'combo-item__name' }, pieza.nombre),
          el('span', { className: 'combo-item__meta' },
            el('span', { className: `badge badge--${pieza.tamano}` }, capitalize(pieza.tamano)),
            formatGramos(pieza.peso),
            ' · ',
            formatMinutos(pieza.minutos)
          )
        ),
        el('button', {
          className: 'combo-item__add',
          'data-id': pieza.id,
          'data-type': 'pieza',
          title: 'Agregar al combo',
        }, '+')
      );
      containerList.appendChild(item);
    });
  } else {
    const ceras = CATALOGO_CERAS;
    const filtered = q ? ceras.filter((c) => c.nombre.toLowerCase().includes(q)) : ceras;

    if (filtered.length === 0) {
      containerList.appendChild(el('div', { className: 'combo-available__empty' }, 'Sin resultados'));
      return;
    }

    filtered.forEach((cera) => {
      const item = el('div', { className: 'combo-item' },
        el('div', { className: 'combo-item__info' },
          el('span', { className: 'combo-item__name' }, cera.nombre),
          el('span', { className: 'combo-item__meta' },
            capitalize(cera.tamano),
            ' · ',
            formatGramos(cera.peso),
            ' · ',
            formatMXN(cera.costoUnitario)
          )
        ),
        el('button', {
          className: 'combo-item__add',
          'data-id': cera.id,
          'data-type': 'cera',
          title: 'Agregar al combo',
        }, '+')
      );
      containerList.appendChild(item);
    });
  }

  // Delegación de clics en botones +
  containerList.querySelectorAll('.combo-item__add').forEach((btn) => {
    on(btn, 'click', () => {
      const type = btn.dataset.type;
      const id = btn.dataset.id;
      if (type === 'pieza') {
        addPiezaToCombo(Number(id));
      } else {
        addCeraToCombo(id);
      }
      refreshComboBuilder();
    });
  });
}

function addPiezaToCombo(refId) {
  const catalog = store.getState().catalog;
  const pieza = catalog.find((p) => p.id === refId);
  if (!pieza) return;

  const settings = store.getState().settings;
  const defaultYeso = settings.yesos[0]?.id || 'redimix';

  const config = {
    yeso: defaultYeso,
    zona: 'pueblo',
    conColor: false,
    conSellador: false,
    conDetalle: false,
    ajusteDesmolde: 0,
    ajusteEsfuerzo: 0,
  };

  const costoUnitario = calcularCostoPieza(refId, config);

  comboState.items.push({
    tipo: 'pieza',
    uid: uid(),
    refId: pieza.id,
    nombre: pieza.nombre,
    cantidad: 1,
    config,
    costoUnitario,
  });
}

function addCeraToCombo(refId) {
  const cera = CATALOGO_CERAS.find((c) => c.id === refId);
  if (!cera) return;

  comboState.items.push({
    tipo: 'cera',
    uid: uid(),
    refId: cera.id,
    nombre: cera.nombre,
    cantidad: 1,
    costoUnitario: cera.costoUnitario,
  });
}

// ─── Renderizado panel derecho ───

function renderCurrentPanel() {
  const header = el('div', { className: 'combo-current__header' },
    el('h3', { className: 'combo-current__title' }, 'Combo actual'),
    el('input', {
      className: 'combo-current__input',
      type: 'text',
      placeholder: 'Nombre del arreglo/combo...',
      value: comboState.nombre,
      id: 'combo-nombre',
    })
  );

  const list = el('div', { className: 'combo-current__list' });
  renderCurrentList(list);

  const summary = renderSummary();

  return el('div', { className: 'combo-current' }, header, list, summary);
}

function renderCurrentList(containerList) {
  clear(containerList);

  if (comboState.items.length === 0) {
    containerList.appendChild(
      el('div', { className: 'combo-current__empty' },
        iconBouquet({ size: 40, stroke: 1.5, style: { opacity: '0.3' } }),
        'Agrega piezas de yeso y figuras de cera para armar tu combo.'
      )
    );
    return;
  }

  comboState.items.forEach((item, index) => {
    const isPieza = item.tipo === 'pieza';

    const info = el('div', { className: 'combo-current-item__info' },
      el('span', { className: 'combo-current-item__name' }, item.nombre),
      el('span', { className: 'combo-current-item__meta' },
        isPieza ? iconWeight({ size: 12 }) : iconCandle({ size: 12 }),
        isPieza ? 'Pieza de yeso' : 'Figura de cera',
        item.cantidad > 1 ? ` ×${item.cantidad}` : ''
      )
    );

    const qtyControl = el('div', { className: 'combo-qty' },
      el('button', { className: 'combo-qty__btn', 'data-idx': index, 'data-action': 'minus' }, '-'),
      el('span', { className: 'combo-qty__value' }, String(item.cantidad)),
      el('button', { className: 'combo-qty__btn', 'data-idx': index, 'data-action': 'plus' }, '+')
    );

    const right = el('div', { className: 'combo-current-item__right' },
      el('span', { className: 'combo-current-item__price' }, formatMXN(item.costoUnitario * item.cantidad)),
      el('button', {
        className: 'combo-current-item__remove',
        'data-idx': index,
        title: 'Eliminar',
      }, iconTrash({ size: 14 }))
    );

    if (isPieza) {
      const configBtn = el('button', {
        className: 'combo-current-item__remove',
        'data-idx': index,
        title: 'Configurar pieza',
        style: { marginRight: '4px' },
      }, iconSliders({ size: 14 }));
      on(configBtn, 'click', () => openConfigModal(index));
      right.insertBefore(configBtn, right.firstChild);
    }

    const row = el('div', { className: 'combo-current-item' }, info, qtyControl, right);
    containerList.appendChild(row);
  });

  // Eventos
  containerList.querySelectorAll('.combo-qty__btn').forEach((btn) => {
    on(btn, 'click', () => {
      const idx = Number(btn.dataset.idx);
      const action = btn.dataset.action;
      if (action === 'plus') {
        comboState.items[idx].cantidad++;
      } else if (action === 'minus' && comboState.items[idx].cantidad > 1) {
        comboState.items[idx].cantidad--;
      }
      refreshComboBuilder();
    });
  });

  containerList.querySelectorAll('.combo-current-item__remove[data-idx]').forEach((btn) => {
    if (btn.title === 'Eliminar') {
      on(btn, 'click', () => {
        const idx = Number(btn.dataset.idx);
        comboState.items.splice(idx, 1);
        refreshComboBuilder();
      });
    }
  });
}

function renderSummary() {
  const settings = store.getState().settings;
  const canalObj = MARGENES_CANAL[comboState.canal];
  const canalNombre = canalObj?.nombre || 'Bazar / evento';

  const channelSelect = el('select', { className: 'form-select', id: 'combo-canal' },
    ...Object.entries(MARGENES_CANAL).map(([key, val]) =>
      el('option', { value: key, selected: key === comboState.canal }, val.nombre)
    )
  );

  on(channelSelect, 'change', () => {
    comboState.canal = channelSelect.value;
    refreshComboBuilder();
  });

  const hasItems = comboState.items.length > 0;
  const totales = hasItems ? recalcularCombo() : null;
  const canalLabel = el('div', { className: 'combo-channel' },
    el('label', { className: 'combo-channel__label' }, 'Canal de venta'),
    channelSelect
  );

  if (!hasItems) {
    return el('div', { className: 'combo-summary' },
      canalLabel,
      el('div', { className: 'combo-summary__final', style: { opacity: 0.5 } },
        el('div', { className: 'combo-summary__final-label' }, 'Sin items'),
        el('div', { className: 'combo-summary__final-meta' }, 'Agrega piezas y figuras de cera para calcular el precio.')
      )
    );
  }

  const summary = el('div', { className: 'combo-summary' },
    canalLabel,
    el('div', { className: 'combo-summary__row' },
      el('span', null, 'Piezas de yeso'),
      el('span', { className: 'combo-summary__value' }, formatMXN(totales.sumaPiezas))
    ),
    el('div', { className: 'combo-summary__row' },
      el('span', null, 'Figuras de cera'),
      el('span', { className: 'combo-summary__value' }, formatMXN(totales.sumaCeras))
    ),
    el('div', { className: 'combo-summary__row' },
      el('span', null, 'Armado'),
      el('span', { className: 'combo-summary__value' }, formatMXN(totales.armado))
    ),
    el('div', { className: 'combo-summary__row combo-summary__row--total' },
      el('span', null, 'Costo total'),
      el('span', { className: 'combo-summary__value' }, formatMXN(totales.costoBase))
    ),
    el('div', { className: 'combo-summary__final' },
      el('div', { className: 'combo-summary__final-label' }, 'Precio sugerido'),
      el('div', { className: 'combo-summary__final-value' }, formatMXNShort(totales.precioFinal)),
      el('div', { className: 'combo-summary__final-meta' }, `${canalNombre} · Ganancia ${formatMXN(totales.gananciaMXN)}`)
    ),
    el('div', { className: 'combo-summary__actions' },
      el('button', { className: 'btn btn--secondary btn--full', id: 'combo-clear' }, 'Limpiar'),
      el('button', { className: 'btn btn--primary btn--full', id: 'combo-save' }, iconSave({ size: 16 }), ' Guardar')
    )
  );

  // Eventos
  on(qs('#combo-clear', summary), 'click', () => {
    comboState.items = [];
    comboState.nombre = '';
    refreshComboBuilder();
  });

  on(qs('#combo-save', summary), 'click', () => {
    guardarCombo(totales);
  });

  return summary;
}

function guardarCombo(totales) {
  if (comboState.items.length === 0) return;

  const nombre = qs('#combo-nombre')?.value.trim() || 'Combo sin nombre';
  comboState.nombre = nombre;

  const entry = {
    tipo: 'combo',
    nombre,
    canal: comboState.canal,
    precioFinal: totales.precioFinal,
    margenAplicado: totales.margenAplicado,
    resultado: totales,
    params: { ...comboState },
  };

  addToHistory(entry);
  store.setState({
    history: [{
      ...entry,
      id: Date.now(),
      fecha: new Date().toISOString(),
    }, ...store.getState().history],
  });

  // Feedback
  const saveBtn = qs('#combo-save');
  if (saveBtn) {
    saveBtn.innerHTML = '';
    saveBtn.appendChild(iconCheck({ size: 16 }));
    saveBtn.appendChild(document.createTextNode(' Guardado'));
    setTimeout(() => {
      saveBtn.innerHTML = '';
      saveBtn.appendChild(iconSave({ size: 16 }));
      saveBtn.appendChild(document.createTextNode(' Guardar'));
    }, 2000);
  }
}

// ─── Modal de configuración de pieza ───

function openConfigModal(itemIndex) {
  const item = comboState.items[itemIndex];
  if (!item || item.tipo !== 'pieza') return;

  const existing = qs('.combo-config-overlay');
  if (existing) existing.remove();

  const settings = store.getState().settings;
  const pieza = store.getState().catalog.find((p) => p.id === item.refId);

  const title = el('h2', { className: 'combo-config-modal__title' }, `Configurar: ${item.nombre}`);
  const closeBtn = el('button', { className: 'combo-config-modal__close' }, iconClose({ size: 14 }));

  // Yeso
  const yesoSelect = el('select', { className: 'form-select', id: 'config-yeso' },
    ...settings.yesos.map((y) => el('option', { value: y.id, selected: y.id === item.config.yeso }, y.nombre))
  );

  // Zona
  const zonaSelect = el('select', { className: 'form-select', id: 'config-zona' },
    ...Object.entries(settings.tarifasZona).map(([k, v]) =>
      el('option', { value: k, selected: k === item.config.zona }, `${k === 'pueblo' ? 'Pueblo' : 'Ciudad'} — $${v.toFixed(2)}/min`)
    )
  );

  // Toggles
  const colorToggle = makeToggle('Color / pintura', 'config-color', item.config.conColor);
  const selladorToggle = makeToggle('Sellador', 'config-sellador', item.config.conSellador);
  const detalleToggle = makeToggle('Detalle fino', 'config-detalle', item.config.conDetalle);

  // Esfuerzo
  const esfuerzoInput = el('input', {
    className: 'form-input',
    type: 'number',
    id: 'config-esfuerzo',
    min: '0',
    max: '10',
    step: '5',
    value: String(item.config.ajusteEsfuerzo),
  });

  // Desmolde
  const desmoldeSelect = el('select', { className: 'form-select', id: 'config-desmolde' },
    el('option', { value: '0', selected: item.config.ajusteDesmolde === 0 }, 'Normal'),
    el('option', { value: '5', selected: item.config.ajusteDesmolde === 5 }, 'Difícil (+$5)'),
    el('option', { value: '10', selected: item.config.ajusteDesmolde === 10 }, 'Muy difícil (+$10)'),
  );

  const cancelBtn = el('button', { className: 'btn btn--secondary btn--full' }, 'Cancelar');
  const saveBtn = el('button', { className: 'btn btn--primary btn--full' }, 'Aplicar');

  const modal = el('div', { className: 'combo-config-modal' },
    el('div', { className: 'combo-config-modal__header' }, title, closeBtn),
    el('div', { className: 'combo-config-modal__body' },
      el('div', { className: 'form-group' },
        el('label', { className: 'form-label' }, 'Tipo de yeso'),
        yesoSelect,
      ),
      el('div', { className: 'form-group' },
        el('label', { className: 'form-label' }, 'Zona'),
        zonaSelect,
      ),
      colorToggle,
      selladorToggle,
      detalleToggle,
      el('div', { className: 'form-group' },
        el('label', { className: 'form-label' }, 'Ajuste esfuerzo ($)'),
        esfuerzoInput,
      ),
      el('div', { className: 'form-group' },
        el('label', { className: 'form-label' }, 'Dificultad de desmolde'),
        desmoldeSelect,
      ),
    ),
    el('div', { className: 'combo-config-modal__footer' }, cancelBtn, saveBtn),
  );

  const overlay = el('div', { className: 'combo-config-overlay' }, modal);

  function close() { overlay.remove(); }

  on(closeBtn, 'click', close);
  on(cancelBtn, 'click', close);
  on(overlay, 'click', (e) => { if (e.target === overlay) close(); });

  on(saveBtn, 'click', () => {
    const newConfig = {
      yeso: qs('#config-yeso', modal).value,
      zona: qs('#config-zona', modal).value,
      conColor: qs('#config-color', modal)?.checked || false,
      conSellador: qs('#config-sellador', modal)?.checked || false,
      conDetalle: qs('#config-detalle', modal)?.checked || false,
      ajusteEsfuerzo: Number(qs('#config-esfuerzo', modal).value) || 0,
      ajusteDesmolde: Number(qs('#config-desmolde', modal).value) || 0,
    };

    comboState.items[itemIndex].config = newConfig;
    comboState.items[itemIndex].costoUnitario = calcularCostoPieza(item.refId, newConfig);
    refreshComboBuilder();
    close();
  });

  document.body.appendChild(overlay);
}

function makeToggle(label, id, checked) {
  return el('div', { className: 'toggle-row' },
    el('div', null,
      el('div', { className: 'toggle-label' }, label),
    ),
    el('label', { className: 'switch' },
      el('input', { type: 'checkbox', id, checked }),
      el('span', { className: 'switch__track' },
        el('span', { className: 'switch__thumb' }),
      ),
    ),
  );
}

// ─── Refresh global ───

function refreshComboBuilder() {
  if (!container) return;
  const builder = qs('.combo-builder', container);
  if (builder) {
    // Reemplazar solo los paneles, no todo el contenedor
    const left = qs('.combo-available', builder);
    const right = qs('.combo-current', builder);
    if (left) left.replaceWith(renderAvailablePanel());
    if (right) right.replaceWith(renderCurrentPanel());
  }
}

// ─── Montaje ───

export function mountCombo() {
  container = document.getElementById('combos');
  if (!container) {
    console.warn('[combo-ui] No se encontró #combos en el DOM');
    return () => {};
  }

  clear(container);
  comboState = { nombre: '', canal: 'bazar', items: [] };
  activeAvailableTab = 'piezas';
  availableSearch = '';

  container.appendChild(el('h2', { className: 'section-title' }, 'Combos'));
  container.appendChild(el('p', { className: 'section-subtitle' }, 'Arma arreglos florales combinando piezas de yeso y figuras de cera. Calcula el costo total y precio sugerido.'));

  const builder = el('div', { className: 'combo-builder' },
    renderAvailablePanel(),
    renderCurrentPanel(),
  );

  container.appendChild(builder);

  return () => {
    clear(container);
    container = null;
  };
}
