(() => {
  const addPolish = () => { if (!document.querySelector('link[href="polish.css"]')) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'polish.css'; document.head.appendChild(link); } };
  addPolish();

  const toRad = (d) => (Number(d) * Math.PI) / 180;
  const toDeg = (r) => (Number(r) * 180) / Math.PI;
  const project = (c, origin) => { const lat = 111320, lon = 111320 * Math.max(Math.cos(toRad(origin.latitude)), 0.2); return { x: (Number(c.longitude) - Number(origin.longitude)) * lon, y: (Number(c.latitude) - Number(origin.latitude)) * lat }; };
  const unproject = (p, origin) => { const lat = 111320, lon = 111320 * Math.max(Math.cos(toRad(origin.latitude)), 0.2); return { latitude: Number(origin.latitude) + p.y / lat, longitude: Number(origin.longitude) + p.x / lon }; };
  const distanceM = (a, b) => { const r = 6371000, p1 = toRad(a.latitude), p2 = toRad(b.latitude), dp = toRad(b.latitude - a.latitude), dl = toRad(b.longitude - a.longitude); const h = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2; return 2*r*Math.atan2(Math.sqrt(h), Math.sqrt(1-h)); };
  const dest = (c, bearingDeg, metres) => { const r=6371000, ad=metres/r, br=toRad(bearingDeg), p1=toRad(c.latitude), l1=toRad(c.longitude); const p2=Math.asin(Math.sin(p1)*Math.cos(ad)+Math.cos(p1)*Math.sin(ad)*Math.cos(br)); const l2=l1+Math.atan2(Math.sin(br)*Math.sin(ad)*Math.cos(p1), Math.cos(ad)-Math.sin(p1)*Math.sin(p2)); return { latitude: toDeg(p2), longitude: ((toDeg(l2)+540)%360)-180 }; };

  window.projectCoordinateToLocalMetres = project;
  window.interpolateCoordinate = (a,b,f) => { const t=Math.max(0,Math.min(1,Number(f)||0)); return { latitude:Number(a.latitude)+(Number(b.latitude)-Number(a.latitude))*t, longitude:Number(a.longitude)+(Number(b.longitude)-Number(a.longitude))*t }; };
  window.dedupeCoordinates = (coordinates, precision=6) => { const seen=new Set(), output=[]; (coordinates||[]).forEach((c)=>{ const latitude=Number(c?.latitude), longitude=Number(c?.longitude); if(!Number.isFinite(latitude)||!Number.isFinite(longitude)) return; const key=`${latitude.toFixed(precision)},${longitude.toFixed(precision)}`; if(seen.has(key)) return; seen.add(key); output.push({...c, latitude, longitude}); }); return output; };
  window.clusterCoordinatesByDistance = (coordinates, linkDistanceMetres=240) => { const points=window.dedupeCoordinates(coordinates,6), clusters=[], visited=new Set(); for(let i=0;i<points.length;i++){ if(visited.has(i)) continue; const cluster=[], queue=[i]; visited.add(i); while(queue.length){ const idx=queue.shift(); cluster.push(points[idx]); for(let j=0;j<points.length;j++){ if(!visited.has(j)&&distanceM(points[idx],points[j])<=linkDistanceMetres){ visited.add(j); queue.push(j); } } } clusters.push(cluster); } return clusters.sort((a,b)=>b.length-a.length); };
  window.buildBufferedRouteSegmentRing = (a,b,bufferMetres=55) => { if(distanceM(a,b)<=0) return null; const p1=project(a,a), p2=project(b,a), dx=p2.x-p1.x, dy=p2.y-p1.y, mag=Math.hypot(dx,dy)||1, nx=-dy/mag*bufferMetres, ny=dx/mag*bufferMetres; const ring=[unproject({x:p1.x+nx,y:p1.y+ny},a),unproject({x:p2.x+nx,y:p2.y+ny},a),unproject({x:p2.x-nx,y:p2.y-ny},a),unproject({x:p1.x-nx,y:p1.y-ny},a)]; return ring.map((c)=>[c.longitude,c.latitude]).concat([[ring[0].longitude,ring[0].latitude]]); };
  window.buildExpandedCoordinateCloud = (cluster, bufferMetres=55, segmentCount=10) => { const out=[]; (cluster||[]).forEach((c)=>{ out.push(c); for(let i=0;i<segmentCount;i++) out.push(dest(c,i*360/segmentCount,bufferMetres)); }); return window.dedupeCoordinates(out,6); };
  window.buildRadialEnvelopeHull = (points, bins=128) => { const coords=window.dedupeCoordinates(points,6); if(coords.length<3) return null; const origin={latitude:coords.reduce((s,c)=>s+c.latitude,0)/coords.length, longitude:coords.reduce((s,c)=>s+c.longitude,0)/coords.length}; const best=new Array(Math.max(16,bins)).fill(null); coords.forEach((c)=>{ const p=project(c,origin), angle=(Math.atan2(p.y,p.x)+Math.PI*2)%(Math.PI*2), bin=Math.min(best.length-1,Math.floor(angle/(Math.PI*2)*best.length)), d=Math.hypot(p.x,p.y); if(!best[bin]||d>best[bin].d) best[bin]={d,c}; }); const ringCoords=best.filter(Boolean).map((x)=>x.c); if(ringCoords.length<3) return null; const ring=ringCoords.map((c)=>[c.longitude,c.latitude]); ring.push([...ring[0]]); return ring; };
  window.smoothRing = (ring, iterations=1) => { let current=(ring||[]).slice(); if(current.length<4) return current; for(let it=0;it<Math.max(0,iterations);it++){ const pts=current.slice(0,-1), next=[]; for(let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length]; next.push(a,[(a[0]+b[0])/2,(a[1]+b[1])/2]); } next.push([...next[0]]); current=next; } return current; };
  window.getApproximateRingAreaSquareMetres = (ring) => { const pts=(ring||[]).filter((p)=>Array.isArray(p)&&p.length>=2); if(pts.length<4) return 0; const origin={latitude:pts[0][1],longitude:pts[0][0]}, projected=pts.map((p)=>project({latitude:p[1],longitude:p[0]},origin)); let area=0; for(let i=0;i<projected.length-1;i++) area+=projected[i].x*projected[i+1].y-projected[i+1].x*projected[i].y; return Math.abs(area)/2; };

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const symbolSvg = (symbol='circle', color='#21618c', size=18) => { const fill=esc(color), common=`fill="${fill}" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"`; const shapes={square:`<rect x="5" y="5" width="14" height="14" rx="2" ${common}/>`,diamond:`<path d="M12 3 L21 12 L12 21 L3 12 Z" ${common}/>`,triangle:`<path d="M12 3 L22 20 L2 20 Z" ${common}/>`,cross:`<path d="M9 3 H15 V9 H21 V15 H15 V21 H9 V15 H3 V9 H9 Z" ${common}/>`,hex:`<path d="M7 4 H17 L22 12 L17 20 H7 L2 12 Z" ${common}/>`,star:`<path d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18 L6 21 L7 14 L2 9 L9 8 Z" ${common}/>`,pentagon:`<path d="M12 3 L21 10 L17 21 H7 L3 10 Z" ${common}/>`,ring:`<circle cx="12" cy="12" r="8" fill="none" stroke="${fill}" stroke-width="4"/>`}; return `<svg class="amenity-symbol-svg" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${shapes[symbol]||`<circle cx="12" cy="12" r="8" ${common}/>`}</svg>`; };
  const amenityCards = () => Array.from(document.querySelectorAll('.amenity-card')).map((card)=>({ name:card.querySelector('input[data-field="name"]')?.value||'Amenity', symbol:card.querySelector('select[data-field="symbol"]')?.value||'circle', color:card.querySelector('input[data-field="color"]')?.value||'#21618c', visible:card.querySelector('input[data-field="visible"]')?.checked!==false, showInLegend:card.querySelector('input[data-field="showInLegend"]')?.checked!==false }));
  const symbolForColour = (colour) => amenityCards().find((item)=>item.visible&&item.color.toLowerCase()===String(colour||'').toLowerCase())?.symbol||'circle';
  window.leafletAmenityIcon = (colour, symbol) => L.divIcon({className:'amenity-leaflet-icon', html:symbolSvg(symbol||symbolForColour(colour), colour||'#21618c', 18), iconSize:[22,22], iconAnchor:[11,11], popupAnchor:[0,-10]});
  window.buildLeafletLegendMarkup = (bands=[]) => { const mode=document.querySelector('.mode-chip.active')?.textContent?.trim()||'Walking'; const bandRows=bands.map((band,i)=>`<span class="legend-row"><i class="legend-band" style="background:${esc(band.fill||['#00f7ff','#ff0000','#22ff00'][i%3])}"></i><b>${esc(band.label)}</b></span>`).join(''); const amenities=amenityCards().filter((item)=>item.visible&&item.showInLegend).slice(0,30).map((item)=>`<span class="legend-row legend-amenity-row"><i class="legend-symbol">${symbolSvg(item.symbol,item.color,15)}</i><b>${esc(item.name)}</b></span>`).join(''); return `<strong>${esc(mode)} bands</strong>${bandRows}<span class="legend-row"><i class="legend-site-pin"></i><b>Site</b></span>${amenities?`<strong class="legend-subhead">Amenities</strong>${amenities}`:''}`; };

  const originalFetch = window.fetch.bind(window);
  const amenityQueries = [
    ['Rail station','[railway station]',{railway:'station'}], ['School','[school]',{amenity:'school'}], ['Healthcare','[hospital]',{amenity:'hospital'}], ['Retail','shop',{shop:'supermarket'}], ['Food and drink','[cafe]',{amenity:'cafe'}], ['Community','[library]',{amenity:'library'}], ['Worship','[church]',{amenity:'place_of_worship'}], ['Open space','[park]',{leisure:'park'}], ['Settlement','town',{place:'town'}], ['Settlement','village',{place:'village'}]
  ];
  async function nominatimAmenityResponse(queryText) {
    const around = /around:\s*(\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/.exec(queryText || '');
    if (!around) return null;
    const radius = Math.min(Number(around[1]) || 1600, 6500), lat = Number(around[2]), lon = Number(around[3]);
    const latDelta = radius / 111320, lonDelta = radius / (111320 * Math.max(Math.cos(toRad(lat)), 0.2));
    const viewbox = `${lon-lonDelta},${lat+latDelta},${lon+lonDelta},${lat-latDelta}`;
    const elements = []; let id = 900000000;
    await Promise.all(amenityQueries.map(async ([category, q, tags]) => {
      try {
        const url = `/api/proxy/nominatim/search?format=jsonv2&limit=4&bounded=1&viewbox=${encodeURIComponent(viewbox)}&q=${encodeURIComponent(q)}`;
        const response = await originalFetch(url); if (!response.ok) return; const results = await response.json();
        (results || []).forEach((result) => { const rlat=Number(result.lat), rlon=Number(result.lon); if(!Number.isFinite(rlat)||!Number.isFinite(rlon)) return; elements.push({type:'node', id:id++, lat:rlat, lon:rlon, tags:{name:(result.display_name||category).split(',')[0].trim(), ...tags}}); });
      } catch {}
    }));
    return new Response(JSON.stringify({elements}), {status:200, headers:{'Content-Type':'application/json'}});
  }
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const body = typeof init?.body === 'string' ? init.body : '';
    if (url.includes('/api/proxy/overpass') && /\b(amenity|shop|leisure|railway|place)\b/i.test(body) && !/\bhighway\b/i.test(body)) {
      const response = await nominatimAmenityResponse(body); if (response) return response;
    }
    return originalFetch(input, init);
  };

  function patchLeaflet() {
    if (!window.L || window.L.__isochroneHotfixPatched) return; window.L.__isochroneHotfixPatched = true;
    const originalPolygon = L.polygon;
    L.polygon = function patchedPolygon(latlngs, options = {}) { if (options && Number(options.fillOpacity) === 0.32 && Number(options.weight) === 2) options = {...options, interactive:false}; return originalPolygon.call(this, latlngs, options); };
    const originalBindPopup = L.Layer.prototype.bindPopup;
    L.Layer.prototype.bindPopup = function patchedBindPopup(content, options) { if (typeof content === 'string' && /^(Walking|Cycling)\s/i.test(content)) return this; return originalBindPopup.call(this, content, options); };
  }

  const rebuild = () => { addPolish(); patchLeaflet(); const rail=document.querySelector('.control-rail'), main=document.querySelector('.main-stage'); if(!rail||!main)return; const access=document.getElementById('accessCoordinates'); if(access){access.value=''; access.closest('label')?.remove();} document.getElementById('projectNote')?.closest('label')?.remove(); const cyclingBands=document.getElementById('cyclingBands'); if(cyclingBands && /8000/.test(cyclingBands.value)) cyclingBands.value='2000m, 4000m'; const toolbar=document.querySelector('.workspace-toolbar'), advanced=document.querySelector('.advanced-panel'), manual=document.querySelector('.manual-edit-panel'), outputs=document.querySelector('.outputs-stage'); const actions=document.querySelector('.toolbar-block-actions')||toolbar?.querySelector('.toolbar-block-actions'), mode=document.querySelector('.toolbar-block-mode')||toolbar?.querySelector('.toolbar-block-mode'), exports=document.querySelector('.toolbar-block-export')||toolbar?.querySelector('.toolbar-block-export'), status=document.querySelector('.toolbar-block-status')||toolbar?.querySelector('.toolbar-block-status'); const after=(node,ref)=>node&&ref?.parentElement===rail&&rail.insertBefore(node,ref.nextSibling); if(advanced?.parentElement===rail){after(actions,advanced); after(mode,actions||advanced);} else { if(actions)rail.appendChild(actions); if(mode)rail.appendChild(mode); } document.querySelectorAll('.list-panel').forEach((list)=>rail.appendChild(list)); if(manual)rail.appendChild(manual); if(exports)rail.appendChild(exports); outputs?.remove(); if(status)rail.appendChild(status); toolbar?.remove(); document.querySelector('.bottom-panels')?.remove(); document.querySelectorAll('.amenity-symbol').forEach((node)=>{const card=node.closest('.amenity-card'); node.innerHTML=symbolSvg(card?.querySelector('select[data-field="symbol"]')?.value||'circle', card?.querySelector('input[data-field="color"]')?.value||'#21618c', 18);}); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rebuild, {once:true}); else rebuild(); window.addEventListener('load', rebuild, {once:true}); setInterval(rebuild, 1200);
})();
