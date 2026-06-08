    extent: "Local services focus",
    scaleLabel: "250 m",
    zoom: 15,
    amenityRadius: 1600,
    metric: "distance",
    costing: "pedestrian",
    bands: [
      { label: "1,200 m", distance: 1.2, fill: "#2563eb" },
      { label: "2,000 m", distance: 2.0, fill: "#dc2626" },
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
      { label: "2,000 m", distance: 2.0, fill: "#fff27a" },
      { label: "5,000 m", distance: 5.0, fill: "#f6c9c6" },
      { label: "8,000 m", distance: 8.0, fill: "#c7a3cf" },
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
      { label: "15 mins", time: 15, fill: "#1e40af" },
      { label: "30 mins", time: 30, fill: "#3b82f6" },
      { label: "45 mins", time: 45, fill: "#ef4444" },
      { label: "60 mins", time: 60, fill: "#991b1b" },
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
