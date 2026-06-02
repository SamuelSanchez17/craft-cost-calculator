/**
 * Calculadora de piezas individuales.
 * Renderiza el formulario, conecta eventos, y muestra resultados.
 * Se monta sobre #calculator en el DOM.
 */

import { store } from '../app.js';
import {
  calcularPiezaCompleta,
  redondearA5,
} from '../calculator.js';
import {
  YESOS,
  COSTO_FIJO_POR_PIEZA,
  COSTOS_COLOR,
  COSTOS_SELLADOR,
  COSTOS_DETALLE_FINO,
  MARGENES_CANAL,
  RECARGOS_URGENCIA,
  AJUSTES_DESMOLDE,
  ETIQUETAS_CANAL,
  ETIQUETAS_URGENCIA,
  ETIQUETAS_DESMOLDE,
} from '../catalog.js';
import { formatMXN, formatMXNShort, formatPercent, formatGramos, formatMinutos, capitalize } from '../utils/format.js';
import { addToHistory } from '../storage.js';
import { el, clear, qs, on, delegate } from './renderer.js';

// ─── Referencias internas ───

let selectedPiece = null;
let container = null;

// ─── Renderizado de secciones ───

function renderPieceSelector() {
  const catalog = store.getState().catalog;

  const input = el('input', {
    className: 'piece-selector__input',
    type: 'text',
    placeholder: 'Buscar pieza...',
    autocomplete: 'off',
  });

  const caret = el('span', { className: 'piece-selector__caret' }, '▼');

  const dropdown = el('div', { className: 'piece-selector__dropdown' });

  function filterPieces(query) {
    const q = query.toLowerCase().trim();
    clear(dropdown);

    if (!q) {
      dropdown.classList.remove('piece-selector__dropdown--open');
      return;
    }

    const filtered = catalog.filter((p) =>
      p.nombre.toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
      dropdown.appendChild(
        el('div', { className: 'piece-selector__empty' }, 'Sin resultados')
      );
    } else {
      filtered.forEach((piece) => {
        const option = el('div', {
          className: 'piece-selector__option',
          'data-id': piece.id,
        },
          el('span', null, piece.nombre),
          el('span', { className: 'piece-selector__option-meta' },
            el('span', { className: `badge badge--${piece.tamano}` }, capitalize(piece.tamano)),
            el('span', { className: 'text-sm text-muted' }, formatGramos(piece.peso)),
          ),
        );
        dropdown.appendChild(option);
      });
    }

    dropdown.classList.add('piece-selector__dropdown--open');
  }

  on(input, 'input', () => filterPieces(input.value));
  on(input, 'focus', () => { if (input.value) filterPieces(input.value); });

  // Cerrar dropdown al hacer clic fuera
  on(document, 'click', (e) => {
    if (!e.target.closest('.piece-selector')) {
      dropdown.classList.remove('piece-selector__dropdown--open');
    }
  });

  // Seleccionar pieza
  delegate(dropdown, 'click', '.piece-selector__option', (e, option) => {
    const id = Number(option.dataset.id);
    const catalog = store.getState().catalog;
    selectedPiece = catalog.find((p) => p.id === id) || null;

    if (selectedPiece) {
      input.value = selectedPiece.nombre;
      dropdown.classList.remove('piece-selector__dropdown--open');
      renderPieceDetails();
      updateEffortMarks();
    }
  });

  return el('div', { className: 'piece-selector' }, input, caret, dropdown);
}

function renderPieceDetails() {
  const detailsEl = qs('#piece-details');
  if (!detailsEl) return;

  clear(detailsEl);

  if (!selectedPiece) {
    detailsEl.style.display = 'none';
    return;
  }

  detailsEl.style.display = 'block';

  detailsEl.appendChild(
    el('div', { className: 'flex items-center gap-2', style: { flexWrap: 'wrap' } },
      el('span', { className: `badge badge--${selectedPiece.tamano}` }, capitalize(selectedPiece.tamano)),
      el('span', { className: 'text-sm text-secondary', style: { display: 'flex', alignItems: 'center', gap: '4px' } },
        '⚖', formatGramos(selectedPiece.peso),
      ),
      el('span', { className: 'text-sm text-secondary', style: { display: 'flex', alignItems: 'center', gap: '4px' } },
        '⏱', formatMinutos(selectedPiece.minutos),
      ),
    )
  );
}

function renderPlasterCards() {
  const settings = store.getState().settings;
  const yesos = settings.yesos;

  const cards = yesos.map((y, i) => {
    const input = el('input', {
      type: 'radio',
      name: 'yeso',
      value: y.id,
      id: `yeso-${y.id}`,
    });
    if (i === 0) input.checked = true;

    const content = el('label', {
      className: 'radio-card__content',
      htmlFor: `yeso-${y.id}`,
    },
      el('span', { className: 'radio-card__name' }, y.nombre),
      el('span', { className: 'radio-card__price' }, `$${y.precioPorGramo.toFixed(3)}/g`),
    );

    return el('div', { className: 'radio-card' }, input, content);
  });

  return el('div', { className: 'radio-cards' }, ...cards);
}

function renderSelectGroup() {
  // Zona
  const zonaOptions = Object.values(store.getState().settings.tarifasZona).map((tarifa, i) => {
    const keys = ['pueblo', 'ciudad'];
    const names = ['Pueblo', 'Ciudad'];
    return el('option', { value: keys[i] }, `${names[i]} — ${formatMXNShort(tarifa)}/min`);
  });

  const zonaSelect = el('select', { className: 'form-select', id: 'calc-zona' }, ...zonaOptions);

  const zonaItem = el('div', { className: 'select-group__item' },
    el('label', { className: 'select-group__label' }, 'Zona de venta'),
    zonaSelect,
  );

  // Canal
  const canalOptions = Object.entries(MARGENES_CANAL).map(([key, val]) =>
    el('option', { value: key }, `${val.nombre} (${formatPercent(val.margen, 0)})`)
  );

  const canalSelect = el('select', { className: 'form-select', id: 'calc-canal' }, ...canalOptions);

  const canalItem = el('div', { className: 'select-group__item' },
    el('label', { className: 'select-group__label' }, 'Canal de venta'),
    canalSelect,
  );

  return el('div', { className: 'select-group' }, zonaItem, canalItem);
}

function renderUrgencySelector() {
  const options = Object.entries(RECARGOS_URGENCIA).map(([key, val]) => {
    const pct = val.recargo > 0 ? ` (+${formatPercent(val.recargo, 0)})` : '';
    return el('option', { value: key }, `${val.nombre}${pct}`);
  });

  const select = el('select', { className: 'form-select', id: 'calc-urgencia' }, ...options);

  return el('div', { className: 'form-group' },
    el('label', { className: 'form-label' }, 'Tiempo de entrega'),
    select,
  );
}

function renderToggles() {
  function makeToggle(label, hint, price, id) {
    const info = el('div', null,
      el('div', { className: 'toggle-label' }, label),
      el('div', { className: 'toggle-row__hint' }, hint),
    );

    const priceEl = el('span', { className: 'toggle-row__price' }, `+${formatMXN(price)}`);

    const switchEl = el('label', { className: 'switch' },
      el('input', { type: 'checkbox', id: `calc-${id}`, 'data-id': id }),
      el('span', { className: 'switch__track' },
        el('span', { className: 'switch__thumb' }),
      ),
    );

    return el('div', { className: 'toggle-row' }, info, priceEl, switchEl);
  }

  return el('div', null,
    makeToggle('Color / pintura', 'Costo base de pintura por tamaño', 0, 'color'),
    makeToggle('Detalle fino', 'Acabado detallado extra', 0, 'detalle'),
    makeToggle('Sellador', 'Protección y acabado brillante', 0, 'sellador'),
  );
}

function renderDemoldingOptions() {
  const options = Object.entries(AJUSTES_DESMOLDE).map(([key, val]) => {
    const input = el('input', {
      type: 'radio',
      name: 'desmolde',
      value: key,
      id: `desmolde-${key}`,
    });
    if (key === 'normal') input.checked = true;

    const check = el('span', { className: 'desmolde-option__check' });
    const label = el('span', { className: 'desmolde-option__label' }, val.nombre);
    const price = el('span', { className: 'desmolde-option__price' },
      val.valor > 0 ? `+${formatMXN(val.valor)}` : formatMXN(0)
    );

    const content = el('label', {
      className: 'desmolde-option__content',
      htmlFor: `desmolde-${key}`,
    }, label, check, price);

    return el('div', { className: 'desmolde-option' }, input, content);
  });

  return el('div', { className: 'desmolde-options' }, ...options);
}

function renderEffortRange() {
  const slider = el('input', {
    className: 'effort-range__slider',
    type: 'range',
    id: 'calc-esfuerzo',
    min: '0',
    max: '10',
    step: '5',
    value: '0',
  });

  const valueEl = el('span', { className: 'effort-range__value' }, '$0');

  on(slider, 'input', () => {
    valueEl.textContent = formatMXNShort(Number(slider.value));
  });

  const marks = el('div', { className: 'effort-range__marks' },
    el('span', null, '$0'),
    el('span', null, '$5'),
    el('span', null, '$10'),
  );

  return el('div', null,
    el('div', { className: 'effort-range' }, slider, valueEl),
    marks,
  );
}

function renderSubmitButton() {
  const btn = el('button', {
    className: 'calc-submit__btn',
    id: 'calc-submit-btn',
  }, '📋 Calcular precio');

  return el('div', { className: 'calc-submit' }, btn);
}

function renderResultPlaceholder() {
  const resultArea = el('div', { className: 'calc-result', id: 'calc-result-area' });
  return resultArea;
}

function renderPieceAutoFields() {
  return el('div', {
    className: 'flex items-center gap-3 mb-2',
    id: 'piece-details',
    style: { display: 'none', padding: '8px 12px', background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-md)' }
  });
}

// ─── Cálculo y presentación de resultados ───

function collectParams() {
  if (!selectedPiece) return null;

  const settings = store.getState().settings;
  const yesoKey = qs('input[name="yeso"]:checked')?.value || 'redimix';
  const zonaKey = qs('#calc-zona')?.value || 'pueblo';
  const canalKey = qs('#calc-canal')?.value || 'bazar';
  const urgenciaKey = qs('#calc-urgencia')?.value || 'normal';
  const conColor = qs('#calc-color')?.checked || false;
  const conDetalle = qs('#calc-detalle')?.checked || false;
  const conSellador = qs('#calc-sellador')?.checked || false;
  const desmoldeKey = qs('input[name="desmolde"]:checked')?.value || 'normal';
  const esfuerzo = Number(qs('#calc-esfuerzo')?.value) || 0;

  const yeso = settings.yesos.find((y) => y.id === yesoKey) || settings.yesos[0];
  const tarifaPorMinuto = settings.tarifasZona[zonaKey] || 1.16;
  const canal = MARGENES_CANAL[canalKey];
  const urgencia = RECARGOS_URGENCIA[urgenciaKey];
  const desmoldeValor = AJUSTES_DESMOLDE[desmoldeKey]?.valor || 0;

  return {
    peso_g: selectedPiece.peso,
    tamano: selectedPiece.tamano,
    precioYesoPorG: yeso.precioPorGramo,
    minutos: selectedPiece.minutos,
    tarifaPorMinuto,
    conColor,
    conDetalleFino: conDetalle,
    conSellador,
    ajusteDesmolde: desmoldeValor,
    ajusteEsfuerzo: esfuerzo,
    margen: canal.margen,
    recargoUrgencia: urgencia.recargo,
    nombre: selectedPiece.nombre,
    canal: canalKey,
    urgencia: urgenciaKey,
    zona: zonaKey,
    yesoKey,
  };
}

function updateTogglesCount() {
  if (!selectedPiece) return;
  const tamano = selectedPiece.tamano;

  const colorPrice = COSTOS_COLOR[tamano] || 0;
  const detallePrice = COSTOS_DETALLE_FINO[tamano] || 0;
  const selladorPrice = COSTOS_SELLADOR[tamano] || 0;

  const colorRow = qs('#calc-color')?.closest('.toggle-row');
  const detalleRow = qs('#calc-detalle')?.closest('.toggle-row');
  const selladorRow = qs('#calc-sellador')?.closest('.toggle-row');

  if (colorRow) colorRow.querySelector('.toggle-row__price').textContent = `+${formatMXN(colorPrice)}`;
  if (detalleRow) detalleRow.querySelector('.toggle-row__price').textContent = `+${formatMXN(detallePrice)}`;
  if (selladorRow) selladorRow.querySelector('.toggle-row__price').textContent = `+${formatMXN(selladorPrice)}`;
}

function updateEffortMarks() {
  // La escala ya es fija 0-5-10, no depende de la pieza
}

function handleCalculate() {
  const params = collectParams();
  const resultArea = qs('#calc-result-area');
  if (!resultArea) return;

  clear(resultArea);
  resultArea.classList.remove('calc-result--visible');

  if (!params) {
    resultArea.appendChild(
      el('div', { className: 'empty-state' },
        el('div', { className: 'empty-state__icon' }, '🔍'),
        el('p', { className: 'empty-state__text' }, 'Selecciona una pieza del catálogo para calcular su precio.'),
      )
    );
    resultArea.classList.add('calc-result--visible');
    return;
  }

  const result = calcularPiezaCompleta(params);

  // Cabecera
  const header = el('div', { className: 'result-card__header' },
    el('div', { className: 'result-card__piece-name' }, params.nombre),
    el('div', { className: 'result-card__meta' },
      el('span', null, capitalize(params.tamano)),
      el('span', null, formatGramos(params.peso_g)),
      el('span', null, formatMinutos(params.minutos)),
    ),
  );

  // Precio
  const canalNombre = MARGENES_CANAL[params.canal]?.nombre || '';
  const urgenciaNombre = RECARGOS_URGENCIA[params.urgencia]?.nombre || '';

  const price = el('div', { className: 'result-card__price' },
    el('div', { className: 'result-card__price-label' }, 'Precio sugerido'),
    el('div', { className: 'result-card__price-value' }, formatMXNShort(result.precioFinal)),
    el('div', { className: 'result-card__price-channel' }, `${canalNombre} · ${urgenciaNombre}`),
    el('div', { className: 'result-card__price-ganancia' },
      `Ganancia: ${formatMXN(result.gananciaMXN)} (${formatPercent(result.gananciaPct / 100, 0)})`
    ),
  );

  // Desglose colapsable
  const breakdownToggle = el('button', {
    className: 'result-card__breakdown-toggle',
    ariaExpanded: 'false',
  },
    'Ver desglose de costos ',
    el('span', { className: 'result-card__breakdown-toggle-icon' }, '▼'),
  );

  const items = [
    ['Yeso', result.desglose.costoYeso],
    ['Costos fijos', result.desglose.costosFijos],
    ['Mano de obra', result.desglose.manoDeObra],
  ];
  if (result.desglose.costoColor > 0) items.push(['Color / pintura', result.desglose.costoColor]);
  if (result.desglose.costoDetalle > 0) items.push(['Detalle fino', result.desglose.costoDetalle]);
  if (result.desglose.costoSellador > 0) items.push(['Sellador', result.desglose.costoSellador]);
  if (result.desglose.ajusteDesmolde > 0) items.push(['Ajuste desmolde', result.desglose.ajusteDesmolde]);
  if (result.desglose.ajusteEsfuerzo > 0) items.push(['Ajuste esfuerzo', result.desglose.ajusteEsfuerzo]);

  const breakdownList = el('div', { className: 'result-card__breakdown-list' },
    ...items.map(([label, value]) =>
      el('div', { className: 'result-card__breakdown-item' },
        el('span', null, label),
        el('span', { className: 'result-card__breakdown-value' }, formatMXN(value)),
      )
    ),
    el('div', { className: 'result-card__breakdown-item result-card__breakdown-item--total' },
      el('span', null, 'Costo base'),
      el('span', { className: 'result-card__breakdown-value' }, formatMXN(result.costoBase)),
    ),
  );

  const breakdown = el('div', { className: 'result-card__breakdown' }, breakdownList);

  on(breakdownToggle, 'click', () => {
    const isOpen = breakdownToggle.getAttribute('aria-expanded') === 'true';
    breakdownToggle.setAttribute('aria-expanded', String(!isOpen));
    breakdown.classList.toggle('result-card__breakdown--open', !isOpen);
  });

  // Tarjeta completa
  const card = el('div', { className: 'result-card' }, header, price, breakdownToggle, breakdown);

  // Botones de acción
  const saveBtn = el('button', { className: 'result-actions__btn result-actions__btn--save' },
    '💾 Guardar cotización'
  );
  const shareBtn = el('button', { className: 'result-actions__btn result-actions__btn--share' },
    '📤 Compartir'
  );

  on(saveBtn, 'click', () => {
    addToHistory({
      tipo: 'pieza',
      nombre: params.nombre,
      canal: params.canal,
      precioFinal: result.precioFinal,
      margenAplicado: params.margen,
      resultado: { desglose: result.desglose, costoBase: result.costoBase, ...result },
      params,
    });
    store.setState({
      history: [{
        tipo: 'pieza',
        nombre: params.nombre,
        canal: params.canal,
        precioFinal: result.precioFinal,
        margenAplicado: params.margen,
        resultado: result,
        params,
        id: Date.now(),
        fecha: new Date().toISOString(),
      }, ...store.getState().history],
    });

    // Feedback visual
    saveBtn.textContent = '✅ Guardado';
    saveBtn.style.background = 'var(--color-salvia)';
    saveBtn.style.color = 'var(--color-blanco)';
    setTimeout(() => {
      saveBtn.textContent = '💾 Guardar cotización';
      saveBtn.style.background = '';
      saveBtn.style.color = '';
    }, 2000);
  });

  on(shareBtn, 'click', () => {
    const lines = [
      `📋 *Cotización — ${params.nombre}*`,
      '',
      `• Peso: ${formatGramos(params.peso_g)}`,
      `• Tamaño: ${capitalize(params.tamano)}`,
      `• Tiempo: ${formatMinutos(params.minutos)}`,
      `• Canal: ${canalNombre}`,
      `• Entrega: ${urgenciaNombre}`,
      '',
      `💰 *Precio: ${formatMXN(result.precioFinal)}*`,
      `📊 Ganancia: ${formatMXN(result.gananciaMXN)} (${formatPercent(result.gananciaPct / 100, 0)})`,
    ];

    if (navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n')).then(() => {
        shareBtn.textContent = '✅ Copiado';
        setTimeout(() => { shareBtn.textContent = '📤 Compartir'; }, 2000);
      }).catch(() => {
        shareBtn.textContent = '⚠ Error';
      });
    }
  });

  const actions = el('div', { className: 'result-actions' }, saveBtn, shareBtn);

  resultArea.appendChild(card);
  resultArea.appendChild(actions);

  // Forzar visibilidad con un pequeño delay para la animación
  requestAnimationFrame(() => {
    resultArea.classList.add('calc-result--visible');
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

// ─── Montaje principal ───

/**
 * Monta la calculadora en el panel #calculator.
 * Retorna función cleanup para desmontar.
 */
export function mountCalculator() {
  container = document.getElementById('calculator');
  if (!container) {
    console.warn('[calculator-ui] No se encontró #calculator en el DOM');
    return () => {};
  }

  clear(container);

  // Título del panel
  container.appendChild(el('h2', { className: 'section-title' }, 'Calcular precio'));
  container.appendChild(el('p', { className: 'section-subtitle' }, 'Selecciona una pieza, ajusta los parámetros y obtén el precio sugerido.'));

  // 1. Selector de pieza
  container.appendChild(
    el('div', { className: 'calc-section' },
      el('h3', { className: 'calc-section__title' }, 'Pieza'),
      renderPieceSelector(),
      renderPieceAutoFields(),
    )
  );

  // 2. Tipo de yeso
  container.appendChild(
    el('div', { className: 'calc-section' },
      el('h3', { className: 'calc-section__title' }, 'Tipo de yeso'),
      renderPlasterCards(),
    )
  );

  // 3. Zona + Canal
  container.appendChild(
    el('div', { className: 'calc-section' },
      renderSelectGroup(),
    )
  );

  // 4. Urgencia
  container.appendChild(
    el('div', { className: 'calc-section' },
      el('h3', { className: 'calc-section__title' }, 'Tiempo de entrega'),
      renderUrgencySelector(),
    )
  );

  // 5. Toggles
  container.appendChild(
    el('div', { className: 'calc-section' },
      el('h3', { className: 'calc-section__title' }, 'Acabados'),
      renderToggles(),
    )
  );

  // 6. Desmolde
  container.appendChild(
    el('div', { className: 'calc-section' },
      el('h3', { className: 'calc-section__title' }, 'Dificultad de desmolde'),
      renderDemoldingOptions(),
    )
  );

  // 7. Esfuerzo extra
  container.appendChild(
    el('div', { className: 'calc-section' },
      el('h3', { className: 'calc-section__title' }, 'Esfuerzo extra'),
      renderEffortRange(),
    )
  );

  // 8. Botón calcular
  container.appendChild(renderSubmitButton());

  // 9. Área de resultados
  container.appendChild(renderResultPlaceholder());

  // Evento: calcular al hacer clic
  const submitBtn = qs('#calc-submit-btn');
  on(submitBtn, 'click', handleCalculate);

  // Evento: actualizar precios de toggles al seleccionar pieza
  on(document, 'click', (e) => {
    if (e.target.closest('.piece-selector__option')) {
      setTimeout(updateTogglesCount, 50);
    }
  });

  // Evento: actualizar precios al cambiar tamaño (vía settings)
  const unsubscribe = store.subscribe(() => {
    // Re-renderizar radio cards si cambian los settings de yeso
    if (selectedPiece) updateTogglesCount();
  });

  return () => {
    unsubscribe();
    clear(container);
  };
}
