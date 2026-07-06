(() => {
  const $ = (id) => document.getElementById(id);
  const DEFAULT_WALKING_BANDS = '800 m, 1,200 m, 2,000 m';
  const DEFAULT_CYCLING_BANDS = '5 km, 8 km';
  const WALKING_FALLBACKS = [
    { label: '800 m preferred walking catchment', distance: 0.8, fill: '#00bcd4' },
    { label: '1,200 m walking catchment', distance: 1.2, fill: '#f59f00' },
    { label: '2,000 m walking catchment', distance: 2.0, fill: '#ef4444' },
  ];
  const CYCLING_FALLBACKS = [
    { label: '5 km cycling catchment', distance: 5.0, fill: '#6f42c1' },
    { label: '8 km cycling catchment', distance: 8.0, fill: '#d63384' },
  ];
  const primeConfig = () => window.PRIME_SYMBOLOGY || { categories: [], categoryNames: [] };
  const primeCategories = () => primeConfig().categories || [];
  const byCategory = () => new Map(primeCategories().map((item) => [item.primeCategory, item]));
  const categoryNames = () => primeCategories().map((item) => item.primeCategory);
  const categoryPriority = () => new Map(categoryNames().map((category, index) => [category, index]));
  const categorySymbols = () => Object.fromEntries(primeCategories().map((item) => [item.primeCategory, item.markerShape || 'circle']));
  const categoryColours = () => Object.fromEntries(primeCategories().map((item) => [item.primeCategory, item.colour || '#2563eb']));
  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const distanceMetres = (a, b) => {
    if (!a || !b) return Infinity;
    const r = 6371000;
    const p1 = toRad(a.latitude), p2 = toRad(b.latitude);
    const dp = toRad(Number(b.latitude) - Number(a.latitude));
    const dl = toRad(Number(b.longitude) - Number(a.longitude));
    const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 2 * r * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  };
  const setValue = (id, value) => {
    const element = $(id);
    if (element && element.value !== value) {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const normaliseTagValue = (value) => String(value ?? '').trim().toLowerCase();
  const getTags = (item) => ({ ...(item?.tags || {}), ...(item?.osmTags || {}), ...(item?.properties?.tags || {}), ...(item?.properties || {}) });
  const tagMatchesRule = (tags, rule) => Object.entries(rule).every(([key, allowed]) => {
    const value = normaliseTagValue(tags[key]);
    if (!value) return false;
    const values = Array.isArray(allowed) ? allowed : [allowed];
    return values.some((candidate) => candidate === '*' || normaliseTagValue(candidate) === value);
  });
  const findPrimeByTags = (item) => {
    const tags = getTags(item);
    return primeCategories().find((category) => (category.osm || []).some((rule) => tagMatchesRule(tags, rule))) || null;
  };
  const findPrimeByName = (item) => {
    const text = `${item?.category || ''} ${item?.name || ''} ${item?.sourceId || ''}`.toLowerCase();
    if (/open space|settlement|neighbou?rhood/.test(text)) return null;
    return primeCategories().find((category) => (category.nameFallback || []).some((needle) => text.includes(String(needle).toLowerCase()))) || null;
  };
  const classifyAmenity = (item) => findPrimeByTags(item) || findPrimeByName(item) || (item?.category === 'Employment Areas' ? byCategory().get('Employment Areas') : null);
  const isTag = (item, key, value) => normaliseTagValue(getTags(item)[key]) === normaliseTagValue(value);
  const hasPrimaryPreferred = (items, category) => {
    const primary = category?.preferTags?.primary;
    return !!primary && items.some((item) => Object.entries(primary).every(([key, value]) => isTag(item, key, value)) && item.visible !== false);
  };
  const isFallbackPreferred = (item, category) => {
    const fallback = category?.preferTags?.fallback;
    return !!fallback && Object.entries(fallback).every(([key, value]) => isTag(item, key, value));
  };

  const bandEntries = (value) => {
    const text = String(value || '').replace(/\s+/g, ' ');
    const matches = text.match(/\d[\d,]*(?:\.\d+)?\s*(?:km|m)\b(?:\s+[^,;]*)?/gi);
    if (matches?.length) return matches.map((entry) => entry.trim());
    return text.split(/[;|]/).map((entry) => entry.trim()).filter(Boolean);
  };
  const parseBandEntry = (entry, mode, fallbackBand) => {
    const text = String(entry || '').trim();
    const numberMatch = text.match(/\d[\d,]*(?:\.\d+)?/);
    if (!numberMatch) return null;
    const numeric = Number(numberMatch[0].replace(/,/g, ''));
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    const isKm = /km/i.test(text);
    const distance = isKm ? numeric : numeric / 1000;
    const label = /catchment/i.test(text) ? text : `${numeric.toLocaleString('en-GB')} ${isKm ? 'km' : 'm'} ${mode === 'cycling' ? 'cycling catchment' : 'walking catchment'}`;
    return { ...fallbackBand, label, distance };
  };

  const ensureWalkingColourControl = () => {
    if ($('walkingColor3')) return;
    const grid = $('walkingColor2')?.closest('.band-colour-grid');
    if (!grid) return;
    const label = document.createElement('label');
    label.className = 'band-colour-item';
    label.innerHTML = '<span>2,000 m</span><input id="walkingColor3" class="colour-input" type="color" value="#ef4444" />';
    grid.appendChild(label);
  };
  const getSelectedBandColoursForMode = (mode) => mode === 'cycling'
    ? [($('cyclingColor1')?.value || '#6f42c1'), ($('cyclingColor2')?.value || '#d63384')]
    : [($('walkingColor1')?.value || '#00bcd4'), ($('walkingColor2')?.value || '#f59f00'), ($('walkingColor3')?.value || '#ef4444')];
  const getConfiguredBandsForMode = (mode) => {
    const fallbackBands = mode === 'cycling' ? CYCLING_FALLBACKS : WALKING_FALLBACKS;
    const inputValue = mode === 'cycling' ? $('cyclingBands')?.value : $('walkingBands')?.value;
    const colours = getSelectedBandColoursForMode(mode);
    const parsed = bandEntries(inputValue).map((entry, index) => {
      const fallback = fallbackBands[index] || fallbackBands[fallbackBands.length - 1] || {};
      return parseBandEntry(entry, mode, { ...fallback, fill: colours[index % colours.length] || fallback.fill });
    }).filter(Boolean).sort((a, b) => Number(b.distance) - Number(a.distance));
    return parsed.length ? parsed : fallbackBands;
  };

  const patchGlobals = () => {
    try {
      ensureWalkingColourControl();
      const names = categoryNames();
      if (names.length) {
        if (Array.isArray(CATEGORY_OPTIONS)) CATEGORY_OPTIONS.splice(0, CATEGORY_OPTIONS.length, ...names);
        if (typeof CATEGORY_SYMBOLS === 'object' && CATEGORY_SYMBOLS) Object.assign(CATEGORY_SYMBOLS, categorySymbols());
        if (Array.isArray(AMENITY_COLOR_PALETTE)) AMENITY_COLOR_PALETTE.splice(0, AMENITY_COLOR_PALETTE.length, ...Object.values(categoryColours()));
      }
      if (typeof MODE_CONFIG === 'object' && MODE_CONFIG) {
        MODE_CONFIG.walking.extent = 'Local destinations focus';
        MODE_CONFIG.walking.bands = WALKING_FALLBACKS;
        MODE_CONFIG.cycling.bands = CYCLING_FALLBACKS;
      }
      if (typeof elements === 'object' && elements) {
        elements.isochroneDisplayMode = $('isochroneDisplayMode');
        elements.isochroneOpacity = $('isochroneOpacity');
        elements.exportGeojsonButton = $('exportGeojsonButton');
      }
      window.getSelectedBandColoursForMode = getSelectedBandColoursForMode;
      window.parseConfiguredBandEntry = parseBandEntry;
      window.getConfiguredBandsForMode = getConfiguredBandsForMode;
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
    if (!primeCategories().length || !Array.isArray(state?.amenities) || !state.generatedScenario?.siteCoordinates) return;
    const site = state.generatedScenario.siteCoordinates;
    const buckets = new Map();
    state.amenities.forEach((item) => {
      const prime = classifyAmenity(item);
      if (!prime) {
        item.visible = false;
        item.showInLegend = false;
        return;
      }
      item.primeCategory = prime.primeCategory;
      item.primeSymbolName = prime.primeSymbolName;
      item.displayLabel = prime.legendLabel;
      item.featureType = prime.featureType;
      item.source = item.source || 'OSM/manual';
      item.originalOsmTags = getTags(item);
      item.category = prime.primeCategory;
      item.symbol = prime.markerShape || item.symbol || 'circle';
      item.webIcon = prime.webIcon;
      item.color = prime.colour || item.color || '#2563eb';
      item.outlineColor = prime.outlineColour || item.color;
      item.__primeDistance = distanceMetres(site, item);
      if (!buckets.has(prime.primeCategory)) buckets.set(prime.primeCategory, []);
      buckets.get(prime.primeCategory).push(item);
    });
    const categories = byCategory();
    buckets.forEach((items, categoryName) => {
      const category = categories.get(categoryName);
      items.sort((a, b) => a.__primeDistance - b.__primeDistance);
      const unlimited = categoryName === 'Transport - Train Station';
      items.forEach((item, index) => {
        item.visible = unlimited || index < 2;
        item.showInLegend = item.visible;
      });
      if (hasPrimaryPreferred(items, category)) {
        items.forEach((item) => {
          if (isFallbackPreferred(item, category)) {
            item.visible = false;
            item.showInLegend = false;
          }
        });
      }
      if (categoryName === 'Facilities - Retail') {
        const visibleConvenience = items.filter((item) => item.visible !== false && isTag(item, 'shop', 'convenience'));
        const visibleSupermarket = items.some((item) => item.visible !== false && isTag(item, 'shop', 'supermarket'));
        if (visibleSupermarket && visibleConvenience.length > 1) visibleConvenience.slice(1).forEach((item) => { item.visible = false; item.showInLegend = false; });
      }
    });
    const priority = categoryPriority();
    state.amenities.sort((a, b) => (priority.get(a.category) ?? 999) - (priority.get(b.category) ?? 999) || (a.__primeDistance || 0) - (b.__primeDistance || 0));
  };

  const amenityGeometry = (item) => item.geometry || (Number.isFinite(Number(item.longitude)) && Number.isFinite(Number(item.latitude)) ? { type: 'Point', coordinates: [Number(item.longitude), Number(item.latitude)] } : null);
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
      (state?.amenities || []).filter((item) => item.visible !== false).forEach((item) => add(amenityGeometry(item), {
        original_osm_tags: item.originalOsmTags || getTags(item),
        prime_category: item.primeCategory || item.category,
        prime_symbol_name: item.primeSymbolName || item.category,
        display_label: item.displayLabel || item.name || item.category,
        feature_type: item.featureType || 'point',
        source: item.source || 'OSM/manual',
        name: item.name || '',
        colour: item.color,
        web_icon: item.webIcon,
        qgis_reference: byCategory().get(item.primeCategory || item.category)?.qgisSvg || null,
      }));
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
    if (w <= 1200) return '1,200 m walking catchment';
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
        rows.push([item.primeCategory || item.category, item.name || '', item.postcode || getTags(item).postcode || '', distance, cyclingDistance, catchmentBand(distance, cyclingDistance)]);
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
    ensureWalkingColourControl();
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
    if (checklist && categoryNames().length) {
      categoryNames().forEach((category) => {
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
    setValue('walkingBands', DEFAULT_WALKING_BANDS);
    setValue('cyclingBands', DEFAULT_CYCLING_BANDS);
    const category = $('manualPointCategory');
    if (category && categoryNames().length) {
      categoryNames().forEach((item) => {
        if (!Array.from(category.options).some((option) => option.value === item)) category.add(new Option(item, item));
      });
    }
    document.querySelectorAll('option').forEach((option) => { if (option.textContent === 'Employment') { option.textContent = 'Employment Areas'; option.value = 'Employment Areas'; } });
    const button = $('exportGeojsonButton');
    if (button && !button.__activeTravelExportBound) { button.__activeTravelExportBound = true; button.addEventListener('click', exportGeojson); }
    ensureControls();
    normaliseAmenities();
  };

  const run = (withRender = false) => {
    patchGlobals();
    patchLeaflet();
    applyDom();
    if (withRender) {
      try { if (typeof render === 'function') render(); } catch (error) { console.warn('Initial active travel render failed', error); }
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => run(true), { once: true }); else run(true);
  window.addEventListener('load', () => run(true), { once: true });
  setInterval(() => run(false), 5000);
})();
