Transport Planning Isochrone Map Tool
Browser-based isochrone mapping tool for preparing draft accessibility plans for UK transport planning work.

The tool is intended for report-style outputs for planning applications, site appraisals, transport statements, accessibility reviews and early feasibility work. It uses live OpenStreetMap-based services and Valhalla routing, with exports suitable for checking and refinement before issue.

Current Status
The current version uses Valhalla for all isochrone modes:

Walking: Valhalla pedestrian routing
Cycling: Valhalla bicycle routing
Bus: Valhalla multimodal routing as an indicative public transport output
Bus contours should not be treated as a confirmed scheduled public transport accessibility assessment. They are indicative only and should be checked against current bus timetable information before planning issue.

The hosted Cloudflare version serves files from dist/ and uses the Cloudflare Worker proxy for live API requests.

Main Features
Enter site coordinates as a single latitude/longitude pair.
Optional proposed access coordinates can be used as the routing origin.
Generate walking, cycling and indicative bus isochrone maps.
Live OpenStreetMap basemap tiles.
Live amenity data from OpenStreetMap/Overpass, with Nominatim fallback searches.
Local planning authority lookup from coordinates.
Editable project name, planning authority and output note.
Editable isochrone bands and colours.
Manual map panning, zoom adjustment and recenter control.
Amenity table editing, manual point placement and local override saving.
Export options for PNG, SVG, CSV amenity schedule and JSON method note.
How To Use
Open the tool.

Enter the site coordinates in WGS84 decimal degrees, for example:

51.508059049226425, -0.12803483425128898

If required, enter proposed access coordinates. Leave this blank to route from the site coordinate.

Select the travel mode:

Walking
Cycling
Bus
Click Generate draft map.

Review the isochrones, amenities and legend.

Use the controls to adjust colours, bands, legend position and map zoom where needed.

Pan the map manually if the framing needs refinement.

Edit amenity names/categories or add manual points where the OpenStreetMap data needs presentation refinement.

Export the required output:

PNG for report figures
SVG for editable map output
CSV for amenity schedules
JSON for methodology notes and QA records
Travel Mode Notes
Walking
Walking uses Valhalla pedestrian routing. Default bands are based on preferred maximum walking distances commonly used in accessibility assessment:

1,200 m for local services trips
2,000 m for commuting trips
Amenity CSV exports can include walking distances and walking time calculations.

Cycling
Cycling uses Valhalla bicycle routing. The cycling mode focuses on wider-area destinations such as settlements, rail stations, education and healthcare locations.

Cycle times in CSV outputs are based on a cycling speed of 16 kph, consistent with DfT guidance.

Bus
Bus mode uses Valhalla multimodal routing and is provided as an indicative catchment only.

Before using bus outputs in a planning submission, check the result against current public transport timetable information and local service context. The tool does not currently model a full timetable-based public transport isochrone.

Data And Method Limitations
This tool uses live public data sources. Outputs should be checked before issue.

Key limitations:

OpenStreetMap amenity coverage depends on current OSM mapping quality.
Overpass, Nominatim and public Valhalla services may be rate-limited or temporarily unavailable.
Bus contours are indicative Valhalla multimodal outputs, not timetable-confirmed public transport isochrones.
Report figures should be reviewed for appropriate map scale, legend clarity, amenity relevance and methodology wording.
Accessibility findings should be considered alongside local highway authority guidance, Local Plan policy, NPPF/PPG context and professional transport planning judgement.
Suggested QA Before Issue
Confirm the site/access coordinates.
Check the local planning authority value.
Review all mapped amenities for relevance and naming.
Confirm rail station labels and key destination names.
Check walking/cycling/bus method wording.
Confirm map scale, north arrow, legend and title block.
Check exported PNG/SVG quality before placing into reports.
For bus outputs, check current timetables and avoid presenting the output as a full scheduled public transport isochrone.
