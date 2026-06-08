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
const SERVICE_TIMEOUT_MS = {
  Overpass: 12000,
  "Valhalla isochrone": 10000,
  "Valhalla route": 5000,
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
