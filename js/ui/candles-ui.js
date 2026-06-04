/**
 * Calculadora de velas artesanales.
 * Renderiza formulario, selector de figuras de cera,
 * cálculo de costos y resultados.
 * Se monta sobre #candles en el DOM.
 */

import { store } from '../app.js';
import { calcularVelaCompleta } from '../calculator.js';
import { CATALOGO_CERAS, CONFIG_VELAS } from '../catalog.js';
import { formatMXN, formatMXNShort, formatGramos, formatMinutos, formatPercent } from '../utils/format.js';
import { addToHistory } from '../storage.js';
import { el, clear, qs, on, delegate } from './renderer.js';
import {
  iconCandle,
  iconSearch,
  iconWeight,
  iconClock,
  iconLayers,
  iconDroplet,
  iconZap,
  iconFlame,
  iconSave,
  iconShare,
  iconChevronDown,
} from './icons.js';

let container = null;
let selectedFigure = null;

// ─── Renderizado ───

function renderFigureSelector() {
  const input = el('input', {
    className: 'candle-figure-selector__input',
    type: 'text',
    placeholder: 'Buscar figura de cera...',
    autocomplete: 'off',
    id: 'candle-figure-input',
  });

  const caret = el('span', { className: 'candle-figure-selector__caret' });
  caret.appendChild(iconChevronDown({ size: 16, stroke: 2 }));

  const dropdown = el('div', { className: 'candle-figure-selector__dropdown' });

  function filterFigures(query) {
    const q = query.toLowerCase().trim();
    clear(dropdown);

    if (!q) {
      dropdown.classList.remove('candle-figure-selector__dropdown--open');
      return;
    }

    const filtered = CATALOGO_CERAS.filter((f) =>
      f.nombre.toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
      dropdown.appendChild(
        el('div', { className: 'candle-figure-selector__empty' }, 'Sin resultados')
      );
    } else {
      filtered.forEach((fig) => {
        const option = el('div', {
          className: 'candle-figure-selector__option',
          'data-id': fig.id,
        },
          el('span', null, fig.nombre),
          el('span', { className: 'candle-figure-selector__option-meta' },
            formatGramos(fig.peso),
            ` — ${formatMXN(fig.costoUnitario)}`
          ),
        );
        dropdown.appendChild(option);
      });
    }

    dropdown.classList.add('candle-figure-selector__dropdown--open');
  }

  on(input, 'input', () => filterFigures(input.value));
  on(input, 'focus', () => { if (input.value) filterFigures(input.value); });

  on(document, 'click', (e) => {
    if (!e.target.closest('.candle-figure-selector')) {
      dropdown.classList.remove('candle-figure-selector__dropdown--open');
    }
  });

  delegate(dropdown, 'click', '.candle-figure-selector__option', (e, option) => {
    const id = option.dataset.id;
    selectedFigure = CATALOGO_CERAS.find((f) => f.id === id) || null;

    if (selectedFigure) {
      input.value = selectedFigure.nombre;
      dropdown.classList.remove('candle-figure-selector__dropdown--open');
      renderFigureDetails();
      updateInputsFromFigure();
    }
  });

  return el('div', { className: 'candle-figure-selector' }, input, caret, dropdown);
}

function renderFigureDetails() {
  const detailsEl = qs('#candle-figure-details');
  if (!detailsEl) return;

  clear(detailsEl);

  if (!selectedFigure) {
    detailsEl.classList.remove('candle-figure-details--visible');
    return;
  }

  detailsEl.classList.add('candle-figure-details--visible');

  detailsEl.appendChild(
    el('div', { className: 'candle-figure-details__row' },
      el('span', null, 'Peso de cera'),
      el('span', { className: 'candle-figure-details__value' }, formatGramos(selectedFigure.peso))
    ),
    el('div', { className: 'candle-figure-details__row' },
      el('span', null, 'Costo unitario referencia'),
      el('span', { className: 'candle-figure-details__value' }, formatMXN(selectedFigure.costoUnitario))
    ),
    el('div', { className: 'candle-figure-details__row' },
      el('span', null, 'Tamaño'),
      el('span', { className: 'candle-figure-details__value' }, selectedFigure.tamano)
    )
  );
}

function updateInputsFromFigure() {
  if (!selectedFigure) return;
  const pesoInput = qs('#candle-peso-cera');
  const aromaInput = qs('#candle-peso-aroma');
  if (pesoInput) pesoInput.value = selectedFigure.peso;
  if (aromaInput) aromaInput.value = (selectedFigure.peso * 0.08).toFixed(1); // aproximación
}

function renderConfigSummary() {
  const settings = store.getState().settings;
  const v = settings.velas;

  return el('div', { className: 'candle-config-summary' },
    el('div', { className: 'candle-config-summary__title' }, 'Insumos de vela'),
    el('div', { className: 'candle-config-summary__grid' },
      el('div', { className: 'candle-config-summary__item' },
        el('span', { className: 'candle-config-summary__label' }, 'Cera'),
        el('span', { className: 'candle-config-summary__value' }, `$${v.precioCeraPorGramo.toFixed(4)}/g`)
      ),
      el('div', { className: 'candle-config-summary__item' },
        el('span', { className: 'candle-config-summary__label' }, 'Aroma'),
        el('span', { className: 'candle-config-summary__value' }, `$${v.precioAromaPorGramo.toFixed(4)}/g`)
      ),
      el('div', { className: 'candle-config-summary__item' },
        el('span', { className: 'candle-config-summary__label' }, 'Color'),
        el('span', { className: 'candle-config-summary__value' }, formatMXN(v.costoColorFijo))
      ),
    )
  );
}

function renderNumericFields() {
  const row1 = el('div', { className: 'candle-row' },
    el('div', { className: 'form-group' },
      el('label', { className: 'form-label', htmlFor: 'candle-peso-cera' }, 'Peso cera (g)'),
      el('input', {
        className: 'form-input',
        type: 'number',
        id: 'candle-peso-cera',
        min: '0',
        step: '0.1',
        placeholder: '0',
      })
    ),
    el('div', { className: 'form-group' },
      el('label', { className: 'form-label', htmlFor: 'candle-peso-aroma' }, 'Peso aroma (g)'),
      el('input', {
        className: 'form-input',
        type: 'number',
        id: 'candle-peso-aroma',
        min: '0',
        step: '0.1',
        placeholder: '0',
      })
    )
  );

  const row2 = el('div', { className: 'candle-row' },
    el('div', { className: 'form-group' },
      el('label', { className: 'form-label', htmlFor: 'candle-minutos' }, 'Minutos MO'),
      el('input', {
        className: 'form-input',
        type: 'number',
        id: 'candle-minutos',
        min: '1',
        step: '1',
        placeholder: '30',
        value: '30',
      })
    ),
    el('div', { className: 'form-group' },
      el('label', { className: 'form-label', htmlFor: 'calc-zona-vela' }, 'Zona'),
      renderZonaSelect()
    )
  );

  return el('div', null, row1, row2);
}

function renderZonaSelect() {
  const options = Object.entries(store.getState().settings.tarifasZona).map(([key, val]) =>
    el('option', { value: key }, `${key === 'pueblo' ? 'Pueblo' : 'Ciudad'} — $${val.toFixed(2)}/min`)
  );
  return el('select', { className: 'form-select', id: 'calc-zona-vela' }, ...options);
}

function renderCanalSelect() {
  const options = Object.entries(store.getState().settings.margenesCanal).map(([key, val]) => {
    const pct = Math.round(val * 100);
    const name = key === 'venta_directa' ? 'Venta directa' :
                 key === 'bazar' ? 'Bazar / evento' :
                 key === 'mayoreo_diversas' ? 'Mayoreo diversas' : 'Mayoreo 6+ iguales';
    return el('option', { value: key }, `${name} (${pct}%)`);
  });
  return el('select', { className: 'form-select', id: 'calc-canal-vela' }, ...options);
}

function renderCapasControl() {
  const minusBtn = el('button', {
    className: 'candle-capas__btn',
    type: 'button',
    id: 'candle-capas-minus',
  }, '-');

  const valueEl = el('span', { className: 'candle-capas__value', id: 'candle-capas-value' }, '1');

  const plusBtn = el('button', {
    className: 'candle-capas__btn',
    type: 'button',
    id: 'candle-capas-plus',
  }, '+');

  on(minusBtn, 'click', () => {
    const current = Number(valueEl.textContent);
    if (current > 1) {
      valueEl.textContent = String(current - 1);
    }
  });

  on(plusBtn, 'click', () => {
    const current = Number(valueEl.textContent);
    if (current < 10) {
      valueEl.textContent = String(current + 1);
    }
  });

  return el('div', { className: 'candle-capas' },
    el('div', null,
      el('span', { className: 'candle-capas__label' }, 'Capas'),
      el('span', { className: 'candle-capas__hint' }, 'Para velas funcionales multicapa')
    ),
    el('div', { className: 'candle-capas__control' }, minusBtn, valueEl, plusBtn)
  );
}

function renderToggles() {
  function makeToggle(label, hint, price, id, checked = false) {
    const info = el('div', { className: 'candle-toggle__info' },
      el('div', { className: 'candle-toggle__label' }, label),
      el('div', { className: 'candle-toggle__hint' }, hint),
    );

    const priceEl = el('span', { className: 'candle-toggle__price' }, price > 0 ? `+${formatMXN(price)}` : formatMXN(0));

    const switchEl = el('label', { className: 'switch' },
      el('input', { type: 'checkbox', id: `candle-${id}`, checked }),
      el('span', { className: 'switch__track' },
        el('span', { className: 'switch__thumb' }),
      ),
    );

    return el('div', { className: 'candle-toggle-row' }, info, priceEl, switchEl);
  }

  const settings = store.getState().settings;
  const v = settings.velas || CONFIG_VELAS;

  return el('div', null,
    makeToggle('Color', 'Tinte para la cera', v.costoColorFijo || 0.50, 'color', true),
    makeToggle('Pabilo', 'Mecha para vela', v.costoPabiloFijo || 1.00, 'pabilo', true),
    makeToggle('Decorado extra', '+5 min de trabajo', 0, 'decorado', false),
  );
}

function renderSubmitButton() {
  const btn = el('button', {
    className: 'calc-submit__btn',
    id: 'candle-submit-btn',
  }, 'Calcular precio de vela');

  const icon = iconCandle({ size: 18, stroke: 2 });
  btn.insertBefore(icon, btn.firstChild);

  return el('div', { className: 'calc-submit' }, btn);
}

function renderResultPlaceholder() {
  return el('div', { className: 'candle-result', id: 'candle-result-area' });
}

// ─── Cálculo ───

function collectParams() {
  const settings = store.getState().settings;
  const v = settings.velas || CONFIG_VELAS;

  const pesoCeraG = Number(qs('#candle-peso-cera')?.value) || 0;
  const pesoAromaG = Number(qs('#candle-peso-aroma')?.value) || 0;
  const minutos = Number(qs('#candle-minutos')?.value) || 30;
  const zonaKey = qs('#calc-zona-vela')?.value || 'pueblo';
  const canalKey = qs('#calc-canal-vela')?.value || 'bazar';
  const capas = Number(qs('#candle-capas-value')?.textContent) || 1;
  const conColor = qs('#candle-color')?.checked ?? true;
  const conPabilo = qs('#candle-pabilo')?.checked ?? true;
  const conDecorado = qs('#candle-decorado')?.checked ?? false;

  const tarifaPorMinuto = settings.tarifasZona[zonaKey] || 1.16;
  const margen = settings.margenesCanal[canalKey] || 0.45;

  const figureName = selectedFigure ? selectedFigure.nombre : 'Vela personalizada';

  return {
    pesoCeraG,
    pesoAromaG,
    minutos,
    tarifaPorMinuto,
    capas,
    conColor,
    conPabilo,
    conDecorado,
    margen,
    recargoUrgencia: 0,
    config: v,
    nombre: figureName,
    canal: canalKey,
    zona: zonaKey,
  };
}

function handleCalculate() {
  const params = collectParams();
  const resultArea = qs('#candle-result-area');
  if (!resultArea) return;

  clear(resultArea);
  resultArea.classList.remove('candle-result--visible');

  if (params.pesoCeraG <= 0) {
    resultArea.appendChild(
      el('div', { className: 'empty-state' },
        el('div', { className: 'empty-state__icon' },
          iconCandle({ size: 48, stroke: 1.5, style: { opacity: '0.4' } })
        ),
        el('p', { className: 'empty-state__text' }, 'Ingresa el peso de la cera para calcular.')
      )
    );
    resultArea.classList.add('candle-result--visible');
    return;
  }

  const result = calcularVelaCompleta(params);

  // Header
  const header = el('div', { className: 'result-card__header' },
    el('div', { className: 'result-card__piece-name' }, params.nombre),
    el('div', { className: 'result-card__meta' },
      el('span', null, formatGramos(params.pesoCeraG)),
      el('span', null, `${params.capas} capa${params.capas > 1 ? 's' : ''}`),
      el('span', null, formatMinutos(params.minutos)),
    ),
  );

  // Precio
  const canalNombre = params.canal === 'venta_directa' ? 'Venta directa' :
                      params.canal === 'bazar' ? 'Bazar / evento' :
                      params.canal === 'mayoreo_diversas' ? 'Mayoreo diversas' : 'Mayoreo 6+ iguales';

  const price = el('div', { className: 'result-card__price' },
    el('div', { className: 'result-card__price-label' }, 'Precio sugerido'),
    el('div', { className: 'result-card__price-value' }, formatMXNShort(result.precioFinal)),
    el('div', { className: 'result-card__price-channel' }, canalNombre),
    el('div', { className: 'result-card__price-ganancia' },
      `Ganancia: ${formatMXN(result.gananciaMXN)} (${formatPercent(result.gananciaPct / 100, 0)})`
    ),
  );

  // Desglose
  const breakdownToggle = el('button', {
    className: 'result-card__breakdown-toggle',
    ariaExpanded: 'false',
  },
    'Ver desglose de costos ',
    el('span', { className: 'result-card__breakdown-toggle-icon' }, iconChevronDown({ size: 14 }))
  );

  const items = [
    ['Cera', result.desglose.costoCera],
    ['Aroma', result.desglose.costoAroma],
  ];
  if (result.desglose.costoColor > 0) items.push(['Color', result.desglose.costoColor]);
  if (result.desglose.costoPabilo > 0) items.push(['Pabilo', result.desglose.costoPabilo]);
  items.push(['Costos fijos', result.desglose.costosFijos]);
  items.push(['Mano de obra', result.desglose.manoDeObra]);
  if (result.desglose.capas > 1) items.push(['Multiplicador capas', `×${result.desglose.capas}`]);

  const breakdownList = el('div', { className: 'result-card__breakdown-list' },
    ...items.map(([label, value]) =>
      el('div', { className: 'result-card__breakdown-item' },
        el('span', null, label),
        el('span', { className: 'result-card__breakdown-value' },
          typeof value === 'number' ? formatMXN(value) : value
        ),
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

  const card = el('div', { className: 'result-card' }, header, price, breakdownToggle, breakdown);

  // Acciones
  const saveBtn = el('button', { className: 'result-actions__btn result-actions__btn--save' },
    iconSave({ size: 16 }), ' Guardar'
  );
  const shareBtn = el('button', { className: 'result-actions__btn result-actions__btn--share' },
    iconShare({ size: 16 }), ' Compartir'
  );

  on(saveBtn, 'click', () => {
    addToHistory({
      tipo: 'vela',
      nombre: params.nombre,
      canal: params.canal,
      precioFinal: result.precioFinal,
      margenAplicado: params.margen,
      resultado: result,
      params,
    });
    store.setState({
      history: [{
        tipo: 'vela',
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

    saveBtn.innerHTML = '';
    saveBtn.appendChild(iconCheck({ size: 16 }));
    saveBtn.appendChild(document.createTextNode(' Guardado'));
    saveBtn.style.background = 'var(--color-salvia)';
    saveBtn.style.color = 'var(--color-blanco)';
    setTimeout(() => {
      saveBtn.innerHTML = '';
      saveBtn.appendChild(iconSave({ size: 16 }));
      saveBtn.appendChild(document.createTextNode(' Guardar'));
      saveBtn.style.background = '';
      saveBtn.style.color = '';
    }, 2000);
  });

  on(shareBtn, 'click', () => {
    const lines = [
      `*Cotización — Vela: ${params.nombre}*`,
      '',
      `• Peso cera: ${formatGramos(params.pesoCeraG)}`,
      `• Capas: ${params.capas}`,
      `• Tiempo: ${formatMinutos(params.minutos)}`,
      `• Canal: ${canalNombre}`,
      '',
      `*Precio: ${formatMXN(result.precioFinal)}*`,
      `Ganancia: ${formatMXN(result.gananciaMXN)} (${formatPercent(result.gananciaPct / 100, 0)})`,
    ];

    if (navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n')).then(() => {
        shareBtn.innerHTML = '';
        shareBtn.appendChild(iconCheck({ size: 16 }));
        shareBtn.appendChild(document.createTextNode(' Copiado'));
        setTimeout(() => {
          shareBtn.innerHTML = '';
          shareBtn.appendChild(iconShare({ size: 16 }));
          shareBtn.appendChild(document.createTextNode(' Compartir'));
        }, 2000);
      }).catch(() => {
        shareBtn.textContent = 'Error';
      });
    }
  });

  const actions = el('div', { className: 'result-actions' }, saveBtn, shareBtn);

  resultArea.appendChild(card);
  resultArea.appendChild(actions);

  requestAnimationFrame(() => {
    resultArea.classList.add('candle-result--visible');
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

// ─── Montaje ───

export function mountCandles() {
  container = document.getElementById('candles');
  if (!container) {
    console.warn('[candles-ui] No se encontró #candles en el DOM');
    return () => {};
  }

  clear(container);

  container.appendChild(el('h2', { className: 'section-title' }, 'Velas'));
  container.appendChild(el('p', { className: 'section-subtitle' }, 'Calcula el costo y precio de velas artesanales y figuras de cera.'));

  // 1. Figura de referencia
  container.appendChild(
    el('div', { className: 'candle-section' },
      el('h3', { className: 'candle-section__title' },
        iconFlame({ size: 16 }), ' Figura de referencia'
      ),
      renderFigureSelector(),
      el('div', { className: 'candle-figure-details', id: 'candle-figure-details' })
    )
  );

  // 2. Insumos actuales
  container.appendChild(
    el('div', { className: 'candle-section' },
      renderConfigSummary()
    )
  );

  // 3. Datos numéricos
  container.appendChild(
    el('div', { className: 'candle-section' },
      el('h3', { className: 'candle-section__title' },
        iconScale({ size: 16 }), ' Materiales y tiempo'
      ),
      renderNumericFields()
    )
  );

  // 4. Canal
  container.appendChild(
    el('div', { className: 'candle-section' },
      el('h3', { className: 'candle-section__title' },
        iconTag({ size: 16 }), ' Canal de venta'
      ),
      el('div', { className: 'form-group' },
        el('label', { className: 'form-label', htmlFor: 'calc-canal-vela' }, 'Canal'),
        renderCanalSelect()
      )
    )
  );

  // 5. Capas
  container.appendChild(
    el('div', { className: 'candle-section' },
      el('h3', { className: 'candle-section__title' },
        iconLayers({ size: 16 }), ' Capas'
      ),
      renderCapasControl()
    )
  );

  // 6. Toggles
  container.appendChild(
    el('div', { className: 'candle-section' },
      el('h3', { className: 'candle-section__title' },
        iconSparkles({ size: 16 }), ' Acabados'
      ),
      renderToggles()
    )
  );

  // 7. Botón calcular
  container.appendChild(renderSubmitButton());

  // 8. Área de resultados
  container.appendChild(renderResultPlaceholder());

  const submitBtn = qs('#candle-submit-btn');
  on(submitBtn, 'click', handleCalculate);

  const unsubscribe = store.subscribe(() => {
    // Re-renderizar summary de config si cambian settings
    const summary = qs('.candle-config-summary');
    if (summary) {
      summary.replaceWith(renderConfigSummary());
    }
  });

  return () => {
    unsubscribe();
    clear(container);
  };
}

// Lazy imports para evitar circular refs
function iconCheck(attrs) {
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
  path.setAttribute('d', 'M20 6 9 17l-5-5');
  el2.appendChild(path);
  return el2;
}

function iconTag(attrs) {
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
  path.setAttribute('d', 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z');
  el2.appendChild(path);
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '7');
  circle.setAttribute('cy', '7');
  circle.setAttribute('r', '1');
  circle.setAttribute('fill', 'currentColor');
  circle.setAttribute('stroke', 'none');
  el2.appendChild(circle);
  return el2;
}

function iconScale(attrs) {
  const el2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el2.setAttribute('viewBox', '0 0 24 24');
  el2.setAttribute('width', attrs.size || 20);
  el2.setAttribute('height', attrs.size || 20);
  el2.setAttribute('fill', 'none');
  el2.setAttribute('stroke', 'currentColor');
  el2.setAttribute('stroke-width', '2');
  el2.setAttribute('stroke-linecap', 'round');
  el2.setAttribute('stroke-linejoin', 'round');
  ['M12 2v20', 'M2 12h20', 'M7 7l10 10', 'M17 7 7 17'].forEach((d) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    el2.appendChild(path);
  });
  return el2;
}

function iconSparkles(attrs) {
  const el2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el2.setAttribute('viewBox', '0 0 24 24');
  el2.setAttribute('width', attrs.size || 20);
  el2.setAttribute('height', attrs.size || 20);
  el2.setAttribute('fill', 'none');
  el2.setAttribute('stroke', 'currentColor');
  el2.setAttribute('stroke-width', '2');
  el2.setAttribute('stroke-linecap', 'round');
  el2.setAttribute('stroke-linejoin', 'round');
  ['m12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5z',
   'm5 15-1 3-3 1 3 1 1 3 1-3 3-1-3-1-1-3z',
   'm19 10-1 3-3 1 3 1 1 3 1-3 3-1-3-1-1-3z'].forEach((d) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    el2.appendChild(path);
  });
  return el2;
}
