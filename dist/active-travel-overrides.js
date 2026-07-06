(() => {
  const $ = (id) => document.getElementById(id);
  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const distanceMetres = (a, b) => {
    if (!a || !b) return Infinity;
    const r = 6371000;
    const p1 = toRad(a.latitude), p2 = toRad(b.latitude);
    const dp = toRad(Number(b.latitude) - Number(a.latitude));
    const dl = toRad(Number(b.longitude) - Number(a.longitude));
    const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 2 * r * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  };
  const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const setValue = (id, value) => {
    const element = $(id);
    if (element && element.value !== value) {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const PRIME_CATEGORIES = [
    'Railway Station',
    'Community Centre',
    'Bank',
    'ATM',
    'Primary School',
    'Secondary School',
    'Medical Facility',
    'Dentist',
    'Pharmacy',
    'Place of Worship',
    'Post Office',
    'Post Box',
    'Public House',
    'Recreation Facility',
    'Supermarket',
    'Convenience Store',
    'Employment Areas',
  ];
  const CATEGORY_SYMBOL = {
    'Railway Station': 'diamond',
    'Community Centre': 'hex',
    Bank: 'square',
    ATM: 'square',
    'Primary School': 'triangle',
    'Secondary School': 'pentagon',
    'Medical Facility': 'cross',
    Dentist: 'cross',
    Pharmacy: 'cross',
    'Place of Worship': 'pentagon',
    'Post Office': 'square',
    'Post Box': 'square',
    'Public House': 'star',
    'Recreation Facility': 'ring',
    Supermarket: 'circle',
    'Convenience Store': 'circle',
    'Employment Areas': 'square',
  };
  const CATEGORY_COLOR = {
    'Railway Station': '#1d4ed8',
    'Community Centre': '#7c3aed',
    Bank: '#0f766e',
    ATM: '#14b8a6',
    'Primary School': '#f59e0b',
    'Secondary School': '#d97706',
    'Medical Facility': '#dc2626',
    Dentist: '#ef4444',
    Pharmacy: '#16a34a',
    'Place of Worship': '#9333ea',
    'Post Office': '#b45309',
    'Post Box': '#ca8a04',
    'Public House': '#be123c',
    'Recreation Facility': '#4d7c0f',
    Supermarket: '#2563eb',
    'Convenience Store': '#0ea5e9',
    'Employment Areas': '#475569',
  };
  const CATEGORY_PRIORITY = new Map(PRIME_CATEGORIES.map((category, index) => [category, index]));

  const classifyAmenity = (item) => {
    const text = `${item?.category || ''} ${item?.name || ''} ${item?.sourceId || ''}`.toLowerCase();
    if (/rail|station/.test(text)) return 'Railway Station';
    if (/community|village hall|civic|library/.test(text)) return 'Community Centre';
    if (/\bbank\b/.test(text)) return 'Bank';
    if (/\batm\b|cash ?point/.test(text)) return 'ATM';
    if (/primary|junior|infant/.test(text)) return 'Primary School';
    if (/secondary|high school|college|academy/.test(text)) return 'Secondary School';
    if (/dentist|dental/.test(text)) return 'Dentist';
    if (/pharmacy|chemist/.test(text)) return 'Pharmacy';
    if (/doctor|gp|surgery|clinic|health|medical|hospital/.test(text)) return 'Medical Facility';
    if (/church|mosque|masjid|synagogue|temple|worship|chapel/.test(text)) return 'Place of Worship';
    if (/post office/.test(text)) return 'Post Office';
    if (/post box|letter box/.test(text)) return 'Post Box';
    if (/pub|public house|bar|inn/.test(text)) return 'Public House';
    if (/gym|sport|leisure|fitness|recreation|sports centre|swimming/.test(text)) return 'Recreation Facility';
    if (/supermarket|tesco|sainsbury|asda|morrisons|aldi|lidl|waitrose|marks.*spencer|m&s/.test(text)) return 'Supermarket';
    if (/convenience|shop|store|co-op|coop|spar|premier|costcutter|one stop|nisa|local/.test(text)) return 'Convenience Store';
    if (/employment|industrial|business park|office|commercial|works|estate|factory|warehouse/.test(text)) return 'Employment Areas';
    if (/education|school/.test(text)) return 'Primary School';
    if (/retail|food and drink/.test(text)) return 'Convenience Store';
    if (/healthcare/.test(text)) return 'Medical Facility';
    if (/open space|settlement|neighbourhood|neighborhood/.test(text)) return null;
    return item?.category === 'Employment Areas' ? 'Employment Areas' : null;
  };

  const patchGlobals = () => {
    try {
      if (Array.isArray(CATEGORY_OPTIONS)) {
        CATEGORY_OPTIONS.splice(0, CATEGORY_OPTIONS.length, ...PRIME_CATEGORIES);
      }
      if (typeof CATEGORY_SYMBOLS === 'object' && CATEGORY_SYMBOLS) {
        Object.assign(CATEGORY_SYMBOLS, CATEGORY_SYMBOL);
        delete CATEGORY_SYMBOLS.Employment;
      }
      if (Array.isArray(AMENITY_COLOR_PALETTE)) {
        AMENITY_COLOR_PALETTE.splice(0, AMENITY_COLOR_PALETTE.length, ...Object.values(CATEGORY_COLOR));
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

  const normaliseAmenities = () => {
    if (!Array.isArray(state?.amenities) || !state.generatedScenario?.siteCoordinates) return;
    const site = state.generatedScenario.siteCoordinates;
    const buckets = new Map();
    state.amenities.forEach((item) => {
      const category = classifyAmenity(item);
      if (!category) {
        item.visible = false;
        item.showInLegend = false;
        return;
      }
      item.category = category;
      item.symbol = CATEGORY_SYMBOL[category] || item.symbol || 'circle';
      item.color = CATEGORY_COLOR[category] || item.color || '#2563eb';
      item.__primeDistance = distanceMetres(site, item);
      if (!buckets.has(category)) buckets.set(category, []);
      buckets.get(category).push(item);
    });
    buckets.forEach((items, category) => {
      items.sort((a, b) => a.__primeDistance - b.__primeDistance);
      let limit = category === 'Railway Station' ? Number.POSITIVE_INFINITY : 2;
      if (category === 'Convenience Store' || category === 'Supermarket') limit = Math.max(limit, 2);
      items.forEach((item, index) => {
        item.visible = index < limit;
        item.showInLegend = index < limit;
      });
    });
    const hasBank = buckets.has('Bank') && buckets.get('Bank').some((item) => item.visible);
    if (hasBank && buckets.has('ATM')) buckets.get('ATM').forEach((item) => { item.visible = false; item.showInLegend = false; });
    const hasPostOffice = buckets.has('Post Office') && buckets.get('Post Office').some((item) => item.visible);
    if (hasPostOffice && buckets.has('Post Box')) buckets.get('Post Box').forEach((item) => { item.visible = false; item.showInLegend = false; });
    const hasSupermarket = buckets.has('Supermarket') && buckets.get('Supermarket').some((item) => item.visible);
    if (hasSupermarket && buckets.has('Convenience Store')) {
      const closestConvenience = buckets.get('Convenience Store')[0];
      buckets.get('Convenience Store').forEach((item) => { item.visible = item === closestConvenience; item.showInLegend = item === closestConvenience; });
    }
    state.amenities.sort((a, b) => (CATEGORY_PRIORITY.get(a.category) ?? 999) - (CATEGORY_PRIORITY.get(b.category) ?? 999) || (a.__primeDistance || 0) - (b.__primeDistance || 0));
  };

  const exportGeojson = () => {
    try {
      normaliseAmenities();
      const features = [];
      const add = (geometry, properties) => geometry && features.push({ type: 'Feature', geometry, properties });
      (state?.isochrones || []).forEach((isochrone, index) => add(isochrone.geometry, {
        featureType: 'active_travel_catchment', mode: state.selectedMode, label: isochrone.label || isochrone.properties?.label || `Catchment ${index + 1}`,
        distanceMetres: Number(isochrone.contour ?? isochrone.properties?.contour ?? 0), colour: isochrone.color || '', displayMode: $('isochroneDisplayMode')?.value || 'fill', opacity: Number($('isochroneOpacity')?.value || 0.32),
      }));
      const site = state?.generatedScenario?.siteCoordinates;
      if (site) add({ type: 'Point', coordinates: [site.longitude, site.latitude] }, { featureType: 'site_marker', name: 'Site marker' });
      (state?.amenities || []).filter((item) => item.visible !== false).forEach((item) => add({ type: 'Point', coordinates: [item.longitude, item.latitude] }, { featureType: item.category === 'Employment Areas' ? 'employment_area' : 'amenity', name: item.name, category: item.category, symbol: item.symbol, colour: item.color }));
      const blob = new Blob([JSON.stringify({ type: 'FeatureCollection', features }, null, 2)], { type: 'application/geo+json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `active-travel-${state?.selectedMode || 'isochrone'}.geojson`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    } catch (error) {
      console.error('GeoJSON export failed', error);
    }
  };

  const catchmentBand = (walkingDistance, cyclingDistance) => {
    const w = Number(walkingDistance);
    const c = Number(cyclingDistance);
    if (w <= 800) return '800 m preferred walking catchment';
    if (w <= 1600) return '1,600 m walking catchment';
    if (w <= 2000) return '2,000 m walking catchment';
    if (c <= 5000) return '5 km cycling catchment';
    if (c <= 8000) return '8 km cycling catchment';
    return 'Outside default active travel catchments';
  };

  const exportTaTable = () => {
    try {
      normaliseAmenities();
      const site = state?.generatedScenario?.siteCoordinates;
      const rows = [['facility_type', 'facility_name', 'postcode', 'walking_distance_m', 'cycling_distance_m', 'catchment_band']];
      (state?.amenities || []).filter((item) => item.visible !== false).forEach((item) => {
        const distance = Math.round(distanceMetres(site, item));
        const cyclingDistance = Math.round(distance);
        rows.push([item.category, item.name || '', item.postcode || '', distance, cyclingDistance, catchmentBand(distance, cyclingDistance)]);
      });
      const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'active-travel-ta-facility-distances.csv'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    } catch (error) {
      console.error('TA table export failed', error);
    }
  };

  const ensureControls = () => {
    const exportActions = document.querySelector('.export-actions');
    if (exportActions && !$('exportTaTableButton')) {
      const button = document.createElement('button');
      button.id = 'exportTaTableButton';
      button.className = 'secondary-action';
      button.type = 'button';
      button.textContent = 'TA Table';
      button.title = 'Export optional Transport Assessment facility distance table';
      button.addEventListener('click', exportTaTable);
      exportActions.appendChild(button);
    }
    const checklist = document.querySelector('.amenity-category-checklist');
    if (checklist) {
      PRIME_CATEGORIES.forEach((category) => {
        const exists = Array.from(checklist.querySelectorAll('label')).some((label) => label.textContent.trim() === category);
        if (!exists) {
          const label = document.createElement('label');
          label.innerHTML = `<input type="checkbox" checked /> ${category}`;
          checklist.appendChild(label);
        }
      });
    }
  };

  const applyDom = () => {
    document.title = 'Walking and Cycling Isochrone';
    setValue('walkingBands', '800 m, 1,600 m, 2,000 m');
    setValue('cyclingBands', '5 km, 8 km');
    const category = $('manualPointCategory');
    if (category) {
      PRIME_CATEGORIES.forEach((item) => {
        if (!Array.from(category.options).some((option) => option.value === item)) category.add(new Option(item, item));
      });
      if (category.value === 'Employment') category.value = 'Employment Areas';
    }
    document.querySelectorAll('option').forEach((option) => { if (option.textContent === 'Employment') { option.textContent = 'Employment Areas'; option.value = 'Employment Areas'; } });
    const button = $('exportGeojsonButton');
    if (button && !button.__activeTravelExportBound) { button.__activeTravelExportBound = true; button.addEventListener('click', exportGeojson); }
    ensureControls();
    normaliseAmenities();
  };

  const run = () => { patchGlobals(); patchLeaflet(); applyDom(); try { if (typeof render === 'function') render(); } catch {} };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true }); else run();
  window.addEventListener('load', run, { once: true });
  setInterval(run, 1500);
})();
