const CATEGORY_OPTIONS = [
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

const MANUAL_OVERLAY_STORAGE_KEY = "prime-isochrone-manual-overlays";

const DRAWING_TOOL_CONFIG = {
  "walking-path": {
    geometryType: "line",
    overlayType: "walking-path",
    displayName: "Proposed walking path",
    legendName: "Proposed walking path",
    stroke: "#2f8f4e",
    dasharray: "",
    strokeWidth: 5,
  },
  "cycling-path": {
    geometryType: "line",
    overlayType: "cycling-path",
    displayName: "Proposed cycling path",
    legendName: "Proposed cycling path",
    stroke: "#1f6ed4",
    dasharray: "",
    strokeWidth: 5,
  },
  "shared-path": {
    geometryType: "line",
    overlayType: "shared-path",
    displayName: "Proposed shared walking/cycling path",
    legendName: "Proposed shared walking/cycling path",
    stroke: "#178b8b",
    dasharray: "11 6",
    strokeWidth: 5,
  },
  "bridge-crossing": {
    geometryType: "line",
    overlayType: "bridge-crossing",
    displayName: "Proposed bridge or crossing link",
    legendName: "Proposed bridge or crossing link",
    stroke: "#7b4cc2",
    dasharray: "8 6",
    strokeWidth: 5,
  },
  "barrier-line": {
    geometryType: "line",
    overlayType: "barrier-line",
    displayName: "No walking/cycling barrier",
    legendName: "No walking/cycling barrier",
    stroke: "#c23b3b",
    dasharray: "9 6",
    strokeWidth: 4,
  },
  "exclusion-area": {
    geometryType: "polygon",
    overlayType: "exclusion-area",
    displayName: "Isochrone removed area",
    legendName: "Isochrone removed area",
    stroke: "#8f2d2d",
    dasharray: "10 7",
    strokeWidth: 3,
  },
};

const MANUAL_LINE_TOOL_ORDER = [
  "walking-path",
  "cycling-path",
  "shared-path",
  "bridge-crossing",
  "barrier-line",
];

const MANUAL_EDIT_LIMITATION_TEXT =
  "Manual walking paths, cycling paths, shared links, bridge/crossing links and barrier lines are user-authored network edits applied to the local walking/cycling graph before isochrone generation. Isochrone exclusion areas remain cartographic masks applied after generation and do not alter the routed network calculation.";

const CATEGORY_SYMBOLS = {
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
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass-api.de/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
        "https://z.overpass-api.de/api/interpreter",
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
const ACTIVE_TRAVEL_NETWORK_SERVICE_NAME = "OpenStreetMap active travel network";
const GEOMETRIC_FALLBACK_NOTICE =
  "The active travel network catchment could not be generated, so the map is showing an indicative straight-line fallback. Do not describe this fallback as a routed network isochrone.";
const MPH_TO_KPH = 1.609344;
const ACTIVE_TRAVEL_NETWORK_CACHE = new Map();
const ACTIVE_TRAVEL_GRAPH_CACHE = new Map();
const ACTIVE_TRAVEL_ISOCHRONE_RESULT_CACHE = new Map();
const ACTIVE_TRAVEL_NETWORK_FETCH_RADIUS_MARGIN_METRES = 1200;
const ACTIVE_TRAVEL_BUFFER_BY_MODE = {
  walking: 55,
  cycling: 110,
};
const ACTIVE_TRAVEL_SAMPLE_SPACING_BY_MODE = {
  walking: 45,
  cycling: 90,
};
const ACTIVE_TRAVEL_MANUAL_PATH_SAMPLE_SPACING_BY_MODE = {
  walking: 20,
  cycling: 24,
};
const ACTIVE_TRAVEL_CLUSTER_LINK_BY_MODE = {
  walking: 220,
  cycling: 480,
};
const ACTIVE_TRAVEL_MIN_COMPONENT_AREA_BY_MODE = {
  walking: 1800,
  cycling: 1200,
};
const ACTIVE_TRAVEL_RADIAL_BINS_BY_MODE = {
  walking: 128,
  cycling: 192,
};
const ACTIVE_TRAVEL_SMOOTHING_ITERATIONS_BY_MODE = {
  walking: 1,
  cycling: 1,
};
const ACTIVE_TRAVEL_INTERSECTION_TOLERANCE_METRES = 22;
const ACTIVE_TRAVEL_SNAP_TOLERANCE_METRES = 60;
const ACTIVE_TRAVEL_MAX_SNAP_CANDIDATE_DISTANCE_METRES = 120;
const ACTIVE_TRAVEL_OSM_JUNCTION_STITCH_TOLERANCE_METRES = 14;
const ACTIVE_TRAVEL_OSM_ENDPOINT_LINK_TOLERANCE_METRES = 10;
const ACTIVE_TRAVEL_CONNECTIVITY_HEURISTIC_EDGE_LIMIT = 1800;
const ACTIVE_TRAVEL_CONNECTIVITY_HEURISTIC_CANDIDATE_LIMIT = 240;
const ACTIVE_TRAVEL_CONNECTIVITY_HEURISTIC_TERMINAL_LIMIT = 160;
const ACTIVE_TRAVEL_DEFAULT_WALKING_SPEED_KPH = 4.8;
const ACTIVE_TRAVEL_WALK_PERMISSIVE_HIGHWAYS = new Set([
  "residential",
  "living_street",
  "service",
  "unclassified",
  "tertiary",
  "tertiary_link",
]);
const ACTIVE_TRAVEL_WALK_FOOTWAY_HIGHWAYS = new Set([
  "footway",
  "path",
  "pedestrian",
  "steps",
  "track",
  "bridleway",
  "cycleway",
]);
const ACTIVE_TRAVEL_WALK_ROADS_REQUIRING_SIDEWALK = new Set([
  "motorway",
  "motorway_link",
  "trunk",
  "trunk_link",
  "primary",
  "primary_link",
  "secondary",
  "secondary_link",
]);
const ACTIVE_TRAVEL_CYCLE_HIGHWAYS = new Set([
  "cycleway",
  "path",
  "track",
  "bridleway",
  "living_street",
  "residential",
  "service",
  "unclassified",
  "tertiary",
  "tertiary_link",
  "secondary",
  "secondary_link",
  "primary",
  "primary_link",
]);
const ACTIVE_TRAVEL_EXCLUDED_HIGHWAYS = new Set([
  "motorway",
  "motorway_link",
  "proposed",
  "construction",
  "raceway",
  "corridor",
  "elevator",
]);
const ACTIVE_TRAVEL_ONEWAY_FALSE_VALUES = new Set(["no", "false", "0", "reversible"]);

const CYCLING_SPEED_KPH = 16;
const CYCLING_TIME_GUIDANCE_TEXT =
  "The cycle times detailed in the table are based on a cycling speed of 16 kph which corresponds with DfT guidance.";
const SERVICE_TIMEOUT_MS = {
  Overpass: 30000,
  "OpenStreetMap active travel network": 45000,
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
};

const state = {
  selectedMode: "walking",
  amenities: [],
  isochrones: [],
  currentMapView: null,
  mapViewAnimationFrameId: null,
  mapViewAnimationStartTime: 0,
  mapViewAnimationDurationMs: 0,
  mapViewAnimationFrom: null,
  mapViewAnimationTo: null,
  lastZoomControlValue: 0,
  nextAmenityId: 1,
  nextManualOverlayId: 1,
  isPlacingPoint: false,
  activeDrawingTool: "",
  draftDrawingPoints: [],
  manualLineEdits: [],
  isochroneExclusionAreas: [],
  isDraggingMap: false,
  mapDragPointerId: null,
  mapDragLastPoint: null,
  mapPanFrameId: null,
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
  walkingBands: document.getElementById("walkingBands"),
  cyclingBands: document.getElementById("cyclingBands"),
  walkingColor1: document.getElementById("walkingColor1"),
  walkingColor2: document.getElementById("walkingColor2"),
  cyclingColor1: document.getElementById("cyclingColor1"),
  cyclingColor2: document.getElementById("cyclingColor2"),
  cyclingColor3: document.getElementById("cyclingColor3"),
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
  manualOverlaysTableBody: document.getElementById("manualOverlaysTableBody"),
  methodNote: document.getElementById("methodNote"),
  manualPointName: document.getElementById("manualPointName"),
  manualPointCategory: document.getElementById("manualPointCategory"),
  manualPointSymbol: document.getElementById("manualPointSymbol"),
  manualOverlayName: document.getElementById("manualOverlayName"),
  manualEditStatus: document.getElementById("manualEditStatus"),
  togglePlacePointButton: document.getElementById("togglePlacePointButton"),
  drawingToolButtons: Array.from(document.querySelectorAll("[data-drawing-tool]")),
  finishDrawingButton: document.getElementById("finishDrawingButton"),
  cancelDrawingButton: document.getElementById("cancelDrawingButton"),
  clearLastManualEditButton: document.getElementById("clearLastManualEditButton"),
  clearAllManualEditsButton: document.getElementById("clearAllManualEditsButton"),
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
  applySavedManualMapEdits(loadSavedManualMapEdits());
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
      state.selectedMode = MODE_CONFIG[button.dataset.mode] ? button.dataset.mode : "walking";
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
    elements.walkingBands,
    elements.cyclingBands,
    elements.walkingColor1,
    elements.walkingColor2,
    elements.cyclingColor1,
    elements.cyclingColor2,
    elements.cyclingColor3,
    elements.legendPosition,
  ].filter(Boolean).forEach((control) => {
    control.addEventListener("input", render);
    control.addEventListener("change", render);
  });

  elements.mapZoomAdjust?.addEventListener("input", onMapZoomAdjustChange);
  elements.mapZoomAdjust?.addEventListener("change", onMapZoomAdjustChange);
  elements.recenterMapButton?.addEventListener("click", recenterMapView);

  [elements.siteCoordinates, elements.accessCoordinates].forEach((control) => {
    control.addEventListener("input", handleCoordinateDraftChange);
    control.addEventListener("change", handleCoordinateDraftChange);
  });

  elements.generateButton.addEventListener("click", runGenerationSequence);
  elements.saveOverridesButton.addEventListener("click", saveOverrides);
  elements.resetOverridesButton.addEventListener("click", resetOverrides);
  elements.togglePlacePointButton.addEventListener("click", togglePlacePointMode);
  elements.drawingToolButtons.forEach((button) => {
    button.addEventListener("click", () => activateDrawingTool(button.dataset.drawingTool || ""));
  });
  elements.finishDrawingButton?.addEventListener("click", finishCurrentDrawing);
  elements.cancelDrawingButton?.addEventListener("click", cancelCurrentDrawing);
  elements.clearLastManualEditButton?.addEventListener("click", clearLastManualEdit);
  elements.clearAllManualEditsButton?.addEventListener("click", clearAllManualEdits);
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
  document.addEventListener("keydown", onDocumentKeyDown);
}

function render() {
  updateModeControls();
  updateManualEditControls();
  updateStatus();
  renderAmenitiesTable();
  renderManualOverlaysTable();
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
  if (elements.mapZoomAdjustValue) {
    elements.mapZoomAdjustValue.textContent = formatMapZoomAdjustValue();
  }
}

function updateStatus() {
  const isRunning = state.status.tone === "running";
  document.body.classList.toggle("is-busy", isRunning);
  if (elements.generateButton) {
    elements.generateButton.disabled = isRunning;
  }
  if (elements.mapPreview) {
    elements.mapPreview.setAttribute("aria-busy", String(isRunning));
  }
  elements.statusTitle.textContent = state.status.title;
  elements.statusText.textContent = state.status.text;
  elements.statusDot.className = "status-dot";
  if (state.status.tone === "running") {
    elements.statusDot.classList.add("is-running");
  } else if (state.status.tone === "warning") {
    elements.statusDot.classList.add("is-warning");
  } else if (state.status.tone === "error") {
    elements.statusDot.classList.add("is-error");
  } else if (state.status.tone === "active") {
    elements.statusDot.classList.add("is-active");
  } else if (state.status.tone === "ready") {
    elements.statusDot.classList.add("is-ready");
  }
}

function renderAmenitiesTable() {
  elements.amenitiesTableBody.innerHTML = "";

  if (state.amenities.length === 0) {
    const row = document.createElement("tr");
    row.className = "empty-table-row";
    row.innerHTML = `<td colspan="7">No amenities are currently shown. Generate a draft map or place a manual point to populate this table.</td>`;
    elements.amenitiesTableBody.appendChild(row);
    return;
  }

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

function renderManualOverlaysTable() {
  if (!elements.manualOverlaysTableBody) {
    return;
  }

  elements.manualOverlaysTableBody.innerHTML = "";
  const savedManualOverlays = getAllSavedManualOverlays();

  if (savedManualOverlays.length === 0) {
    const row = document.createElement("tr");
    row.className = "empty-table-row";
    row.innerHTML = `<td colspan="4">No manual map edits are currently saved.</td>`;
    elements.manualOverlaysTableBody.appendChild(row);
    return;
  }

  savedManualOverlays.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td><input type="text" value="${escapeHtml(item.displayName)}" data-manual-field="displayName" data-manual-id="${item.id}" data-manual-type="${item.type}" /></td>
        <td>${escapeHtml(getDrawingToolConfig(item.type)?.displayName || item.type)}</td>
        <td><input type="checkbox" ${item.showInLegend ? "checked" : ""} data-manual-field="showInLegend" data-manual-id="${item.id}" data-manual-type="${item.type}" /></td>
        <td><button class="row-delete" type="button" data-manual-delete-id="${item.id}" data-manual-delete-type="${item.type}" aria-label="Delete manual edit">X</button></td>
      `;
    elements.manualOverlaysTableBody.appendChild(row);
  });

  elements.manualOverlaysTableBody
    .querySelectorAll("input[data-manual-id]")
    .forEach((control) => {
      control.addEventListener("input", onManualOverlayFieldChange);
      control.addEventListener("change", onManualOverlayFieldChange);
    });

  elements.manualOverlaysTableBody
    .querySelectorAll("[data-manual-delete-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        const manualId = Number(button.dataset.manualDeleteId);
        const manualType = String(button.dataset.manualDeleteType || "");
        const removedOverlay = findSavedManualOverlay(manualId, manualType);
        if (!removedOverlay) {
          return;
        }
        removeSavedManualOverlay(manualId, manualType);
        persistManualMapEdits();
        await refreshCurrentIsochronesAfterManualOverlayChange(
          `Recalculating ${MODE_CONFIG[state.selectedMode].label.toLowerCase()} catchment after removing ${removedOverlay.displayName}.`,
          "Manual edit removed",
          `${removedOverlay.displayName} was removed from the map.`,
          "ready",
          [removedOverlay]
        );
      });
    });
}

function onManualOverlayFieldChange(event) {
  const manualId = Number(event.target.dataset.manualId);
  const manualType = String(event.target.dataset.manualType || "");
  const field = event.target.dataset.manualField;
  const overlay = findSavedManualOverlay(manualId, manualType);
  if (!overlay || !field) {
    return;
  }

  if (event.target.type === "checkbox") {
    overlay[field] = event.target.checked;
  } else {
    overlay[field] = event.target.value;
  }

  persistManualMapEdits();

  if (event.target.type === "text") {
    renderMap();
    renderMethodNote();
    return;
  }

  render();
}

function doesManualOverlayAffectMode(overlay, mode = state.selectedMode) {
  if (!overlay) {
    return false;
  }
  if (overlay.type === "shared-path" || overlay.type === "bridge-crossing" || overlay.type === "barrier-line") {
    return true;
  }
  if (mode === "walking") {
    return overlay.type === "walking-path";
  }
  if (mode === "cycling") {
    return overlay.type === "cycling-path";
  }
  return false;
}

function shouldRefreshCurrentIsochroneForManualOverlays(overlays) {
  return Boolean(
    state.generatedScenario &&
    state.hasGeneratedDraft &&
    Array.isArray(overlays) &&
    overlays.some((overlay) => doesManualOverlayAffectMode(overlay, state.selectedMode))
  );
}

async function refreshCurrentIsochronesAfterManualOverlayChange(
  statusText,
  fallbackTitle,
  fallbackText,
  fallbackTone,
  overlays = []
) {
  if (shouldRefreshCurrentIsochroneForManualOverlays(overlays)) {
    await refreshLiveContext(statusText);
    return;
  }
  setStatus(fallbackTitle, fallbackText, fallbackTone);
  render();
}

function findSavedManualOverlay(manualId, manualType) {
  return manualType === "exclusion-area"
    ? state.isochroneExclusionAreas.find((item) => item.id === manualId)
    : state.manualLineEdits.find((item) => item.id === manualId && item.type === manualType);
}

function removeSavedManualOverlay(manualId, manualType) {
  if (manualType === "exclusion-area") {
    state.isochroneExclusionAreas = state.isochroneExclusionAreas.filter((item) => item.id !== manualId);
    return;
  }
  state.manualLineEdits = state.manualLineEdits.filter((item) => !(item.id === manualId && item.type === manualType));
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
    Number(elements.mapZoomAdjust?.value || 0)
  );
  state.currentMapView = mapView;
  const site = projectLatLonToSvg(
    scenario.siteCoordinates.latitude,
    scenario.siteCoordinates.longitude,
    mapView
  );
  const accessProvided = Boolean(scenario.accessCoordinates);
  const showAccessMarker = accessProvided;
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
  elements.previewNote.textContent =
    state.selectedMode === "cycling"
        ? "Cycling mode shows settlements and key destinations from OpenStreetMap. Cycling isochrones are generated from a local OpenStreetMap-derived network with user-authored links and barrier edits applied before polygon generation."
        : "Basemap and amenities are drawn from OpenStreetMap live services. Walking isochrones are generated from a local OpenStreetMap-derived network with dedicated pedestrian links, tagged sidewalks and user-authored links/barriers considered before polygon generation.";

  const legendInside = elements.legendPosition.value === "inside";
  const legendX = legendInside ? 650 : 742;
  const legendWidth = legendInside ? 248 : 190;

  const isochroneMarkup = buildIsochroneLayerMarkup(state.isochrones, mapView);
  const exclusionMaskMarkup = buildIsochroneExclusionMaskMarkup(state.isochroneExclusionAreas, mapView);
  const exclusionBoundaryMarkup = buildIsochroneExclusionBoundaryMarkup(
    isochroneMarkup.layers,
    state.isochroneExclusionAreas,
    mapView
  );
  const manualLineMarkup = buildManualLineOverlayMarkup(state.manualLineEdits, mapView);
  const draftMarkup = buildDraftDrawingMarkup(mapView);
  const pointMarkup = buildAmenityDisplayItems(visibleAmenities, mapView, site, state.selectedMode)
    .map((item) => item.labelOnly
      ? `
        <text x="${item.x}" y="${item.y}" font-size="13" fill="#1d2328" stroke="#fffdf8" stroke-width="3.2" paint-order="stroke" font-family="Inter, Arial, sans-serif" font-weight="700" text-anchor="middle">${escapeHtml(item.name)}</text>
      `
      : `
        <g transform="translate(${item.x} ${item.y})">
          ${drawSymbol(item.symbol, item.color, 8.5, true)}
        </g>
      `
    )
    .join("");

  const legendRows = [
    { name: "Development site", type: "site-marker", color: "#1d2328" },
    ...(showAccessMarker ? [{ name: "Proposed access", type: "access-marker", color: "#b35b3d" }] : []),
    ...configuredBands.map((band) => ({
      name: `${config.label} ${band.label}`,
      type: "band",
      color: band.fill,
    })),
    ...buildManualOverlayLegendRows(),
    ...legendItems.map((item) => ({
      name: getLegendLabelForAmenity(item, state.selectedMode),
      type: "amenity",
      symbol: item.symbol,
      color: item.color,
    })),
  ];
  elements.legendCount.textContent = String(legendRows.length);

  const legendBoxY = 28;
  const legendPaddingX = 16;
  const legendPaddingTop = 14;
  const legendLayout = buildLegendLayout(legendRows, legendWidth, legendX, legendBoxY, legendPaddingX, legendPaddingTop);
  const legendHeight = legendLayout.height;
  const legendRowMarkup = legendLayout.markup;

  const siteMarker = drawDevelopmentSiteMarker(site.x, site.y, false);

  const accessMarker = showAccessMarker ? drawAccessMarker(access.x, access.y, false) : "";
  const projectDisplayName = elements.projectName.value || "Unnamed project";
  const authorityDisplayName = elements.planningAuthority.value || "Planning authority to be confirmed";
  const titleBoxMarkup = buildMapTitleBlock(projectDisplayName, authorityDisplayName);

  elements.mapPreview.innerHTML = `
    <rect width="960" height="640" fill="#f2efe6"></rect>
    <rect x="24" y="24" width="912" height="592" fill="#f8f5ee" stroke="#d7d0c4" stroke-width="1.5"></rect>
    ${basemapMarkup}
    ${exclusionMaskMarkup}
    <g opacity="0.82">
      <g${exclusionMaskMarkup ? ' mask="url(#isochrone-fill-mask)"' : ""}>
        ${isochroneMarkup.fillMarkup}
        ${isochroneMarkup.strokeMarkup}
      </g>
      ${exclusionBoundaryMarkup}
    </g>
    ${manualLineMarkup}
    ${draftMarkup}
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
  elements.mapPreview.style.cursor =
    state.isPlacingPoint || state.activeDrawingTool ? "crosshair" : state.isDraggingMap ? "grabbing" : "grab";
}

function buildDraftScenarioFromInputs() {
  const siteCoordinates = parseCoordinatePair(elements.siteCoordinates.value);
  if (!siteCoordinates) {
    return null;
  }

  const accessCoordinates = parseCoordinatePair(elements.accessCoordinates.value, true);
  if (elements.accessCoordinates.value.trim() !== "" && !accessCoordinates) {
    return null;
  }

  return buildGeneratedScenario(siteCoordinates, accessCoordinates);
}

function pruneAutoAmenities() {
  state.amenities = state.amenities.filter((item) => item.isManual);
}

function clearGeneratedOutputsForScenarioChange() {
  state.isochrones = [];
  state.hasGeneratedDraft = false;
  state.lastIsochroneFallbackNotice = "";
  state.lastIsochroneSourceNote = "";
  pruneAutoAmenities();
}

function getActiveScenarioForPreview() {
  return state.generatedScenario ?? buildDraftScenarioFromInputs() ?? buildGeneratedScenario(
    parseCoordinatePair(DEFAULT_SITE_COORDINATES),
    parseCoordinatePair(DEFAULT_ACCESS_COORDINATES, true)
  );
}

function getDefaultPreviewMapView(scenario = getActiveScenarioForPreview()) {
  return buildBestFitMapView(
    scenario,
    state.hasGeneratedDraft ? state.isochrones : [],
    MODE_CONFIG[state.selectedMode].zoom,
    Number(elements.mapZoomAdjust?.value || 0)
  );
}

function cancelMapViewAnimation() {
  if (state.mapViewAnimationFrameId != null) {
    cancelAnimationFrame(state.mapViewAnimationFrameId);
  }
  state.mapViewAnimationFrameId = null;
  state.mapViewAnimationStartTime = 0;
  state.mapViewAnimationDurationMs = 0;
  state.mapViewAnimationFrom = null;
  state.mapViewAnimationTo = null;
}

function interpolateMapView(fromView, toView, progress) {
  return {
    zoom: fromView.zoom + (toView.zoom - fromView.zoom) * progress,
    topLeft: {
      x: fromView.topLeft.x + (toView.topLeft.x - fromView.topLeft.x) * progress,
      y: fromView.topLeft.y + (toView.topLeft.y - fromView.topLeft.y) * progress,
    },
  };
}

function animateMapViewTo(targetView, durationMs = 350) {
  if (!targetView) {
    return;
  }

  cancelMapViewAnimation();
  const fromView = state.currentMapView ?? getDefaultPreviewMapView();
  const toView = { zoom: targetView.zoom, topLeft: { ...targetView.topLeft } };
  state.currentMapView = fromView;
  state.mapViewAnimationFrom = fromView;
  state.mapViewAnimationTo = toView;
  state.mapViewAnimationDurationMs = durationMs;
  state.mapViewAnimationStartTime = performance.now();

  const step = (timestamp) => {
    const elapsed = timestamp - state.mapViewAnimationStartTime;
    const rawProgress = Math.min(1, elapsed / state.mapViewAnimationDurationMs);
    const easedProgress = 1 - (1 - rawProgress) * (1 - rawProgress) * (1 - rawProgress);
    state.currentMapView = interpolateMapView(
      state.mapViewAnimationFrom,
      state.mapViewAnimationTo,
      easedProgress
    );
    renderMap();

    if (rawProgress >= 1) {
      state.currentMapView = state.mapViewAnimationTo;
      cancelMapViewAnimation();
      renderMap();
      return;
    }

    state.mapViewAnimationFrameId = requestAnimationFrame(step);
  };

  state.mapViewAnimationFrameId = requestAnimationFrame(step);
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
        state.selectedMode === "walking"
          ? "OpenStreetMap raster tiles with live Overpass amenity points and a locally generated OpenStreetMap walking network catchment with user-authored network edits applied before polygon generation"
          : "OpenStreetMap raster tiles with live Overpass amenity points and a locally generated OpenStreetMap cycling network catchment with user-authored network edits applied before polygon generation",
      amenity_filtering:
        state.selectedMode === "cycling"
          ? `${visibleCount} visible cycling destinations, ${legendCount} shown in legend, fetched from OpenStreetMap around the current site and measured from the site coordinates`
          : `${visibleCount} visible amenities, ${legendCount} shown in legend, fetched from OpenStreetMap around the current site`,
      cycling_time_assumption:
        state.selectedMode === "cycling" ? CYCLING_TIME_GUIDANCE_TEXT : undefined,
      manual_map_edits: {
        proposed_manual_line_edits: state.manualLineEdits.map((item) => ({
          line_type: getDrawingToolConfig(item.type)?.displayName || item.type,
          display_name: item.displayName,
          point_count: item.points.length,
          shown_in_legend: item.showInLegend !== false,
          mode_created_in: item.modeCreated || undefined,
        })),
        isochrone_exclusion_areas: state.isochroneExclusionAreas.map((item) => ({
          exclusion_area_name: item.displayName,
          point_count: item.points.length,
          shown_in_legend: item.showInLegend !== false,
          mode_created_in: item.modeCreated || undefined,
        })),
      },
      limitations: [
        "Walking and cycling isochrones depend on OpenStreetMap network completeness and tagging quality, including the presence or absence of dedicated pedestrian links, sidewalk tags, access restrictions and cycle permissions.",
        "Amenities are fetched live from OpenStreetMap via Overpass and therefore depend on current public service availability.",
        MANUAL_EDIT_LIMITATION_TEXT,
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

function updateManualPointButtonState() {
  elements.togglePlacePointButton.classList.toggle("toggle-live", state.isPlacingPoint);
  elements.togglePlacePointButton.setAttribute("aria-pressed", String(state.isPlacingPoint));
  elements.togglePlacePointButton.textContent = state.isPlacingPoint
    ? "Click map to place point"
    : "Place manual point";
}

function updateManualEditControls() {
  elements.drawingToolButtons.forEach((button) => {
    const isActiveTool = button.dataset.drawingTool === state.activeDrawingTool;
    button.classList.toggle("is-active", isActiveTool);
    button.setAttribute("aria-pressed", String(isActiveTool));
  });

  if (elements.manualEditStatus) {
    const savedCount = state.manualLineEdits.length + state.isochroneExclusionAreas.length;
    if (state.activeDrawingTool) {
      const toolConfig = getDrawingToolConfig(state.activeDrawingTool);
      const minimumPoints = toolConfig?.geometryType === "polygon" ? 3 : 2;
      elements.manualEditStatus.textContent = `${toolConfig.displayName} active. ${state.draftDrawingPoints.length} point${state.draftDrawingPoints.length === 1 ? "" : "s"} captured. ${minimumPoints} required to finish. ${savedCount} saved manual edit${savedCount === 1 ? "" : "s"} on this device.`;
    } else {
      elements.manualEditStatus.textContent = `${savedCount} saved manual edit${savedCount === 1 ? "" : "s"} on this device. Select a drawing tool to add proposed routes, barriers or isochrone exclusion areas.`;
    }
  }

  if (elements.finishDrawingButton) {
    elements.finishDrawingButton.disabled = !state.activeDrawingTool;
  }
  if (elements.cancelDrawingButton) {
    elements.cancelDrawingButton.disabled = !state.activeDrawingTool && state.draftDrawingPoints.length === 0;
  }
  if (elements.clearLastManualEditButton) {
    elements.clearLastManualEditButton.disabled =
      state.manualLineEdits.length === 0 && state.isochroneExclusionAreas.length === 0;
  }
  if (elements.clearAllManualEditsButton) {
    elements.clearAllManualEditsButton.disabled =
      state.manualLineEdits.length === 0 &&
      state.isochroneExclusionAreas.length === 0 &&
      state.draftDrawingPoints.length === 0 &&
      !state.activeDrawingTool;
  }

  updateManualPointButtonState();
}

function getDrawingToolConfig(toolKey) {
  return DRAWING_TOOL_CONFIG[toolKey] || null;
}

function getManualOverlayDefaultName(toolKey, nextOrdinal = 1) {
  const toolConfig = getDrawingToolConfig(toolKey);
  return `${toolConfig?.displayName || "Manual edit"} ${nextOrdinal}`;
}

function getNextManualOverlayOrdinal(toolKey) {
  if (toolKey === "exclusion-area") {
    return state.isochroneExclusionAreas.length + 1;
  }
  return state.manualLineEdits.filter((item) => item.type === toolKey).length + 1;
}

function clearDraftDrawing() {
  state.draftDrawingPoints = [];
}

function deactivateDrawingTool(clearDraft = true) {
  state.activeDrawingTool = "";
  if (clearDraft) {
    clearDraftDrawing();
  }
}

function activateDrawingTool(toolKey) {
  const toolConfig = getDrawingToolConfig(toolKey);
  if (!toolConfig) {
    return;
  }

  if (state.activeDrawingTool === toolKey) {
    deactivateDrawingTool(true);
    setStatus("Drawing tool closed", "Manual line drawing has been switched off.", "ready");
    render();
    return;
  }

  const draftHadPoints = state.draftDrawingPoints.length > 0;
  deactivateDrawingTool(true);
  state.isPlacingPoint = false;
  state.activeDrawingTool = toolKey;
  setStatus(
    toolConfig.geometryType === "polygon" ? "Exclusion drawing active" : "Line drawing active",
    draftHadPoints
      ? `The previous draft was cleared. Click within the map preview to draw ${toolConfig.displayName.toLowerCase()}.`
      : `Click within the map preview to draw ${toolConfig.displayName.toLowerCase()}.`,
    "active"
  );
  render();
}

function togglePlacePointMode() {
  const nextState = !state.isPlacingPoint;
  if (nextState) {
    if (state.activeDrawingTool || state.draftDrawingPoints.length > 0) {
      deactivateDrawingTool(true);
      setStatus(
        "Placement mode active",
        "Manual line drawing was cleared so a manual point can be placed. Click within the map preview to add a manual point.",
        "active"
      );
    } else {
      setStatus("Placement mode active", "Click within the map preview to add a manual point.", "active");
    }
  } else {
    setStatus("Placement mode closed", "Manual point placement has been cancelled.", "ready");
  }
  state.isPlacingPoint = nextState;
  render();
}

function onDocumentKeyDown(event) {
  if (event.key !== "Escape" || event.defaultPrevented) {
    return;
  }

  if (state.activeDrawingTool || state.draftDrawingPoints.length > 0) {
    event.preventDefault();
    cancelCurrentDrawing();
    return;
  }

  if (state.isPlacingPoint) {
    event.preventDefault();
    state.isPlacingPoint = false;
    setStatus("Placement mode closed", "Manual point placement has been cancelled.", "ready");
    render();
  }
}

function getMapClickCoordinate(event) {
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
  return unprojectSvgToLatLon(clickX, clickY, mapView);
}

async function finishCurrentDrawing() {
  if (!state.activeDrawingTool) {
    setStatus("Select a drawing tool", "Choose a manual drawing tool before finishing a draft.", "warning");
    render();
    return;
  }

  const toolConfig = getDrawingToolConfig(state.activeDrawingTool);
  const minimumPoints = toolConfig.geometryType === "polygon" ? 3 : 2;
  if (state.draftDrawingPoints.length < minimumPoints) {
    setStatus(
      "More points needed",
      toolConfig.geometryType === "polygon"
        ? "An isochrone exclusion area needs at least three points before it can be finished."
        : "A manual line needs at least two points before it can be finished.",
      "warning"
    );
    render();
    return;
  }

  const overlayId = state.nextManualOverlayId++;
  const customName = elements.manualOverlayName?.value.trim();
  const overlay = {
    id: overlayId,
    type: state.activeDrawingTool,
    displayName: customName || getManualOverlayDefaultName(state.activeDrawingTool, getNextManualOverlayOrdinal(state.activeDrawingTool)),
    points: state.draftDrawingPoints.map((point) => ({ latitude: point.latitude, longitude: point.longitude })),
    showInLegend: true,
    modeCreated: state.selectedMode,
  };

  if (toolConfig.geometryType === "polygon") {
    state.isochroneExclusionAreas.push(overlay);
  } else {
    state.manualLineEdits.push(overlay);
  }

  persistManualMapEdits();
  clearDraftDrawing();
  if (elements.manualOverlayName) {
    elements.manualOverlayName.value = "";
  }
  await refreshCurrentIsochronesAfterManualOverlayChange(
    `Recalculating ${MODE_CONFIG[state.selectedMode].label.toLowerCase()} catchment after saving ${overlay.displayName}.`,
    toolConfig.geometryType === "polygon" ? "Isochrone exclusion saved" : "Manual line saved",
    `${overlay.displayName} has been added to the map preview and will be included in SVG and PNG exports.`,
    "ready",
    [overlay]
  );
}

function cancelCurrentDrawing() {
  if (!state.activeDrawingTool && state.draftDrawingPoints.length === 0) {
    setStatus("Nothing to cancel", "There is no active manual drawing to clear.", "warning");
    render();
    return;
  }

  deactivateDrawingTool(true);
  setStatus("Drawing cancelled", "The current manual drawing tool has been closed. Saved manual edits were left in place.", "ready");
  render();
}

async function clearLastManualEdit() {
  const latestOverlay = getAllSavedManualOverlays().slice(-1)[0];
  if (!latestOverlay) {
    setStatus("No manual edits saved", "There is no saved manual edit to remove.", "warning");
    render();
    return;
  }

  if (latestOverlay.type === "exclusion-area") {
    state.isochroneExclusionAreas = state.isochroneExclusionAreas.filter((item) => item.id !== latestOverlay.id);
  } else {
    state.manualLineEdits = state.manualLineEdits.filter((item) => item.id !== latestOverlay.id);
  }

  persistManualMapEdits();
  await refreshCurrentIsochronesAfterManualOverlayChange(
    `Recalculating ${MODE_CONFIG[state.selectedMode].label.toLowerCase()} catchment after removing ${latestOverlay.displayName}.`,
    "Last manual edit cleared",
    `${latestOverlay.displayName} was removed from the map.`,
    "ready",
    [latestOverlay]
  );
}

async function clearAllManualEdits() {
  const hadSavedEdits = state.manualLineEdits.length > 0 || state.isochroneExclusionAreas.length > 0;
  const hadDraft = state.draftDrawingPoints.length > 0 || Boolean(state.activeDrawingTool);
  const clearedOverlays = getAllSavedManualOverlays();
  state.manualLineEdits = [];
  state.isochroneExclusionAreas = [];
  deactivateDrawingTool(true);
  persistManualMapEdits();
  await refreshCurrentIsochronesAfterManualOverlayChange(
    `Recalculating ${MODE_CONFIG[state.selectedMode].label.toLowerCase()} catchment after clearing manual overlays.`,
    "Manual edits cleared",
    hadSavedEdits || hadDraft
      ? "All saved manual overlays and draft drawing points were cleared from this device."
      : "There were no manual edits to clear.",
    hadSavedEdits || hadDraft ? "ready" : "warning",
    clearedOverlays
  );
}

function getAllSavedManualOverlays() {
  return [...state.manualLineEdits, ...state.isochroneExclusionAreas].sort((a, b) => a.id - b.id);
}

function persistManualMapEdits() {
  localStorage.setItem(
    MANUAL_OVERLAY_STORAGE_KEY,
    JSON.stringify({
      manualLineEdits: state.manualLineEdits,
      isochroneExclusionAreas: state.isochroneExclusionAreas,
      nextManualOverlayId: state.nextManualOverlayId,
    })
  );
}

function applySavedManualMapEdits(savedEdits) {
  state.manualLineEdits = savedEdits.manualLineEdits;
  state.isochroneExclusionAreas = savedEdits.isochroneExclusionAreas;
  state.nextManualOverlayId = savedEdits.nextManualOverlayId;
}

function loadSavedManualMapEdits() {
  const fallback = {
    manualLineEdits: [],
    isochroneExclusionAreas: [],
    nextManualOverlayId: 1,
  };
  const raw = localStorage.getItem(MANUAL_OVERLAY_STORAGE_KEY);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    const manualLineEdits = Array.isArray(parsed?.manualLineEdits)
      ? parsed.manualLineEdits.map(normaliseSavedManualOverlay).filter(Boolean)
      : [];
    const isochroneExclusionAreas = Array.isArray(parsed?.isochroneExclusionAreas)
      ? parsed.isochroneExclusionAreas.map(normaliseSavedManualOverlay).filter(Boolean)
      : [];
    const highestId = Math.max(
      Number(parsed?.nextManualOverlayId) - 1 || 0,
      ...manualLineEdits.map((item) => item.id),
      ...isochroneExclusionAreas.map((item) => item.id)
    );
    return {
      manualLineEdits,
      isochroneExclusionAreas,
      nextManualOverlayId: highestId + 1,
    };
  } catch (error) {
    return fallback;
  }
}

function normaliseSavedManualOverlay(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const type = String(item.type || "");
  const points = Array.isArray(item.points)
    ? item.points
      .map((point) => ({
        latitude: Number(point?.latitude),
        longitude: Number(point?.longitude),
      }))
      .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
    : [];

  if (!DRAWING_TOOL_CONFIG[type] || points.length === 0 || !Number.isFinite(Number(item.id))) {
    return null;
  }

  return {
    id: Number(item.id),
    type,
    displayName: String(item.displayName || getManualOverlayDefaultName(type)),
    points,
    showInLegend: item.showInLegend !== false,
    modeCreated: item.modeCreated ? String(item.modeCreated) : "",
  };
}

function onMapClick(event) {
  if (!state.isPlacingPoint && !state.activeDrawingTool) {
    return;
  }

  const coordinatePoint = getMapClickCoordinate(event);

  if (state.activeDrawingTool) {
    state.draftDrawingPoints = [
      ...state.draftDrawingPoints,
      {
        latitude: coordinatePoint.latitude,
        longitude: coordinatePoint.longitude,
      },
    ];
    render();
    return;
  }

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
        `${serviceName} did not respond within ${Math.round(timeoutMs / 1000)} seconds. Public Overpass mirrors can be slow; try again in a few minutes or reduce the search area if the issue persists.`
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
    [payload?.error, payload?.details?.message, payload?.details?.detail, payload?.message, responseText]
      .filter(Boolean)
      .join(" ")
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
    const detailText = responseMessage ? ` ${responseMessage}` : "";
    return createServiceError(
      serviceName,
      "api_outage",
      `${serviceName} is temporarily unavailable or overloaded. Please try again shortly.${detailText}`
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
  return splitBands(elements.walkingBands.value);
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
  return splitBands(elements.walkingBands.value);
}

function getSelectedBandColoursForMode(mode) {
  if (mode === "walking") {
    return [elements.walkingColor1.value, elements.walkingColor2.value];
  }
  if (mode === "cycling") {
    return [elements.cyclingColor1.value, elements.cyclingColor2.value, elements.cyclingColor3.value];
  }
  return [elements.walkingColor1.value, elements.walkingColor2.value];
}

function parseConfiguredBandEntry(entry, mode, fallbackBand) {
  const numeric = Number(entry.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(numeric) || numeric <= 0) {
    return null;
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

  const previousScenario = state.generatedScenario ?? buildGeneratedScenario(
    parseCoordinatePair(DEFAULT_SITE_COORDINATES),
    parseCoordinatePair(DEFAULT_ACCESS_COORDINATES, true)
  );
  const baseView = state.currentMapView ?? buildBestFitMapView(
    previousScenario,
    state.hasGeneratedDraft ? state.isochrones : [],
    MODE_CONFIG[state.selectedMode].zoom,
    Number(elements.mapZoomAdjust?.value || 0)
  );
  const nextScenario = buildGeneratedScenario(siteCoordinates, accessCoordinates);
  state.generatedScenario = nextScenario;
  clearGeneratedOutputsForScenarioChange();
  state.currentMapView = baseView;
  animateMapViewTo(getDefaultPreviewMapView(nextScenario), 360);
  setStatus(
    "Coordinates updated",
    "Preview markers have moved to the new coordinates. Generate the draft map when you are ready to recalculate isochrones.",
    "warning"
  );
  schedulePlanningAuthorityLookup(siteCoordinates);
  render();
}

function onMapZoomAdjustChange() {
  const nextZoomValue = Number(elements.mapZoomAdjust?.value || 0);
  const zoomDelta = nextZoomValue - state.lastZoomControlValue;
  state.lastZoomControlValue = nextZoomValue;
  if (elements.mapZoomAdjustValue) {
    elements.mapZoomAdjustValue.textContent = formatMapZoomAdjustValue();
  }

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
  cancelMapViewAnimation();
  if (elements.mapZoomAdjust) {
    elements.mapZoomAdjust.value = "0";
  }
  state.lastZoomControlValue = 0;
  if (elements.mapZoomAdjustValue) {
    elements.mapZoomAdjustValue.textContent = formatMapZoomAdjustValue();
  }
  animateMapViewTo(getDefaultPreviewMapView(), 350);
}

function onMapPointerDown(event) {
  if (state.isPlacingPoint || state.activeDrawingTool || event.button !== 0) {
    return;
  }

  event.preventDefault();
  cancelMapViewAnimation();
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
  if (state.mapPanFrameId != null) {
    return;
  }
  state.mapPanFrameId = requestAnimationFrame(() => {
    state.mapPanFrameId = null;
    renderMap();
  });
}

function onMapPointerUp(event) {
  if (event.pointerId !== state.mapDragPointerId) {
    return;
  }

  state.isDraggingMap = false;
  state.mapDragPointerId = null;
  state.mapDragLastPoint = null;
  if (state.mapPanFrameId != null) {
    cancelAnimationFrame(state.mapPanFrameId);
    state.mapPanFrameId = null;
    renderMap();
  }
  elements.mapPreview.releasePointerCapture?.(event.pointerId);
  elements.mapPreview.style.cursor =
    state.isPlacingPoint || state.activeDrawingTool ? "crosshair" : "grab";
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
              : item.type === "manual-line"
                ? drawManualLineLegendSwatch(item)
                : item.type === "exclusion-area"
                  ? drawExclusionAreaLegendSwatch(item)
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
  const adjustValue = Number(elements.mapZoomAdjust?.value || 0);
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

function scheduleLongRunningCalculationNotice(requestId, mode) {
  return null;
}

function clearTimer(timer) {
  clearTimeout(timer);
  state.generationTimers = state.generationTimers.filter((candidate) => candidate !== timer);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function yieldToBrowser() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function isDebugTimingLogEnabled() {
  try {
    return IS_FILE_CONTEXT || window.localStorage?.getItem("prime-isochrone-debug") === "1";
  } catch (error) {
    return IS_FILE_CONTEXT;
  }
}

function startDebugTiming(label, metadata = {}) {
  if (!isDebugTimingLogEnabled()) {
    return null;
  }
  const startedAt = performance.now();
  console.debug(`[isochrone timing] ${label} started`, metadata);
  return { label, startedAt };
}

function endDebugTiming(timer, metadata = {}) {
  if (!timer) {
    return;
  }
  console.debug(`[isochrone timing] ${timer.label} completed`, {
    ...metadata,
    durationMs: Math.round(performance.now() - timer.startedAt),
  });
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
  const longRunningNoticeTimer = scheduleLongRunningCalculationNotice(requestId, state.selectedMode);
  state.lastIsochroneFallbackNotice = "";
  state.lastIsochroneSourceNote = "";
  setStatus(
    "Loading isochrones",
    state.selectedMode === "walking"
      ? "Building a local walkable network from OpenStreetMap, including user-authored links and barriers."
      : "Building a local cyclable network from OpenStreetMap, including user-authored links and barriers.",
    "running"
  );
  render();

  const originCoordinates = state.generatedScenario.accessCoordinates ?? state.generatedScenario.siteCoordinates;
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
    state.currentMapView = null;
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
    if (longRunningNoticeTimer) {
      clearTimer(longRunningNoticeTimer);
    }
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
          headers: IS_FILE_CONTEXT
            ? {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                "Accept": "application/json, */*;q=0.1",
              }
            : {
                "Content-Type": "text/plain;charset=UTF-8",
              },
          body: IS_FILE_CONTEXT ? new URLSearchParams({ data: query }).toString() : query,
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

  if (lastError?.kind === "cancelled") {
    throw lastError;
  }

  cacheAmenitiesForScenario(siteCoordinates, mode, []);
  return [];
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
        state.selectedMode === "walking"
          ? "Live OpenStreetMap context and locally generated walking isochrones refreshed for the current coordinates."
          : "Live OpenStreetMap context and locally generated cycling isochrones refreshed for the current coordinates.",
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

  return [
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

async function fetchLocalActiveTravelIsochronesForScenario(originCoordinates, mode, options = {}) {
  const configuredBands = getConfiguredBandsForMode(mode)
    .filter((band) => Number.isFinite(Number(band.distance)) && Number(band.distance) > 0)
    .sort((a, b) => Number(a.distance) - Number(b.distance));
  if (configuredBands.length === 0) {
    throw createServiceError(ACTIVE_TRAVEL_NETWORK_SERVICE_NAME, "malformed_request", `No valid ${mode} distance bands are configured.`);
  }

  const networkRadiusMetres = getActiveTravelNetworkFetchRadiusMetres(configuredBands);
  const cacheKey = buildActiveTravelNetworkCacheKey(originCoordinates, mode, networkRadiusMetres);
  const resultCacheKey = buildActiveTravelIsochroneCacheKey(originCoordinates, mode, configuredBands, networkRadiusMetres);
  const cachedIsochrones = getMapCacheEntry(ACTIVE_TRAVEL_ISOCHRONE_RESULT_CACHE, resultCacheKey, cloneActiveTravelIsochroneResult);
  if (cachedIsochrones) {
    return cachedIsochrones;
  }
  let payload = getMapCacheEntry(ACTIVE_TRAVEL_NETWORK_CACHE, cacheKey, clonePlainValue);

  if (!payload) {
    payload = await fetchActiveTravelNetworkPayload(originCoordinates, networkRadiusMetres, mode, options);
    setMapCacheEntry(ACTIVE_TRAVEL_NETWORK_CACHE, cacheKey, payload, clonePlainValue);
  }

  let graph = getMapCacheEntry(ACTIVE_TRAVEL_GRAPH_CACHE, cacheKey, cloneActiveTravelGraph);
  if (!graph) {
    graph = buildActiveTravelGraphFromOverpassPayload(payload, mode);
    setMapCacheEntry(ACTIVE_TRAVEL_GRAPH_CACHE, cacheKey, graph, cloneActiveTravelGraph);
  }
  applyManualActiveTravelEditsToGraph(graph, mode);
  if (graph.edges.filter((edge) => edge.active !== false).length === 0 || graph.nodes.size === 0) {
    throw createServiceError(
      ACTIVE_TRAVEL_NETWORK_SERVICE_NAME,
      "unavailable_routing_data",
      `No usable ${mode === "walking" ? "walkable" : "cyclable"} network could be assembled from OpenStreetMap for the selected location.`
    );
  }

  const originNodeId = addTemporarySnappedGraphNode(graph, originCoordinates, "origin");
  const distances = runGraphDijkstra(graph, originNodeId);
  if ((graph.adjacency.get(originNodeId) || []).length === 0 || distances.size <= 1) {
    throw createServiceError(
      ACTIVE_TRAVEL_NETWORK_SERVICE_NAME,
      "unavailable_routing_data",
      `No usable ${mode === "walking" ? "walking" : "cycling"} connection could be found from the selected origin into the mapped OpenStreetMap network.`
    );
  }
  const outputs = configuredBands
    .map((band) => {
      const bandDistanceMetres = Number(band.distance) * 1000;
      const samples = collectReachableActiveTravelSamples(graph, distances, bandDistanceMetres, mode, originCoordinates);
      const rings = buildActiveTravelCatchmentRings(samples, mode);
      if (rings.length === 0) {
        return null;
      }
      return {
        geometry: {
          type: "MultiPolygon",
          coordinates: rings.map((ring) => [ring]),
        },
        label: band.label,
        color: band.fill,
        contour: bandDistanceMetres,
        provider: ACTIVE_TRAVEL_NETWORK_SERVICE_NAME,
        properties: {
          contour: bandDistanceMetres,
          source: ACTIVE_TRAVEL_NETWORK_SERVICE_NAME,
        },
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(b.contour) - Number(a.contour));

  outputs.metadata = {
    provider: ACTIVE_TRAVEL_NETWORK_SERVICE_NAME,
    mode,
    fetchRadiusMetres: networkRadiusMetres,
    networkNodeCount: graph.nodes.size,
    networkEdgeCount: graph.edges.filter((edge) => edge.active !== false).length,
    manualLinkCount: countManualNetworkLineEditsForMode(mode),
    manualBarrierCount: state.manualLineEdits.filter((item) => item.type === "barrier-line").length,
    caveat:
      mode === "walking"
        ? "Walking catchments are generated from a local OpenStreetMap-derived network. Dedicated pedestrian links and tagged sidewalks are used directly; ordinary local roads are permitted on a planning-style permissive basis unless restricted."
        : "Cycling catchments are generated from a local OpenStreetMap-derived network with user-authored route additions and barrier removals applied before polygon generation.",
  };
  setMapCacheEntry(ACTIVE_TRAVEL_ISOCHRONE_RESULT_CACHE, resultCacheKey, outputs, cloneActiveTravelIsochroneResult);
  return outputs;
}

function getActiveTravelNetworkFetchRadiusMetres(configuredBands) {
  const maximumBandDistance = Math.max(...configuredBands.map((band) => Number(band.distance) * 1000), 0);
  return Math.max(1200, Math.round(maximumBandDistance + ACTIVE_TRAVEL_NETWORK_FETCH_RADIUS_MARGIN_METRES));
}

function buildActiveTravelNetworkCacheKey(originCoordinates, mode, radiusMetres) {
  return [
    mode,
    originCoordinates.latitude.toFixed(5),
    originCoordinates.longitude.toFixed(5),
    Math.round(radiusMetres),
  ].join("|");
}

function buildActiveTravelNetworkOverpassQuery(originCoordinates, radiusMetres, mode) {
  const allowedHighways = Array.from(
    mode === "walking"
      ? new Set([
          ...ACTIVE_TRAVEL_WALK_PERMISSIVE_HIGHWAYS,
          ...ACTIVE_TRAVEL_WALK_FOOTWAY_HIGHWAYS,
          ...ACTIVE_TRAVEL_WALK_ROADS_REQUIRING_SIDEWALK,
          "road",
        ])
      : new Set([
          ...ACTIVE_TRAVEL_CYCLE_HIGHWAYS,
          "footway",
          "pedestrian",
        ])
  ).join("|");
  return `
[out:json][timeout:45];
(
  way(around:${Math.round(radiusMetres)},${originCoordinates.latitude},${originCoordinates.longitude})
    [highway]
    [highway~"^(${allowedHighways})$"]
    [highway!~"construction|proposed|raceway|corridor|elevator"];
);
(._;>;);
out body;
  `;
}

async function fetchActiveTravelNetworkPayload(originCoordinates, radiusMetres, mode, options = {}) {
  let lastError = null;
  const query = buildActiveTravelNetworkOverpassQuery(originCoordinates, radiusMetres, mode);

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      return await fetchJsonWithDiagnostics(
        endpoint,
        {
          method: "POST",
          headers: IS_FILE_CONTEXT
            ? {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                "Accept": "application/json, */*;q=0.1",
              }
            : {
                "Content-Type": "text/plain;charset=UTF-8",
              },
          body: IS_FILE_CONTEXT ? new URLSearchParams({ data: query }).toString() : query,
          signal: options.signal,
        },
        ACTIVE_TRAVEL_NETWORK_SERVICE_NAME
      );
    } catch (error) {
      lastError = error;
      if (error?.kind === "cancelled" || error?.kind === "malformed_request" || error?.kind === "invalid_site_location") {
        throw error;
      }
    }
  }

  throw lastError || createServiceError(
    ACTIVE_TRAVEL_NETWORK_SERVICE_NAME,
    "api_outage",
    "OpenStreetMap active travel network data could not be fetched from the available Overpass services."
  );
}

function buildActiveTravelGraphFromOverpassPayload(payload, mode) {
  const nodeById = new Map();
  const ways = [];
  (payload?.elements ?? []).forEach((element) => {
    if (element.type === "node" && Number.isFinite(Number(element.lat)) && Number.isFinite(Number(element.lon))) {
      nodeById.set(String(element.id), {
        id: String(element.id),
        latitude: Number(element.lat),
        longitude: Number(element.lon),
      });
      return;
    }
    if (element.type === "way" && Array.isArray(element.nodes) && element.nodes.length >= 2) {
      ways.push(element);
    }
  });

  const graph = createEmptyActiveTravelGraph(mode);
  nodeById.forEach((node) => {
    graph.nodes.set(node.id, { ...node });
    graph.adjacency.set(node.id, []);
  });

  ways.forEach((way) => {
    const tags = way.tags ?? {};
    const allowsMode = mode === "walking" ? isOsmWayWalkable(tags) : isOsmWayCyclable(tags);
    if (!allowsMode) {
      return;
    }

    const bidirectional = !isWayOneWayForMode(tags, mode);
    for (let index = 1; index < way.nodes.length; index += 1) {
      const fromId = String(way.nodes[index - 1]);
      const toId = String(way.nodes[index]);
      const fromNode = graph.nodes.get(fromId);
      const toNode = graph.nodes.get(toId);
      if (!fromNode || !toNode) {
        continue;
      }
      const segmentLengthMetres = getDistanceMetres(
        fromNode.latitude,
        fromNode.longitude,
        toNode.latitude,
        toNode.longitude
      );
      if (!Number.isFinite(segmentLengthMetres) || segmentLengthMetres < 1) {
        continue;
      }
      addGraphEdge(graph, fromId, toId, {
        lengthMetres: segmentLengthMetres,
        bidirectional,
        sourceType: "osm",
        highway: String(tags.highway || ""),
        wayName: String(tags.name || ""),
        wayId: Number(way.id),
      });
    }
  });

  strengthenOsmGraphConnectivity(graph);
  return graph;
}

function createEmptyActiveTravelGraph(mode) {
  return {
    mode,
    nodes: new Map(),
    adjacency: new Map(),
    edges: [],
    nextSyntheticNodeId: 1,
  };
}

function cloneActiveTravelGraph(graph) {
  if (!graph) {
    return graph;
  }
  return {
    mode: graph.mode,
    nextSyntheticNodeId: Number(graph.nextSyntheticNodeId) || 1,
    nodes: new Map(Array.from(graph.nodes.entries(), ([nodeId, node]) => [nodeId, { ...node }])),
    adjacency: new Map(
      Array.from(graph.adjacency.entries(), ([nodeId, links]) => [nodeId, Array.isArray(links) ? links.map((link) => ({ ...link })) : []])
    ),
    edges: Array.isArray(graph.edges) ? graph.edges.map((edge) => ({ ...edge })) : [],
  };
}

function strengthenOsmGraphConnectivity(graph) {
  const activeOsmEdgeCount = graph.edges.filter((edge) => edge.active !== false && edge.sourceType === "osm").length;
  if (activeOsmEdgeCount > ACTIVE_TRAVEL_CONNECTIVITY_HEURISTIC_EDGE_LIMIT) {
    return;
  }
  connectLowDegreeNodesToNearbyEdges(graph);
  bridgeNearbyTerminalNodes(graph);
}

function addGraphNode(graph, coordinate, id = null) {
  const nodeId = id ? String(id) : `synthetic-${graph.mode}-${graph.nextSyntheticNodeId++}`;
  if (!graph.nodes.has(nodeId)) {
    graph.nodes.set(nodeId, {
      id: nodeId,
      latitude: Number(coordinate.latitude),
      longitude: Number(coordinate.longitude),
    });
  }
  if (!graph.adjacency.has(nodeId)) {
    graph.adjacency.set(nodeId, []);
  }
  return nodeId;
}

function addGraphEdge(graph, fromId, toId, details) {
  if (fromId === toId) {
    return null;
  }
  const fromNode = graph.nodes.get(String(fromId));
  const toNode = graph.nodes.get(String(toId));
  if (!fromNode || !toNode) {
    return null;
  }

  const edgeId = graph.edges.length;
  const edge = {
    id: edgeId,
    a: String(fromId),
    b: String(toId),
    lengthMetres: Number(details.lengthMetres),
    bidirectional: details.bidirectional !== false,
    sourceType: details.sourceType || "osm",
    highway: details.highway || "",
    wayName: details.wayName || "",
    wayId: Number.isFinite(Number(details.wayId)) ? Number(details.wayId) : null,
    manualType: details.manualType || "",
    manualId: Number.isFinite(Number(details.manualId)) ? Number(details.manualId) : null,
    active: true,
  };
  graph.edges.push(edge);
  graph.adjacency.get(edge.a).push({ to: edge.b, lengthMetres: edge.lengthMetres, edgeId });
  if (edge.bidirectional) {
    graph.adjacency.get(edge.b).push({ to: edge.a, lengthMetres: edge.lengthMetres, edgeId });
  }
  return edge;
}

function buildActiveGraphDegreeMap(graph) {
  const degreeByNodeId = new Map();
  graph.nodes.forEach((_, nodeId) => {
    degreeByNodeId.set(nodeId, 0);
  });
  graph.edges.forEach((edge) => {
    if (edge.active === false) {
      return;
    }
    degreeByNodeId.set(edge.a, (degreeByNodeId.get(edge.a) || 0) + 1);
    degreeByNodeId.set(edge.b, (degreeByNodeId.get(edge.b) || 0) + 1);
  });
  return degreeByNodeId;
}

function connectLowDegreeNodesToNearbyEdges(graph) {
  const degreeByNodeId = buildActiveGraphDegreeMap(graph);
  const candidateNodeIds = Array.from(graph.nodes.keys()).filter((nodeId) => (degreeByNodeId.get(nodeId) || 0) <= 2);
  if (candidateNodeIds.length > ACTIVE_TRAVEL_CONNECTIVITY_HEURISTIC_CANDIDATE_LIMIT) {
    return;
  }

  candidateNodeIds.forEach((nodeId) => {
    const node = graph.nodes.get(nodeId);
    if (!node) {
      return;
    }
    const best = findBestNearbyEdgeForExistingNode(graph, nodeId, node, ACTIVE_TRAVEL_OSM_JUNCTION_STITCH_TOLERANCE_METRES);
    if (!best) {
      return;
    }
    const splitNodeId = splitGraphEdgeAtCoordinate(graph, best.edge, best.projection.coordinate);
    if (splitNodeId === nodeId || graphHasActiveEdgeBetween(graph, nodeId, splitNodeId)) {
      return;
    }
    addGraphEdge(graph, nodeId, splitNodeId, {
      lengthMetres: best.projection.distanceMetres,
      bidirectional: true,
      sourceType: "stitch",
      highway: best.edge.highway,
      wayName: best.edge.wayName,
      wayId: best.edge.wayId,
    });
  });
}

function findBestNearbyEdgeForExistingNode(graph, nodeId, node, toleranceMetres) {
  let best = null;
  graph.edges.forEach((edge) => {
    if (edge.active === false || edge.a === nodeId || edge.b === nodeId || edge.sourceType !== "osm") {
      return;
    }
    const fromNode = graph.nodes.get(edge.a);
    const toNode = graph.nodes.get(edge.b);
    if (!fromNode || !toNode) {
      return;
    }
    const projection = projectCoordinateOntoSegmentMetres(
      node,
      { latitude: fromNode.latitude, longitude: fromNode.longitude },
      { latitude: toNode.latitude, longitude: toNode.longitude }
    );
    if (!projection || projection.distanceMetres > toleranceMetres) {
      return;
    }
    if (projection.fraction <= 0.08 || projection.fraction >= 0.92) {
      return;
    }
    if (!best || projection.distanceMetres < best.projection.distanceMetres) {
      best = { edge, projection };
    }
  });
  return best;
}

function bridgeNearbyTerminalNodes(graph) {
  const degreeByNodeId = buildActiveGraphDegreeMap(graph);
  const terminalNodes = Array.from(graph.nodes.entries())
    .filter(([nodeId]) => (degreeByNodeId.get(nodeId) || 0) === 1)
    .map(([nodeId, node]) => ({ nodeId, node }));
  if (terminalNodes.length > ACTIVE_TRAVEL_CONNECTIVITY_HEURISTIC_TERMINAL_LIMIT) {
    return;
  }

  for (let index = 0; index < terminalNodes.length; index += 1) {
    for (let candidateIndex = index + 1; candidateIndex < terminalNodes.length; candidateIndex += 1) {
      const left = terminalNodes[index];
      const right = terminalNodes[candidateIndex];
      if (graphHasActiveEdgeBetween(graph, left.nodeId, right.nodeId)) {
        continue;
      }
      const distanceMetres = getDistanceMetres(
        left.node.latitude,
        left.node.longitude,
        right.node.latitude,
        right.node.longitude
      );
      if (distanceMetres <= 0.5 || distanceMetres > ACTIVE_TRAVEL_OSM_ENDPOINT_LINK_TOLERANCE_METRES) {
        continue;
      }
      addGraphEdge(graph, left.nodeId, right.nodeId, {
        lengthMetres: distanceMetres,
        bidirectional: true,
        sourceType: "stitch",
      });
    }
  }
}

function graphHasActiveEdgeBetween(graph, fromId, toId) {
  return graph.edges.some((edge) =>
    edge.active !== false &&
    (
      (edge.a === String(fromId) && edge.b === String(toId)) ||
      (edge.bidirectional && edge.a === String(toId) && edge.b === String(fromId))
    )
  );
}

function isOsmWayWalkable(tags = {}) {
  const highway = String(tags.highway || "").toLowerCase();
  if (!highway || ACTIVE_TRAVEL_EXCLUDED_HIGHWAYS.has(highway)) {
    return false;
  }

  const foot = String(tags.foot || "").toLowerCase();
  const access = String(tags.access || "").toLowerCase();
  const sidewalkPresent = hasPositiveSidewalkTag(tags);
  const explicitFootBan = isExplicitNoLikeValue(foot) || isExplicitPrivateLikeValue(foot);
  const explicitAccessBan = isExplicitNoLikeValue(access) || isExplicitPrivateLikeValue(access);

  if (ACTIVE_TRAVEL_WALK_FOOTWAY_HIGHWAYS.has(highway)) {
    if (highway === "cycleway") {
      return sidewalkPresent || isPositiveAccessValue(foot) || isPositiveAccessValue(tags.segregated);
    }
    return !explicitFootBan && !explicitAccessBan;
  }

  if (sidewalkPresent) {
    return true;
  }

  if (explicitFootBan || explicitAccessBan) {
    return false;
  }

  if (ACTIVE_TRAVEL_WALK_PERMISSIVE_HIGHWAYS.has(highway)) {
    return true;
  }

  if (ACTIVE_TRAVEL_WALK_ROADS_REQUIRING_SIDEWALK.has(highway)) {
    return false;
  }

  return highway === "road";
}

function isOsmWayCyclable(tags = {}) {
  const highway = String(tags.highway || "").toLowerCase();
  if (!highway || ACTIVE_TRAVEL_EXCLUDED_HIGHWAYS.has(highway)) {
    return false;
  }

  const bicycle = String(tags.bicycle || "").toLowerCase();
  const access = String(tags.access || "").toLowerCase();
  if (isExplicitNoLikeValue(bicycle) || isExplicitPrivateLikeValue(bicycle) || isExplicitPrivateLikeValue(access)) {
    return false;
  }

  if (ACTIVE_TRAVEL_CYCLE_HIGHWAYS.has(highway)) {
    return true;
  }

  if (highway === "footway" || highway === "pedestrian") {
    return isPositiveAccessValue(bicycle) || String(tags.cycleway || "").toLowerCase().includes("track");
  }

  return false;
}

function hasPositiveSidewalkTag(tags = {}) {
  return [
    tags.sidewalk,
    tags["sidewalk:left"],
    tags["sidewalk:right"],
    tags.footway,
    tags["footway:left"],
    tags["footway:right"],
  ].some((value) => {
    const raw = String(value || "").toLowerCase();
    return raw === "yes" || raw === "both" || raw === "left" || raw === "right" || raw === "separate" || raw === "sidewalk";
  });
}

function isWayOneWayForMode(tags = {}, mode) {
  if (mode === "walking") {
    return false;
  }
  const oneway = String(tags.oneway || "").toLowerCase();
  if (!oneway || ACTIVE_TRAVEL_ONEWAY_FALSE_VALUES.has(oneway)) {
    return false;
  }
  if (String(tags["oneway:bicycle"] || "").toLowerCase() === "no") {
    return false;
  }
  if (String(tags.cycleway || "").toLowerCase().includes("opposite")) {
    return false;
  }
  return oneway === "yes" || oneway === "1" || oneway === "-1" || oneway === "true";
}

function isPositiveAccessValue(value) {
  const raw = String(value || "").toLowerCase();
  return raw === "yes" || raw === "designated" || raw === "permissive" || raw === "official";
}

function isExplicitNoLikeValue(value) {
  const raw = String(value || "").toLowerCase();
  return raw === "no" || raw === "use_sidepath";
}

function isExplicitPrivateLikeValue(value) {
  return String(value || "").toLowerCase() === "private";
}

function applyManualActiveTravelEditsToGraph(graph, mode) {
  const relevantManualTypes = mode === "walking"
    ? new Set(["walking-path", "shared-path", "bridge-crossing"])
    : new Set(["cycling-path", "shared-path", "bridge-crossing"]);

  state.manualLineEdits
    .filter((item) => relevantManualTypes.has(item.type) && Array.isArray(item.points) && item.points.length >= 2)
    .forEach((item) => {
      const overlayTemporaryNodeIds = new Set();
      const snappedNodeIds = buildSampledManualOverlayPoints(item, mode)
        .map((point, index) => {
          const preferredId = `manual-${item.id}-${index}`;
          const nodeId = addTemporarySnappedGraphNode(graph, point, preferredId, {
            ignoreNodeIds: overlayTemporaryNodeIds,
            ignoreEdge: (edge) => edge.sourceType === "snap",
          });
          overlayTemporaryNodeIds.add(preferredId);
          overlayTemporaryNodeIds.add(nodeId);
          return nodeId;
        })
        .filter((nodeId, index, allNodeIds) => index === 0 || nodeId !== allNodeIds[index - 1]);
      for (let index = 1; index < snappedNodeIds.length; index += 1) {
        const fromNode = graph.nodes.get(snappedNodeIds[index - 1]);
        const toNode = graph.nodes.get(snappedNodeIds[index]);
        if (!fromNode || !toNode) {
          continue;
        }
        addGraphEdge(graph, snappedNodeIds[index - 1], snappedNodeIds[index], {
          lengthMetres: getDistanceMetres(fromNode.latitude, fromNode.longitude, toNode.latitude, toNode.longitude),
          bidirectional: true,
          sourceType: "manual",
          manualType: item.type,
          manualId: item.id,
        });
      }
    });

  const barrierSegments = state.manualLineEdits
    .filter((item) => item.type === "barrier-line" && Array.isArray(item.points) && item.points.length >= 2)
    .flatMap((item) => buildManualLineSegments(item.points));

  if (barrierSegments.length === 0) {
    return;
  }

  graph.edges.forEach((edge) => {
    if (edge.active === false) {
      return;
    }
    if (edge.sourceType === "manual" && edge.manualType === "bridge-crossing") {
      return;
    }
    const fromNode = graph.nodes.get(edge.a);
    const toNode = graph.nodes.get(edge.b);
    if (!fromNode || !toNode) {
      return;
    }
    const edgeSegment = {
      start: { latitude: fromNode.latitude, longitude: fromNode.longitude },
      end: { latitude: toNode.latitude, longitude: toNode.longitude },
    };
    if (barrierSegments.some((barrierSegment) => doCoordinateSegmentsIntersect(edgeSegment, barrierSegment))) {
      edge.active = false;
    }
  });
}

function countManualNetworkLineEditsForMode(mode) {
  const relevantTypes = mode === "walking"
    ? new Set(["walking-path", "shared-path", "bridge-crossing"])
    : new Set(["cycling-path", "shared-path", "bridge-crossing"]);
  return state.manualLineEdits.filter((item) => relevantTypes.has(item.type)).length;
}

function buildManualLineSegments(points) {
  const output = [];
  for (let index = 1; index < points.length; index += 1) {
    output.push({
      start: points[index - 1],
      end: points[index],
    });
  }
  return output;
}

function buildSampledManualOverlayPoints(overlay, mode) {
  const points = Array.isArray(overlay?.points) ? overlay.points : [];
  if (points.length < 2) {
    return points;
  }
  const spacingMetres = ACTIVE_TRAVEL_MANUAL_PATH_SAMPLE_SPACING_BY_MODE[mode] || 30;
  const sampledPoints = [];
  for (let index = 1; index < points.length; index += 1) {
    const segmentSamples = sampleCoordinateSegment(points[index - 1], points[index], spacingMetres);
    if (segmentSamples.length === 0) {
      if (sampledPoints.length === 0) {
        sampledPoints.push(points[index - 1]);
      }
      sampledPoints.push(points[index]);
      continue;
    }
    if (sampledPoints.length > 0) {
      segmentSamples.shift();
    }
    sampledPoints.push(...segmentSamples);
  }
  return dedupeCoordinates(sampledPoints, 6);
}

function addTemporarySnappedGraphNode(graph, coordinate, preferredId = "", options = {}) {
  const snap = findNearestGraphSnap(graph, coordinate, options);
  if (!snap) {
    return addGraphNode(graph, coordinate, preferredId || null);
  }

  if (snap.kind === "node") {
    const lengthMetres = getDistanceMetres(
      coordinate.latitude,
      coordinate.longitude,
      snap.coordinate.latitude,
      snap.coordinate.longitude
    );
    if (lengthMetres <= 0.5) {
      return snap.nodeId;
    }
    const nodeId = addGraphNode(graph, coordinate, preferredId || null);
    addGraphEdge(graph, nodeId, snap.nodeId, {
      lengthMetres,
      bidirectional: true,
      sourceType: "snap",
    });
    return nodeId;
  }

  const snappedEdgeNodeId = splitGraphEdgeAtCoordinate(graph, snap.edge, snap.coordinate);
  const snappedEdgeNode = graph.nodes.get(snappedEdgeNodeId);
  if (!snappedEdgeNode) {
    return addGraphNode(graph, coordinate, preferredId || null);
  }
  const snapLengthMetres = getDistanceMetres(
    coordinate.latitude,
    coordinate.longitude,
    snappedEdgeNode.latitude,
    snappedEdgeNode.longitude
  );
  if (snapLengthMetres <= 0.5) {
    return snappedEdgeNodeId;
  }
  const nodeId = addGraphNode(graph, coordinate, preferredId || null);
  addGraphEdge(graph, nodeId, snappedEdgeNodeId, {
    lengthMetres: snapLengthMetres,
    bidirectional: true,
    sourceType: "snap",
  });
  return nodeId;
}

function splitGraphEdgeAtCoordinate(graph, edge, coordinate) {
  const fromNode = graph.nodes.get(edge.a);
  const toNode = graph.nodes.get(edge.b);
  if (!fromNode || !toNode) {
    return edge.a;
  }
  const lengthToA = getDistanceMetres(coordinate.latitude, coordinate.longitude, fromNode.latitude, fromNode.longitude);
  const lengthToB = getDistanceMetres(coordinate.latitude, coordinate.longitude, toNode.latitude, toNode.longitude);
  if (lengthToA <= 0.5) {
    return edge.a;
  }
  if (lengthToB <= 0.5) {
    return edge.b;
  }

  const splitNodeId = addGraphNode(
    graph,
    coordinate,
    `split-${edge.id}-${coordinate.latitude.toFixed(6)}-${coordinate.longitude.toFixed(6)}`
  );
  if (edge.active !== false) {
    edge.active = false;
    addGraphEdge(graph, edge.a, splitNodeId, {
      lengthMetres: lengthToA,
      bidirectional: edge.bidirectional,
      sourceType: edge.sourceType,
      highway: edge.highway,
      wayName: edge.wayName,
      wayId: edge.wayId,
      manualType: edge.manualType,
      manualId: edge.manualId,
    });
    addGraphEdge(graph, splitNodeId, edge.b, {
      lengthMetres: lengthToB,
      bidirectional: edge.bidirectional,
      sourceType: edge.sourceType,
      highway: edge.highway,
      wayName: edge.wayName,
      wayId: edge.wayId,
      manualType: edge.manualType,
      manualId: edge.manualId,
    });
  }
  return splitNodeId;
}

function findNearestGraphSnap(graph, coordinate, options = {}) {
  let best = null;
  const ignoreNodeIds = options.ignoreNodeIds instanceof Set ? options.ignoreNodeIds : null;
  const ignoreEdge = typeof options.ignoreEdge === "function" ? options.ignoreEdge : () => false;

  graph.nodes.forEach((node, nodeId) => {
    if (ignoreNodeIds?.has(nodeId)) {
      return;
    }
    const distance = getDistanceMetres(coordinate.latitude, coordinate.longitude, node.latitude, node.longitude);
    if (distance <= ACTIVE_TRAVEL_SNAP_TOLERANCE_METRES && (!best || distance < best.distance)) {
      best = {
        kind: "node",
        nodeId,
        coordinate: { latitude: node.latitude, longitude: node.longitude },
        distance,
      };
    }
  });

  graph.edges.forEach((edge) => {
    if (edge.active === false || ignoreEdge(edge)) {
      return;
    }
    const fromNode = graph.nodes.get(edge.a);
    const toNode = graph.nodes.get(edge.b);
    if (!fromNode || !toNode) {
      return;
    }
    const projection = projectCoordinateOntoSegmentMetres(
      coordinate,
      { latitude: fromNode.latitude, longitude: fromNode.longitude },
      { latitude: toNode.latitude, longitude: toNode.longitude }
    );
    if (!projection || projection.distanceMetres > ACTIVE_TRAVEL_MAX_SNAP_CANDIDATE_DISTANCE_METRES) {
      return;
    }
    if (!best || projection.distanceMetres < best.distance) {
      best = {
        kind: "edge",
        edge,
        coordinate: projection.coordinate,
        distance: projection.distanceMetres,
      };
    }
  });

  return best;
}

function projectCoordinateOntoSegmentMetres(point, segmentStart, segmentEnd) {
  const origin = {
    latitude: (segmentStart.latitude + segmentEnd.latitude + point.latitude) / 3,
    longitude: (segmentStart.longitude + segmentEnd.longitude + point.longitude) / 3,
  };
  const start = projectCoordinateToLocalMetres(segmentStart, origin);
  const end = projectCoordinateToLocalMetres(segmentEnd, origin);
  const target = projectCoordinateToLocalMetres(point, origin);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!Number.isFinite(lengthSquared) || lengthSquared === 0) {
    return null;
  }
  const t = Math.max(0, Math.min(1, ((target.x - start.x) * dx + (target.y - start.y) * dy) / lengthSquared));
  const projected = {
    x: start.x + dx * t,
    y: start.y + dy * t,
  };
  const metresPerDegreeLatitude = 111320;
  const metresPerDegreeLongitude = 111320 * Math.max(Math.cos((origin.latitude * Math.PI) / 180), 0.2);
  const coordinate = {
    latitude: origin.latitude + projected.y / metresPerDegreeLatitude,
    longitude: origin.longitude + projected.x / metresPerDegreeLongitude,
  };
  return {
    coordinate,
    distanceMetres: Math.hypot(projected.x - target.x, projected.y - target.y),
    fraction: t,
  };
}

function doCoordinateSegmentsIntersect(segmentA, segmentB) {
  const origin = {
    latitude: (segmentA.start.latitude + segmentA.end.latitude + segmentB.start.latitude + segmentB.end.latitude) / 4,
    longitude: (segmentA.start.longitude + segmentA.end.longitude + segmentB.start.longitude + segmentB.end.longitude) / 4,
  };
  const a1 = projectCoordinateToLocalMetres(segmentA.start, origin);
  const a2 = projectCoordinateToLocalMetres(segmentA.end, origin);
  const b1 = projectCoordinateToLocalMetres(segmentB.start, origin);
  const b2 = projectCoordinateToLocalMetres(segmentB.end, origin);

  if (
    Math.hypot(a1.x - b1.x, a1.y - b1.y) <= ACTIVE_TRAVEL_INTERSECTION_TOLERANCE_METRES ||
    Math.hypot(a1.x - b2.x, a1.y - b2.y) <= ACTIVE_TRAVEL_INTERSECTION_TOLERANCE_METRES ||
    Math.hypot(a2.x - b1.x, a2.y - b1.y) <= ACTIVE_TRAVEL_INTERSECTION_TOLERANCE_METRES ||
    Math.hypot(a2.x - b2.x, a2.y - b2.y) <= ACTIVE_TRAVEL_INTERSECTION_TOLERANCE_METRES
  ) {
    return false;
  }

  return lineSegmentsIntersect(a1, a2, b1, b2);
}

function lineSegmentsIntersect(a1, a2, b1, b2) {
  const orientation = (p, q, r) => Math.sign((q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y));
  const onSegment = (p, q, r) =>
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y);

  const o1 = orientation(a1, a2, b1);
  const o2 = orientation(a1, a2, b2);
  const o3 = orientation(b1, b2, a1);
  const o4 = orientation(b1, b2, a2);

  if (o1 !== o2 && o3 !== o4) {
    return true;
  }
  if (o1 === 0 && onSegment(a1, b1, a2)) {
    return true;
  }
  if (o2 === 0 && onSegment(a1, b2, a2)) {
    return true;
  }
  if (o3 === 0 && onSegment(b1, a1, b2)) {
    return true;
  }
  if (o4 === 0 && onSegment(b1, a2, b2)) {
    return true;
  }
  return false;
}

function runGraphDijkstra(graph, originNodeId) {
  const distances = new Map([[originNodeId, 0]]);
  const queue = createMinPriorityQueue();
  queue.push({ nodeId: originNodeId, distance: 0 });

  while (queue.size > 0) {
    const current = queue.pop();
    if (!current) {
      break;
    }
    if (current.distance > (distances.get(current.nodeId) ?? Infinity)) {
      continue;
    }
    const neighbours = graph.adjacency.get(current.nodeId) || [];
    neighbours.forEach((entry) => {
      const edge = graph.edges[entry.edgeId];
      if (!edge || edge.active === false) {
        return;
      }
      const candidateDistance = current.distance + Number(entry.lengthMetres);
      if (candidateDistance < (distances.get(entry.to) ?? Infinity)) {
        distances.set(entry.to, candidateDistance);
        queue.push({ nodeId: entry.to, distance: candidateDistance });
      }
    });
  }

  return distances;
}

function createMinPriorityQueue() {
  return {
    values: [],
    get size() {
      return this.values.length;
    },
    push(item) {
      this.values.push(item);
      let index = this.values.length - 1;
      while (index > 0) {
        const parentIndex = Math.floor((index - 1) / 2);
        if (this.values[parentIndex].distance <= this.values[index].distance) {
          break;
        }
        [this.values[parentIndex], this.values[index]] = [this.values[index], this.values[parentIndex]];
        index = parentIndex;
      }
    },
    pop() {
      if (this.values.length === 0) {
        return null;
      }
      const first = this.values[0];
      const last = this.values.pop();
      if (this.values.length > 0) {
        this.values[0] = last;
        let index = 0;
        while (true) {
          const left = index * 2 + 1;
          const right = index * 2 + 2;
          let smallest = index;
          if (left < this.values.length && this.values[left].distance < this.values[smallest].distance) {
            smallest = left;
          }
          if (right < this.values.length && this.values[right].distance < this.values[smallest].distance) {
            smallest = right;
          }
          if (smallest === index) {
            break;
          }
          [this.values[index], this.values[smallest]] = [this.values[smallest], this.values[index]];
          index = smallest;
        }
      }
      return first;
    },
  };
}

function collectReachableActiveTravelSamples(graph, distances, bandDistanceMetres, mode, originCoordinates) {
  const spacingMetres = ACTIVE_TRAVEL_SAMPLE_SPACING_BY_MODE[mode] || 60;
  const samples = [{ latitude: originCoordinates.latitude, longitude: originCoordinates.longitude }];

  graph.edges.forEach((edge) => {
    if (edge.active === false) {
      return;
    }
    const fromNode = graph.nodes.get(edge.a);
    const toNode = graph.nodes.get(edge.b);
    if (!fromNode || !toNode) {
      return;
    }
    const fromDistance = distances.get(edge.a);
    const toDistance = distances.get(edge.b);
    const fromReachable = Number.isFinite(fromDistance) && fromDistance <= bandDistanceMetres;
    const toReachable = Number.isFinite(toDistance) && toDistance <= bandDistanceMetres;

    if (fromReachable && toReachable) {
      samples.push(...sampleCoordinateSegment(fromNode, toNode, spacingMetres));
      return;
    }

    if (fromReachable && Number.isFinite(fromDistance)) {
      const reachableLength = Math.min(edge.lengthMetres, bandDistanceMetres - fromDistance);
      if (reachableLength > 1) {
        samples.push(...samplePartialCoordinateSegment(fromNode, toNode, reachableLength, edge.lengthMetres, spacingMetres));
      }
      return;
    }

    if (toReachable && Number.isFinite(toDistance)) {
      const reachableLength = Math.min(edge.lengthMetres, bandDistanceMetres - toDistance);
      if (reachableLength > 1) {
        samples.push(...samplePartialCoordinateSegment(toNode, fromNode, reachableLength, edge.lengthMetres, spacingMetres));
      }
    }
  });

  graph.nodes.forEach((node, nodeId) => {
    const distance = distances.get(nodeId);
    if (Number.isFinite(distance) && distance <= bandDistanceMetres) {
      samples.push({ latitude: node.latitude, longitude: node.longitude });
    }
  });

  return dedupeCoordinates(samples, 6);
}

function sampleCoordinateSegment(startCoordinate, endCoordinate, spacingMetres) {
  const totalLength = getDistanceMetres(
    startCoordinate.latitude,
    startCoordinate.longitude,
    endCoordinate.latitude,
    endCoordinate.longitude
  );
  if (!Number.isFinite(totalLength) || totalLength <= 0) {
    return [];
  }

  const sampleCount = Math.max(1, Math.ceil(totalLength / Math.max(20, spacingMetres)));
  const samples = [];
  for (let index = 0; index <= sampleCount; index += 1) {
    samples.push(interpolateCoordinate(startCoordinate, endCoordinate, index / sampleCount));
  }
  return samples;
}

function samplePartialCoordinateSegment(startCoordinate, endCoordinate, partialLengthMetres, totalLengthMetres, spacingMetres) {
  if (!Number.isFinite(partialLengthMetres) || partialLengthMetres <= 0 || !Number.isFinite(totalLengthMetres) || totalLengthMetres <= 0) {
    return [];
  }
  const endFraction = Math.max(0, Math.min(1, partialLengthMetres / totalLengthMetres));
  const sampleCount = Math.max(1, Math.ceil(partialLengthMetres / Math.max(20, spacingMetres)));
  const samples = [];
  for (let index = 0; index <= sampleCount; index += 1) {
    samples.push(interpolateCoordinate(startCoordinate, endCoordinate, endFraction * (index / sampleCount)));
  }
  return samples;
}

function buildActiveTravelCatchmentRings(samples, mode) {
  const coordinates = dedupeCoordinates(samples.filter((coordinate) =>
    coordinate && Number.isFinite(coordinate.latitude) && Number.isFinite(coordinate.longitude)
  ), 5);
  if (coordinates.length === 0) {
    return [];
  }

  const clusters = clusterCoordinatesByDistance(
    coordinates,
    ACTIVE_TRAVEL_CLUSTER_LINK_BY_MODE[mode] || 240
  );
  const rings = [];
  clusters.forEach((cluster) => {
    const ring = buildActiveTravelRingForCluster(cluster, mode);
    if (!ring || ring.length < 4) {
      return;
    }
    const area = getApproximateRingAreaSquareMetres(ring);
    if (area < (ACTIVE_TRAVEL_MIN_COMPONENT_AREA_BY_MODE[mode] || 1500) && cluster.length > 2) {
      return;
    }
    rings.push(ring);
  });

  return capPolygonRings(rings, 8);
}

function buildActiveTravelRingForCluster(cluster, mode) {
  const bufferMetres = ACTIVE_TRAVEL_BUFFER_BY_MODE[mode] || 55;
  const smoothingIterations = ACTIVE_TRAVEL_SMOOTHING_ITERATIONS_BY_MODE[mode] ?? 1;
  const radialBins = ACTIVE_TRAVEL_RADIAL_BINS_BY_MODE[mode] || 128;
  if (cluster.length === 1) {
    return smoothRing(buildCoordinateBufferRing(cluster[0], bufferMetres, 18), smoothingIterations);
  }
  if (cluster.length === 2) {
    const buffered = buildBufferedRouteSegmentRing(cluster[0], cluster[1], bufferMetres);
    return buffered ? smoothRing(buffered, smoothingIterations) : null;
  }
  const expandedPoints = buildExpandedCoordinateCloud(cluster, bufferMetres, 10);
  const hullRing = buildRadialEnvelopeHull(expandedPoints, radialBins);
  if (!hullRing || hullRing.length < 4) {
    return null;
  }
  return smoothRing(hullRing, smoothingIterations);
}

async function fetchIsochronesForScenario(originCoordinates, mode, options = {}) {
  try {
    return await fetchLocalActiveTravelIsochronesForScenario(originCoordinates, mode, options);
  } catch (error) {
    if (error?.kind === "cancelled") {
      throw error;
    }
    return buildGeometricFallbackIsochrones(originCoordinates, mode, {
      triggerError: error,
      provider: "Indicative straight-line fallback",
    });
  }
}

function buildCoordinateBufferRing(coordinate, radiusMetres, segmentCount = 10) {
  const ring = [];
  for (let index = 0; index < segmentCount; index += 1) {
    const bearing = (index / segmentCount) * 360;
    const point = destinationPoint(coordinate.latitude, coordinate.longitude, bearing, radiusMetres);
    ring.push([point.longitude, point.latitude]);
  }
  ring.push([...ring[0]]);
  return ring;
}

function capPolygonRings(rings, maxRings) {
  if (rings.length <= maxRings) {
    return rings;
  }
  const interval = Math.ceil(rings.length / maxRings);
  return rings.filter((_, index) => index % interval === 0).slice(0, maxRings);
}

function destinationPoint(latitude, longitude, bearingDegrees, distanceMetres) {
  const earthRadius = 6371000;
  const angularDistance = distanceMetres / earthRadius;
  const bearing = (bearingDegrees * Math.PI) / 180;
  const phi1 = (latitude * Math.PI) / 180;
  const lambda1 = (longitude * Math.PI) / 180;

  const sinPhi2 = Math.sin(phi1) * Math.cos(angularDistance) +
    Math.cos(phi1) * Math.sin(angularDistance) * Math.cos(bearing);
  const phi2 = Math.asin(sinPhi2);
  const y = Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(phi1);
  const x = Math.cos(angularDistance) - Math.sin(phi1) * sinPhi2;
  const lambda2 = lambda1 + Math.atan2(y, x);

  return {
    latitude: (phi2 * 180) / Math.PI,
    longitude: (((lambda2 * 180) / Math.PI + 540) % 360) - 180,
  };
}


function buildGeometricFallbackIsochrones(originCoordinates, mode, context = {}) {
  const modeConfig = MODE_CONFIG[mode];
  const configuredBands = getConfiguredBandsForMode(mode);
  const fallbackIsochrones = configuredBands
    .map((band) => {
      const radiusMetres = getGeometricFallbackRadiusMetres(band, mode);
      if (!Number.isFinite(radiusMetres) || radiusMetres <= 0) {
        return null;
      }
      return {
        geometry: buildCircularPolygon(originCoordinates, radiusMetres),
        label: band.label,
        color: band.fill,
        contour: modeConfig.metric === "distance" ? radiusMetres : Number(band.time),
        provider: context.provider || "Indicative straight-line fallback",
        properties: {
          contour: modeConfig.metric === "distance" ? radiusMetres : Number(band.time),
          source: context.provider || "Indicative straight-line fallback",
        },
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(b.contour) - Number(a.contour));

  const primaryReason = context.triggerError?.userMessage || context.triggerError?.message || String(context.triggerError || "");
  const secondaryReason = context.secondaryError?.userMessage || context.secondaryError?.message || "";
  const reasonParts = [primaryReason, secondaryReason].filter(Boolean);
  const reasonText = reasonParts.length ? ` Reason: ${reasonParts.join(" / ")}` : "";
  const baseNotice = GEOMETRIC_FALLBACK_NOTICE;
  const methodText = `${baseNotice}${reasonText}`;

  fallbackIsochrones.fallbackNotice = `${baseNotice}${reasonText}`;
  fallbackIsochrones.sourceNote = methodText;
  fallbackIsochrones.metadata = {
    provider: context.provider || "Indicative straight-line fallback",
    intendedProvider: mode === "walking"
      ? "OpenStreetMap-derived walking network catchment"
      : "OpenStreetMap-derived cycling network catchment",
    fallbackReason: reasonParts.join(" / "),
    caveat: "Indicative geometric fallback only; not a routed network catchment.",
  };
  return fallbackIsochrones;
}

function getGeometricFallbackRadiusMetres(band, mode) {
  if (Number.isFinite(Number(band.distance))) {
    return Number(band.distance) * 1000;
  }
  return Number(band.time) * 80;
}

function buildCircularPolygon(originCoordinates, radiusMetres, segmentCount = 96) {
  const ring = [];
  for (let index = 0; index < segmentCount; index += 1) {
    const bearing = (index / segmentCount) * 360;
    const point = destinationPoint(
      originCoordinates.latitude,
      originCoordinates.longitude,
      bearing,
      radiusMetres
    );
    ring.push([point.longitude, point.latitude]);
  }
  ring.push([...ring[0]]);
  return {
    type: "Polygon",
    coordinates: [ring],
  };
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
      placeType: element.tags?.place || "",
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
  const siteCoordinates = state.generatedScenario?.siteCoordinates ?? null;

  categoryOrder.forEach((category) => {
    const items = dedupeAmenitiesByName(grouped.get(category) ?? []);
    const categoryLimit = categoryLimits[category] ?? 0;
    const selectedItems = mode === "walking"
      ? selectWalkingAmenitiesForCategory(items, category, categoryLimit, siteCoordinates)
      : mode === "cycling"
        ? selectCyclingAmenitiesForCategory(items, category, categoryLimit)
        : items
            .sort((a, b) => a.distance - b.distance)
            .slice(0, categoryLimit);
    selectedItems.forEach((item) => {
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

  if (mode === "walking") {
    return {
      "Rail station": 2,
      School: 3,
      Healthcare: 3,
      Retail: 4,
      "Food and drink": 3,
      Community: 2,
      Worship: 2,
      "Open space": 2,
    };
  }

  return Object.fromEntries(
    getCategoryOrderForMode(mode).map((category) => [category, 4])
  );
}

function getLegendLimitForMode(mode) {
  if (mode === "cycling") {
      return 12;
  }
  return mode === "walking" ? 9 : 8;
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

function selectWalkingAmenitiesForCategory(items, category, limit, siteCoordinates) {
  if (limit <= 0) {
    return [];
  }

  const clusteredItems = buildWalkingAmenityRepresentatives(items, category);
  if (clusteredItems.length <= limit) {
    return clusteredItems.sort((a, b) => a.distance - b.distance);
  }

  const selected = [];
  const remaining = clusteredItems
    .map((item) => ({ ...item }))
    .sort((a, b) => a.distance - b.distance);

  selected.push(remaining.shift());

  while (selected.length < limit && remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = -Infinity;
    remaining.forEach((item, index) => {
      const score = scoreWalkingAmenityCandidate(item, selected, category, siteCoordinates);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    selected.push(remaining.splice(bestIndex, 1)[0]);
  }

  return selected;
}

function buildWalkingAmenityRepresentatives(items, category) {
  const clusterDistance = getWalkingAmenityClusterDistance(category);
  const clusters = [];

  items.forEach((item) => {
    const cluster = clusters.find((candidateCluster) =>
      candidateCluster.some((candidateItem) =>
        getDistanceMetres(
          candidateItem.latitude,
          candidateItem.longitude,
          item.latitude,
          item.longitude
        ) <= clusterDistance
      )
    );

    if (cluster) {
      cluster.push(item);
      return;
    }

    clusters.push([item]);
  });

  return clusters.map((cluster) =>
    cluster
      .slice()
      .sort((left, right) => {
        if (left.distance !== right.distance) {
          return left.distance - right.distance;
        }
        return String(left.name).localeCompare(String(right.name));
      })[0]
  );
}

function scoreWalkingAmenityCandidate(item, selectedItems, category, siteCoordinates) {
  const proximityScore = 1 / (1 + item.distance / getWalkingAmenityDistanceScale(category));
  const separationScore = Math.min(
    getMinimumWalkingAmenitySeparation(item, selectedItems) / getWalkingAmenityClusterDistance(category),
    1.4
  );
  const angularScore = getWalkingAmenityAngularSpreadScore(item, selectedItems, siteCoordinates);
  const nameDiversityScore = selectedItems.some((selectedItem) => simplifyAmenityName(selectedItem.name) === simplifyAmenityName(item.name))
    ? 0
    : 0.2;

  return proximityScore * 0.48 + separationScore * 0.32 + angularScore * 0.12 + nameDiversityScore * 0.08;
}

function getWalkingAmenityClusterDistance(category) {
  return {
    "Rail station": 180,
    School: 140,
    Healthcare: 140,
    Retail: 180,
    "Food and drink": 180,
    Community: 180,
    Worship: 160,
    "Open space": 260,
  }[category] || 180;
}

function getWalkingAmenityDistanceScale(category) {
  return {
    "Rail station": 700,
    School: 850,
    Healthcare: 850,
    Retail: 520,
    "Food and drink": 520,
    Community: 720,
    Worship: 720,
    "Open space": 900,
  }[category] || 650;
}

function getMinimumWalkingAmenitySeparation(item, selectedItems) {
  if (!selectedItems.length) {
    return Number.POSITIVE_INFINITY;
  }

  return selectedItems.reduce((bestDistance, selectedItem) =>
    Math.min(
      bestDistance,
      getDistanceMetres(
        item.latitude,
        item.longitude,
        selectedItem.latitude,
        selectedItem.longitude
      )
    ),
  Number.POSITIVE_INFINITY);
}

function getWalkingAmenityAngularSpreadScore(item, selectedItems, siteCoordinates) {
  if (!siteCoordinates || !selectedItems.length) {
    return 0.6;
  }

  const itemBearing = getInitialBearingDegrees(siteCoordinates, item);
  if (!Number.isFinite(itemBearing)) {
    return 0.4;
  }

  const minimumBearingGap = selectedItems.reduce((bestGap, selectedItem) => {
    const selectedBearing = getInitialBearingDegrees(siteCoordinates, selectedItem);
    if (!Number.isFinite(selectedBearing)) {
      return bestGap;
    }
    const rawGap = Math.abs(itemBearing - selectedBearing);
    return Math.min(bestGap, Math.min(rawGap, 360 - rawGap));
  }, 180);

  return minimumBearingGap / 180;
}

function simplifyAmenityName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(opposite|opp|adjacent|outside|near|stop|platform)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
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

function buildActiveTravelIsochroneCacheKey(originCoordinates, mode, configuredBands, networkRadiusMetres) {
  const bandKey = configuredBands
    .map((band) => `${band.label}:${Number(band.distance)}:${band.fill}`)
    .join(",");
  const manualKey = state.manualLineEdits
    .filter((item) => Array.isArray(item.points) && item.points.length >= 2)
    .map((item) => [
      item.id,
      item.type,
      item.modeCreated || "",
      item.points.map((point) => `${Number(point.latitude).toFixed(5)},${Number(point.longitude).toFixed(5)}`).join(";"),
    ].join(":"))
    .join("|");
  return [
    mode,
    originCoordinates.latitude.toFixed(5),
    originCoordinates.longitude.toFixed(5),
    Math.round(networkRadiusMetres),
    bandKey,
    manualKey,
  ].join("|");
}

function getMapCacheEntry(cache, key, cloneValue) {
  if (!cache.has(key)) {
    return null;
  }
  const value = cache.get(key);
  cache.delete(key);
  cache.set(key, value);
  return cloneValue(value);
}

function setMapCacheEntry(cache, key, value, cloneValue) {
  cache.set(key, cloneValue(value));
  while (cache.size > 8) {
    cache.delete(cache.keys().next().value);
  }
}

function clonePlainValue(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}


function cloneActiveTravelIsochroneResult(isochrones) {
  const cloned = (isochrones ?? []).map((isochrone) => clonePlainValue(isochrone));
  cloned.fallbackNotice = isochrones?.fallbackNotice || "";
  cloned.sourceNote = isochrones?.sourceNote || "";
  cloned.metadata = clonePlainValue(isochrones?.metadata);
  return cloned;
}


function selectBusSettlementsForCategory(items, limit) {
  if (limit <= 0) {
    return [];
  }

  const priorityByPlaceType = {
    city: 0,
    town: 1,
    village: 2,
    suburb: 3,
  };

  return [...items]
    .filter((item) => item.name && Number.isFinite(item.distance))
    .sort((a, b) => {
      const priorityA = priorityByPlaceType[String(a.placeType || "").toLowerCase()] ?? 9;
      const priorityB = priorityByPlaceType[String(b.placeType || "").toLowerCase()] ?? 9;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return a.distance - b.distance;
    })
    .slice(0, limit)
    .sort((a, b) => a.distance - b.distance);
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
  if (mode === 'cycling') {
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
  if (category === "Settlement") {
    return tags.name || "Settlement";
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

function firstNonEmpty(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() ?? "";
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

function buildIsochroneLayerMarkup(isochrones, mapView) {
  const orderedIsochrones = [...isochrones].sort((a, b) => Number(b.contour ?? b.properties?.contour ?? 0) - Number(a.contour ?? a.properties?.contour ?? 0));
  const layers = orderedIsochrones.map((isochrone, index) => {
    const pathMarkup = geometryToSvgPath(isochrone.geometry, mapView);
    if (!pathMarkup) {
      return { fill: "", stroke: "", pathMarkup: "", color: isochrone.color, clipPathId: `isochrone-band-${index}` };
    }
    return {
      pathMarkup,
      color: isochrone.color,
      clipPathId: `isochrone-band-${index}`,
      fill: `<path d="${pathMarkup}" fill="${isochrone.color}" fill-opacity="0.32"></path>`,
      stroke: `<path d="${pathMarkup}" fill="none" stroke="${isochrone.color}" stroke-width="2"></path>`,
    };
  });

  return {
    layers,
    fillMarkup: layers.map((layer) => layer.fill).join(""),
    strokeMarkup: layers.map((layer) => layer.stroke).join(""),
  };
}

function buildIsochroneExclusionMaskMarkup(exclusionAreas, mapView) {
  const paths = exclusionAreas
    .map((item) => buildPolygonPathFromPoints(item.points, mapView))
    .filter(Boolean);
  if (paths.length === 0) {
    return "";
  }

  return `
    <defs>
      <mask id="isochrone-fill-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="960" height="640">
        <rect x="0" y="0" width="960" height="640" fill="#ffffff"></rect>
        ${paths.map((path) => `<path d="${path}" fill="#000000"></path>`).join("")}
      </mask>
    </defs>
  `;
}

function buildIsochroneExclusionBoundaryMarkup(layers, exclusionAreas, mapView) {
  const exclusionPaths = exclusionAreas
    .map((item) => buildPolygonPathFromPoints(item.points, mapView))
    .filter(Boolean);
  const activeLayers = (layers || []).filter((layer) => layer.pathMarkup);
  if (exclusionPaths.length === 0 || activeLayers.length === 0) {
    return "";
  }

  const clipDefs = activeLayers
    .map((layer) => `
      <clipPath id="${layer.clipPathId}">
        <path d="${layer.pathMarkup}"></path>
      </clipPath>
    `)
    .join("");
  const boundaryMarkup = activeLayers
    .map((layer) =>
      exclusionPaths
        .map((path) => `<path d="${path}" fill="none" stroke="${layer.color}" stroke-width="2" clip-path="url(#${layer.clipPathId})" stroke-linejoin="round"></path>`)
        .join("")
    )
    .join("");

  return `
    <defs>
      ${clipDefs}
    </defs>
    ${boundaryMarkup}
  `;
}

function buildManualLineOverlayMarkup(lineEdits, mapView) {
  return lineEdits
    .map((item) => {
      const path = buildLinePathFromPoints(item.points, mapView);
      if (!path) {
        return "";
      }
      const style = getDrawingToolConfig(item.type);
      return `
        <g>
          <path d="${path}" fill="none" stroke="#ffffff" stroke-width="${style.strokeWidth + 2.4}" stroke-linecap="round" stroke-linejoin="round" opacity="0.88"></path>
          <path d="${path}" fill="none" stroke="${style.stroke}" stroke-width="${style.strokeWidth}" stroke-dasharray="${style.dasharray}" stroke-linecap="round" stroke-linejoin="round"></path>
        </g>
      `;
    })
    .join("");
}

function buildDraftDrawingMarkup(mapView) {
  if (!state.activeDrawingTool || state.draftDrawingPoints.length === 0) {
    return "";
  }

  const toolConfig = getDrawingToolConfig(state.activeDrawingTool);
  const circles = state.draftDrawingPoints
    .map((point) => {
      const svgPoint = projectLatLonToSvg(point.latitude, point.longitude, mapView);
      return `<circle cx="${svgPoint.x}" cy="${svgPoint.y}" r="4.5" fill="${toolConfig.stroke}" stroke="#ffffff" stroke-width="1.5"></circle>`;
    })
    .join("");

  if (toolConfig.geometryType === "polygon") {
    const polygonPath = state.draftDrawingPoints.length >= 3
      ? buildPolygonPathFromPoints(state.draftDrawingPoints, mapView)
      : "";
    const previewPath = buildLinePathFromPoints(state.draftDrawingPoints, mapView);
    return `
      <g>
        ${polygonPath ? `<path d="${polygonPath}" fill="${toolConfig.stroke}" fill-opacity="0.10" stroke="${toolConfig.stroke}" stroke-width="${toolConfig.strokeWidth}" stroke-dasharray="${toolConfig.dasharray}" stroke-linejoin="round"></path>` : ""}
        ${!polygonPath && previewPath ? `<path d="${previewPath}" fill="none" stroke="${toolConfig.stroke}" stroke-width="${toolConfig.strokeWidth}" stroke-dasharray="${toolConfig.dasharray}" stroke-linecap="round" stroke-linejoin="round"></path>` : ""}
        ${circles}
      </g>
    `;
  }

  const linePath = buildLinePathFromPoints(state.draftDrawingPoints, mapView);
  return `
    <g opacity="0.96">
      ${linePath ? `<path d="${linePath}" fill="none" stroke="#ffffff" stroke-width="${toolConfig.strokeWidth + 2.4}" stroke-linecap="round" stroke-linejoin="round"></path>` : ""}
      ${linePath ? `<path d="${linePath}" fill="none" stroke="${toolConfig.stroke}" stroke-width="${toolConfig.strokeWidth}" stroke-dasharray="${toolConfig.dasharray}" stroke-linecap="round" stroke-linejoin="round"></path>` : ""}
      ${circles}
    </g>
  `;
}

function buildManualOverlayLegendRows() {
  return getAllSavedManualOverlays()
    .filter((item) => item.showInLegend !== false)
    .map((item) => {
      const style = getDrawingToolConfig(item.type);
      return {
        name: item.displayName,
        type: item.type === "exclusion-area" ? "exclusion-area" : "manual-line",
        stroke: style?.stroke || "#1d2328",
        dasharray: style?.dasharray || "",
        strokeWidth: style?.strokeWidth || 3,
      };
    });
}

function buildLinePathFromPoints(points, mapView) {
  if (!Array.isArray(points) || points.length < 2) {
    return "";
  }

  return points
    .map((point, index) => {
      const projected = projectLatLonToSvg(point.latitude, point.longitude, mapView);
      return `${index === 0 ? "M" : "L"}${projected.x} ${projected.y}`;
    })
    .join(" ");
}

function buildPolygonPathFromPoints(points, mapView) {
  if (!Array.isArray(points) || points.length < 3) {
    return "";
  }

  const path = buildLinePathFromPoints(points, mapView);
  return path ? `${path} Z` : "";
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

function buildAmenityDisplayItems(amenities, mapView, sitePoint, mode = state.selectedMode) {
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
      labelOnly: false,
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

function drawManualLineLegendSwatch(item) {
  return `
    <path d="M-8 0 H8" fill="none" stroke="#ffffff" stroke-width="${Number(item.strokeWidth) + 2}" stroke-linecap="round"></path>
    <path d="M-8 0 H8" fill="none" stroke="${item.stroke}" stroke-width="${item.strokeWidth}" stroke-dasharray="${item.dasharray || ""}" stroke-linecap="round"></path>
  `;
}

function drawExclusionAreaLegendSwatch(item) {
  return `<rect x="-7" y="-7" width="14" height="14" fill="none" stroke="${item.stroke}" stroke-width="${item.strokeWidth}" stroke-dasharray="${item.dasharray || ""}"></rect>`;
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
