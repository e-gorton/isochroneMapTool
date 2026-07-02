import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const appSource = readFileSync(join(projectRoot, "app.walkcycle.v47.js"), "utf8");
const htmlSource = readFileSync(join(projectRoot, "index.html"), "utf8");

assert.match(htmlSource, /Draw walking path/, "Manual walking path tool should be present in the UI.");
assert.match(htmlSource, /Draw cycling path/, "Manual cycling path tool should be present in the UI.");
assert.match(htmlSource, /Draw isochrone exclusion area/, "Isochrone exclusion tool should be present in the UI.");
assert.match(htmlSource, /workspace-toolbar/, "The map-first workspace toolbar should be present in the UI.");
assert.match(appSource, /async function fetchLocalActiveTravelIsochronesForScenario/, "Walking/cycling modes should use the local active travel network builder.");
assert.match(appSource, /return await fetchLocalActiveTravelIsochronesForScenario\(originCoordinates, mode, options\);/, "Walking/cycling isochrone fetch should route through the local network engine.");
assert.match(appSource, /Dedicated pedestrian links and tagged sidewalks are used directly; ordinary local roads are permitted on a planning-style permissive basis unless restricted/, "Walking methodology note should describe the local permissive pavement-aware network rules.");
assert.match(appSource, /function buildDraftScenarioFromInputs\(\)/, "Live coordinate preview should build a draft scenario before generation.");
assert.match(appSource, /function selectWalkingAmenitiesForCategory\(/, "Walking amenities should use a dedicated ranking helper.");

const fakeElement = (id) => ({
  id,
  value:
    id === "busSpeedMph" ? "11.1847"
      : id === "busMaxWalkMetres" ? "400"
      : id === "siteCoordinates" ? "53.801672, -1.548567"
      : id === "accessCoordinates" ? "53.801155, -1.547860"
      : id === "mapZoomAdjust" ? "0"
      : "",
  textContent: "",
  innerHTML: "",
  disabled: false,
  style: {},
  className: "",
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  setAttribute(name, value) { this[name] = value; },
  addEventListener() {},
  appendChild() {},
  querySelectorAll() { return []; },
});

const sandbox = {
  window: {
    location: { protocol: "file:", origin: "file://" },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  },
  document: {
    body: { classList: { toggle() {} } },
    getElementById: fakeElement,
    querySelector() { return fakeElement("query"); },
    querySelectorAll() { return []; },
    createElement() { return fakeElement("created"); },
  },
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  console,
  URL,
  performance,
  Blob: function Blob() {},
  setTimeout,
  clearTimeout,
  AbortController: class AbortController {
    constructor() {
      this.signal = {};
    }
    abort() {}
  },
  fetch: async () => ({ ok: false, json: async () => ({}) }),
};

vm.createContext(sandbox);
vm.runInContext(
  `${appSource.replace(/\ninit\(\);\s*$/, "")}
  globalThis.__state = state;
  globalThis.__isOsmWayWalkable = isOsmWayWalkable;
  globalThis.__isOsmWayCyclable = isOsmWayCyclable;
  globalThis.__createEmptyActiveTravelGraph = createEmptyActiveTravelGraph;
  globalThis.__addGraphNode = addGraphNode;
  globalThis.__addGraphEdge = addGraphEdge;
  globalThis.__applyManualActiveTravelEditsToGraph = applyManualActiveTravelEditsToGraph;
  globalThis.__runGraphDijkstra = runGraphDijkstra;
  globalThis.__buildDraftScenarioFromInputs = buildDraftScenarioFromInputs;
  globalThis.__selectWalkingAmenitiesForCategory = selectWalkingAmenitiesForCategory;
  `,
  sandbox
);

assert.equal(
  sandbox.__isOsmWayWalkable({ highway: "primary" }),
  false,
  "Primary roads without tagged sidewalks should not be treated as walkable."
);
assert.equal(
  sandbox.__isOsmWayWalkable({ highway: "primary", sidewalk: "both" }),
  true,
  "Primary roads with tagged sidewalks should be treated as walkable."
);
assert.equal(
  sandbox.__isOsmWayWalkable({ highway: "residential" }),
  true,
  "Residential roads should remain walkable on the planning-style permissive basis."
);
assert.equal(
  sandbox.__isOsmWayCyclable({ highway: "residential" }),
  true,
  "Residential roads should remain cyclable unless explicitly restricted."
);

const previewScenario = sandbox.__buildDraftScenarioFromInputs();
assert.equal(
  Number(previewScenario.siteCoordinates.latitude.toFixed(6)),
  53.801672,
  "Valid site coordinates should build a live draft preview scenario before generation."
);
assert.equal(
  Number(previewScenario.accessCoordinates.longitude.toFixed(6)),
  -1.54786,
  "Valid access coordinates should be carried into the live preview scenario."
);

const graph = sandbox.__createEmptyActiveTravelGraph("walking");
const nodeA = sandbox.__addGraphNode(graph, { latitude: 53.8, longitude: -1.55 }, "a");
const nodeB = sandbox.__addGraphNode(graph, { latitude: 53.8, longitude: -1.549 }, "b");
sandbox.__addGraphEdge(graph, nodeA, nodeB, {
  lengthMetres: 70,
  bidirectional: true,
  sourceType: "osm",
  highway: "residential",
});

sandbox.__state.manualLineEdits = [
  {
    id: 1,
    type: "walking-path",
    displayName: "Manual path",
    points: [
      { latitude: 53.8001, longitude: -1.5489 },
      { latitude: 53.8003, longitude: -1.5487 },
    ],
  },
  {
    id: 2,
    type: "barrier-line",
    displayName: "Barrier",
    points: [
      { latitude: 53.7997, longitude: -1.5495 },
      { latitude: 53.8003, longitude: -1.5495 },
    ],
  },
  {
    id: 3,
    type: "bridge-crossing",
    displayName: "Bridge",
    points: [
      { latitude: 53.7999, longitude: -1.5496 },
      { latitude: 53.8001, longitude: -1.5494 },
    ],
  },
];

sandbox.__applyManualActiveTravelEditsToGraph(graph, "walking");

assert.ok(
  graph.edges.some((edge) => edge.sourceType === "manual" && edge.manualType === "walking-path" && edge.active !== false),
  "Manual walking paths should add active edges into the local walking graph."
);
assert.ok(
  graph.edges.some((edge) => edge.sourceType === "osm" && edge.active === false),
  "Barrier lines should deactivate crossing OSM edges in the local walking graph."
);
assert.ok(
  graph.edges.some((edge) => edge.sourceType === "manual" && edge.manualType === "bridge-crossing" && edge.active !== false),
  "Manual bridge/crossing links should remain active even where a barrier line is present."
);

const routingGraph = sandbox.__createEmptyActiveTravelGraph("walking");
const routingA = sandbox.__addGraphNode(routingGraph, { latitude: 53.8, longitude: -1.55 }, "ra");
const routingB = sandbox.__addGraphNode(routingGraph, { latitude: 53.8, longitude: -1.5495 }, "rb");
const routingC = sandbox.__addGraphNode(routingGraph, { latitude: 53.8003, longitude: -1.5495 }, "rc");
sandbox.__addGraphEdge(routingGraph, routingA, routingB, {
  lengthMetres: 40,
  bidirectional: true,
  sourceType: "osm",
  highway: "residential",
});
sandbox.__addGraphEdge(routingGraph, routingB, routingC, {
  lengthMetres: 35,
  bidirectional: true,
  sourceType: "osm",
  highway: "residential",
});

const distances = sandbox.__runGraphDijkstra(routingGraph, routingA);
assert.equal(Math.round(distances.get(routingC)), 75, "Local walking graph distances should accumulate across connected edges.");

const educationSelections = sandbox.__selectWalkingAmenitiesForCategory(
  [
    { name: "Primary School A", category: "Education", latitude: 53.8, longitude: -1.55, distance: 90 },
    { name: "Primary School B", category: "Education", latitude: 53.80005, longitude: -1.55002, distance: 96 },
    { name: "Village School", category: "Education", latitude: 53.806, longitude: -1.544, distance: 780 },
    { name: "North Academy", category: "Education", latitude: 53.807, longitude: -1.55, distance: 810 },
  ],
  "Education",
  3,
  { latitude: 53.8, longitude: -1.55 }
);
assert.equal(educationSelections[0].name, "Primary School A", "Walking amenity ranking should keep the nearest representative education point first.");
assert.ok(
  educationSelections.some((item) => item.name === "Village School"),
  "Walking amenity ranking should retain a more spatially distinct education point rather than only clustered duplicates."
);

const retailSelections = sandbox.__selectWalkingAmenitiesForCategory(
  [
    { name: "Corner Shop", category: "Retail", latitude: 53.8001, longitude: -1.55, distance: 110 },
    { name: "Bakery Row", category: "Retail", latitude: 53.80011, longitude: -1.54999, distance: 114 },
    { name: "Village Store", category: "Retail", latitude: 53.8034, longitude: -1.5469, distance: 460 },
    { name: "East Parade", category: "Retail", latitude: 53.7995, longitude: -1.5428, distance: 520 },
  ],
  "Retail",
  3,
  { latitude: 53.8, longitude: -1.55 }
);
assert.equal(retailSelections[0].name, "Corner Shop", "Walking retail ranking should start with the nearest useful amenity.");
assert.ok(
  retailSelections.some((item) => item.name === "Village Store") && retailSelections.some((item) => item.name === "East Parade"),
  "Walking retail ranking should spread later picks across different clusters instead of over-selecting adjacent shops."
);
