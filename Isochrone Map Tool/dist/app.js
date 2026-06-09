const CATEGORY_OPTIONS = [
  "Bus stop",
  "Rail station",
  "School",
  "Healthcare",
  "Retail",
  "Food and drink",
  "Community",
  "Worship",
  "Open space",
  "Settlement",
  "Education",
  "Employment",
];

const SYMBOL_OPTIONS = [
  "circle",
  "square",
  "diamond",
  "triangle",
  "cross",
  "hex",
  "star",
  "pentagon",
  "ring",
];
const CATEGORY_SYMBOLS = {
  "Bus stop": "square",
  "Rail station": "diamond",
  School: "triangle",
  Healthcare: "cross",
  Retail: "circle",
  "Food and drink": "star",
  Community: "hex",
  Worship: "pentagon",
  "Open space": "ring",
  Settlement: "ring",
  Education: "triangle",
  Employment: "diamond",
};
const AMENITY_COLOR_PALETTE = [
  "#2563eb",
  "#dc2626",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#0f766e",
  "#be123c",
  "#4f46e5",
  "#4d7c0f",
  "#c2410c",
  "#0ea5e9",
  "#a855f7",
  "#0891b2",
  "#b91c1c",
  "#15803d",
  "#b45309",
  "#6d28d9",
  "#047857",
  "#9d174d",
  "#4338ca",
  "#65a30d",
  "#ea580c",
  "#0369a1",
  "#9333ea",
  "#0e7490",
  "#be185d",
  "#1d4ed8",
  "#a16207",
  "#166534",
  "#7e22ce",
];
const DEFAULT_SITE_COORDINATES = "53.801672, -1.548567";
const DEFAULT_ACCESS_COORDINATES = "53.801155, -1.547860";
const IS_FILE_CONTEXT = window.location.protocol === "file:";
function resolveHostedAppEndpoint(path) {
  if (IS_FILE_CONTEXT || /^https?:\/\//i.test(path)) {
    return path;
  }
  return new URL(path, window.location.origin).toString();
}
const OVERPASS_ENDPOINTS = [
  ...(IS_FILE_CONTEXT
    ? [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
      ]
    : [resolveHostedAppEndpoint("/api/proxy/overpass")]),
];
const MAPIT_POINT_ENDPOINT = IS_FILE_CONTEXT
  ? "https://mapit.mysociety.org/point/4326"
  : resolveHostedAppEndpoint("/api/proxy/mapit/point/4326");
const NOMINATIM_SEARCH_ENDPOINT = IS_FILE_CONTEXT
  ? "https://nominatim.openstreetmap.org/search"
  : resolveHostedAppEndpoint("/api/proxy/nominatim/search");
const VALHALLA_ISOCHRONE_ENDPOINT = IS_FILE_CONTEXT
  ? "https://valhalla1.openstreetmap.de/isochrone"
  : resolveHostedAppEndpoint("/api/proxy/valhalla/isochrone");
const VALHALLA_ROUTE_ENDPOINT = IS_FILE_CONTEXT
  ? "https://valhalla1.openstreetmap.de/route"
  : resolveHostedAppEndpoint("/api/proxy/valhalla/route");
const CYCLING_SPEED_KPH = 16;
const CYCLING_TIME_GUIDANCE_TEXT =
  "The cycle times detailed in the table are based on a cycling speed of 16 kph which corresponds with DfT guidance.";
const BUS_INDICATIVE_METHOD_NOTE =
  "Bus contours are indicative Valhalla multimodal outputs and should be checked against current bus timetables before planning issue.";
const SERVICE_TIMEOUT_MS = {
  Overpass: 30000,
  "Valhalla isochrone": 30000,
  "Valhalla route": 10000,
};
const MAP_DIMENSIONS = {
  width: 960,
  height: 640,
};

const MODE_CONFIG = {
  walking: {
    label: "Walking",
    extent: "Local services focus",
    scaleLabel: "250 m",
    zoom: 15,
    amenityRadius: 1600,
    metric: "distance",
    costing: "pedestrian",
    bands: [
      { label: "1,200 m", distance: 1.2, fill: "#00f7ff" },
      { label: "2,000 m", distance: 2.0, fill: "#ff0000" },
    ],
  },
  cycling: {
    label: "Cycling",
    extent: "Nearby settlements and key destinations",
    scaleLabel: "1 km",
    zoom: 14,
    amenityRadius: 4500,
    metric: "distance",
    costing: "bicycle",
    bands: [
      { label: "2,000 m", distance: 2.0, fill: "#00f7ff" },
      { label: "5,000 m", distance: 5.0, fill: "#22ff00" },
      { label: "8,000 m", distance: 8.0, fill: "#ff0000" },
    ],
  },
  bus: {
    label: "Bus",
    extent: "Indicative public transport catchment",
    scaleLabel: "2 km",
    zoom: 13,
    amenityRadius: 8000,
    metric: "time",
    costing: "multimodal",
    bands: [
      { label: "15 mins", time: 15, fill: "#00f7ff" },
      { label: "30 mins", time: 30, fill: "#22ff00" },
      { label: "45 mins", time: 45, fill: "#ff0000" },
      { label: "60 mins", time: 60, fill: "#eaff00" },
    ],
  },
};

const state = {
  selectedMode: "walking",
  amenities: [],
  isochrones: [],
  currentMapView: null,
  lastZoomControlValue: 0,
  nextAmenityId: 1,
  isPlacingPoint: false,
  isDraggingMap: false,
  mapDragPointerId: null,
  mapDragLastPoint: null,
  generatedScenario: null,
  lastAutoPlanningAuthority: "",
  planningAuthorityLookupTimer: null,
  latestPlanningAuthorityLookupId: 0,
  savedOverrides: {},
  generationTimers: [],
  latestFetchRequestId: 0,
  activeRefreshController: null,
  hasGeneratedDraft: false,
  lastIsochroneFallbackNotice: "",
  lastIsochroneSourceNote: "",
  amenityCache: {
    walking: null,
    cycling: null,
    bus: null,
  },
  status: {
    title: "Ready to generate",
    text: "Waiting for a draft run.",
    tone: "ready",
  },
};

const elements = {
  projectName: document.getElementById("projectName"),
  planningAuthority: document.getElementById("planningAuthority"),
  projectNote: document.getElementById("projectNote"),
  siteCoordinates: document.getElementById("siteCoordinates"),
  accessCoordinates: document.getElementById("accessCoordinates"),
  busNote: document.getElementById("busNote"),
  walkingBands: document.getElementById("walkingBands"),
  cyclingBands: document.getElementById("cyclingBands"),
  busBands: document.getElementById("busBands"),
  walkingColor1: document.getElementById("walkingColor1"),
  walkingColor2: document.getElementById("walkingColor2"),
  cyclingColor1: document.getElementById("cyclingColor1"),
  cyclingColor2: document.getElementById("cyclingColor2"),
  cyclingColor3: document.getElementById("cyclingColor3"),
  busColor1: document.getElementById("busColor1"),
  busColor2: document.getElementById("busColor2"),
  busColor3: document.getElementById("busColor3"),
  busColor4: document.getElementById("busColor4"),
  legendPosition: document.getElementById("legendPosition"),
  mapZoomAdjust: document.getElementById("mapZoomAdjust"),
  mapZoomAdjustValue: document.getElementById("mapZoomAdjustValue"),
  recenterMapButton: document.getElementById("recenterMapButton"),
  modeButtons: Array.from(document.querySelectorAll(".mode-chip")),
  bandSummary: document.getElementById("bandSummary"),
  modeLabel: document.getElementById("modeLabel"),
  extentLabel: document.getElementById("extentLabel"),
  legendCount: document.getElementById("legendCount"),
  statusTitle: document.getElementById("statusTitle"),
  statusText: document.getElementById("statusText"),
  statusDot: document.getElementById("statusDot"),
  previewNote: document.getElementById("previewNote"),
  mapPreview: document.getElementById("mapPreview"),
  amenitiesTableBody: document.getElementById("amenitiesTableBody"),
  methodNote: document.getElementById("methodNote"),
  manualPointName: document.getElementById("manualPointName"),
  manualPointCategory: document.getElementById("manualPointCategory"),
  manualPointSymbol: document.getElementById("manualPointSymbol"),
  togglePlacePointButton: document.getElementById("togglePlacePointButton"),
  generateButton: document.getElementById("generateButton"),
  saveOverridesButton: document.getElementById("saveOverridesButton"),
  resetOverridesButton: document.getElementById("resetOverridesButton"),
  exportPngButton: document.getElementById("exportPngButton"),
  exportSvgButton: document.getElementById("exportSvgButton"),
  exportCsvButton: document.getElementById("exportCsvButton"),
  exportJsonButton: document.getElementById("exportJsonButton"),
};

function init() {
  populateSelect(elements.manualPointCategory, CATEGORY_OPTIONS);
  populateSelect(elements.manualPointSymbol, SYMBOL_OPTIONS);
  state.generatedScenario = buildGeneratedScenario(
    parseCoordinatePair(elements.siteCoordinates.value) ?? parseCoordinatePair(DEFAULT_SITE_COORDINATES),
    parseCoordinatePair(elements.accessCoordinates.value, true)
  );
  state.savedOverrides = loadSavedOverrides();
  state.amenities = [];
  bindEvents();
  render();
  schedulePlanningAuthorityLookup(state.generatedScenario.siteCoordinates);
}

function populateSelect(select, options) {
  select.innerHTML = options.map((option) => `<option value="${option}">${option}</option>`).join("");
}

function bindEvents() {
  elements.modeButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      state.selectedMode = button.dataset.mode;
      render();
      if (state.generatedScenario && state.hasGeneratedDraft) {
        await refreshLiveContext(`Refreshing ${MODE_CONFIG[state.selectedMode].label.toLowerCase()} amenities from OpenStreetMap.`);
      }
    });
  });

  [
    elements.projectName,
    elements.planningAuthority,
    elements.projectNote,
    elements.busNote,
    elements.walkingBands,
    elements.cyclingBands,
    elements.busBands,
    elements.walkingColor1,
    elements.walkingColor2,
    elements.cyclingColor1,
    elements.cyclingColor2,
    elements.cyclingColor3,
    elements.busColor1,
    elements.busColor2,
    elements.busColor3,
    elements.busColor4,
    elements.legendPosition,
  ].forEach((control) => {
    control.addEventListener("input", render);
    control.addEventListener("change", render);
  });

  elements.mapZoomAdjust.addEventListener("input", onMapZoomAdjustChange);
  elements.mapZoomAdjust.addEventListener("change", onMapZoomAdjustChange);
  elements.recenterMapButton.addEventListener("click", recenterMapView);

  [elements.siteCoordinates, elements.accessCoordinates].forEach((control) => {
    control.addEventListener("input", handleCoordinateDraftChange);
    control.addEventListener("change", handleCoordinateDraftChange);
  });

  elements.generateButton.addEventListener("click", runGenerationSequence);
  elements.saveOverridesButton.addEventListener("click", saveOverrides);
  elements.resetOverridesButton.addEventListener("click", resetOverrides);
  elements.togglePlacePointButton.addEventListener("click", togglePlacePointMode);
  elements.exportPngButton.addEventListener("click", exportPng);
  elements.exportSvgButton.addEventListener("click", exportSvg);
  elements.exportCsvButton.addEventListener("click", exportCsv);
  elements.exportJsonButton.addEventListener("click", exportMethodNote);
  elements.mapPreview.addEventListener("click", onMapClick);
  elements.mapPreview.addEventListener("pointerdown", onMapPointerDown);
  elements.mapPreview.addEventListener("pointermove", onMapPointerMove);
  elements.mapPreview.addEventListener("pointerup", onMapPointerUp);
  elements.mapPreview.addEventListener("pointerleave", onMapPointerUp);
  elements.mapPreview.addEventListener("pointercancel", onMapPointerUp);
}

function render() {
  updateModeControls();
  updateStatus();
  renderAmenitiesTable();
  renderMap();
  renderMethodNote();
}

function updateModeControls() {
  elements.modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.selectedMode);
  });
  const config = MODE_CONFIG[state.selectedMode];
  const labels = getConfiguredBandsForMode(state.selectedMode).map((band) => band.label).join(" | ");
  elements.bandSummary.textContent = `Default bands: ${labels}`;
  elements.modeLabel.textContent = config.label;
  elements.extentLabel.textContent = config.extent;
  elements.mapZoomAdjustValue.textContent = formatMapZoomAdjustValue();
}

function updateStatus() {
  elements.statusTitle.textContent = state.status.title;
  elements.statusText.textContent = state.status.text;
  elements.statusDot.className = "status-dot";
  if (state.status.tone === "running") {
    elements.statusDot.classList.add("is-running");
  } else if (state.status.tone === "warning") {
    elements.statusDot.classList.add("is-warning");
  } else if (state.status.tone === "error") {
    elements.statusDot.classList.add("is-error");
  } else if (state.status.tone === "ready") {
    elements.statusDot.classList.add("is-ready");
  }
}

function renderAmenitiesTable() {
  elements.amenitiesTableBody.innerHTML = "";

  state.amenities.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td><input type="text" value="${escapeHtml(item.name)}" data-field="name" data-id="${item.id}" /></td>
        <td>${buildSelectMarkup(item.id, "category", CATEGORY_OPTIONS, item.category)}</td>
        <td>${buildSelectMarkup(item.id, "symbol", SYMBOL_OPTIONS, item.symbol)}</td>
        <td><input class="colour-input" type="color" value="${item.color}" data-field="color" data-id="${item.id}" /></td>
        <td><input type="checkbox" ${item.visible ? "checked" : ""} data-field="visible" data-id="${item.id}" /></td>
        <td><input type="checkbox" ${item.showInLegend ? "checked" : ""} data-field="showInLegend" data-id="${item.id}" /></td>
        <td><button class="row-delete" type="button" data-delete-id="${item.id}" aria-label="Delete amenity">X</button></td>
      `;
    elements.amenitiesTableBody.appendChild(row);
  });

  elements.amenitiesTableBody
    .querySelectorAll("input[data-id], select[data-id]")
    .forEach((control) => {
      control.addEventListener("input", onAmenityFieldChange);
      control.addEventListener("change", onAmenityFieldChange);
    });

  elements.amenitiesTableBody.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const amenityId = Number(button.dataset.deleteId);
      state.amenities = state.amenities.filter((item) => item.id !== amenityId);
      render();
    });
  });
}

function onAmenityFieldChange(event) {
  const amenityId = Number(event.target.dataset.id);
  const field = event.target.dataset.field;
  const amenity = state.amenities.find((item) => item.id === amenityId);
  if (!amenity) {
    return;
  }

  if (event.target.type === "checkbox") {
    amenity[field] = event.target.checked;
  } else {
    amenity[field] = event.target.value;
  }

  if (event.target.type === "text") {
    renderMap();
    renderMethodNote();
    return;
  }

  render();
}

function renderMap() {
  const config = MODE_CONFIG[state.selectedMode];
  const scenario = state.generatedScenario ?? buildGeneratedScenario(
    parseCoordinatePair(DEFAULT_SITE_COORDINATES),
    parseCoordinatePair(DEFAULT_ACCESS_COORDINATES, true)
  );
  const mapView = state.currentMapView ?? buildBestFitMapView(
    scenario,
    state.isochrones,
    config.zoom,
    Number(elements.mapZoomAdjust.value)
  );
  state.currentMapView = mapView;
  const site = projectLatLonToSvg(
    scenario.siteCoordinates.latitude,
    scenario.siteCoordinates.longitude,
    mapView
  );
  const accessProvided = Boolean(scenario.accessCoordinates);
  const access = accessProvided
    ? projectLatLonToSvg(
        scenario.accessCoordinates.latitude,
        scenario.accessCoordinates.longitude,
        mapView
      )
    : site;
  const basemapMarkup = buildTileLayerMarkup(mapView);
  const visibleAmenities = state.amenities.filter((item) => item.visible);
  const legendItems = [...visibleAmenities.filter((item) => item.showInLegend)].sort((a, b) =>
    compareAmenitiesForLegend(a, b, state.selectedMode)
  );
  const configuredBands = getConfiguredBandsForMode(state.selectedMode);
  elements.legendCount.textContent = String(
    legendItems.length + configuredBands.length + 1 + (accessProvided ? 1 : 0)
  );
    elements.previewNote.textContent =
      state.selectedMode === "bus"
        ? `${elements.busNote.value} ${BUS_INDICATIVE_METHOD_NOTE}`
        : state.selectedMode === "cycling"
          ? "Cycling mode shows settlements and key destinations such as rail stations, schools and healthcare locations from OpenStreetMap. Cycle distance and time calculations are only run when exporting the CSV. Isochrone geometry comes from live Valhalla routing."
        : "Basemap and amenities are drawn from OpenStreetMap live services. Isochrone geometry comes from live Valhalla routing.";

  const legendInside = elements.legendPosition.value === "inside";
  const legendX = legendInside ? 650 : 742;
  const legendWidth = legendInside ? 248 : 190;

  const bandMarkup = buildIsochroneMarkup(state.isochrones, mapView);
  const pointMarkup = buildAmenityDisplayItems(visibleAmenities, mapView, site)
    .map((item) => `
      <g transform="translate(${item.x} ${item.y})">
        ${drawSymbol(item.symbol, item.color, 8.5, true)}
      </g>
    `)
    .join("");

  const legendRows = [
    { name: "Development site", type: "site-marker", color: "#1d2328" },
    ...(accessProvided ? [{ name: "Proposed access", type: "access-marker", color: "#b35b3d" }] : []),
      ...configuredBands.map((band) => ({
        name: `${config.label} ${band.label}`,
        type: "band",
        color: band.fill,
      })),
      ...legendItems.map((item) => ({
        name: getLegendLabelForAmenity(item, state.selectedMode),
        type: "amenity",
        symbol: item.symbol,
        color: item.color,
      })),
  ];

  const legendBoxY = 28;
  const legendPaddingX = 16;
  const legendPaddingTop = 14;
  const legendLayout = buildLegendLayout(legendRows, legendWidth, legendX, legendBoxY, legendPaddingX, legendPaddingTop);
  const legendHeight = legendLayout.height;
  const legendRowMarkup = legendLayout.markup;

  const siteMarker = drawDevelopmentSiteMarker(site.x, site.y, false);

  const accessMarker = accessProvided ? drawAccessMarker(access.x, access.y, false) : "";
  const projectDisplayName = elements.projectName.value || "Unnamed project";
  const authorityDisplayName = elements.planningAuthority.value || "Planning authority to be confirmed";
  const titleBoxMarkup = buildMapTitleBlock(projectDisplayName, authorityDisplayName);

  elements.mapPreview.innerHTML = `
    <rect width="960" height="640" fill="#f2efe6"></rect>
    <rect x="24" y="24" width="912" height="592" fill="#f8f5ee" stroke="#d7d0c4" stroke-width="1.5"></rect>
    ${basemapMarkup}
    <g opacity="0.82">${bandMarkup}</g>
    ${pointMarkup}
    ${siteMarker}
    ${accessMarker}
    <g>
      <rect x="${legendX}" y="${legendBoxY}" width="${legendWidth}" height="${legendHeight}" fill="#fffdf8" stroke="#d7d0c4"></rect>
      ${legendRowMarkup}
    </g>
    <g>
      ${buildScaleBarMarkup(mapView)}
    </g>
    <g transform="translate(862 560)">
      <path d="M0 -28 L10 0 L0 28 L-10 0 Z" fill="#1d2328"></path>
      <text x="-5" y="-36" font-size="13" fill="#1d2328" font-family="Inter, Arial, sans-serif" font-weight="700">N</text>
    </g>
    ${titleBoxMarkup}
  `;
  elements.mapPreview.style.cursor = state.isPlacingPoint ? "crosshair" : state.isDraggingMap ? "grabbing" : "grab";
}

function renderMethodNote() {
  const config = MODE_CONFIG[state.selectedMode];
  const scenario = state.generatedScenario;
  const visibleCount = state.amenities.filter((item) => item.visible).length;
  const legendCount = state.amenities.filter((item) => item.visible && item.showInLegend).length;
  const generatedDate = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const note = {
    project_name: elements.projectName.value || "Unnamed project",
    planning_authority: elements.planningAuthority.value || "To be confirmed",
    draft_mode: config.label,
    site_coordinates: scenario?.siteCoordinates ?? "Awaiting valid coordinates",
    access_coordinates:
      scenario?.accessCoordinates ?? "Using site coordinates as routing origin",
    draft_bands: getSelectedBandLabels(),
      methodology: {
        status: "Prototype front-end only",
        map_preview:
          state.selectedMode === "bus"
            ? `OpenStreetMap raster tiles with live OpenStreetMap amenity points. ${BUS_INDICATIVE_METHOD_NOTE}`
            : "OpenStreetMap raster tiles with live Overpass amenity points and live Valhalla routed isochrone contours",
        amenity_filtering:
          state.selectedMode === "cycling"
            ? `${visibleCount} visible cycling destinations, ${legendCount} shown in legend, fetched from OpenStreetMap around the current site and measured from the site coordinates`
            : `${visibleCount} visible amenities, ${legendCount} shown in legend, fetched from OpenStreetMap around the current site`,
        cycling_time_assumption:
          state.selectedMode === "cycling" ? CYCLING_TIME_GUIDANCE_TEXT : undefined,
        bus_assumption: elements.busNote.value,
        public_transport_method:
          state.selectedMode === "bus" ? BUS_INDICATIVE_METHOD_NOTE : undefined,
        public_transport_source:
          state.selectedMode === "bus" ? getBusContourSourceNote() : undefined,
        limitations: [
          state.selectedMode === "bus"
            ? "Bus contours are indicative only and should be checked against current bus timetable data before planning issue."
            : "Isochrone geometry depends on a public Valhalla demo server and may be subject to fair-use limits or temporary unavailability.",
          "Amenities are fetched live from OpenStreetMap via Overpass and therefore depend on current public service availability.",
        "The scale bar should still be checked against the final export workflow before issue.",
      ],
    },
    note: elements.projectNote.value,
    generated: generatedDate,
  };

  elements.methodNote.textContent = JSON.stringify(note, null, 2);
}

async function runGenerationSequence() {
  clearGenerationTimers();
  const siteCoordinates = parseCoordinatePair(elements.siteCoordinates.value);
  const accessCoordinates = parseCoordinatePair(elements.accessCoordinates.value, true);

  if (!siteCoordinates) {
    setStatus(
      "Coordinate format issue",
      "Enter site coordinates as 'latitude, longitude' in decimal degrees.",
      "error"
    );
    render();
    return;
  }

  if (elements.accessCoordinates.value.trim() !== "" && !accessCoordinates) {
    setStatus(
      "Coordinate format issue",
      "Enter access coordinates as 'latitude, longitude' or leave the field blank.",
      "error"
    );
    render();
    return;
  }

  state.generatedScenario = buildGeneratedScenario(siteCoordinates, accessCoordinates);
  state.hasGeneratedDraft = true;
  schedulePlanningAuthorityLookup(siteCoordinates);
  setStatus("Draft generation started", "Checking inputs and fetching live OpenStreetMap context.", "running");
  render();
  await refreshLiveContext("Querying OpenStreetMap amenities for the current site.");
}

function setStatus(title, text, tone) {
  state.status = { title, text, tone };
}

function saveOverrides() {
  const overrideEntries = state.amenities
    .filter((item) => item.sourceId)
    .map((item) => [
      item.sourceId,
      {
        name: item.name,
        category: item.category,
        symbol: item.symbol,
        color: item.color,
        visible: item.visible,
        showInLegend: item.showInLegend,
      },
    ]);
  state.savedOverrides = Object.fromEntries(overrideEntries);
  localStorage.setItem("prime-isochrone-overrides", JSON.stringify(state.savedOverrides));
  setStatus("Overrides saved", "Amenity edits were saved on this device.", "ready");
  render();
}

async function resetOverrides() {
  localStorage.removeItem("prime-isochrone-overrides");
  state.savedOverrides = {};
  setStatus("Defaults restored", "Saved overrides were cleared from this device.", "ready");
  await refreshLiveContext("Refreshing live OpenStreetMap amenities without local overrides.");
}

function togglePlacePointMode() {
  state.isPlacingPoint = !state.isPlacingPoint;
  elements.togglePlacePointButton.classList.toggle("toggle-live", state.isPlacingPoint);
  elements.togglePlacePointButton.textContent = state.isPlacingPoint
    ? "Click map to place point"
    : "Place manual point";
  setStatus(
    state.isPlacingPoint ? "Placement mode active" : "Placement mode closed",
    state.isPlacingPoint
      ? "Click within the map preview to add a manual point."
      : "Manual point placement has been cancelled.",
    state.isPlacingPoint ? "running" : "ready"
  );
  render();
}

function onMapClick(event) {
  if (!state.isPlacingPoint) {
    return;
  }

  const svg = event.currentTarget;
  const bounds = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  const clickX = ((event.clientX - bounds.left) / bounds.width) * viewBox.width;
  const clickY = ((event.clientY - bounds.top) / bounds.height) * viewBox.height;
  const scenario = state.generatedScenario;
  const mapView = state.currentMapView ?? buildBestFitMapView(
    scenario ?? buildGeneratedScenario(
      parseCoordinatePair(DEFAULT_SITE_COORDINATES),
      parseCoordinatePair(DEFAULT_ACCESS_COORDINATES, true)
    ),
    state.isochrones,
    MODE_CONFIG[state.selectedMode].zoom
  );
  const coordinatePoint = unprojectSvgToLatLon(clickX, clickY, mapView);

  state.amenities.push({
    id: state.nextAmenityId++,
    name: elements.manualPointName.value || "Manual point",
    category: elements.manualPointCategory.value,
    symbol: elements.manualPointSymbol.value,
    color: "#7a5f9d",
    visible: true,
    showInLegend: true,
    sourceId: `manual-${Date.now()}`,
    latitude: coordinatePoint.latitude,
    longitude: coordinatePoint.longitude,
    isManual: true,
  });

  state.isPlacingPoint = false;
  elements.togglePlacePointButton.classList.remove("toggle-live");
  elements.togglePlacePointButton.textContent = "Place manual point";
  setStatus("Manual point added", "Review the new legend entry and amend its styling if required.", "ready");
  render();
}

async function exportPng() {
  setStatus("Preparing PNG", "Building an export-safe PNG of the current map view.", "running");
  render();

  try {
    const exportSafeSvg = await buildExportSafeSvgDocument();
    const pngBlob = await rasterizeSvgToPngBlob(exportSafeSvg);
    downloadBlob(pngBlob, fileStem("png"));
    setStatus("PNG exported", "PNG map preview downloaded.", "ready");
  } catch (error) {
    setStatus(
      "PNG export error",
      "The map could not be exported to PNG from the current browser session. Please try again.",
      "error"
    );
  }
  render();
}

function exportSvg() {
  const svgMarkup = buildSvgDocument();
  downloadBlob(new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" }), fileStem("svg"));
  setStatus("SVG exported", "Vector map preview downloaded.", "ready");
  render();
}

async function exportCsv() {
  if (state.selectedMode === "cycling") {
    const cycleRows = await buildCyclingCsvRows();
    if (!cycleRows) {
      return;
    }

    const cycleCsv = cycleRows.map((row) => row.map(csvEscape).join(",")).join("\n");
    downloadBlob(new Blob([cycleCsv], { type: "text/csv;charset=utf-8" }), fileStem("csv"));
    setStatus(
      "CSV exported",
      "Amenity schedule downloaded with routed cycling distances from the site and 16 kph cycle times.",
      "ready"
    );
    render();
    return;
  }

  const distanceReference = getCsvDistanceReferencePoint();
  const distanceSettings = getExportDistanceSettings();
  const distanceValues = await getAmenityExportDistances(
    state.amenities,
    distanceReference,
    distanceSettings
  );
  if (!distanceValues) {
    return;
  }

  const rows = distanceSettings.includeWalkingTime
    ? buildWalkingCsvRows(distanceSettings, distanceValues)
    : [
        ["name", "category", "symbol", "colour", distanceSettings.header, "visible", "show_in_legend"],
        ...state.amenities.map((item, index) => [
          item.name,
          item.category,
          item.symbol,
          item.color,
          distanceValues[index],
          item.visible,
          item.showInLegend,
        ]),
      ];
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), fileStem("csv"));
  setStatus(
    "CSV exported",
    hasCsvAccessReference()
      ? `Amenity schedule downloaded with routed ${distanceSettings.label} distances from the proposed access point.`
      : `Amenity schedule downloaded with routed ${distanceSettings.label} distances from the site coordinates.`,
    "ready"
  );
  render();
}

function exportMethodNote() {
  downloadBlob(
    new Blob([elements.methodNote.textContent], { type: "application/json;charset=utf-8" }),
    fileStem("json")
  );
  setStatus("Method note exported", "JSON note downloaded for review.", "ready");
  render();
}

function buildSvgDocument() {
  const svgMarkup = elements.mapPreview.outerHTML
    .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ');
  return `<?xml version="1.0" encoding="UTF-8"?>${svgMarkup}`;
}

async function buildExportSafeSvgDocument() {
  const parser = new DOMParser();
  const svgDocument = parser.parseFromString(buildSvgDocument(), "image/svg+xml");
  const imageNodes = Array.from(svgDocument.querySelectorAll("image"));

  await Promise.all(
    imageNodes.map(async (imageNode) => {
      const href =
        imageNode.getAttribute("href") ||
        imageNode.getAttributeNS("http://www.w3.org/1999/xlink", "href");

      if (!href || !href.startsWith("http")) {
        return;
      }

      try {
        const dataUrl = await fetchImageAsDataUrl(href);
        imageNode.setAttribute("href", dataUrl);
        imageNode.removeAttribute("crossorigin");
      } catch (error) {
        imageNode.remove();
      }
    })
  );

  return new XMLSerializer().serializeToString(svgDocument);
}

async function fetchImageAsDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image request failed with status ${response.status}`);
  }

  const imageBlob = await response.blob();
  return blobToDataUrl(imageBlob);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed."));
    reader.readAsDataURL(blob);
  });
}

async function rasterizeSvgToPngBlob(svgMarkup) {
  const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(svgUrl);
    const canvas = document.createElement("canvas");
    canvas.width = MAP_DIMENSIONS.width;
    canvas.height = MAP_DIMENSIONS.height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context is not available.");
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pngBlob = await canvasToBlob(canvas, "image/png");
    if (!pngBlob) {
      throw new Error("Canvas export returned no PNG data.");
    }
    return pngBlob;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image load failed."));
    image.src = url;
  });
}

function canvasToBlob(canvas, type) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type);
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function fileStem(extension) {
  const cleanName = (elements.projectName.value || "isochrone-draft")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${cleanName || "isochrone-draft"}-${state.selectedMode}.${extension}`;
}

function getCsvDistanceReferencePoint() {
  if (state.selectedMode === "cycling") {
    return (
      state.generatedScenario?.siteCoordinates ??
      parseCoordinatePair(elements.siteCoordinates.value) ??
      parseCoordinatePair(DEFAULT_SITE_COORDINATES)
    );
  }

  return (
    state.generatedScenario?.accessCoordinates ??
    state.generatedScenario?.siteCoordinates ??
    parseCoordinatePair(elements.accessCoordinates.value, true) ??
    parseCoordinatePair(elements.siteCoordinates.value) ??
    parseCoordinatePair(DEFAULT_SITE_COORDINATES)
  );
}

function hasCsvAccessReference() {
  return Boolean(
    state.generatedScenario?.accessCoordinates ||
    parseCoordinatePair(elements.accessCoordinates.value, true)
  );
}

function getExportDistanceSettings() {
  if (state.selectedMode === "cycling") {
    return {
      costing: "bicycle",
      header: "cycling_distance_m",
      label: "cycling",
      includeWalkingTime: false,
    };
  }

  if (state.selectedMode === "bus") {
    return {
      costing: "pedestrian",
      header: "walking_access_distance_m",
      label: "walking access",
      includeWalkingTime: false,
    };
  }

  return {
    costing: "pedestrian",
    header: "walking_distance_m",
    label: "walking",
    includeWalkingTime: true,
    walkingSpeedHeader: "walking_speed_kph",
    walkingSpeedDefault: 4.8,
    preferredMaxHeader: "preferred_max_walking_distance_m",
    walkingTimeHeader: "walking_time_mmss",
  };
}

function buildWalkingCsvRows(distanceSettings, distanceValues) {
  const dataStartRow = 4;
  return [
    [distanceSettings.walkingSpeedHeader, distanceSettings.walkingSpeedDefault],
    [],
    [
      "name",
      "category",
      "symbol",
      "colour",
      distanceSettings.header,
      distanceSettings.preferredMaxHeader,
      distanceSettings.walkingTimeHeader,
      "visible",
      "show_in_legend",
    ],
    ...state.amenities.map((item, index) => [
      item.name,
      item.category,
      item.symbol,
      item.color,
      distanceValues[index],
      getPreferredMaxWalkingDistance(item.category),
      buildWalkingTimeFormula(dataStartRow + index),
      item.visible,
      item.showInLegend,
    ]),
    ];
}

async function buildCyclingCsvRows() {
  const siteCoordinates =
    state.generatedScenario?.siteCoordinates ??
    parseCoordinatePair(elements.siteCoordinates.value) ??
    parseCoordinatePair(DEFAULT_SITE_COORDINATES);

  if (!siteCoordinates) {
    setStatus("CSV export error", "Valid site coordinates are required before exporting cycle metrics.", "error");
    render();
    return null;
  }

  const cycleMetricResult = await ensureCyclingMetrics(siteCoordinates, {
    allowFallback: true,
    statusPrefix: "CSV export",
  });

  const metricUnavailableCount = state.amenities.filter(
    (item) => item.cyclingMetricStatus === "unavailable"
  ).length;

  return [
    ["cycling_speed_kph", CYCLING_SPEED_KPH],
    ["cycle_time_note", CYCLING_TIME_GUIDANCE_TEXT],
    ...(cycleMetricResult.ok || metricUnavailableCount === 0
      ? []
      : [["cycle_metric_status", cycleMetricResult.message || "Some cycle metrics were unavailable at export time."]]),
    [],
    [
      "name",
      "category",
      "symbol",
      "colour",
      "cycling_distance_m",
      "cycling_time_mmss",
      "visible",
      "show_in_legend",
    ],
    ...state.amenities.map((item) => [
      item.name,
      item.category,
      item.symbol,
      item.color,
      Number.isFinite(item.cyclingDistanceM) ? Math.round(item.cyclingDistanceM) : "",
      Number.isFinite(item.cyclingTimeSeconds) ? formatDurationMmSs(item.cyclingTimeSeconds) : "",
      item.visible,
      item.showInLegend,
    ]),
  ];
}

function getPreferredMaxWalkingDistance(category) {
  if (category === "Bus stop") {
    return "";
  }

  if (["Rail station", "Employment", "Education"].includes(category)) {
    return 2000;
  }

  return 1200;
}

function buildWalkingTimeFormula(rowNumber) {
  return `=IF(OR(E${rowNumber}="",$B$1=""),"",TEXT((E${rowNumber}/1000)/$B$1/24,"[m]:ss"))`;
}

async function ensureCyclingMetrics(siteCoordinates, options = {}) {
  const cyclingTargets = state.amenities.filter(
    (item) =>
      item.latitude !== undefined &&
      item.longitude !== undefined &&
      (!Number.isFinite(item.cyclingDistanceM) || !Number.isFinite(item.cyclingTimeSeconds))
  );

  if (cyclingTargets.length === 0) {
    return { ok: true, message: "" };
  }

  if (!options.silent) {
    setStatus(
      "Calculating cycle metrics",
      "Working out routed cycling distances from the site and applying the 16 kph cycle-time assumption.",
      "running"
    );
    render();
  }

    try {
      const routedDistances = await fetchRoutedDistancesForTargets(
        siteCoordinates,
        cyclingTargets.map((item, index) => ({ item, index })),
        "bicycle"
    );
    cyclingTargets.forEach((item, index) => {
      const distanceMetres = routedDistances[index];
      if (!Number.isFinite(distanceMetres)) {
        item.cyclingDistanceM = null;
        item.cyclingTimeSeconds = null;
        item.cyclingMetricStatus = "unavailable";
        return;
      }

      item.cyclingDistanceM = Math.round(distanceMetres);
        item.cyclingTimeSeconds = getCyclingTimeSeconds(distanceMetres);
        item.cyclingMetricStatus = "ready";
      });
      const unavailableCount = cyclingTargets.filter(
        (item) => item.cyclingMetricStatus === "unavailable"
      ).length;
      if (unavailableCount > 0) {
        return {
          ok: false,
          message: `Cycle metrics were unavailable for ${unavailableCount} destination${unavailableCount === 1 ? "" : "s"} because routing data could not be returned for those locations.`,
        };
      }
      return { ok: true, message: "" };
    } catch (error) {
    cyclingTargets.forEach((item) => {
      item.cyclingDistanceM = null;
      item.cyclingTimeSeconds = null;
      item.cyclingMetricStatus = "unavailable";
    });

      if (!options.allowFallback && !options.silent) {
        setStatus(
          "Cycle metric issue",
          describeServiceFailure(options.statusPrefix || "Cycle metrics", error),
        "warning"
      );
      render();
    }

    return {
      ok: false,
      message: describeServiceFailure(options.statusPrefix || "Cycle metrics", error),
    };
  }
}

function getCyclingTimeSeconds(distanceMetres) {
  return Math.round((Number(distanceMetres) / 1000 / CYCLING_SPEED_KPH) * 3600);
}

function formatDurationMmSs(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "";
  }
  const roundedSeconds = Math.round(totalSeconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDistanceMetres(distanceMetres) {
  if (!Number.isFinite(distanceMetres) || distanceMetres < 0) {
    return "";
  }
  return `${Math.round(distanceMetres).toLocaleString("en-GB")} m`;
}

function getAmenityDistanceDisplay(item, mode) {
  if (mode === "cycling") {
    return formatDistanceMetres(item.cyclingDistanceM);
  }
  return "";
}

function getAmenityTimeDisplay(item, mode) {
  if (mode === "cycling") {
    return formatDurationMmSs(item.cyclingTimeSeconds);
  }
  return "";
}

function getLegendLabelForAmenity(item, mode) {
  return item.name;
}

async function fetchRoutedDistancesForTargets(referencePoint, routedTargets, costing) {
  const exportDistances = new Array(routedTargets.length).fill("");
  const batchSize = 3;

  for (let batchStart = 0; batchStart < routedTargets.length; batchStart += batchSize) {
    const batch = routedTargets.slice(batchStart, batchStart + batchSize);
    const batchResults = await Promise.all(
      batch.map(async ({ item }) => {
        const payload = {
          locations: [
            {
              lat: referencePoint.latitude,
              lon: referencePoint.longitude,
            },
            {
              lat: item.latitude,
              lon: item.longitude,
            },
          ],
          costing,
          units: "kilometers",
          directions_options: {
            units: "kilometers",
          },
        };

        const routePayload = await fetchJsonWithDiagnostics(
          `${VALHALLA_ROUTE_ENDPOINT}?json=${encodeURIComponent(JSON.stringify(payload))}`,
          undefined,
          "Valhalla route"
        );

        if (routePayload.error) {
          throw createServiceError(
            "Valhalla route",
            classifyRoutingPayloadKind(routePayload.error),
            buildServiceKindMessage(
              "Valhalla route",
              classifyRoutingPayloadKind(routePayload.error),
              normaliseServiceMessage("Valhalla route", routePayload.error)
            )
          );
        }

        const distanceKilometres = routePayload.trip?.summary?.length;
        return distanceKilometres === null || distanceKilometres === undefined
          ? ""
          : Math.round(Number(distanceKilometres) * 1000);
      })
    );

    batchResults.forEach((distanceValue, batchIndex) => {
      exportDistances[batchStart + batchIndex] = distanceValue;
    });
  }

  return exportDistances;
}

async function fetchJsonWithDiagnostics(url, options, serviceName, timeoutMs = SERVICE_TIMEOUT_MS[serviceName] ?? 8000) {
  let response;
  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);
  let removeAbortListener = null;
  if (options?.signal) {
    if (options.signal.aborted) {
      abortController.abort();
    } else {
      const onAbort = () => abortController.abort();
      options.signal.addEventListener("abort", onAbort, { once: true });
      removeAbortListener = () => options.signal.removeEventListener("abort", onAbort);
    }
  }
  const requestOptions = {
    ...(options ?? {}),
    signal: abortController.signal,
  };

  try {
    response = await fetch(url, requestOptions);
  } catch (error) {
    clearTimeout(timeoutHandle);
    removeAbortListener?.();
    if (options?.signal?.aborted) {
      throw createServiceError(
        serviceName,
        "cancelled",
        `${serviceName} request was cancelled.`
      );
    }
    if (error?.name === "AbortError") {
      throw createServiceError(
        serviceName,
        "api_outage",
        `${serviceName} did not respond within ${Math.round(timeoutMs / 1000)} seconds.`
      );
    }
    throw createServiceError(
      serviceName,
      "connectivity",
      `${serviceName} could not be reached. Check connectivity and try again.`
    );
  }

  const responseText = await response.text();
  clearTimeout(timeoutHandle);
  removeAbortListener?.();
  let payload = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch (error) {
      payload = null;
    }
  }

  if (!response.ok) {
    throw classifyServiceResponseError(serviceName, response.status, responseText, payload);
  }

  if (payload !== null) {
    return payload;
  }

  if (!responseText.trim()) {
    return {};
  }

  throw createServiceError(
    serviceName,
    "malformed_request",
    `${serviceName} returned a response that could not be read.`
  );
}

function classifyServiceResponseError(serviceName, status, responseText, payload) {
  const responseMessage = normaliseServiceMessage(
    serviceName,
    payload?.error || payload?.message || responseText
  );
  const routingKind = classifyRoutingPayloadKind(responseMessage);

  if (status === 429) {
    return createServiceError(
      serviceName,
      "rate_limit",
      `${serviceName} has rate-limited the request. Please wait a moment and try again.`
    );
  }

  if (status >= 500) {
    return createServiceError(
      serviceName,
      "api_outage",
      `${serviceName} is temporarily unavailable or overloaded. Please try again shortly.`
    );
  }

  if (status === 400 || status === 404 || status === 422) {
    return createServiceError(
      serviceName,
      routingKind,
      buildServiceKindMessage(serviceName, routingKind, responseMessage)
    );
  }

  return createServiceError(
    serviceName,
    "api_outage",
    `${serviceName} returned status ${status}. ${responseMessage}`
  );
}

function buildServiceKindMessage(serviceName, kind, detail) {
  if (kind === "invalid_site_location") {
    return `${serviceName} could not use the selected site coordinates. Check that the site point is valid and located in the expected area.`;
  }
  if (kind === "unavailable_routing_data") {
    return `${serviceName} could not find usable routing data for the selected location. ${detail}`;
  }
  if (kind === "malformed_request") {
    return `${serviceName} rejected the request format. ${detail}`;
  }
  return detail;
}

function classifyRoutingPayloadKind(message) {
  const lowerMessage = String(message || "").toLowerCase();
  if (
    lowerMessage.includes("no suitable edges") ||
    lowerMessage.includes("no path could be found") ||
    lowerMessage.includes("not located on") ||
    lowerMessage.includes("outside") ||
    lowerMessage.includes("unreachable")
  ) {
    return "unavailable_routing_data";
  }
  if (
    lowerMessage.includes("invalid") ||
    lowerMessage.includes("malformed") ||
    lowerMessage.includes("parse")
  ) {
    return "malformed_request";
  }
  if (
    lowerMessage.includes("location") ||
    lowerMessage.includes("coordinate") ||
    lowerMessage.includes("lat") ||
    lowerMessage.includes("lon")
  ) {
    return "invalid_site_location";
  }
  return "unavailable_routing_data";
}

function normaliseServiceMessage(serviceName, message) {
  const trimmedMessage = String(message || "").replace(/\s+/g, " ").trim();
  if (!trimmedMessage) {
    return `${serviceName} did not provide any further detail.`;
  }
  return trimmedMessage;
}

function createServiceError(serviceName, kind, message) {
  const error = new Error(message);
  error.serviceName = serviceName;
  error.kind = kind;
  error.userMessage = message;
  return error;
}

function describeServiceFailure(subject, error) {
  const prefix = subject ? `${subject}: ` : "";
  if (error?.userMessage) {
    return `${prefix}${error.userMessage}`;
  }

  return `${prefix}${String(error?.message || "The request did not complete.")}`;
}

async function getAmenityExportDistances(amenities, referencePoint, distanceSettings) {
  if (!referencePoint) {
    setStatus("CSV export error", "Valid site coordinates are required before exporting distances.", "error");
    render();
    return null;
  }

  const targets = amenities.map((item, index) => ({
    item,
    index,
  }));
  const routedTargets = targets.filter(
    ({ item }) => item.latitude !== undefined && item.longitude !== undefined
  );

  if (routedTargets.length === 0) {
    return amenities.map(() => "");
  }

  setStatus(
    "Calculating distances",
    `Working out routed ${distanceSettings.label} distances for the CSV export.`,
    "running"
  );
  render();

  try {
    return await fetchRouteDistancesForExport(
      amenities,
      referencePoint,
      routedTargets,
      distanceSettings
    );
  } catch (error) {
    setStatus(
      "CSV export error",
      describeServiceFailure("CSV export", error),
      "error"
    );
    render();
    return null;
  }
}

async function fetchRouteDistancesForExport(amenities, referencePoint, routedTargets, distanceSettings) {
  const exportDistances = amenities.map(() => "");
  const routedDistanceValues = await fetchRoutedDistancesForTargets(
    referencePoint,
    routedTargets,
    distanceSettings.costing
  );
  routedTargets.forEach(({ index }, routedIndex) => {
    exportDistances[index] = routedDistanceValues[routedIndex];
  });
  return exportDistances;
}

function getSelectedBandLabels() {
  if (state.selectedMode === "walking") {
    return splitBands(elements.walkingBands.value);
  }
  if (state.selectedMode === "cycling") {
    return splitBands(elements.cyclingBands.value);
  }
  return splitBands(elements.busBands.value);
}

function getConfiguredBandsForMode(mode) {
  const config = MODE_CONFIG[mode];
  const rawEntries = getSelectedBandLabelsForMode(mode);
  const configuredColours = getSelectedBandColoursForMode(mode);
  if (rawEntries.length !== config.bands.length) {
    return config.bands.map((band, index) => ({
      ...band,
      fill: configuredColours[index] ?? band.fill,
    }));
  }

  const parsedBands = rawEntries
    .map((entry, index) =>
      parseConfiguredBandEntry(
        entry,
        mode,
        {
          ...config.bands[index],
          fill: configuredColours[index] ?? config.bands[index].fill,
        }
      )
    )
    .filter(Boolean);

  return parsedBands.length === config.bands.length
    ? parsedBands
    : config.bands.map((band, index) => ({
        ...band,
        fill: configuredColours[index] ?? band.fill,
      }));
}

function getSelectedBandLabelsForMode(mode) {
  if (mode === "walking") {
    return splitBands(elements.walkingBands.value);
  }
  if (mode === "cycling") {
    return splitBands(elements.cyclingBands.value);
  }
  return splitBands(elements.busBands.value);
}

function getSelectedBandColoursForMode(mode) {
  if (mode === "walking") {
    return [elements.walkingColor1.value, elements.walkingColor2.value];
  }
  if (mode === "cycling") {
    return [elements.cyclingColor1.value, elements.cyclingColor2.value, elements.cyclingColor3.value];
  }
  return [elements.busColor1.value, elements.busColor2.value, elements.busColor3.value, elements.busColor4.value];
}

function parseConfiguredBandEntry(entry, mode, fallbackBand) {
  const numeric = Number(entry.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(numeric) || numeric <= 0) {
    return null;
  }

  if (mode === "bus") {
    return {
      ...fallbackBand,
      label: entry,
      time: numeric,
    };
  }

  return {
    ...fallbackBand,
    label: entry,
    distance: numeric / 1000,
  };
}

function handleCoordinateDraftChange() {
  const siteCoordinates = parseCoordinatePair(elements.siteCoordinates.value);
  const accessCoordinates = parseCoordinatePair(elements.accessCoordinates.value, true);

  if (!siteCoordinates) {
    setStatus(
      "Coordinate format issue",
      "Use a single box in the form 'latitude, longitude'.",
      "error"
    );
    render();
    return;
  }

  if (elements.accessCoordinates.value.trim() !== "" && !accessCoordinates) {
    setStatus(
      "Coordinate format issue",
      "Access coordinates should use the same 'latitude, longitude' format or be left blank.",
      "error"
    );
    render();
    return;
  }

  setStatus(
    "Coordinates updated",
    "Select Generate draft map to recalculate the preview from the new coordinates.",
    "warning"
  );
  schedulePlanningAuthorityLookup(siteCoordinates);
  render();
}

function onMapZoomAdjustChange() {
  const nextZoomValue = Number(elements.mapZoomAdjust.value);
  const zoomDelta = nextZoomValue - state.lastZoomControlValue;
  state.lastZoomControlValue = nextZoomValue;
  elements.mapZoomAdjustValue.textContent = formatMapZoomAdjustValue();

  if (zoomDelta === 0) {
    return;
  }

  const scenario = state.generatedScenario ?? buildGeneratedScenario(
    parseCoordinatePair(DEFAULT_SITE_COORDINATES),
    parseCoordinatePair(DEFAULT_ACCESS_COORDINATES, true)
  );
  const baseView = state.currentMapView ?? buildBestFitMapView(
    scenario,
    state.isochrones,
    MODE_CONFIG[state.selectedMode].zoom
  );
  state.currentMapView = adjustMapViewZoom(baseView, zoomDelta);
  renderMap();
}

function recenterMapView() {
  state.currentMapView = null;
  elements.mapZoomAdjust.value = "0";
  state.lastZoomControlValue = 0;
  elements.mapZoomAdjustValue.textContent = formatMapZoomAdjustValue();
  renderMap();
}

function onMapPointerDown(event) {
  if (state.isPlacingPoint || event.button !== 0) {
    return;
  }

  event.preventDefault();
  state.isDraggingMap = true;
  state.mapDragPointerId = event.pointerId;
  state.mapDragLastPoint = { x: event.clientX, y: event.clientY };
  elements.mapPreview.setPointerCapture?.(event.pointerId);
  elements.mapPreview.style.cursor = "grabbing";
}

function onMapPointerMove(event) {
  if (!state.isDraggingMap || event.pointerId !== state.mapDragPointerId || !state.currentMapView) {
    return;
  }

  const bounds = elements.mapPreview.getBoundingClientRect();
  const viewBox = elements.mapPreview.viewBox.baseVal;
  const deltaX = ((event.clientX - state.mapDragLastPoint.x) / bounds.width) * viewBox.width;
  const deltaY = ((event.clientY - state.mapDragLastPoint.y) / bounds.height) * viewBox.height;
  state.mapDragLastPoint = { x: event.clientX, y: event.clientY };
  state.currentMapView = {
    ...state.currentMapView,
    topLeft: {
      x: state.currentMapView.topLeft.x - deltaX,
      y: state.currentMapView.topLeft.y - deltaY,
    },
  };
  renderMap();
}

function onMapPointerUp(event) {
  if (event.pointerId !== state.mapDragPointerId) {
    return;
  }

  state.isDraggingMap = false;
  state.mapDragPointerId = null;
  state.mapDragLastPoint = null;
  elements.mapPreview.releasePointerCapture?.(event.pointerId);
  elements.mapPreview.style.cursor = state.isPlacingPoint ? "crosshair" : "grab";
}

function splitBands(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function loadSavedOverrides() {
  const raw = localStorage.getItem("prime-isochrone-overrides");
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

function buildGeneratedScenario(siteCoordinates, accessCoordinates) {
  return {
    siteCoordinates,
    accessCoordinates,
  };
}

function schedulePlanningAuthorityLookup(siteCoordinates) {
  if (!siteCoordinates) {
    return;
  }

  if (state.planningAuthorityLookupTimer) {
    clearTimeout(state.planningAuthorityLookupTimer);
  }

  const requestId = ++state.latestPlanningAuthorityLookupId;
  state.planningAuthorityLookupTimer = setTimeout(() => {
    resolvePlanningAuthorityFromCoordinates(siteCoordinates, requestId);
  }, 700);
}

async function resolvePlanningAuthorityFromCoordinates(siteCoordinates, requestId) {
  if (!canOverwritePlanningAuthority()) {
    return;
  }

  try {
    const planningAuthorityName = await lookupPlanningAuthorityForCoordinates(siteCoordinates);
    if (!planningAuthorityName || requestId !== state.latestPlanningAuthorityLookupId) {
      return;
    }

    if (!canOverwritePlanningAuthority()) {
      return;
    }

    elements.planningAuthority.value = planningAuthorityName;
    state.lastAutoPlanningAuthority = planningAuthorityName;
    render();
  } catch (error) {
    // Best-effort quality-of-life feature only; leave the field editable if lookup fails.
  }
}

function canOverwritePlanningAuthority() {
  const currentValue = elements.planningAuthority.value.trim();
  return currentValue === "" || currentValue === state.lastAutoPlanningAuthority;
}

async function lookupPlanningAuthorityForCoordinates(siteCoordinates) {
  const types = "DIS,LBO,MTD,UTA,LGD,COI,CTY";
  const url = `${MAPIT_POINT_ENDPOINT}/${siteCoordinates.longitude},${siteCoordinates.latitude}?type=${types}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`MapIt lookup failed with status ${response.status}`);
  }

  const areas = await response.json();
  return pickBestPlanningAuthorityName(areas);
}

function pickBestPlanningAuthorityName(areas) {
  const areaList = Object.values(areas ?? {});
  if (areaList.length === 0) {
    return "";
  }

  const priority = {
    DIS: 1,
    LBO: 2,
    MTD: 3,
    UTA: 4,
    LGD: 5,
    COI: 6,
    CTY: 7,
  };

  return areaList
    .filter((area) => area?.name)
    .sort((a, b) => (priority[a.type] ?? 99) - (priority[b.type] ?? 99))[0]?.name ?? "";
}

function compareAmenitiesForLegend(itemA, itemB, mode) {
  const categoryOrder = getCategoryOrderForMode(mode);
  const categoryIndexA = categoryOrder.indexOf(itemA.category);
  const categoryIndexB = categoryOrder.indexOf(itemB.category);

  if (categoryIndexA !== categoryIndexB) {
    return (categoryIndexA === -1 ? 99 : categoryIndexA) - (categoryIndexB === -1 ? 99 : categoryIndexB);
  }

  return String(itemA.name).localeCompare(String(itemB.name), "en-GB", { sensitivity: "base" });
}

function buildLegendLayout(legendRows, legendWidth, legendX, legendBoxY, legendPaddingX, legendPaddingTop) {
  const textMaxWidth = legendWidth - legendPaddingX * 2 - 28;
  let cursorY = legendBoxY + legendPaddingTop + 8;
  let totalContentHeight = 0;

  const rowMarkup = legendRows
    .map((item) => {
      const wrappedLines = wrapLegendLabel(item.name, textMaxWidth, 12);
      const rowHeight = Math.max(24, wrappedLines.length * 14 + 2);
      const iconMarkup =
        item.type === "band"
          ? drawBandSwatch(item.color)
          : item.type === "site-marker"
            ? drawDevelopmentSiteMarker(0, 0, true)
            : item.type === "access-marker"
              ? drawAccessMarker(0, 0, true)
              : drawSymbol(item.symbol, item.color, 9, true);
      const textMarkup = wrappedLines
        .map(
          (line, lineIndex) =>
            `<tspan x="18" dy="${lineIndex === 0 ? 0 : 14}">${escapeHtml(line)}</tspan>`
        )
        .join("");
      const row = `
        <g transform="translate(${legendX + legendPaddingX} ${cursorY})">
          ${iconMarkup}
          <text x="18" y="4" font-size="12" fill="#1d2328" font-family="Inter, Arial, sans-serif">${textMarkup}</text>
        </g>
      `;
      cursorY += rowHeight;
      totalContentHeight += rowHeight;
      return row;
    })
    .join("");

  return {
    height: Math.max(140, legendPaddingTop * 2 + totalContentHeight),
    markup: rowMarkup,
  };
}

function wrapLegendLabel(text, maxWidth, fontSize) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }

  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (estimateSvgTextWidth(candidate, fontSize, 0.58) <= maxWidth || currentLine === "") {
      currentLine = candidate;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function formatMapZoomAdjustValue() {
  const adjustValue = Number(elements.mapZoomAdjust.value);
  if (adjustValue === 0) {
    return "Auto fit";
  }
  const formattedValue = Number.isInteger(adjustValue)
    ? String(adjustValue)
    : adjustValue.toFixed(2).replace(/\.?0+$/, "");
  return adjustValue > 0 ? `Zoom in ${formattedValue}` : `Zoom out ${Math.abs(adjustValue).toFixed(2).replace(/\.?0+$/, "")}`;
}

function parseCoordinatePair(value, allowBlank = false) {
  const trimmed = value.trim();
  if (trimmed === "") {
    return allowBlank ? null : null;
  }

  const match = trimmed.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/
  );

  if (!match) {
    return null;
  }

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);

  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

function clearGenerationTimers() {
  state.generationTimers.forEach((timer) => clearTimeout(timer));
  state.generationTimers = [];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

async function refreshLiveContext(statusText) {
  if (!state.generatedScenario?.siteCoordinates) {
    return;
  }

  if (state.activeRefreshController) {
    state.activeRefreshController.abort();
  }
  const refreshController = new AbortController();
  state.activeRefreshController = refreshController;
  const requestId = ++state.latestFetchRequestId;
  state.lastIsochroneFallbackNotice = "";
  state.lastIsochroneSourceNote = "";
  setStatus("Loading isochrones", "Fetching routed isochrone geometry for the current site.", "running");
  render();

  const originCoordinates =
      state.generatedScenario.accessCoordinates ?? state.generatedScenario.siteCoordinates;
  const manualAmenities = state.amenities.filter((item) => item.isManual);
  const cachedAmenities = getCachedAmenitiesForScenario(state.generatedScenario.siteCoordinates, state.selectedMode);
  if (cachedAmenities) {
    applyAmenityState(cachedAmenities, manualAmenities);
    render();
  }

  const amenityPromise = fetchAmenitiesForScenario(
    state.generatedScenario.siteCoordinates,
    state.selectedMode,
    { signal: refreshController.signal }
  );

  let isochroneError = null;
  try {
    const liveIsochrones = await fetchIsochronesForScenario(originCoordinates, state.selectedMode, {
      signal: refreshController.signal,
    });

    if (requestId !== state.latestFetchRequestId) {
      return;
    }

    state.isochrones = liveIsochrones;
    state.lastIsochroneFallbackNotice = liveIsochrones.fallbackNotice || "";
    state.lastIsochroneSourceNote = liveIsochrones.sourceNote || "";
    setStatus(
      "Isochrones ready",
      state.lastIsochroneFallbackNotice
        ? `${state.lastIsochroneFallbackNotice} Updating amenities in the background.`
        : cachedAmenities
        ? "Isochrones refreshed. Updating amenities in the background."
        : statusText,
      state.lastIsochroneFallbackNotice ? "warning" : "running"
    );
    render();
  } catch (error) {
    isochroneError = error;
    if (error?.kind === "cancelled") {
      return;
    }
    if (requestId !== state.latestFetchRequestId) {
      return;
    }

    state.isochrones = [];
    setStatus(
      "Isochrone issue",
      describeServiceFailure("Isochrones", error),
      "error"
    );
    render();
  }

  if (requestId !== state.latestFetchRequestId) {
    return;
  }

  try {
    await handleAmenityRefresh(
      requestId,
      state.generatedScenario.siteCoordinates,
      state.selectedMode,
      manualAmenities,
      cachedAmenities,
      amenityPromise,
      isochroneError,
      refreshController.signal
    );
  } finally {
    if (state.activeRefreshController === refreshController) {
      state.activeRefreshController = null;
    }
  }
}

async function fetchAmenitiesForScenario(siteCoordinates, mode, options = {}) {
  const config = getAmenityFetchConfig(mode);
  const radii = config.radii;
  let lastError = null;
  const overpassEndpoints = config.endpoints;
  const requestTimeoutMs = options.timeoutMsOverride ?? config.timeoutMs;

  for (const endpoint of overpassEndpoints) {
    for (const radius of radii) {
      try {
        const query = config.queryBuilder(siteCoordinates, radius);
        const payload = await fetchJsonWithDiagnostics(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=UTF-8",
          },
          body: query,
          signal: options.signal,
        }, "Overpass", requestTimeoutMs);
        const amenities = config.transformer(payload.elements ?? [], siteCoordinates);
        if (amenities.length > 0 || radius === radii[radii.length - 1]) {
          cacheAmenitiesForScenario(siteCoordinates, mode, amenities);
          return amenities;
        }
      } catch (error) {
        lastError = error;
        if (error?.kind === "malformed_request" || error?.kind === "invalid_site_location") {
          throw error;
        }
      }
    }
  }

  if (config.fallbackFetcher) {
    try {
      const fallbackAmenities = await config.fallbackFetcher(siteCoordinates, options);
      if (fallbackAmenities.length > 0) {
        cacheAmenitiesForScenario(siteCoordinates, mode, fallbackAmenities);
        return fallbackAmenities;
      }
    } catch (fallbackError) {
      lastError = fallbackError;
    }
  }

  throw lastError ?? new Error("Overpass amenity request did not complete.");
}

function getAmenityFetchConfig(mode) {
  if (mode === "cycling") {
    return {
      endpoints: [],
      radii: [],
      timeoutMs: 0,
      queryBuilder: buildCyclingOverpassQuery,
      transformer: (elements, siteCoordinates) =>
        transformOverpassElements(elements, siteCoordinates, "cycling"),
      fallbackFetcher: (targetSiteCoordinates, options) =>
        fetchNominatimAmenities(targetSiteCoordinates, "cycling", options),
    };
  }

  if (mode === "bus") {
    return {
      endpoints: OVERPASS_ENDPOINTS,
      radii: [4500, 3200, 2200],
      timeoutMs: 30000,
      queryBuilder: buildLocalOverpassQuery,
      transformer: (elements, siteCoordinates) =>
        transformOverpassElements(elements, siteCoordinates, "bus"),
      fallbackFetcher: (targetSiteCoordinates, options) =>
        fetchNominatimAmenities(targetSiteCoordinates, "bus", options),
    };
  }

  return {
    endpoints: OVERPASS_ENDPOINTS,
    radii: [1600, 1200, 900],
    timeoutMs: 30000,
    queryBuilder: buildLocalOverpassQuery,
    transformer: (elements, siteCoordinates) =>
      transformOverpassElements(elements, siteCoordinates, "walking"),
    fallbackFetcher: (targetSiteCoordinates, options) =>
      fetchNominatimAmenities(targetSiteCoordinates, "walking", options),
  };
}

async function handleAmenityRefresh(
  requestId,
  siteCoordinates,
  mode,
  manualAmenities,
  cachedAmenities,
  amenityPromise,
  isochroneError,
  signal
) {
  try {
    const liveAmenities = await amenityPromise;
    if (requestId !== state.latestFetchRequestId) {
      return;
    }

    applyAmenityState(liveAmenities, manualAmenities);

    if (!isochroneError && state.lastIsochroneFallbackNotice) {
      setStatus(
        "Draft ready with warnings",
        state.lastIsochroneFallbackNotice,
        "warning"
      );
    } else if (!isochroneError) {
      setStatus(
        "Draft ready",
        "Live OpenStreetMap context and Valhalla isochrones refreshed for the current coordinates.",
        "ready"
      );
    } else {
      setStatus(
        "Draft ready with warnings",
        describeServiceFailure("Isochrones", isochroneError),
        "warning"
      );
    }
    render();
  } catch (error) {
    if (error?.kind === "cancelled" || requestId !== state.latestFetchRequestId) {
      return;
    }

    const warningText = cachedAmenities
      ? `${describeServiceFailure("Amenities", error)} Using the last successful amenity set for this location as a fallback.`
      : describeServiceFailure("Amenities", error);
    const combinedWarningText = state.lastIsochroneFallbackNotice
      ? `${state.lastIsochroneFallbackNotice} ${warningText}`
      : warningText;

    if (!isochroneError) {
      setStatus("Draft ready with warnings", combinedWarningText, "warning");
    } else {
      setStatus(
        "Live service issue",
        `${describeServiceFailure("Isochrones", isochroneError)} ${combinedWarningText}`.trim(),
        "error"
      );
    }
    render();

    retryAmenitiesInBackground(siteCoordinates, mode, requestId, manualAmenities, signal);
  }
}

function applyAmenityState(liveAmenities, manualAmenities) {
  state.amenities = applySavedOverrides([...(liveAmenities ?? []), ...(manualAmenities ?? [])]);
  state.nextAmenityId = Math.max(...state.amenities.map((item) => item.id), 0) + 1;
}

async function retryAmenitiesInBackground(siteCoordinates, mode, requestId, manualAmenities, signal) {
  try {
    const liveAmenities = await fetchAmenitiesForScenario(siteCoordinates, mode, {
      timeoutMsOverride: 30000,
      signal,
    });

    if (requestId !== state.latestFetchRequestId) {
      return;
    }

    applyAmenityState(liveAmenities, manualAmenities);
    setStatus(
      "Draft ready",
      "Amenities refreshed after a slower OpenStreetMap response.",
      "ready"
    );
    render();
  } catch (error) {
    if (error?.kind === "cancelled" || requestId !== state.latestFetchRequestId) {
      return;
    }
    // Keep the earlier warning state when the slower retry also fails.
  }
}

function getOverpassEndpointsForMode(mode) {
  return OVERPASS_ENDPOINTS;
}

function getOverpassRequestTimeoutMs(mode) {
  return 30000;
}

function buildOverpassQuery(siteCoordinates, radius, mode = state.selectedMode) {
  return mode === "cycling"
    ? buildCyclingOverpassQuery(siteCoordinates, radius)
    : buildLocalOverpassQuery(siteCoordinates, radius);
}

function buildCyclingOverpassQuery(siteCoordinates, radius) {
  return `
[out:json][timeout:30];
(
  node(around:${radius},${siteCoordinates.latitude},${siteCoordinates.longitude})[place~"town|village|suburb|locality"][name];
  nwr(around:${radius},${siteCoordinates.latitude},${siteCoordinates.longitude})[railway=station][name];
  nwr(around:${radius},${siteCoordinates.latitude},${siteCoordinates.longitude})[amenity~"school|college|university"][name];
  nwr(around:${radius},${siteCoordinates.latitude},${siteCoordinates.longitude})[amenity~"hospital|clinic|doctors"][name];
);
out center tags;
  `;
}

function buildLocalOverpassQuery(siteCoordinates, radius) {
  return `
[out:json][timeout:30];
(
  nwr(around:${radius},${siteCoordinates.latitude},${siteCoordinates.longitude})[highway=bus_stop];
  nwr(around:${radius},${siteCoordinates.latitude},${siteCoordinates.longitude})[public_transport=platform][bus=yes];
  nwr(around:${radius},${siteCoordinates.latitude},${siteCoordinates.longitude})[railway=station];
  nwr(around:${radius},${siteCoordinates.latitude},${siteCoordinates.longitude})[amenity~"school|college|university|kindergarten"];
  nwr(around:${radius},${siteCoordinates.latitude},${siteCoordinates.longitude})[amenity~"hospital|clinic|doctors|dentist|pharmacy"];
  nwr(around:${radius},${siteCoordinates.latitude},${siteCoordinates.longitude})[shop];
  nwr(around:${radius},${siteCoordinates.latitude},${siteCoordinates.longitude})[amenity~"cafe|restaurant|fast_food|pub|bar"];
  nwr(around:${radius},${siteCoordinates.latitude},${siteCoordinates.longitude})[amenity~"community_centre|library|arts_centre|social_facility|theatre"];
  nwr(around:${radius},${siteCoordinates.latitude},${siteCoordinates.longitude})[amenity=place_of_worship];
  nwr(around:${radius},${siteCoordinates.latitude},${siteCoordinates.longitude})[leisure~"park|playground|sports_centre"];
);
out center tags;
  `;
}

async function fetchNominatimAmenities(siteCoordinates, mode, options = {}) {
  const viewbox = buildViewboxForRadius(siteCoordinates, getNominatimFallbackRadius(mode));
  const requests = getNominatimAmenityRequests(mode);
  const grouped = new Map();

  await Promise.all(
    requests.map(async (request) => {
      let searchUrl;
      try {
        searchUrl = new URL(NOMINATIM_SEARCH_ENDPOINT, window.location.origin);
      } catch (error) {
        throw createServiceError(
          "Nominatim",
          "malformed_request",
          "The hosted amenity search URL is not configured correctly for this deployment."
        );
      }
      searchUrl.searchParams.set("format", "jsonv2");
      searchUrl.searchParams.set("limit", String(request.limit ?? 6));
      searchUrl.searchParams.set("bounded", "1");
      searchUrl.searchParams.set("viewbox", `${viewbox.minLongitude},${viewbox.maxLatitude},${viewbox.maxLongitude},${viewbox.minLatitude}`);
      searchUrl.searchParams.set("q", request.query);

      const payload = await fetchJsonWithDiagnostics(
        searchUrl.toString(),
        { signal: options.signal },
        "Nominatim",
        8000
      );

      (payload ?? []).forEach((result) => {
        const latitude = Number(result.lat);
        const longitude = Number(result.lon);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return;
        }

        const category = request.category;
        if (!grouped.has(category)) {
          grouped.set(category, []);
        }

        grouped.get(category).push({
          id: 0,
          sourceId: `nominatim/${category}/${result.place_id}`,
          latitude,
          longitude,
          name: result.display_name?.split(",")[0]?.trim() || category,
          category,
          symbol: "circle",
          color: AMENITY_COLOR_PALETTE[0],
          visible: true,
          showInLegend: true,
          distance: getDistanceMetres(
            siteCoordinates.latitude,
            siteCoordinates.longitude,
            latitude,
            longitude
          ),
          isManual: false,
        });
      });
    })
  );

  return selectAmenitiesFromGroupedResults(grouped, mode);
}

function getNominatimAmenityRequests(mode) {
  if (mode === "cycling") {
    return [
      { category: "Settlement", query: "town", limit: 6 },
      { category: "Settlement", query: "village", limit: 6 },
      { category: "Rail station", query: "[railway station]", limit: 5 },
      { category: "School", query: "[school]", limit: 6 },
      { category: "Healthcare", query: "[hospital]", limit: 4 },
      { category: "Healthcare", query: "[clinic]", limit: 4 },
    ];
  }

  if (mode === "bus") {
    return [
      { category: "Bus stop", query: "[bus stop]", limit: 8 },
      { category: "Rail station", query: "[railway station]", limit: 4 },
      { category: "School", query: "[school]", limit: 6 },
      { category: "Healthcare", query: "[hospital]", limit: 4 },
      { category: "Retail", query: "shop", limit: 6 },
      { category: "Food and drink", query: "[cafe]", limit: 6 },
      { category: "Community", query: "[library]", limit: 4 },
    ];
  }

  return [
    { category: "Bus stop", query: "[bus stop]", limit: 8 },
    { category: "Rail station", query: "[railway station]", limit: 4 },
    { category: "School", query: "[school]", limit: 6 },
    { category: "Healthcare", query: "[hospital]", limit: 4 },
    { category: "Retail", query: "shop", limit: 6 },
    { category: "Food and drink", query: "[cafe]", limit: 6 },
    { category: "Community", query: "[library]", limit: 4 },
    { category: "Worship", query: "[church]", limit: 3 },
    { category: "Open space", query: "[park]", limit: 4 },
  ];
}

function getNominatimFallbackRadius(mode) {
  if (mode === "cycling") {
    return 6500;
  }
  if (mode === "bus") {
    return 2200;
  }
  return 1600;
}

function buildViewboxForRadius(siteCoordinates, radiusMetres) {
  const latitudeDelta = radiusMetres / 111320;
  const longitudeDelta = radiusMetres / (111320 * Math.max(Math.cos((siteCoordinates.latitude * Math.PI) / 180), 0.2));
  return {
    minLatitude: siteCoordinates.latitude - latitudeDelta,
    maxLatitude: siteCoordinates.latitude + latitudeDelta,
    minLongitude: siteCoordinates.longitude - longitudeDelta,
    maxLongitude: siteCoordinates.longitude + longitudeDelta,
  };
}

async function fetchIsochronesForScenario(originCoordinates, mode, options = {}) {
  if (mode === "bus") {
    return fetchBusIsochronesForScenario(originCoordinates, options);
  }
  return fetchValhallaIsochronesForScenario(originCoordinates, mode, options);
}

async function fetchBusIsochronesForScenario(originCoordinates, options = {}) {
  const indicativeIsochrones = await fetchValhallaIsochronesForScenario(
    originCoordinates,
    "bus",
    options
  );
  indicativeIsochrones.sourceNote = BUS_INDICATIVE_METHOD_NOTE;
  return indicativeIsochrones;
}

function getBusContourSourceNote() {
  if (state.lastIsochroneSourceNote) {
    return state.lastIsochroneSourceNote;
  }
  return BUS_INDICATIVE_METHOD_NOTE;
}

async function fetchValhallaIsochronesForScenario(originCoordinates, mode, options = {}) {
  const modeConfig = MODE_CONFIG[mode];
  const configuredBands = getConfiguredBandsForMode(mode);
  const contours = configuredBands.map((band) => {
    if (modeConfig.metric === "distance") {
      return { distance: band.distance, color: band.fill.replace("#", "") };
    }
    return { time: band.time, color: band.fill.replace("#", "") };
  });

  const request = {
    locations: [
      {
        lat: originCoordinates.latitude,
        lon: originCoordinates.longitude,
      },
    ],
    costing: modeConfig.costing,
    contours,
    polygons: true,
    denoise: 0.5,
    generalize: 5,
    show_locations: false,
  };

  if (mode === "bus") {
    request.date_time = {
      type: 0,
    };
  }

  const payload = await fetchValhallaIsochronePayloadWithRetry(request, mode, options);
  if (payload.error) {
    throw createServiceError(
      "Valhalla isochrone",
      classifyRoutingPayloadKind(payload.error),
      buildServiceKindMessage(
        "Valhalla isochrone",
        classifyRoutingPayloadKind(payload.error),
        normaliseServiceMessage("Valhalla isochrone", payload.error)
      )
    );
  }
  if (!Array.isArray(payload.features) || payload.features.length === 0) {
    throw createServiceError(
      "Valhalla isochrone",
      "unavailable_routing_data",
      `Valhalla did not return any ${modeConfig.label.toLowerCase()} catchment geometry for the selected location.`
    );
  }
  return transformIsochroneFeatures(payload.features ?? [], modeConfig, configuredBands);
}

async function fetchValhallaIsochronePayloadWithRetry(request, mode, options = {}) {
  const maxAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const requestUrl = new URL(VALHALLA_ISOCHRONE_ENDPOINT, window.location.origin);
      requestUrl.searchParams.set("json", JSON.stringify(request));
      return await fetchJsonWithDiagnostics(
        requestUrl.toString(),
        { signal: options.signal },
        "Valhalla isochrone"
      );
    } catch (error) {
      if (error?.kind === "cancelled") {
        throw error;
      }
      lastError = error;
      if (!shouldRetryValhallaIsochroneError(error) || attempt === maxAttempts) {
        break;
      }
      await waitForRetryDelay(900);
    }
  }

  if (shouldRetryValhallaIsochroneError(lastError)) {
    throw createServiceError(
      "Valhalla isochrone",
      "api_outage",
      "Valhalla is temporarily unavailable. Please try again shortly. If this continues, the public routing service may be overloaded."
    );
  }

  throw lastError;
}

function shouldRetryValhallaIsochroneError(error) {
  return error?.kind === "api_outage" || error?.kind === "rate_limit";
}

function waitForRetryDelay(delayMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function transformIsochroneFeatures(features, modeConfig, configuredBands) {
  const bandByLabel = new Map(configuredBands.map((band) => [band.label, band]));
  const bandByMetric = new Map(
    configuredBands.map((band) => [
      modeConfig.metric === "distance" ? String(band.distance) : String(band.time),
      band,
    ])
  );

  return features
    .filter((feature) => feature.geometry)
    .map((feature) => {
      const contourValue = feature.properties?.contour;
      const matchedBand =
        bandByMetric.get(String(contourValue)) ||
        bandByLabel.get(feature.properties?.name || "");
      return {
        geometry: feature.geometry,
        label: matchedBand?.label ?? String(contourValue),
        color: matchedBand?.fill ?? `#${feature.properties?.color ?? "888888"}`,
        contour: contourValue,
      };
    })
    .sort((a, b) => Number(b.contour) - Number(a.contour));
}

function transformOverpassElements(elements, siteCoordinates, mode) {
  const grouped = new Map();

  elements.forEach((element) => {
    const category = classifyAmenity(element.tags ?? {}, mode);
    if (!category) {
      return;
    }

    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    if (latitude === undefined || longitude === undefined) {
      return;
    }

    const sourceId = `${element.type}/${element.id}`;
    const distance = getDistanceMetres(
      siteCoordinates.latitude,
      siteCoordinates.longitude,
      latitude,
      longitude
    );
    const amenity = {
      id: 0,
      sourceId,
      latitude,
      longitude,
      name: deriveAmenityName(element.tags ?? {}, category),
      category,
      symbol: "circle",
      color: AMENITY_COLOR_PALETTE[0],
      visible: true,
      showInLegend: true,
      distance,
      isManual: false,
    };

    if (!grouped.has(category)) {
      grouped.set(category, []);
      }
      grouped.get(category).push(amenity);
    });

  return selectAmenitiesFromGroupedResults(grouped, mode);
}

function selectAmenitiesFromGroupedResults(grouped, mode) {
  const categoryOrder = getCategoryOrderForMode(mode);
  const categoryLimits = getCategoryLimitsForMode(mode);
  const legendLimit = getLegendLimitForMode(mode);
  const selected = [];

  categoryOrder.forEach((category) => {
    const items = dedupeAmenitiesByName(grouped.get(category) ?? []);
    const categoryLimit = categoryLimits[category] ?? 0;
    const selectedItems = mode === "cycling"
      ? selectCyclingAmenitiesForCategory(items, category, categoryLimit)
      : items
          .sort((a, b) => a.distance - b.distance)
          .slice(0, categoryLimit);
    selectedItems
      .forEach((item, categoryItemIndex) => {
        const markerStyle = getAmenityMarkerStyle(item, category);
        item.id = selected.length + 1;
        item.symbol = markerStyle.symbol;
        item.color = markerStyle.color;
        item.showInLegend = selected.length < legendLimit;
        selected.push(item);
      });
    });

  return selected;
}

function getCategoryOrderForMode(mode) {
  if (mode === "cycling") {
    return ["Settlement", "Rail station", "Healthcare", "School"];
  }

  return [
    "Bus stop",
    "Rail station",
    "School",
    "Healthcare",
    "Retail",
    "Food and drink",
    "Community",
    "Worship",
    "Open space",
  ];
}

function getCategoryLimitsForMode(mode) {
  if (mode === "cycling") {
        return {
          Settlement: 6,
          "Rail station": 3,
          School: 4,
          Healthcare: 3,
        };
  }

  const defaultLimit = mode === "walking" ? 2 : 4;
  return Object.fromEntries(
    getCategoryOrderForMode(mode).map((category) => [category, defaultLimit])
  );
}

function getLegendLimitForMode(mode) {
  if (mode === "cycling") {
      return 12;
  }
  return mode === "walking" ? 6 : 8;
}

function dedupeAmenitiesByName(items) {
  const deduped = new Map();

  items.forEach((item) => {
    const key = `${item.category}|${String(item.name).trim().toLowerCase()}`;
    const existing = deduped.get(key);
    if (!existing || item.distance < existing.distance) {
      deduped.set(key, item);
    }
  });

  return Array.from(deduped.values());
}

function cacheAmenitiesForScenario(siteCoordinates, mode, amenities) {
  state.amenityCache[mode] = {
    key: buildScenarioCacheKey(siteCoordinates),
    amenities: amenities.map((item) => ({ ...item })),
  };
}

function getCachedAmenitiesForScenario(siteCoordinates, mode) {
  const cached = state.amenityCache[mode];
  if (!cached || cached.key !== buildScenarioCacheKey(siteCoordinates)) {
    return null;
  }
  return cached.amenities.map((item) => ({ ...item }));
}

function buildScenarioCacheKey(siteCoordinates) {
  return `${siteCoordinates.latitude.toFixed(4)},${siteCoordinates.longitude.toFixed(4)}`;
}

function selectCyclingAmenitiesForCategory(items, category, limit) {
  if (limit <= 0) {
    return [];
  }

  const sortedItems = [...items].sort((a, b) => a.distance - b.distance);
  if (sortedItems.length <= limit) {
    return sortedItems;
  }

  const selectedItems = [];
  const configuredBands = getConfiguredBandsForMode("cycling")
    .map((band) => Number(band.distance) * 1000)
    .filter((distance) => Number.isFinite(distance) && distance > 0)
    .sort((a, b) => a - b);
  const innerBand = configuredBands[0] ?? 2000;
  const middleBand = configuredBands[1] ?? innerBand;
  const outerBand = configuredBands[configuredBands.length - 1] ?? middleBand;

  const addFirstMatching = (predicate) => {
    const match = sortedItems.find((item) => !selectedItems.includes(item) && predicate(item));
    if (match) {
      selectedItems.push(match);
    }
  };

  if (category === "Settlement") {
    addFirstMatching(() => true);
    addFirstMatching((item) => item.distance > innerBand && item.distance <= middleBand);
    addFirstMatching((item) => item.distance > middleBand && item.distance <= outerBand);
  } else if (category === "Rail station" || category === "Healthcare") {
    addFirstMatching(() => true);
    addFirstMatching((item) => item.distance > middleBand && item.distance <= outerBand);
  }

  sortedItems.forEach((item) => {
    if (selectedItems.length >= limit || selectedItems.includes(item)) {
      return;
    }
    selectedItems.push(item);
  });

  return selectedItems.slice(0, limit);
}

function classifyAmenity(tags, mode) {
  if (mode === "cycling") {
        if (tags.place && firstNonEmpty(tags.name)) {
          return "Settlement";
        }
        if (tags.railway === "station" && firstNonEmpty(tags.name)) {
          return "Rail station";
        }
        if (["school", "college", "university", "kindergarten"].includes(tags.amenity) && firstNonEmpty(tags.name)) {
          return "School";
        }
      if (["hospital", "clinic", "doctors", "dentist", "pharmacy", "health_centre"].includes(tags.amenity) && firstNonEmpty(tags.name)) {
        return "Healthcare";
      }
      if (tags.shop && firstNonEmpty(tags.name)) {
        return "Retail";
      }
      if (["cafe", "restaurant", "fast_food", "pub", "bar"].includes(tags.amenity) && firstNonEmpty(tags.name)) {
        return "Food and drink";
      }
      if (["community_centre", "library", "arts_centre", "social_facility", "theatre", "village_hall"].includes(tags.amenity) && firstNonEmpty(tags.name)) {
        return "Community";
      }
      return null;
  }

  if (tags.highway === "bus_stop" || (tags.public_transport === "platform" && tags.bus === "yes")) {
    return "Bus stop";
  }
  if (tags.railway === "station") {
    return "Rail station";
  }
  if (["school", "college", "university", "kindergarten"].includes(tags.amenity)) {
    return "School";
  }
  if (["hospital", "clinic", "doctors", "dentist", "pharmacy"].includes(tags.amenity)) {
    return "Healthcare";
  }
  if (tags.shop) {
    return "Retail";
  }
  if (["cafe", "restaurant", "fast_food", "pub", "bar"].includes(tags.amenity)) {
    return "Food and drink";
  }
  if (["community_centre", "library", "arts_centre", "social_facility", "theatre"].includes(tags.amenity)) {
    return "Community";
  }
  if (tags.amenity === "place_of_worship") {
    return "Worship";
  }
  if (["park", "playground", "sports_centre"].includes(tags.leisure)) {
    return "Open space";
  }
  return null;
}

function deriveAmenityName(tags, category) {
  if (category === "Bus stop") {
    return deriveBusStopName(tags);
  }

  const baseName =
    tags.name ||
    tags.operator ||
    tags.brand ||
    tags.ref ||
    `${category}`;

  if (category === "Rail station" && !/\bstation\b/i.test(baseName)) {
    return `${baseName} Station`;
  }

  return baseName;
}

function deriveBusStopName(tags) {
  const indicator = normaliseBusStopIndicator(
    firstNonEmpty(
      tags["naptan:Indicator"],
      tags.indicator,
      tags.local_ref,
      tags.ref
    )
  );
  const direction = formatBusStopDirection(tags.direction, tags.bearing);
  const towards = formatBusStopTowards(tags.towards);
  const roadName = firstNonEmpty(tags["naptan:Street"], tags["addr:street"], tags.name);
  const detailParts = [];

  if (indicator) {
    detailParts.push(indicator);
  }
  if (direction) {
    detailParts.push(direction);
  } else if (towards) {
    detailParts.push(towards);
  }
  if (roadName && !looksGenericBusStopName(roadName)) {
    detailParts.push(roadName);
  }

  return detailParts.length ? `Bus stop ${detailParts.join(" | ")}` : "Bus stop";
}

function firstNonEmpty(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() ?? "";
}

function normaliseBusStopIndicator(value) {
  if (!value) {
    return "";
  }

  const compactValue = value.trim();
  const lowered = compactValue.toLowerCase();

  if (lowered.startsWith("opposite")) {
    return compactValue.replace(/^opposite\b/i, "opp");
  }
  if (lowered.startsWith("outside")) {
    return compactValue.replace(/^outside\b/i, "o/s");
  }
  if (lowered.startsWith("adjacent")) {
    return compactValue.replace(/^adjacent\b/i, "adj");
  }
  if (lowered.startsWith("before")) {
    return compactValue.replace(/^before\b/i, "bef");
  }
  if (lowered.startsWith("after")) {
    return compactValue.replace(/^after\b/i, "aft");
  }
  if (lowered.startsWith("near")) {
    return compactValue.replace(/^near\b/i, "nr");
  }

  return compactValue;
}

function formatBusStopDirection(direction, bearing) {
  const rawDirection = firstNonEmpty(direction);
  if (rawDirection) {
    const normalisedDirection = rawDirection.toLowerCase().replace(/[^a-z]/g, "");
    const mappedDirection = {
      north: "NB",
      northbound: "NB",
      south: "SB",
      southbound: "SB",
      east: "EB",
      eastbound: "EB",
      west: "WB",
      westbound: "WB",
      northeast: "NEB",
      northeastbound: "NEB",
      northwest: "NWB",
      northwestbound: "NWB",
      southeast: "SEB",
      southeastbound: "SEB",
      southwest: "SWB",
      southwestbound: "SWB",
      inbound: "inbound",
      outbound: "outbound",
    }[normalisedDirection];

    if (mappedDirection) {
      return mappedDirection;
    }
  }

  const numericBearing = Number.parseFloat(bearing);
  if (Number.isFinite(numericBearing)) {
    return `${bearingToCardinal(numericBearing)}B`;
  }

  return "";
}

function formatBusStopTowards(towards) {
  const value = firstNonEmpty(towards);
  return value ? `towards ${value}` : "";
}

function looksGenericBusStopName(name) {
  const lowered = name.trim().toLowerCase();
  return lowered === "bus stop" || lowered === "platform" || lowered === "stop";
}

function bearingToCardinal(bearing) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const wrappedBearing = ((bearing % 360) + 360) % 360;
  const index = Math.round(wrappedBearing / 45) % directions.length;
  return directions[index];
}

function getAmenityMarkerStyle(item, category) {
  const symbol = CATEGORY_SYMBOLS[category] ?? "circle";
  const categoryOffset = CATEGORY_OPTIONS.indexOf(category);
  const stableKey = item?.sourceId || `${category}|${item?.name || ""}`;
  const colorIndex = positiveHash(`${categoryOffset}|${stableKey}`) % AMENITY_COLOR_PALETTE.length;
  const color = AMENITY_COLOR_PALETTE[colorIndex];
  return {
    symbol,
    color,
  };
}

function positiveHash(value) {
  let hash = 0;
  String(value).split("").forEach((character) => {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  });
  return hash;
}

function applySavedOverrides(amenities) {
  return amenities.map((item) => {
    if (!item.sourceId || !state.savedOverrides[item.sourceId]) {
      return item;
    }

    return {
      ...item,
      ...state.savedOverrides[item.sourceId],
    };
  });
}

function buildMapView(siteCoordinates, zoom) {
  const center = latLonToWorldPixels(siteCoordinates.latitude, siteCoordinates.longitude, zoom);
  const topLeft = {
    x: center.x - MAP_DIMENSIONS.width / 2,
    y: center.y - MAP_DIMENSIONS.height / 2,
  };
  return {
    zoom,
    topLeft,
  };
}

function adjustMapViewZoom(mapView, zoomDelta) {
  const nextZoom = clampZoom(mapView.zoom + zoomDelta);
  if (nextZoom === mapView.zoom) {
    return mapView;
  }

  const centerScreen = {
    x: MAP_DIMENSIONS.width / 2,
    y: MAP_DIMENSIONS.height / 2,
  };
  const centerCoordinates = unprojectSvgToLatLon(centerScreen.x, centerScreen.y, mapView);
  const centerWorldPoint = latLonToWorldPixels(
    centerCoordinates.latitude,
    centerCoordinates.longitude,
    nextZoom
  );

  return {
    zoom: nextZoom,
    topLeft: {
      x: centerWorldPoint.x - centerScreen.x,
      y: centerWorldPoint.y - centerScreen.y,
    },
  };
}

function buildBestFitMapView(scenario, isochrones, fallbackZoom, zoomAdjust = 0) {
  const bounds = getScenarioBounds(scenario, isochrones);
  if (!bounds) {
    return buildMapView(scenario.siteCoordinates, clampZoom(fallbackZoom + zoomAdjust));
  }

  const padding = {
    left: 42,
    right: 290,
    top: 42,
    bottom: 42,
  };

  const fittedZoom = clampZoom(getBoundsFitZoom(bounds, padding, fallbackZoom) + zoomAdjust);
  const center = {
    latitude: (bounds.minLatitude + bounds.maxLatitude) / 2,
    longitude: (bounds.minLongitude + bounds.maxLongitude) / 2,
  };

  const centerWorld = latLonToWorldPixels(center.latitude, center.longitude, fittedZoom);
  const availableWidth = MAP_DIMENSIONS.width - padding.left - padding.right;
  const availableHeight = MAP_DIMENSIONS.height - padding.top - padding.bottom;
  const targetCenterX = padding.left + availableWidth / 2;
  const targetCenterY = padding.top + availableHeight / 2;

  return {
    zoom: fittedZoom,
    topLeft: {
      x: centerWorld.x - targetCenterX,
      y: centerWorld.y - targetCenterY,
    },
  };
}

function clampZoom(value) {
  return Math.min(18, Math.max(8, value));
}

function buildScaleBarMarkup(mapView) {
  const startX = 94;
  const baselineY = 584;
  const centerY = MAP_DIMENSIONS.height / 2;
  const metresPerPixel = getDistanceMetresPerPixel(mapView, centerY);
  const scaleDistanceMetres = chooseScaleBarDistance(metresPerPixel, 100);
  const scaleWidthPixels = scaleDistanceMetres / metresPerPixel;
  const endX = startX + scaleWidthPixels;
  const labelX = startX + scaleWidthPixels / 2;

  return `
        <line x1="${round1(startX)}" y1="${baselineY}" x2="${round1(endX)}" y2="${baselineY}" stroke="#1d2328" stroke-width="3"></line>
        <line x1="${round1(startX)}" y1="578" x2="${round1(startX)}" y2="590" stroke="#1d2328" stroke-width="3"></line>
        <line x1="${round1(endX)}" y1="578" x2="${round1(endX)}" y2="590" stroke="#1d2328" stroke-width="3"></line>
        <text x="${round1(labelX)}" y="571" font-size="12" fill="#1d2328" font-family="Inter, Arial, sans-serif" text-anchor="middle">${formatScaleBarLabel(scaleDistanceMetres)}</text>
    `;
}

function getDistanceMetresPerPixel(mapView, yPosition) {
  const pointA = unprojectSvgToLatLon(100, yPosition, mapView);
  const pointB = unprojectSvgToLatLon(101, yPosition, mapView);
  return getDistanceMetres(pointA.latitude, pointA.longitude, pointB.latitude, pointB.longitude);
}

function chooseScaleBarDistance(metresPerPixel, targetPixels) {
  const preferredDistances = [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000];
  const targetDistance = metresPerPixel * targetPixels;

  return preferredDistances.reduce((bestDistance, candidateDistance) =>
    Math.abs(candidateDistance - targetDistance) < Math.abs(bestDistance - targetDistance)
      ? candidateDistance
      : bestDistance
  , preferredDistances[0]);
}

function formatScaleBarLabel(distanceMetres) {
  if (distanceMetres >= 1000) {
    const kilometres = distanceMetres / 1000;
    return `${Number.isInteger(kilometres) ? kilometres : kilometres.toFixed(1)} km`;
  }
  return `${distanceMetres} m`;
}

function getScenarioBounds(scenario, isochrones) {
  const coordinates = [];

  if (scenario?.siteCoordinates) {
    coordinates.push(scenario.siteCoordinates);
  }
  if (scenario?.accessCoordinates) {
    coordinates.push(scenario.accessCoordinates);
  }

  (isochrones ?? []).forEach((isochrone) => {
    collectGeometryCoordinates(isochrone.geometry).forEach(([longitude, latitude]) => {
      coordinates.push({ latitude, longitude });
    });
  });

  if (coordinates.length === 0) {
    return null;
  }

  return coordinates.reduce(
    (bounds, coordinate) => ({
      minLatitude: Math.min(bounds.minLatitude, coordinate.latitude),
      maxLatitude: Math.max(bounds.maxLatitude, coordinate.latitude),
      minLongitude: Math.min(bounds.minLongitude, coordinate.longitude),
      maxLongitude: Math.max(bounds.maxLongitude, coordinate.longitude),
    }),
    {
      minLatitude: coordinates[0].latitude,
      maxLatitude: coordinates[0].latitude,
      minLongitude: coordinates[0].longitude,
      maxLongitude: coordinates[0].longitude,
    }
  );
}

function getBoundsFitZoom(bounds, padding, fallbackZoom) {
  const availableWidth = Math.max(80, MAP_DIMENSIONS.width - padding.left - padding.right);
  const availableHeight = Math.max(80, MAP_DIMENSIONS.height - padding.top - padding.bottom);

  for (let zoom = fallbackZoom; zoom >= 8; zoom -= 1) {
    const southWest = latLonToWorldPixels(bounds.minLatitude, bounds.minLongitude, zoom);
    const northEast = latLonToWorldPixels(bounds.maxLatitude, bounds.maxLongitude, zoom);
    const width = Math.abs(northEast.x - southWest.x);
    const height = Math.abs(southWest.y - northEast.y);

    if (width <= availableWidth && height <= availableHeight) {
      return zoom;
    }
  }

  return 8;
}

function collectGeometryCoordinates(geometry) {
  if (!geometry?.coordinates) {
    return [];
  }
  if (geometry.type === "Polygon") {
    return geometry.coordinates.flat();
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flat(2);
  }
  return [];
}

function buildTileLayerMarkup(mapView) {
  const sourceZoom = Math.floor(mapView.zoom);
  const zoomScale = 2 ** (mapView.zoom - sourceZoom);
  const tileSize = 256 * zoomScale;
  const topLeftAtSourceZoom = {
    x: mapView.topLeft.x / zoomScale,
    y: mapView.topLeft.y / zoomScale,
  };
  const startTileX = Math.floor(topLeftAtSourceZoom.x / 256);
  const startTileY = Math.floor(topLeftAtSourceZoom.y / 256);
  const endTileX = Math.floor((topLeftAtSourceZoom.x + MAP_DIMENSIONS.width / zoomScale) / 256);
  const endTileY = Math.floor((topLeftAtSourceZoom.y + MAP_DIMENSIONS.height / zoomScale) / 256);
  const maxTileIndex = 2 ** sourceZoom;
  const tiles = [];

  for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
    for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
      if (tileY < 0 || tileY >= maxTileIndex) {
        continue;
      }

      const wrappedTileX = ((tileX % maxTileIndex) + maxTileIndex) % maxTileIndex;
      const x = tileX * tileSize - mapView.topLeft.x;
      const y = tileY * tileSize - mapView.topLeft.y;
      tiles.push(
        `<image href="https://tile.openstreetmap.org/${sourceZoom}/${wrappedTileX}/${tileY}.png" x="${round1(
          x
        )}" y="${round1(y)}" width="${round1(tileSize)}" height="${round1(tileSize)}" preserveAspectRatio="none" crossorigin="anonymous"></image>`
      );
    }
  }

  return `
    <g clip-path="url(#mapFrameClip)">
      ${tiles.join("")}
    </g>
    <defs>
      <clipPath id="mapFrameClip">
        <rect x="24" y="24" width="912" height="592"></rect>
      </clipPath>
    </defs>
  `;
}

function projectLatLonToSvg(latitude, longitude, mapView) {
  const worldPoint = latLonToWorldPixels(latitude, longitude, mapView.zoom);
  return {
    x: round1(worldPoint.x - mapView.topLeft.x),
    y: round1(worldPoint.y - mapView.topLeft.y),
  };
}

function buildIsochroneMarkup(isochrones, mapView) {
  return isochrones
    .map((isochrone) => {
      const pathMarkup = geometryToSvgPath(isochrone.geometry, mapView);
      if (!pathMarkup) {
        return "";
      }
      return `<path d="${pathMarkup}" fill="${isochrone.color}" fill-opacity="0.32" stroke="${isochrone.color}" stroke-width="2"></path>`;
    })
    .join("");
}

function geometryToSvgPath(geometry, mapView) {
  if (geometry.type === "Polygon") {
    return polygonCoordinatesToPath(geometry.coordinates, mapView);
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map((polygon) => polygonCoordinatesToPath(polygon, mapView))
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

function buildAmenityDisplayItems(amenities, mapView, sitePoint) {
  const placedItems = [];
  const candidateOffsets = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: -10, y: 0 },
    { x: 0, y: 10 },
    { x: 0, y: -10 },
    { x: 8, y: 8 },
    { x: -8, y: 8 },
    { x: 8, y: -8 },
    { x: -8, y: -8 },
    { x: 14, y: 0 },
    { x: -14, y: 0 },
    { x: 0, y: 14 },
    { x: 0, y: -14 },
  ];
  const minSeparation = 13;

  amenities.forEach((item) => {
    const basePoint = item.latitude !== undefined && item.longitude !== undefined
      ? projectLatLonToSvg(item.latitude, item.longitude, mapView)
      : {
          x: sitePoint.x + item.offsets.x,
          y: sitePoint.y + item.offsets.y,
        };

    if (!basePoint) {
      return;
    }

    let chosenPoint = null;

    for (const offset of candidateOffsets) {
      const candidatePoint = {
        x: clamp(basePoint.x + offset.x, 26, 934),
        y: clamp(basePoint.y + offset.y, 26, 614),
      };
      const overlapsExisting = placedItems.some((placedItem) =>
        getPointDistance(candidatePoint, placedItem) < minSeparation
      );
      if (!overlapsExisting) {
        chosenPoint = candidatePoint;
        break;
      }
    }

    const finalPoint = chosenPoint ?? {
      x: clamp(basePoint.x, 26, 934),
      y: clamp(basePoint.y, 26, 614),
    };

    placedItems.push({
      ...item,
      x: round1(finalPoint.x),
      y: round1(finalPoint.y),
    });
  });

  return placedItems;
}

function polygonCoordinatesToPath(rings, mapView) {
  return rings
    .map((ring) => {
      const commands = ring
        .map(([longitude, latitude], index) => {
          const point = projectLatLonToSvg(latitude, longitude, mapView);
          return `${index === 0 ? "M" : "L"}${point.x} ${point.y}`;
        })
        .join(" ");
      return `${commands} Z`;
    })
    .join(" ");
}

function unprojectSvgToLatLon(x, y, mapView) {
  return worldPixelsToLatLon(x + mapView.topLeft.x, y + mapView.topLeft.y, mapView.zoom);
}

function getPointDistance(pointA, pointB) {
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
}

function latLonToWorldPixels(latitude, longitude, zoom) {
  const sinLatitude = Math.sin((latitude * Math.PI) / 180);
  const scale = 256 * 2 ** zoom;
  return {
    x: ((longitude + 180) / 360) * scale,
    y:
      (0.5 -
        Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) *
      scale,
  };
}

function worldPixelsToLatLon(x, y, zoom) {
  const scale = 256 * 2 ** zoom;
  const longitude = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const latitude = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { latitude, longitude };
}

function getDistanceMetres(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function buildMapTitleBlock(projectName, planningAuthority) {
  const boxX = 42;
  const boxY = 30;
  const paddingX = 12;
  const paddingTop = 10;
  const lineGap = 8;
  const titleFontSize = 14;
  const authorityFontSize = 12;
  const titleWidth = estimateSvgTextWidth(projectName, titleFontSize, 0.6);
  const authorityWidth = estimateSvgTextWidth(planningAuthority, authorityFontSize, 0.58);
  const boxWidth = Math.min(420, Math.max(170, Math.ceil(Math.max(titleWidth, authorityWidth) + paddingX * 2)));
  const boxHeight = 52;

  return `
    <g>
      <rect x="${boxX}" y="${boxY}" width="${boxWidth}" height="${boxHeight}" fill="#fffdf8" stroke="#d7d0c4"></rect>
      <text x="${boxX + paddingX}" y="${boxY + paddingTop + titleFontSize}" font-size="${titleFontSize}" fill="#1d2328" font-family="Inter, Arial, sans-serif" font-weight="700">${escapeHtml(projectName)}</text>
      <text x="${boxX + paddingX}" y="${boxY + paddingTop + titleFontSize + lineGap + authorityFontSize}" font-size="${authorityFontSize}" fill="#5c6a70" font-family="Inter, Arial, sans-serif">${escapeHtml(planningAuthority)}</text>
    </g>
  `;
}

function estimateSvgTextWidth(text, fontSize, widthFactor) {
  return String(text).length * fontSize * widthFactor;
}

function buildSelectMarkup(id, field, options, selectedValue) {
  const optionMarkup = options
    .map(
      (option) =>
        `<option value="${option}" ${option === selectedValue ? "selected" : ""}>${option}</option>`
    )
    .join("");
  return `<select data-field="${field}" data-id="${id}">${optionMarkup}</select>`;
}

function drawSymbol(symbol, color, size, withOutline = false) {
  const stroke = withOutline ? "#1d2328" : "none";
  const strokeWidth = withOutline ? 1.7 : 0;
  if (symbol === "square") {
    return `<rect x="${-size}" y="${-size}" width="${size * 2}" height="${size * 2}" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}"></rect>
      <rect x="${-size * 0.35}" y="${-size * 0.35}" width="${size * 0.7}" height="${size * 0.7}" fill="#f8f5ee" opacity="0.92"></rect>`;
  }
  if (symbol === "diamond") {
    return `<path d="M0 ${-size} L${size} 0 L0 ${size} L${-size} 0 Z" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}"></path>
      <path d="M${-size * 0.42} 0 H${size * 0.42}" stroke="#f8f5ee" stroke-width="2.2"></path>`;
  }
  if (symbol === "triangle") {
    return `<path d="M0 ${-size - 1} L${size + 1} ${size} L${-size - 1} ${size} Z" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}"></path>
      <circle cx="0" cy="${size * 0.18}" r="${Math.max(1.8, size * 0.18)}" fill="#f8f5ee"></circle>`;
  }
  if (symbol === "cross") {
    return `<path d="M-3 ${-size} H3 V-3 H${size} V3 H3 V${size} H-3 V3 H${-size} V-3 H-3 Z" fill="${color}" stroke="${stroke}" stroke-width="${withOutline ? 1 : 0}"></path>`;
  }
  if (symbol === "hex") {
    return `<path d="M0 ${-size} L${size} ${-size / 2} L${size} ${size / 2} L0 ${size} L${-size} ${size / 2} L${-size} ${-size / 2} Z" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}"></path>
      <path d="M${-size * 0.34} 0 H${size * 0.34}" stroke="#f8f5ee" stroke-width="2"></path>
      <path d="M0 ${-size * 0.34} V${size * 0.34}" stroke="#f8f5ee" stroke-width="2"></path>`;
  }
  if (symbol === "star") {
    return `<path d="M0 ${-size} L${size * 0.28} ${-size * 0.28} L${size} ${-size * 0.2} L${size *
      0.44} ${size * 0.18} L${size * 0.62} ${size} L0 ${size * 0.52} L${-size * 0.62} ${size} L${-size *
      0.44} ${size * 0.18} L${-size} ${-size * 0.2} L${-size * 0.28} ${-size * 0.28} Z" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}"></path>`;
  }
  if (symbol === "pentagon") {
    return `<path d="M0 ${-size} L${size * 0.95} ${-size * 0.2} L${size * 0.58} ${size} L${-size * 0.58} ${size} L${-size * 0.95} ${-size * 0.2} Z" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}"></path>
      <circle cx="0" cy="${size * 0.08}" r="${Math.max(1.8, size * 0.18)}" fill="#f8f5ee"></circle>`;
  }
  if (symbol === "ring") {
    return `<circle cx="0" cy="0" r="${size}" fill="none" stroke="${color}" stroke-width="4.4"></circle>
      <circle cx="0" cy="0" r="${size * 0.32}" fill="${color}" stroke="${withOutline ? "#1d2328" : "none"}" stroke-width="${withOutline ? 1 : 0}"></circle>`;
  }
  return `<circle cx="0" cy="0" r="${size}" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}"></circle>
    <circle cx="0" cy="0" r="${Math.max(1.8, size * 0.22)}" fill="#f8f5ee"></circle>`;
}

function drawBandSwatch(color) {
  return `<rect x="-7" y="-7" width="14" height="14" fill="${color}" fill-opacity="0.32" stroke="${color}" stroke-width="2"></rect>`;
}

function drawDevelopmentSiteMarker(x, y, compact) {
  const outer = compact ? 8 : 12;
  const inner = compact ? 2.4 : 3.5;
  return `
    <g transform="translate(${x} ${y})">
      <path d="M0 ${-outer} L${outer} 0 L0 ${outer} L${-outer} 0 Z" fill="#1d2328"></path>
      <circle cx="0" cy="0" r="${inner}" fill="#f8f5ee"></circle>
    </g>
  `;
}

function drawAccessMarker(x, y, compact) {
  const top = compact ? 8 : 15;
  const side = compact ? 8 : 12;
  const bottom = compact ? 7 : 10;
  return `
    <g transform="translate(${x} ${y})">
      <path d="M0 ${-top} L${side} ${bottom} L${-side} ${bottom} Z" fill="#b35b3d"></path>
    </g>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function csvEscape(value) {
  const stringValue = String(value);
  return /[",\n]/.test(stringValue)
    ? `"${stringValue.replaceAll('"', '""')}"`
    : stringValue;
}

init();
