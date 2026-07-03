(function () {
  window.projectCoordinateToLocalMetres = function projectCoordinateToLocalMetres(coordinate, origin) {
    const metresPerDegreeLatitude = 111320;
    const metresPerDegreeLongitude = 111320 * Math.max(Math.cos((Number(origin.latitude) * Math.PI) / 180), 0.2);
    return {
      x: (Number(coordinate.longitude) - Number(origin.longitude)) * metresPerDegreeLongitude,
      y: (Number(coordinate.latitude) - Number(origin.latitude)) * metresPerDegreeLatitude,
    };
  };

  window.interpolateCoordinate = function interpolateCoordinate(startCoordinate, endCoordinate, fraction) {
    const t = Math.max(0, Math.min(1, Number(fraction) || 0));
    return {
      latitude: Number(startCoordinate.latitude) + (Number(endCoordinate.latitude) - Number(startCoordinate.latitude)) * t,
      longitude: Number(startCoordinate.longitude) + (Number(endCoordinate.longitude) - Number(startCoordinate.longitude)) * t,
    };
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function symbolSvg(symbol, color, size) {
    const fill = escapeHtml(color || '#21618c');
    const stroke = '#ffffff';
    const s = Number(size) || 18;
    const common = `fill="${fill}" stroke="${stroke}" stroke-width="2" vector-effect="non-scaling-stroke"`;
    let shape = `<circle cx="12" cy="12" r="8" ${common}/>`;
    if (symbol === 'square') shape = `<rect x="5" y="5" width="14" height="14" rx="2" ${common}/>`;
    if (symbol === 'diamond') shape = `<path d="M12 3 L21 12 L12 21 L3 12 Z" ${common}/>`;
    if (symbol === 'triangle') shape = `<path d="M12 3 L22 20 L2 20 Z" ${common}/>`;
    if (symbol === 'cross') shape = `<path d="M9 3 H15 V9 H21 V15 H15 V21 H9 V15 H3 V9 H9 Z" ${common}/>`;
    if (symbol === 'hex') shape = `<path d="M7 4 H17 L22 12 L17 20 H7 L2 12 Z" ${common}/>`;
    if (symbol === 'star') shape = `<path d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18 L6 21 L7 14 L2 9 L9 8 Z" ${common}/>`;
    if (symbol === 'pentagon') shape = `<path d="M12 3 L21 10 L17 21 H7 L3 10 Z" ${common}/>`;
    if (symbol === 'ring') shape = `<circle cx="12" cy="12" r="8" fill="none" stroke="${fill}" stroke-width="4"/>`;
    return `<svg class="amenity-symbol-svg" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${shape}</svg>`;
  }

  function readAmenityCards() {
    return Array.from(document.querySelectorAll('.amenity-card')).map((card) => {
      const name = card.querySelector('input[data-field="name"]')?.value || 'Amenity';
      const symbol = card.querySelector('select[data-field="symbol"]')?.value || 'circle';
      const color = card.querySelector('input[data-field="color"]')?.value || '#21618c';
      const visible = card.querySelector('input[data-field="visible"]')?.checked !== false;
      const showInLegend = card.querySelector('input[data-field="showInLegend"]')?.checked !== false;
      return { name, symbol, color, visible, showInLegend };
    });
  }

  function symbolForColour(colour) {
    const wanted = String(colour || '').toLowerCase();
    const match = readAmenityCards().find((item) => item.visible && item.color.toLowerCase() === wanted);
    return match?.symbol || 'circle';
  }

  window.leafletAmenityIcon = function leafletAmenityIcon(colour, symbol) {
    const resolvedSymbol = symbol || symbolForColour(colour);
    return L.divIcon({
      className: 'amenity-leaflet-icon',
      html: symbolSvg(resolvedSymbol, colour || '#21618c', 18),
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -10],
    });
  };

  window.buildLeafletLegendMarkup = function buildLeafletLegendMarkup(configuredBands) {
    const activeMode = document.querySelector('.mode-chip.active')?.textContent?.trim() || 'Walking';
    const bandRows = (configuredBands || []).map((band, index) => {
      const fill = band.fill || ['#00f7ff', '#ff0000', '#22ff00'][index % 3];
      return `<span class="legend-row"><i class="legend-band" style="background:${escapeHtml(fill)}"></i><b>${escapeHtml(band.label)}</b></span>`;
    }).join('');
    const amenities = readAmenityCards()
      .filter((item) => item.visible && item.showInLegend)
      .slice(0, 30)
      .map((item) => `<span class="legend-row legend-amenity-row"><i class="legend-symbol">${symbolSvg(item.symbol, item.color, 15)}</i><b>${escapeHtml(item.name)}</b></span>`)
      .join('');
    return `<strong>${escapeHtml(activeMode)} bands</strong>${bandRows}<span class="legend-row"><i class="legend-site-pin"></i><b>Site</b></span>${amenities ? `<strong class="legend-subhead">Amenities</strong>${amenities}` : ''}`;
  };

  function rebuildReferenceLayout() {
    const rail = document.querySelector('.control-rail');
    const toolbar = document.querySelector('.workspace-toolbar');
    const advancedPanel = document.querySelector('.advanced-panel');
    const manualPanel = document.querySelector('.manual-edit-panel');
    const editor = document.querySelector('.editor-stage');
    const outputs = document.querySelector('.outputs-stage');
    const mainStage = document.querySelector('.main-stage');
    if (!rail || !mainStage) return;

    const accessInput = document.getElementById('accessCoordinates');
    if (accessInput) {
      accessInput.value = '';
      const accessLabel = accessInput.closest('label');
      if (accessLabel) accessLabel.remove();
    }

    const projectNote = document.getElementById('projectNote');
    const projectNoteLabel = projectNote?.closest('label');
    if (projectNoteLabel) projectNoteLabel.remove();

    let actions = document.querySelector('.toolbar-block-actions');
    let mode = document.querySelector('.toolbar-block-mode');
    let exports = document.querySelector('.toolbar-block-export');
    let status = document.querySelector('.toolbar-block-status');
    if (toolbar) {
      actions = actions || toolbar.querySelector('.toolbar-block-actions');
      mode = mode || toolbar.querySelector('.toolbar-block-mode');
      exports = exports || toolbar.querySelector('.toolbar-block-export');
      status = status || toolbar.querySelector('.toolbar-block-status');
    }

    const insertAfter = (node, reference) => {
      if (!node || !reference || reference.parentElement !== rail) return;
      rail.insertBefore(node, reference.nextSibling);
    };

    if (advancedPanel && advancedPanel.parentElement === rail) {
      insertAfter(actions, advancedPanel);
      insertAfter(mode, actions || advancedPanel);
    } else {
      if (actions) rail.appendChild(actions);
      if (mode) rail.appendChild(mode);
    }

    if (editor && editor.parentElement === rail) {
      editor.querySelectorAll('.list-panel').forEach((list) => rail.appendChild(list));
    }
    if (manualPanel) rail.appendChild(manualPanel);
    if (exports) rail.appendChild(exports);
    if (outputs) outputs.remove();
    if (status) rail.appendChild(status);
    if (toolbar) toolbar.remove();

    const bottomPanels = document.querySelector('.bottom-panels');
    if (bottomPanels) bottomPanels.remove();
  }

  function patchRenderedAmenityCards() {
    document.querySelectorAll('.amenity-symbol').forEach((node) => {
      const card = node.closest('.amenity-card');
      const symbolSelect = card?.querySelector('select[data-field="symbol"]');
      const colourInput = card?.querySelector('input[data-field="color"]');
      node.innerHTML = symbolSvg(symbolSelect?.value || node.textContent || 'circle', colourInput?.value || '#21618c', 18);
    });
  }

  function tick() {
    rebuildReferenceLayout();
    patchRenderedAmenityCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tick, { once: true });
  } else {
    tick();
  }
  window.addEventListener('load', tick, { once: true });
  setInterval(patchRenderedAmenityCards, 1000);
})();
