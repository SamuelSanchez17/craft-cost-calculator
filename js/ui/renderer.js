/**
 * Micro-librería de manipulación DOM.
 * Todos los módulos UI importan estas utilidades para
 * construye las interfaces sin depender de frameworks.
 */

/**
 * Crea elemento DOM.
 * Los atributos especiales se mapean directamente:
 *   className → class, html → innerHTML, data-* → dataset, aria-* → setAttribute
 *
 * @example
 *   el('div', { className: 'card', id: 'main' },
 *     el('h3', null, 'Título'),
 *     el('p', { className: 'text-muted' }, 'Subtítulo'),
 *   )
 */
export function el(tag, attrs, ...children) {
  const element = document.createElement(tag);

  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'html') {
        element.innerHTML = value;
      } else if (key.startsWith('data-')) {
        element.setAttribute(key, value);
      } else if (key.startsWith('aria-')) {
        const ariaKey = key.replace('aria-', 'aria-');
        element.setAttribute(ariaKey, value);
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        const event = key.slice(2).toLowerCase();
        element.addEventListener(event, value);
      } else {
        element.setAttribute(key, value);
      }
    }
  }

  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    element.appendChild(
      typeof child === 'string' || typeof child === 'number'
        ? document.createTextNode(String(child))
        : child
    );
  }

  return element;
}

/** Elimina todos los hijos de un elemento. */
export function clear(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/** Establece innerHTML de forma directa. Usar con datos confiables. */
export function html(element, markup) {
  element.innerHTML = markup;
}

/**
 * Muestra un panel (section.panel) ocultando los demás.
 * @param {string} panelId — id del section a mostrar (sin #)
 */
export function showPanel(panelId) {
  const panels = document.querySelectorAll('.panel');
  panels.forEach((p) => {
    if (p.id === panelId) {
      p.setAttribute('data-active', '');
    } else {
      p.removeAttribute('data-active');
    }
  });
}

/** Versión simplificada: muestra/oculta un panel individual. */
export function togglePanel(panelId, visible) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  if (visible) {
    panel.setAttribute('data-active', '');
  } else {
    panel.removeAttribute('data-active');
  }
}

/** querySelector acortado, con scope opcional. */
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

/** querySelectorAll acortado, retorna array real. */
export function qsAll(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/**
 * Adjunta un event listener con tipado débil.
 * Retorna función para removerlo.
 */
export function on(element, event, handler, options) {
  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
}

/** Dispara un evento custom en un elemento. */
export function emit(element, name, detail = {}) {
  element.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
}

/** Delegación de eventos: escucha en el ancestro y filtra por selector. */
export function delegate(parent, event, selector, handler) {
  parent.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target && parent.contains(target)) {
      handler.call(target, e, target);
    }
  });
}

/** Inserta un fragmento de template string como HTML y retorna el primer hijo. */
export function fragment(markup) {
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  return template.content;
}

/** Alterna una clase CSS en un elemento. */
export function toggleClass(element, className, force) {
  element.classList.toggle(className, force);
}
