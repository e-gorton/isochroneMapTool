import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const sourceHtml = readFileSync(join(projectRoot, "index.html"), "utf8");
const deployedHtml = readFileSync(join(projectRoot, "dist", "index.html"), "utf8");
const sourceCss = readFileSync(join(projectRoot, "styles.css"), "utf8");
const deployedCss = readFileSync(join(projectRoot, "dist", "styles.css"), "utf8");

assert.equal(deployedHtml, sourceHtml, "Deployed HTML should stay in sync with the source HTML.");
assert.equal(deployedCss, sourceCss, "Deployed CSS should stay in sync with the source CSS.");
assert.match(sourceHtml, /app\.walkcycle\.v47\.js/, "The public HTML should load the current app bundle.");

const sourceApp = readFileSync(join(projectRoot, "app.walkcycle.v47.js"), "utf8");
const deployedApp = readFileSync(join(projectRoot, "dist", "app.walkcycle.v47.js"), "utf8");
assert.equal(deployedApp, sourceApp, "Deployed app bundle should stay in sync with the source app bundle.");
assert.doesNotMatch(sourceHtml, /data-mode="[^"`r`n]+"|Timetable date|Maximum walk to .* stop/i, "The public UI should only expose the retained active-travel controls.");
assert.match(
  sourceApp,
  /const orderedIsochrones = \[\.\.\.isochrones\]\.sort\(\(a, b\) => Number\(b\.contour \?\? b\.properties\?\.contour \?\? 0\) - Number\(a\.contour \?\? a\.properties\?\.contour \?\? 0\)\);/,
  "Isochrone SVG layers should be drawn outer-to-inner so larger bands do not cover shorter-time bands."
);
assert.match(
  sourceApp,
  /state\.isochrones = liveIsochrones;\s+state\.currentMapView = null;/,
  "A new isochrone result should reset the stored map view so the preview refits to the generated extent."
);

for (const html of [sourceHtml, deployedHtml]) {
  assert.match(html, /workspace-toolbar/, "Primary workspace controls should sit in a compact toolbar above the preview.");
  assert.match(html, /Run and view/, "The toolbar should expose a clear run-and-view action block.");
  assert.match(html, /Workspace status/, "The toolbar should keep status messaging visible above the fold.");
  assert.match(html, /manual-edit-guidance/, "Manual editing guidance should be present in the editor panel.");
  assert.match(html, /Draw them so they cross or touch the road\/path you want to connect to/, "Manual route drawing guidance should explain how to make proposed links register.");
  assert.match(html, /Exclusion areas only mask the displayed\s+isochrone fill and do not change the routed network/, "Exclusion guidance should distinguish masking from routed-network changes.");
  assert.match(html, /Amenity and settlement legend controls/, "Amenity table should have a visible caption explaining its purpose.");
  assert.match(html, /Manual route, barrier and exclusion controls/, "Manual overlay table should have a visible caption explaining its purpose.");
}

for (const css of [sourceCss, deployedCss]) {
  assert.match(css, /\.workspace-toolbar\s*{/, "The workspace toolbar should have an explicit layout style.");
  assert.match(css, /\.workspace-actions\s*{/, "Primary workspace actions should be laid out as a dedicated grid.");
  assert.match(css, /\.manual-edit-guidance\s*{/, "Manual editing guidance should have a styled panel.");
  assert.match(css, /border:\s*1px dashed rgba\(47, 107, 87, 0\.35\)/, "Manual editing guidance should use the planning-note dashed border treatment.");
  assert.match(css, /\.amenities-table caption\s*{/, "Editor tables should style visible captions.");
  assert.match(css, /caption-side:\s*top/, "Editor table captions should be shown above the table controls.");
}
