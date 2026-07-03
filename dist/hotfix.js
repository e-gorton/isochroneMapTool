(() => {
  const addPolish = () => {
    if (!document.querySelector('link[href="polish.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'polish.css';
      document.head.appendChild(link);
    }
  };
  addPolish();

  window.projectCoordinateToLocalMetres = (coordinate, origin) => {
    const lat = 111320;
    const lon = 111320 * Math.max(Math.cos((Number(origin.latitude) * Math.PI) / 180), 0.2);
    return { x: (Number(coordinate.longitude) - Number(origin.longitude)) * lon, y: (Number(coordinate.latitude) - Number(origin.latitude)) * lat };
  };
  window.interpolateCoordinate = (a, b, fraction) => {
    const t = Math.max(0, Math.min(1, Number(fraction) || 0));
    return { latitude: Number(a.latitude) + (Number(b.latitude) - Number(a.latitude)) * t, longitude: Number(a.longitude) + (Number(b.longitude) - Number(a.longitude)) * t };
  };
  window.dedupeCoordinates = (coordinates, precision = 6) => {
    const seen = new Set();
    const output = [];
    (coordinates || []).forEach((coordinate) => {
      const latitude = Number(coordinate?.latitude);
      const longitude = Number(coordinate?.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      const key = `${latitude.toFixed(precision)},${longitude.toFixed(precision)}`;
      if (seen.has(key)) return;
      seen.add(key);
      output.push({ ...coordinate, latitude, longitude });
    });
    return output;
  };

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const symbolSvg = (symbol = 'circle', color = '#21618c', size = 18) => {
    const fill = esc(color); const common = `fill="${fill}" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"`;
    const shapes = {
      square: `<rect x="5" y="5" width="14" height="14" rx="2" ${common}/>`, diamond: `<path d="M12 3 L21 12 L12 21 L3 12 Z" ${common}/>`, triangle: `<path d="M12 3 L22 20 L2 20 Z" ${common}/>`, cross: `<path d="M9 3 H15 V9 H21 V15 H15 V21 H9 V15 H3 V9 H9 Z" ${common}/>`, hex: `<path d="M7 4 H17 L22 12 L17 20 H7 L2 12 Z" ${common}/>`, star: `<path d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18 L6 21 L7 14 L2 9 L9 8 Z" ${common}/>`, pentagon: `<path d="M12 3 L21 10 L17 21 H7 L3 10 Z" ${common}/>`, ring: `<circle cx="12" cy="12" r="8" fill="none" stroke="${fill}" stroke-width="4"/>`
    };
    return `<svg class="amenity-symbol-svg" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${shapes[symbol] || `<circle cx="12" cy="12" r="8" ${common}/>`}</svg>`;
  };
  const amenityCards = () => Array.from(document.querySelectorAll('.amenity-card')).map((card) => ({
    name: card.querySelector('input[data-field="name"]')?.value || 'Amenity', symbol: card.querySelector('select[data-field="symbol"]')?.value || 'circle', color: card.querySelector('input[data-field="color"]')?.value || '#21618c', visible: card.querySelector('input[data-field="visible"]')?.checked !== false, showInLegend: card.querySelector('input[data-field="showInLegend"]')?.checked !== false
  }));
  const symbolForColour = (colour) => amenityCards().find((item) => item.visible && item.color.toLowerCase() === String(colour || '').toLowerCase())?.symbol || 'circle';

  window.leafletAmenityIcon = (colour, symbol) => L.divIcon({ className: 'amenity-leaflet-icon', html: symbolSvg(symbol || symbolForColour(colour), colour || '#21618c', 18), iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -10] });
  window.buildLeafletLegendMarkup = (bands = []) => {
    const mode = document.querySelector('.mode-chip.active')?.textContent?.trim() || 'Walking';
    const bandRows = bands.map((band, i) => `<span class="legend-row"><i class="legend-band" style="background:${esc(band.fill || ['#00f7ff', '#ff0000', '#22ff00'][i % 3])}"></i><b>${esc(band.label)}</b></span>`).join('');
    const amenities = amenityCards().filter((item) => item.visible && item.showInLegend).slice(0, 30).map((item) => `<span class="legend-row legend-amenity-row"><i class="legend-symbol">${symbolSvg(item.symbol, item.color, 15)}</i><b>${esc(item.name)}</b></span>`).join('');
    return `<strong>${esc(mode)} bands</strong>${bandRows}<span class="legend-row"><i class="legend-site-pin"></i><b>Site</b></span>${amenities ? `<strong class="legend-subhead">Amenities</strong>${amenities}` : ''}`;
  };

  const rebuild = () => {
    addPolish();
    const rail = document.querySelector('.control-rail'); const main = document.querySelector('.main-stage'); if (!rail || !main) return;
    const access = document.getElementById('accessCoordinates'); if (access) { access.value = ''; access.closest('label')?.remove(); }
    document.getElementById('projectNote')?.closest('label')?.remove();
    const toolbar = document.querySelector('.workspace-toolbar'); const advanced = document.querySelector('.advanced-panel'); const manual = document.querySelector('.manual-edit-panel'); const outputs = document.querySelector('.outputs-stage');
    const actions = document.querySelector('.toolbar-block-actions') || toolbar?.querySelector('.toolbar-block-actions'); const mode = document.querySelector('.toolbar-block-mode') || toolbar?.querySelector('.toolbar-block-mode'); const exports = document.querySelector('.toolbar-block-export') || toolbar?.querySelector('.toolbar-block-export'); const status = document.querySelector('.toolbar-block-status') || toolbar?.querySelector('.toolbar-block-status');
    const after = (node, ref) => node && ref?.parentElement === rail && rail.insertBefore(node, ref.nextSibling);
    if (advanced?.parentElement === rail) { after(actions, advanced); after(mode, actions || advanced); } else { if (actions) rail.appendChild(actions); if (mode) rail.appendChild(mode); }
    document.querySelectorAll('.list-panel').forEach((list) => rail.appendChild(list));
    if (manual) rail.appendChild(manual); if (exports) rail.appendChild(exports); outputs?.remove(); if (status) rail.appendChild(status); toolbar?.remove(); document.querySelector('.bottom-panels')?.remove();
    document.querySelectorAll('.amenity-symbol').forEach((node) => { const card = node.closest('.amenity-card'); node.innerHTML = symbolSvg(card?.querySelector('select[data-field="symbol"]')?.value || 'circle', card?.querySelector('input[data-field="color"]')?.value || '#21618c', 18); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rebuild, { once: true }); else rebuild();
  window.addEventListener('load', rebuild, { once: true }); setInterval(rebuild, 1200);
})();
