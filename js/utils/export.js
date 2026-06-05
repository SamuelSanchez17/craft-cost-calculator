// ────────────────────────────────────────────
// Utilidades de exportación
// Texto para WhatsApp · CSV descargable ·
// Copiado al portapapeles con fallback
// ────────────────────────────────────────────

import { formatMXN, formatMXNShort, formatDate } from './format.js';

/**
 * Genera texto formateado para copiar/pegar en WhatsApp.
 * Usa tipografía monoespaciada con backticks para tabla
 * y negritas/cursiva para estructura limpia.
 *
 * @param {Array<{nombre: string, cantidad: number, precioUnitario: number, subtotal: number}>} items
 * @param {Object} [opts]
 * @param {string} [opts.titulo='Cotización']
 * @param {string} [opts.negocio='Yeso Artesanal']
 * @param {boolean} [opts.conAgradecimiento=true]
 * @returns {string}
 */
export function generateQuoteText(items, opts = {}) {
  const {
    titulo = 'Cotizacion',
    negocio = 'Yeso Artesanal',
    conAgradecimiento = true,
  } = opts;

  const fecha = formatDate(new Date().toISOString());
  const total = items.reduce((acc, i) => acc + i.subtotal, 0);
  const COL = 20;

  const lines = [
    `*${titulo} — ${negocio}*`,
    `_${fecha}_`,
    '',
  ];

  if (items.length === 0) {
    lines.push('_(sin articulos)_');
  } else {
    for (const item of items) {
      const name = item.nombre.length > COL
        ? item.nombre.slice(0, COL - 2) + '..'
        : item.nombre.padEnd(COL, ' ');
      const qty = String(item.cantidad).padStart(3, ' ');
      const unit = formatMXN(item.precioUnitario).padStart(9, ' ');
      const sub = formatMXN(item.subtotal).padStart(9, ' ');
      lines.push('`' + name + ' x' + qty + ' ' + unit + ' = ' + sub + '`');
    }

    lines.push('');
    lines.push(`*TOTAL: ${formatMXN(total)}*`);
  }

  if (conAgradecimiento) {
    lines.push('');
    lines.push('_Gracias por tu preferencia_');
  }

  return lines.join('\n');
}

/**
 * Texto plano sin formato (ideal para compartir vía SMS, email, o apps
 * que no soportan markdown de WhatsApp).
 */
export function generatePlainText(items, opts = {}) {
  const {
    titulo = 'COTIZACION',
    negocio = 'Yeso Artesanal',
    conAgradecimiento = true,
  } = opts;

  const fecha = formatDate(new Date().toISOString());
  const total = items.reduce((acc, i) => acc + i.subtotal, 0);
  const COL = 24;
  const SEP = '-'.repeat(46);

  const lines = [
    `${titulo} — ${negocio}`,
    `Fecha: ${fecha}`,
    SEP,
  ];

  if (items.length === 0) {
    lines.push('(sin articulos)');
  } else {
    for (const item of items) {
      const name = item.nombre.length > COL
        ? item.nombre.slice(0, COL - 2) + '..'
        : item.nombre;
      lines.push(
        name.padEnd(COL + 2, ' ') +
        'x' + String(item.cantidad).padStart(2, ' ') +
        '  ' + formatMXN(item.precioUnitario).padStart(9, ' ')
      );
    }
  }

  lines.push(SEP);
  lines.push(`TOTAL: ${formatMXN(total).padStart(36)}`);

  if (conAgradecimiento) {
    lines.push('');
    lines.push('Gracias por tu preferencia.');
  }

  return lines.join('\n');
}

/**
 * Genera un string CSV a partir del historial de cálculos.
 * Usa punto y coma como delimitador (estándar en Excel MX).
 *
 * @param {Array<Object>} history — array de entradas de historial
 * @returns {string} contenido CSV (UTF-8 BOM incluido)
 */
export function generateCSV(history) {
  if (!history || history.length === 0) {
    return '\uFEFFFecha;Tipo;Articulo;Canal;Costo base;Precio final;Ganancia\n';
  }

  const BOM = '\uFEFF';
  const headers = [
    'Fecha',
    'Tipo',
    'Articulo',
    'Canal',
    'Costo base',
    'Precio final',
    'Ganancia',
  ];

  const rows = history.map((entry) => {
    const fecha = entry.fecha ? new Date(entry.fecha).toLocaleDateString('es-MX') : '';
    const tipo = entry.tipo || '';
    const nombre = escapeCSV(entry.nombre || '');
    const canal = entry.canal || '';
    const costoBase = entry.costoBase ?? entry.resultado?.costoBase ?? '';
    const precioFinal = entry.precioFinal ?? '';
    const ganancia = entry.gananciaMXN ?? entry.resultado?.gananciaMXN ?? '';

    return [fecha, tipo, nombre, canal, costoBase, precioFinal, ganancia].join(';');
  });

  return BOM + headers.join(';') + '\n' + rows.join('\n') + '\n';
}

function escapeCSV(value) {
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Dispara descarga de un archivo en el navegador.
 *
 * @param {string} content — contenido del archivo
 * @param {string} filename — nombre del archivo (incluir extensión)
 * @param {string} [mimeType='text/csv;charset=utf-8']
 */
export function downloadFile(content, filename, mimeType = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = filename;
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Atajo: genera y descarga CSV del historial.
 *
 * @param {Array<Object>} history
 * @param {string} [filename='historial_precios.csv']
 */
export function downloadHistoryCSV(history, filename = 'historial_precios.csv') {
  const csv = generateCSV(history);
  downloadFile(csv, filename);
}

/**
 * Copia texto al portapapeles con fallback para navegadores antiguos.
 *
 * @param {string} text
 * @returns {Promise<boolean>} true si se copió exitosamente
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback
    }
  }

  // Fallback: textarea temporal
  return new Promise((resolve) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const ok = document.execCommand('copy');
      resolve(ok);
    } catch {
      resolve(false);
    } finally {
      document.body.removeChild(textarea);
    }
  });
}

/**
 * Abre WhatsApp Web con mensaje pre-cargado.
 *
 * @param {string} text — mensaje a enviar
 * @param {string} [phone=''] — número de teléfono (opcional, vacío = elegir contacto)
 */
export function shareToWhatsApp(text, phone = '') {
  const url = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener');
}

/**
 * Usa la Web Share API nativa (funciona en Android/Chrome/Safari).
 * Fallback: intenta copiar al portapapeles.
 *
 * @param {Object} data
 * @param {string} data.title
 * @param {string} data.text
 * @param {string} [data.url]
 * @returns {Promise<'share'|'clipboard'|'failed'>}
 */
export async function shareNative({ title, text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'share';
    } catch {
      // usuario canceló o no soportado
    }
  }

  const fullText = [title, '', text, url ? `\n${url}` : ''].filter(Boolean).join('\n');
  const ok = await copyToClipboard(fullText);
  return ok ? 'clipboard' : 'failed';
}
