# Prime Transport Planning Isochrone Tool

This workspace contains a browser-based internal prototype for a UK transport planning isochrone workflow.

## What it does

- captures project and coordinate inputs
- lets the user switch between walking, cycling and bus outputs
- previews a report-style draft map
- supports amenity editing, legend controls and manual point placement
- exports a PNG preview, SVG map, amenity schedule CSV and a JSON method note
- stores local override preferences in the browser on the current device

## Current scope

This is a front-end prototype intended to shape the production user experience.

Confirmed:

- coordinate-led workflow
- compact legend treatment
- editable amenity list
- device-local override saving
- browser-based export actions

Assumptions:

- the map uses a styled SVG preview rather than live routing, OSM tiles or Overpass data
- bus assumptions are shown as indicative and should be replaced by a confirmed methodology note before issue
- manual points are placed in the preview by clicking the map rather than by importing GIS data

Not yet connected:

- live Valhalla or other routing engine calls
- OpenStreetMap amenity fetching
- PDF, GeoPackage or HTML map package export
- planner-specific persistent profiles

## Open locally

Open [index.html](./index.html) in a browser.

No build step is required for this prototype.

## Cloudflare hosting

This workspace now includes a Cloudflare Worker proxy and deployment scaffolding:

- [cloudflare/worker.js](./cloudflare/worker.js) serves the static site and proxies:
  - Overpass
  - Valhalla isochrones
  - Valhalla route distances
  - MapIt planning authority lookups
  - Nominatim fallback searches
- [wrangler.jsonc](./wrangler.jsonc) configures a direct Worker deployment path
- [scripts/build-cloudflare.ps1](./scripts/build-cloudflare.ps1) stages a `dist/` artifact for Sites-style hosting
- [scripts/build-cloudflare-inline-worker.ps1](./scripts/build-cloudflare-inline-worker.ps1) creates a single-file inline Worker bundle for direct Worker deployment

The frontend automatically uses direct third-party endpoints when opened via `file://` locally, and switches to relative `/api/proxy/*` endpoints when hosted over HTTP(S).

Deployment trigger after Worker path update.

## Recommended next steps

1. Wire the generate action to the Python isochrone engine and an agreed routing source.
2. Replace preview geometry with live map output and confirmed OSM attribution handling.
3. Persist overrides and project records to a backend store if the tool moves beyond device-local use.
4. Add PDF export only once the report layout and method note wording are agreed.
