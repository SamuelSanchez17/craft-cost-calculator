// ────────────────────────────────────────────
// Sistema de iconos SVG inline
// Reemplaza emojis por iconos vectoriales profesionales.
// Todos los iconos usan currentColor para heredar el color del padre.
// ────────────────────────────────────────────

const DEFAULT_SIZE = 20;
const DEFAULT_STROKE = 1.75;

function svg(viewBox, paths, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.setAttribute('viewBox', viewBox);
  el.setAttribute('width', attrs.size || DEFAULT_SIZE);
  el.setAttribute('height', attrs.size || DEFAULT_SIZE);
  el.setAttribute('fill', 'none');
  el.setAttribute('stroke', 'currentColor');
  el.setAttribute('stroke-width', attrs.stroke || DEFAULT_STROKE);
  el.setAttribute('stroke-linecap', 'round');
  el.setAttribute('stroke-linejoin', 'round');
  if (attrs.className) el.setAttribute('class', attrs.className);
  if (attrs.style) Object.assign(el.style, attrs.style);

  // A veces necesitamos fill en vez de stroke
  if (attrs.fill) {
    el.setAttribute('fill', attrs.fill);
    el.setAttribute('stroke', 'none');
  }

  paths.forEach((d) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    el.appendChild(path);
  });

  return el;
}

// ─── Navegación & App ───

export function iconCalc(attrs = {}) {
  return svg('0 0 24 24', [
    'M4 4h16v16H4z',
    'M8 8h8',
    'M8 12h8',
    'M8 16h5',
  ], attrs);
}

export function iconBox(attrs = {}) {
  return svg('0 0 24 24', [
    'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z',
    'M3.27 6.96 12 12.01l8.73-5.05',
    'M12 22.08V12',
  ], attrs);
}

export function iconBouquet(attrs = {}) {
  return svg('0 0 24 24', [
    'M12 7.5a4.5 4.5 0 1 1 4.5-4.5 4.5 4.5 0 0 1-4.5 4.5',
    'M12 7.5V22',
    'M8 22h8',
    'M7.5 11.5a4.5 4.5 0 1 1-4.5-4.5 4.5 4.5 0 0 1 4.5 4.5',
    'M16.5 11.5a4.5 4.5 0 1 1 4.5-4.5 4.5 4.5 0 0 1-4.5 4.5',
  ], attrs);
}

export function iconCandle(attrs = {}) {
  return svg('0 0 24 24', [
    'M12 2c0 0-3 2-3 4a3 3 0 0 0 6 0c0-2-3-4-3-4Z',
    'M9 10h6v12H9z',
    'M8 22h8',
  ], attrs);
}

export function iconHistory(attrs = {}) {
  return svg('0 0 24 24', [
    'M3 3v5h5',
    'M3.05 13A9 9 0 1 0 6 5.3L3 8',
    'M12 7v5l4 2',
  ], attrs);
}

export function iconSettings(attrs = {}) {
  return svg('0 0 24 24', [
    'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1.27 1.91l-.07.03a2 2 0 0 1-2.28-.43l-.13-.13a2 2 0 0 0-2.83 0l-.31.31a2 2 0 0 0 0 2.83l.13.13a2 2 0 0 1 .43 2.28l-.03.07a2 2 0 0 1-1.91 1.27H3.8a2 2 0 0 0-2 2v.44a2 2 0 0 0 2 2h.18a2 2 0 0 1 1.91 1.27l.03.07a2 2 0 0 1-.43 2.28l-.13.13a2 2 0 0 0 0 2.83l.31.31a2 2 0 0 0 2.83 0l.13-.13a2 2 0 0 1 2.28-.43l.07.03a2 2 0 0 1 1.27 1.91v.18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1.27-1.91l.07-.03a2 2 0 0 1 2.28.43l.13.13a2 2 0 0 0 2.83 0l.31-.31a2 2 0 0 0 0-2.83l-.13-.13a2 2 0 0 1-.43-2.28l.03-.07a2 2 0 0 1 1.91-1.27h.18a2 2 0 0 0 2-2v-.44a2 2 0 0 0-2-2h-.18a2 2 0 0 1-1.91-1.27l-.03-.07a2 2 0 0 1 .43-2.28l.13-.13a2 2 0 0 0 0-2.83l-.31-.31a2 2 0 0 0-2.83 0l-.13.13a2 2 0 0 1-2.28.43l-.07-.03a2 2 0 0 1-1.27-1.91V4a2 2 0 0 0-2-2z',
    'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  ], attrs);
}

export function iconSun(attrs = {}) {
  return svg('0 0 24 24', [
    'M12 4V2',
    'M12 20v2',
    'M4.93 4.93l1.41 1.41',
    'M17.66 17.66l1.41 1.41',
    'M2 12h2',
    'M20 12h2',
    'M6.34 17.66l-1.41 1.41',
    'M19.07 4.93l-1.41 1.41',
    'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
  ], attrs);
}

export function iconMoon(attrs = {}) {
  return svg('0 0 24 24', [
    'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z',
  ], attrs);
}

// ─── Acciones ───

export function iconSearch(attrs = {}) {
  return svg('0 0 24 24', [
    'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z',
    'm21 21-4.35-4.35',
  ], attrs);
}

export function iconPlus(attrs = {}) {
  return svg('0 0 24 24', [
    'M12 5v14',
    'M5 12h14',
  ], attrs);
}

export function iconEdit(attrs = {}) {
  return svg('0 0 24 24', [
    'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7',
    'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  ], attrs);
}

export function iconTrash(attrs = {}) {
  return svg('0 0 24 24', [
    'M3 6h18',
    'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    'M10 11v6',
    'M14 11v6',
  ], attrs);
}

export function iconClose(attrs = {}) {
  return svg('0 0 24 24', [
    'M18 6 6 18',
    'M6 6l12 12',
  ], attrs);
}

export function iconSave(attrs = {}) {
  return svg('0 0 24 24', [
    'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z',
    'M17 21v-8H7v8',
    'M7 3v5h8',
  ], attrs);
}

export function iconShare(attrs = {}) {
  return svg('0 0 24 24', [
    'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8',
    'm16 6-4-4-4 4',
    'M12 2v14',
  ], attrs);
}

export function iconClipboard(attrs = {}) {
  return svg('0 0 24 24', [
    'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
    'M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z',
  ], attrs);
}

export function iconCheck(attrs = {}) {
  return svg('0 0 24 24', [
    'M20 6 9 17l-5-5',
  ], attrs);
}

export function iconWarning(attrs = {}) {
  return svg('0 0 24 24', [
    'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
    'M12 9v4',
    'M12 17h.01',
  ], attrs);
}

// ─── Piezas & Métricas ───

export function iconWeight(attrs = {}) {
  return svg('0 0 24 24', [
    'M12 2a3 3 0 0 0-3 3v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3V5a3 3 0 0 0-3-3z',
    'M9 13h6',
  ], attrs);
}

export function iconClock(attrs = {}) {
  return svg('0 0 24 24', [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'M12 6v6l4 2',
  ], attrs);
}

export function iconTag(attrs = {}) {
  return svg('0 0 24 24', [
    'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z',
    'M7 7h.01',
  ], attrs);
}

export function iconFlame(attrs = {}) {
  return svg('0 0 24 24', [
    'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.057 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.25.5-2.4 1.5-3.5a5.23 5.23 0 0 1 2.5-2 3.49 3.49 0 0 0 1.5-2.5Z',
  ], attrs);
}

export function iconLayers(attrs = {}) {
  return svg('0 0 24 24', [
    'M12 2 2 7l10 5 10-5-10-5z',
    'M2 17l10 5 10-5',
    'M2 12l10 5 10-5',
  ], attrs);
}

export function iconDroplet(attrs = {}) {
  return svg('0 0 24 24', [
    'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
  ], attrs);
}

export function iconDollar(attrs = {}) {
  return svg('0 0 24 24', [
    'M12 2v20',
    'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  ], attrs);
}

export function iconPercent(attrs = {}) {
  return svg('0 0 24 24', [
    'M19 5 5 19',
    'M7.5 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    'M16.5 21.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  ], attrs);
}

export function iconRefresh(attrs = {}) {
  return svg('0 0 24 24', [
    'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8',
    'M21 3v5h-5',
    'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16',
    'M3 21v-5h5',
  ], attrs);
}

export function iconArrowRight(attrs = {}) {
  return svg('0 0 24 24', [
    'M5 12h14',
    'M12 5l7 7-7 7',
  ], attrs);
}

export function iconChevronDown(attrs = {}) {
  return svg('0 0 24 24', [
    'm6 9 6 6 6-6',
  ], attrs);
}

export function iconTrendingUp(attrs = {}) {
  return svg('0 0 24 24', [
    'M23 6l-9.5 9.5-5-5L1 18',
    'M17 6h6v6',
  ], attrs);
}

export function iconSliders(attrs = {}) {
  return svg('0 0 24 24', [
    'M4 21v-7',
    'M4 10V3',
    'M12 21v-9',
    'M12 8V3',
    'M20 21v-5',
    'M20 12V3',
    'M1 14h6',
    'M9 8h6',
    'M17 16h6',
  ], attrs);
}

export function iconInfo(attrs = {}) {
  return svg('0 0 24 24', [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'M12 16v-4',
    'M12 8h.01',
  ], attrs);
}

export function iconPalette(attrs = {}) {
  return svg('0 0 24 24', [
    'M12 22a1 1 0 0 1 0-20 10 10 0 0 1 0 20z',
    'M15 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    'M9 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    'M6 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    'M18 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  ], attrs);
}

export function iconShield(attrs = {}) {
  return svg('0 0 24 24', [
    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  ], attrs);
}

export function iconZap(attrs = {}) {
  return svg('0 0 24 24', [
    'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  ], attrs);
}

export function iconUser(attrs = {}) {
  return svg('0 0 24 24', [
    'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
    'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  ], attrs);
}

export function iconMapPin(attrs = {}) {
  return svg('0 0 24 24', [
    'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z',
    'M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  ], attrs);
}

export function iconGrid(attrs = {}) {
  return svg('0 0 24 24', [
    'M3 3h7v7H3z',
    'M14 3h7v7h-7z',
    'M14 14h7v7h-7z',
    'M3 14h7v7H3z',
  ], attrs);
}

export function iconList(attrs = {}) {
  return svg('0 0 24 24', [
    'M8 6h13',
    'M8 12h13',
    'M8 18h13',
    'M3 6h.01',
    'M3 12h.01',
    'M3 18h.01',
  ], attrs);
}

export function iconPackage(attrs = {}) {
  return svg('0 0 24 24', [
    'm7.5 4.27 9 5.15',
    'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z',
    'M3.27 6.96 12 12.01l8.73-5.05',
    'M12 22.08V12',
  ], attrs);
}

export function iconScale(attrs = {}) {
  return svg('0 0 24 24', [
    'M12 2v20',
    'M2 12h20',
    'M7 7l10 10',
    'M17 7 7 17',
  ], attrs);
}

export function iconThermometer(attrs = {}) {
  return svg('0 0 24 24', [
    'M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z',
    'M10 9.5h4',
  ], attrs);
}

export function iconRuler(attrs = {}) {
  return svg('0 0 24 24', [
    'M16 2l6 6-14 14-6-6 14-14z',
    'M7 17l-3-3',
    'M11 13l-2-2',
    'M15 9l-1-1',
  ], attrs);
}

export function iconSparkles(attrs = {}) {
  return svg('0 0 24 24', [
    'm12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5z',
    'm5 15-1 3-3 1 3 1 1 3 1-3 3-1-3-1-1-3z',
    'm19 10-1 3-3 1 3 1 1 3 1-3 3-1-3-1-1-3z',
  ], attrs);
}

export function iconHeart(attrs = {}) {
  return svg('0 0 24 24', [
    'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  ], attrs);
}

export function iconFileText(attrs = {}) {
  return svg('0 0 24 24', [
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    'M14 2v6h6',
    'M16 13H8',
    'M16 17H8',
    'M10 9H8',
  ], attrs);
}

export function iconDownload(attrs = {}) {
  return svg('0 0 24 24', [
    'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
    'M7 10l5 5 5-5',
    'M12 15V3',
  ], attrs);
}
