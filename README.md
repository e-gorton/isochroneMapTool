# Isochrone Map Tool

Static SVG isochrone map generator for walking and cycling accessibility catchments.

## Current walking/cycling method

Walking and cycling isochrone geometry is generated in the browser from an OpenStreetMap-derived active-travel graph fetched through Overpass. Manual proposed walking, cycling, shared-use and bridge/crossing edits are inserted into that local graph before the walking/cycling isochrone is recalculated. Manual barrier lines deactivate crossed walking/cycling graph edges for the local calculation, except where a proposed bridge/crossing link is drawn.

Walking access is pavement-aware in a proportionate planning sense. Dedicated pedestrian links and roads with tagged sidewalks are used directly. Higher-order roads such as trunk and primary routes require positive pedestrian provision or suitable access tagging before they are treated as walkable. Ordinary local streets remain permitted unless OSM access tags restrict pedestrian use, reflecting the typical level of OSM footway tagging available in UK settlements.

Cycling access uses OSM cycle and highway tags, including ordinary cyclable roads where cycling is not prohibited and the road class is suitable. The graph includes small geometry stitching to reduce false gaps where OSM side roads meet nearby cycle-permitted roads but are slightly under-noded.

Isochrone exclusion areas are cartographic masks only. They remove the displayed isochrone fill and reinstate clipped band boundary styling around the retained isochrone area, but they do not change the underlying active-travel network calculation.

## Deployment

Cloudflare root-deploy settings:

| Field | Value |
|---|---|
| Path | `/` |
| Build command | blank |
| Deploy command | `npx wrangler deploy --config wrangler.toml` |
| Non-production deploy command | `npx wrangler versions upload --config wrangler.toml` |

No Cloudflare secrets are required for the walking/cycling app.

## Data dependencies

Walking/cycling isochrone geometry uses OpenStreetMap/Overpass via the Worker proxy and is calculated locally in the browser. Manual active-travel edits are applied to that local graph only.

Amenity points use OpenStreetMap/Overpass via the Worker proxy.

## Planning caveat

Suggested wording:

> Walking and cycling isochrones are indicative active-travel network outputs generated from OpenStreetMap data and local browser-side graph calculations. Proposed paths, cycle links, shared-use paths, bridges/crossings and barrier lines drawn in the tool are manual modelling assumptions applied to the local graph and should be reviewed against deliverability, land control, highway authority requirements and detailed design standards including Manual for Streets and LTN 1/20 where relevant. Isochrone exclusion areas are cartographic masks applied after isochrone generation and should not be described as routed accessibility recalculations.
