(() => {
  const $ = (id) => document.getElementById(id);
  const setValue = (id, value) => {
    const element = $(id);
    if (element && element.value !== value) {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };
  const patchGlobals = () => {
    try {
      if (Array.isArray(CATEGORY_OPTIONS)) {
        const employmentIndex = CATEGORY_OPTIONS.indexOf('Employment');
        if (employmentIndex >= 0) CATEGORY_OPTIONS[employmentIndex] = 'Employment Areas';
        if (!CATEGORY_OPTIONS.includes('Employment Areas')) CATEGORY_OPTIONS.push('Employment Areas');
      }
      if (typeof CATEGORY_SYMBOLS === 'object' && CATEGORY_SYMBOLS) {
        CATEGORY_SYMBOLS['Employment Areas'] = 'square';
        delete CATEGORY_SYMBOLS.Employment;
      }
      if (typeof MODE_CONFIG === 'object' && MODE_CONFIG) {
        MODE_CONFIG.walking.extent = 'Local destinations focus';
        MODE_CONFIG.walking.bands = [
          { label: '800 m preferred walking catchment', distance: 0.8, fill: '#1f6fbf' },
          { label: '1,600 m walking catchment', distance: 1.6, fill: '#36a2a8' },
          { label: '2,000 m walking catchment', distance: 2.0, fill: '#f59f00' },
        ];
        MODE_CONFIG.cycling.bands = [
          { label: '5 km cycling catchment', distance: 5.0, fill: '#6f42c1' },
          { label: '8 km cycling catchment', distance: 8.0, fill: '#d63384' },
        ];
      }
      if (typeof elements === 'object' && elements) {
        elements.isochroneDisplayMode = $('isochroneDisplayMode');
        elements.isochroneOpacity = $('isochroneOpacity');
        elements.exportGeojsonButton = $('exportGeojsonButton');
      }
      window.getSelectedBandColoursForMode = (mode) => mode === 'cycling'
        ? [($('cyclingColor1')?.value || '#6f42c1'), ($('cyclingColor2')?.value || '#d63384')]
        : [($('walkingColor1')?.value || '#1f6fbf'), ($('walkingColor2')?.value || '#36a2a8'), '#f59f00'];
      window.parseConfiguredBandEntry = (entry, mode, fallbackBand) => {
        const text = String(entry || '').trim();
        const numeric = Number(text.replace(/[^0-9.]/g, ''));
        if (!Number.isFinite(numeric) || numeric <= 0) return null;
        const isKm = /km/i.test(text);
        const distance = isKm ? numeric : numeric / 1000;
        const label = /catchment/i.test(text) ? text : `${numeric.toLocaleString('en-GB')} ${isKm ? 'km' : 'm'} ${mode === 'cycling' ? 'cycling catchment' : 'walking catchment'}`;
        return { ...fallbackBand, label, distance };
      };
      window.getConfiguredBandsForMode = (mode) => {
        const config = MODE_CONFIG?.[mode] || MODE_CONFIG?.walking;
        const raw = String(mode === 'cycling' ? $('cyclingBands')?.value : $('walkingBands')?.value || '').split(',').map((item) => item.trim()).filter(Boolean);
        const colours = window.getSelectedBandColoursForMode(mode);
        const fallbackBands = config?.bands || [];
        const parsed = raw.map((entry, index) => {
          const fallback = fallbackBands[index] || fallbackBands[fallbackBands.length - 1] || {};
          return window.parseConfiguredBandEntry(entry, mode, { ...fallback, fill: colours[index % colours.length] || fallback.fill });
        }).filter(Boolean).sort((a, b) => Number(b.distance) - Number(a.distance));
        return parsed.length ? parsed : fallbackBands;
      };
    } catch (error) {
      console.warn('Active travel override setup issue', error);
    }
  };
  const patchLeaflet = () => {
    if (!window.L || L.__activeTravelDisplayPatch) return;
    L.__activeTravelDisplayPatch = true;
    const originalPolygon = L.polygon;
    L.polygon = function patchedPolygon(latlngs, options = {}) {
      if (options && Number(options.fillOpacity) === 0.32 && Number(options.weight) === 2) {
        const outlineOnly = $('isochroneDisplayMode')?.value === 'outline';
        const opacity = Number($('isochroneOpacity')?.value || 0.32);
        options = { ...options, fillOpacity: outlineOnly ? 0 : opacity, weight: outlineOnly ? 4 : 2 };
      }
      return originalPolygon.call(this, latlngs, options);
    };
  };
  const exportGeojson = () => {
    try {
      const features = [];
      const add = (geometry, properties) => geometry && features.push({ type: 'Feature', geometry, properties });
      (state?.isochrones || []).forEach((isochrone, index) => add(isochrone.geometry, {
        featureType: 'active_travel_catchment', mode: state.selectedMode, label: isochrone.label || isochrone.properties?.label || `Catchment ${index + 1}`,
        distanceMetres: Number(isochrone.contour ?? isochrone.properties?.contour ?? 0), colour: isochrone.color || '', displayMode: $('isochroneDisplayMode')?.value || 'fill', opacity: Number($('isochroneOpacity')?.value || 0.32),
      }));
      const site = state?.generatedScenario?.siteCoordinates;
      if (site) add({ type: 'Point', coordinates: [site.longitude, site.latitude] }, { featureType: 'site_marker', name: 'Site marker' });
      (state?.amenities || []).filter((item) => item.visible !== false).forEach((item) => add({ type: 'Point', coordinates: [item.longitude, item.latitude] }, { featureType: 'amenity', name: item.name, category: item.category === 'Employment' ? 'Employment Areas' : item.category, symbol: item.symbol, colour: item.color }));
      const blob = new Blob([JSON.stringify({ type: 'FeatureCollection', features }, null, 2)], { type: 'application/geo+json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `active-travel-${state?.selectedMode || 'isochrone'}.geojson`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    } catch (error) {
      console.error('GeoJSON export failed', error);
    }
  };
  const applyDom = () => {
    document.title = 'Walking and Cycling Isochrone';
    setValue('walkingBands', '800 m, 1,600 m, 2,000 m');
    setValue('cyclingBands', '5 km, 8 km');
    const category = $('manualPointCategory');
    if (category && !Array.from(category.options).some((option) => option.value === 'Employment Areas')) category.add(new Option('Employment Areas', 'Employment Areas'));
    if (category && category.value === 'Employment') category.value = 'Employment Areas';
    document.querySelectorAll('option').forEach((option) => { if (option.textContent === 'Employment') { option.textContent = 'Employment Areas'; option.value = 'Employment Areas'; } });
    const button = $('exportGeojsonButton');
    if (button && !button.__activeTravelExportBound) { button.__activeTravelExportBound = true; button.addEventListener('click', exportGeojson); }
    try { (state?.amenities || []).forEach((item) => { if (item.category === 'Employment') item.category = 'Employment Areas'; }); } catch {}
  };
  const run = () => { patchGlobals(); patchLeaflet(); applyDom(); try { if (typeof render === 'function') render(); } catch {} };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true }); else run();
  window.addEventListener('load', run, { once: true });
  setInterval(run, 1500);
})();
