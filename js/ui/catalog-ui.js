/**
 * Gestión visual del catálogo de piezas.
 * Renderiza grilla de tarjetas, búsqueda, FAB, y modal de edición.
 * Se monta sobre #catalog en el DOM.
 */

import { store } from '../app.js';
import { COSTOS_COLOR, COSTOS_SELLADOR, COSTOS_DETALLE_FINO } from '../catalog.js';
import { formatGramos, formatMinutos, capitalize } from '../utils/format.js';
import { saveCatalog } from '../storage.js';
import { el, clear, qs, on, delegate } from './renderer.js';
import {
  iconSearch,
  iconBox,
  iconWeight,
  iconClock,
  iconEdit,
  iconTrash,
  iconWarning,
  iconPlus,
  iconClose,
} from './icons.js';

let container = null;
let searchQuery = '';

// ─── Helpers ───

function getNextId(catalog) {
  if (catalog.length === 0) return 1;
  return Math.max(...catalog.map((p) => p.id)) + 1;
}

function persistCatalog(catalog) {
  saveCatalog(catalog);
  store.setState({ catalog });
}

function filterCatalog() {
  const catalog = store.getState().catalog;
  const q = searchQuery.toLowerCase().trim();
  if (!q) return catalog;
  return catalog.filter((p) =>
    p.nombre.toLowerCase().includes(q) ||
    p.tamano.toLowerCase().includes(q)
  );
}

// ─── Renderizado ───

function renderSearchBar() {
  const input = el('input', {
    className: 'catalog-search__input',
    type: 'text',
    placeholder: 'Buscar por nombre o tamaño...',
    value: searchQuery,
  });

  const icon = el('span', { className: 'catalog-search__icon' });
  icon.appendChild(iconSearch({ size: 16 }));

  const count = el('span', { className: 'catalog-search__count', id: 'catalog-count' });

  on(input, 'input', () => {
    searchQuery = input.value;
    renderGrid();
  });

  return el('div', { className: 'catalog-search' }, icon, input, count);
}

function renderGrid() {
  const grid = qs('#catalog-grid');
  const countEl = qs('#catalog-count');
  if (!grid) return;

  clear(grid);

  const filtered = filterCatalog();

  if (countEl) {
    countEl.textContent = `${filtered.length} de ${store.getState().catalog.length} piezas`;
  }

  if (filtered.length === 0) {
    grid.appendChild(
      searchQuery
        ? el('div', { className: 'catalog-empty' },
            el('div', { className: 'catalog-empty__icon' }, iconSearch({ size: 40, stroke: 1.5 })),
            el('div', { className: 'catalog-empty__title' }, 'Sin resultados'),
            el('p', { className: 'catalog-empty__text' }, `Ninguna pieza coincide con "${searchQuery}".`),
          )
        : el('div', { className: 'catalog-empty' },
            el('div', { className: 'catalog-empty__icon' }, iconBox({ size: 40, stroke: 1.5 })),
            el('div', { className: 'catalog-empty__title' }, 'Catálogo vacío'),
            el('p', { className: 'catalog-empty__text' }, 'Agrega tu primera pieza con el botón +.'),
          )
    );
    return;
  }

  filtered.forEach((piece) => {
    const card = el('div', {
      className: 'catalog-card',
      'data-id': piece.id,
    },
      el('div', { className: 'catalog-card__body' },
        el('div', { className: 'catalog-card__header' },
          el('div', { className: 'catalog-card__name' }, piece.nombre),
          el('span', { className: `badge badge--${piece.tamano}` }, capitalize(piece.tamano)),
        ),
        el('div', { className: 'catalog-card__meta' },
          el('span', { className: 'catalog-card__stat' },
            iconWeight({ size: 14 }),
            formatGramos(piece.peso),
          ),
          el('span', { className: 'catalog-card__stat' },
            iconClock({ size: 14 }),
            formatMinutos(piece.minutos),
          ),
        ),
      ),
      el('div', { className: 'catalog-card__actions' },
        el('button', {
          className: 'catalog-card__action catalog-card__action--edit',
          'data-id': piece.id,
        }, iconEdit({ size: 14 }), ' Editar'),
        el('button', {
          className: 'catalog-card__action catalog-card__action--delete',
          'data-id': piece.id,
        }, iconTrash({ size: 14 }), ' Eliminar'),
      ),
    );

    grid.appendChild(card);
  });
}

// ─── Modal de edición / creación ───

function openModal(piece = null) {
  const existingOverlay = qs('.catalog-modal-overlay');
  if (existingOverlay) existingOverlay.remove();

  const isEditing = piece !== null;

  const title = el('h2', { className: 'catalog-modal__title' },
    isEditing ? 'Editar pieza' : 'Nueva pieza'
  );

  const closeBtn = el('button', { className: 'catalog-modal__close' }, iconClose({ size: 16 }));

  // Campos
  const nameInput = el('input', {
    className: 'form-input',
    type: 'text',
    placeholder: 'Nombre de la pieza',
    id: 'modal-name',
    value: isEditing ? piece.nombre : '',
  });

  const pesoInput = el('input', {
    className: 'form-input',
    type: 'number',
    placeholder: 'Peso en gramos',
    id: 'modal-peso',
    min: '1',
    step: '1',
    value: isEditing ? piece.peso : '',
  });

  const minutosInput = el('input', {
    className: 'form-input',
    type: 'number',
    placeholder: 'Minutos de trabajo',
    id: 'modal-minutos',
    min: '1',
    step: '1',
    value: isEditing ? piece.minutos : '',
  });

  // Selector de tamaño con radio cards visuales
  const tamanos = ['chica', 'mediana', 'grande'];
  const currentTamano = isEditing ? piece.tamano : 'chica';

  const sizeOptions = tamanos.map((t) => {
    const input = el('input', {
      type: 'radio',
      name: 'modal-tamano',
      value: t,
      id: `modal-tamano-${t}`,
    });
    if (t === currentTamano) input.checked = true;

    const label = el('label', { htmlFor: `modal-tamano-${t}` },
      capitalize(t),
      el('span', { className: 'size-select__hint' },
        `Color ${COSTOS_COLOR[t] ? `+$${COSTOS_COLOR[t].toFixed(0)}` : ''} · Sell ${COSTOS_SELLADOR[t] ? `+$${COSTOS_SELLADOR[t].toFixed(0)}` : ''}`
      ),
    );

    return el('div', { className: 'size-select__option' }, input, label);
  });

  const sizeSelect = el('div', { className: 'size-select' }, ...sizeOptions);

  // Botones
  const cancelBtn = el('button', {
    className: 'btn btn--secondary btn--full',
  }, 'Cancelar');

  const saveBtn = el('button', {
    className: 'btn btn--primary btn--full',
  }, isEditing ? 'Guardar cambios' : 'Crear pieza');

  // Construir modal
  const modal = el('div', { className: 'catalog-modal' },
    el('div', { className: 'catalog-modal__header' }, title, closeBtn),
    el('div', { className: 'catalog-modal__body' },
      el('div', { className: 'form-group' },
        el('label', { className: 'form-label' }, 'Nombre'),
        nameInput,
      ),
      el('div', { className: 'form-group' },
        el('label', { className: 'form-label' }, 'Peso (gramos)'),
        pesoInput,
      ),
      el('div', { className: 'form-group' },
        el('label', { className: 'form-label' }, 'Tiempo de trabajo (minutos)'),
        minutosInput,
      ),
      el('div', { className: 'form-group' },
        el('label', { className: 'form-label' }, 'Tamaño'),
        sizeSelect,
      ),
      el('div', { className: 'form-hint' }, 'El tamaño determina los costos de color, sellador y detalle fino.'),
    ),
    el('div', { className: 'catalog-modal__footer' }, cancelBtn, saveBtn),
  );

  const overlay = el('div', { className: 'catalog-modal-overlay' }, modal);

  // Cerrar
  function close() {
    overlay.remove();
  }

  on(closeBtn, 'click', close);
  on(cancelBtn, 'click', close);
  on(overlay, 'click', (e) => {
    if (e.target === overlay) close();
  });

  // Guardar
  on(saveBtn, 'click', () => {
    const nombre = nameInput.value.trim();
    const peso = Number(pesoInput.value);
    const minutos = Number(minutosInput.value);
    const tamano = qs('input[name="modal-tamano"]:checked')?.value || 'chica';

    if (!nombre) {
      nameInput.style.borderColor = 'var(--color-error)';
      nameInput.focus();
      return;
    }
    if (!peso || peso < 1) {
      pesoInput.style.borderColor = 'var(--color-error)';
      pesoInput.focus();
      return;
    }
    if (!minutos || minutos < 1) {
      minutosInput.style.borderColor = 'var(--color-error)';
      minutosInput.focus();
      return;
    }

    const catalog = [...store.getState().catalog];

    if (isEditing) {
      const index = catalog.findIndex((p) => p.id === piece.id);
      if (index !== -1) {
        catalog[index] = { ...catalog[index], nombre, peso, tamano, minutos };
      }
    } else {
      catalog.push({
        id: getNextId(catalog),
        nombre,
        peso,
        tamano,
        minutos,
      });
    }

    persistCatalog(catalog);
    renderGrid();
    close();
  });

  // Enfocar primer campo
  setTimeout(() => nameInput.focus(), 100);

  document.body.appendChild(overlay);
}

function openDeleteConfirm(piece) {
  const existingOverlay = qs('.catalog-modal-overlay');
  if (existingOverlay) existingOverlay.remove();

  const content = el('div', { className: 'catalog-confirm' },
    el('div', { className: 'catalog-confirm__icon', style: { color: 'var(--color-warning)' } }, iconWarning({ size: 40 })),
    el('h3', { className: 'catalog-confirm__title' }, '¿Eliminar pieza?'),
    el('p', { className: 'catalog-confirm__text' },
      `"${piece.nombre}" será eliminada permanentemente del catálogo. Esta acción no se puede deshacer.`
    ),
    el('div', { className: 'catalog-confirm__actions' },
      el('button', { className: 'btn btn--secondary', id: 'confirm-cancel' }, 'Cancelar'),
      el('button', { className: 'btn btn--danger', id: 'confirm-delete' }, 'Eliminar'),
    ),
  );

  const modal = el('div', { className: 'catalog-modal' },
    content
  );

  const overlay = el('div', { className: 'catalog-modal-overlay' }, modal);

  function close() {
    overlay.remove();
  }

  on(qs('#confirm-cancel', modal), 'click', close);
  on(overlay, 'click', (e) => {
    if (e.target === overlay) close();
  });

  on(qs('#confirm-delete', modal), 'click', () => {
    const catalog = store.getState().catalog.filter((p) => p.id !== piece.id);
    persistCatalog(catalog);
    renderGrid();
    close();
  });

  document.body.appendChild(overlay);
}

function renderFab() {
  const fab = el('button', {
    className: 'catalog-fab',
    ariaLabel: 'Agregar pieza',
    title: 'Agregar pieza',
  }, '+');

  on(fab, 'click', () => openModal(null));

  return fab;
}

// ─── Eventos delegados ───

function setupDelegation() {
  const panel = document.getElementById('catalog');
  if (!panel) return;

  delegate(panel, 'click', '.catalog-card__action--edit', (e, btn) => {
    const id = Number(btn.dataset.id);
    const piece = store.getState().catalog.find((p) => p.id === id);
    if (piece) openModal(piece);
  });

  delegate(panel, 'click', '.catalog-card__action--delete', (e, btn) => {
    const id = Number(btn.dataset.id);
    const piece = store.getState().catalog.find((p) => p.id === id);
    if (piece) openDeleteConfirm(piece);
  });
}

// ─── Montaje ───

export function mountCatalog() {
  container = document.getElementById('catalog');
  if (!container) {
    console.warn('[catalog-ui] No se encontró #catalog en el DOM');
    return () => {};
  }

  clear(container);

  container.appendChild(el('h2', { className: 'section-title' }, 'Catálogo de piezas'));
  container.appendChild(el('p', { className: 'section-subtitle' }, 'Gestiona las piezas de yeso. Agrega, edita o elimina según necesites.'));

  container.appendChild(renderSearchBar());

  const grid = el('div', { className: 'catalog-grid', id: 'catalog-grid' });
  container.appendChild(grid);

  container.appendChild(renderFab());

  setupDelegation();
  renderGrid();

  const unsubscribe = store.subscribe(() => {
    renderGrid();
  });

  return () => {
    unsubscribe();
    clear(container);
  };
}
