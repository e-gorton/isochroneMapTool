(() => {
  const addPolish = () => {
    if (!document.querySelector('link[href="polish.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'polish.css';
      document.head.appendChild(link);
    }
  };
  addPolish();

  const toRad = (d) => (Number(d) * Math.PI) / 180;
  const toDeg = (r) => (Number(r) * 180) / Math.PI;
  const distanceM = (a, b) => {
    const r = 6371000, p1 = toRad(a.latitude), p2 = toRad(b.latitude), dp = toRad(b.latitude - a.latitude), dl = toRad(b.longitude - a.longitude);
    const h = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
    return 2 * r * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
  };
  const dest = (c, bearingDeg, metres) => {
    const r = 6371000, ad = metres / r, br = toRad(bearingDeg), p1 = toRad(c.latitude), l1 = toRad(c.longitude);
    const p2 = Math.asin(Math.sin(p1)*Math.cos(ad) + Math.cos(p1)*Math.sin(ad)*Math.cos(br));
    const l2 = l1 + Math.atan2(Math.sin(br)*Math.sin(ad)*Math.cos(p1), Math.cos(ad)-Math.sin(p1)*Math.sin(p2));
    return { latitude: toDeg(p2), longitude: ((toDeg(l2) + 540) % 360) - 180 };
  };
  const project = (c, origin) => {
    const lat = 111320, lon = 111320 * Math.max(Math.cos(toRad(origin.latitude)), 0.2);
    return { x: (Number(c.longitude) - Number(origin.longitude)) * lon, y: (Number(c.latitude) - Number(origin.latitude)) * lat };
  };
  const unproject = (p, origin) => {
    const lat = 111320, lon = 111320 * Math.max(Math.cos(toRad(origin.latitude)), 0.2);
    return { latitude: Number(origin.latitude) + p.y / lat, longitude: Number(origin.longitude) + p.x / lon };
  };

  window.projectCoordinateToLocalMetres = project;
  window.interpolateCoordinate = (a, b, fraction) => {
    const t = Math.max(0, Math.min(1, Number(fraction) || 0));
    return { latitude: Number(a.latitude) + (Number(b.latitude) - Number(a.latitude)) * t, longitude: Number(a.longitude) + (Number(b.longitude) - Number(a.longitude)) * t };
  };
  window.dedupeCoordinates = (coordinates, precision = 6) => {
    const seen = new Set(); const output = [];
    (coordinates || []).forEach((coordinate) => {
      const latitude = Number(coordinate?.latitude), longitude = Number(coordinate?.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      const key = `${latitude.toFixed(precision)},${longitude.toFixed(precision)}`;
      if (seen.has(key)) return; seen.add(key); output.push({ ...coordinate, latitude, longitude });
    });
    return output;
  };
  window.clusterCoordinatesByDistance = (coordinates, linkDistanceMetres = 240) => {
    const points = window.dedupeCoordinates(coordinates, 6); const clusters = []; const visited = new Set();
    for (let i = 0; i < points.length; i += 1) {
      if (visited.has(i)) continue;
      const cluster = []; const queue = [i]; visited.add(i);
      while (queue.length) {
        const idx = queue.shift(); cluster.push(points[idx]);
        for (let j = 0; j < points.length; j += 1) {
          if (!visited.has(j) && distanceM(points[idx], points[j]) <= linkDistanceMetres) { visited.add(j); queue.push(j); }
        }
      }
      clusters.push(cluster);
    }
    return clusters.sort((a,b) => b.length - a.length);
  };
  window.buildBufferedRouteSegmentRing = (a, b, bufferMetres = 55) => {
    const length = distanceM(a,b); if (!Number.isFinite(length) || length <= 0) return null;
    const p1 = project(a,a), p2 = project(b,a); const dx = p2.x-p1.x, dy = p2.y-p1.y; const mag = Math.hypot(dx,dy) || 1;
    const nx = -dy / mag * bufferMetres, ny = dx / mag * bufferMetres;
    const ring = [unproject({x:p1.x+nx,y:p1.y+ny},a), unproject({x:p2.x+nx,y:p2.y+ny},a), unproject({x:p2.x-nx,y:p2.y-ny},a), unproject({x:p1.x-nx,y:p1.y-ny},a)];
    return ring.map((c) => [c.longitude,c.latitude]).concat([[ring[0].longitude, ring[0].latitude]]);
  };
  window.buildExpandedCoordinateCloud = (cluster, bufferMetres = 55, segmentCount = 10) => {
    const out = [];
    (cluster || []).forEach((c) => { out.push(c); for (let i=0;i<segmentCount;i+=1) out.push(dest(c, i*360/segmentCount, bufferMetres)); });
    return window.dedupeCoordinates(out, 6);
  };
  window.buildRadialEnvelopeHull = (points, bins = 128) => {
    const coords = window.dedupeCoordinates(points, 6); if (coords.length < 3) return null;
    const origin = { latitude: coords.reduce((s,c)=>s+c.latitude,0)/coords.length, longitude: coords.reduce((s,c)=>s+c.longitude,0)/coords.length };
    const best = new Array(Math.max(16, bins)).fill(null);
    coords.forEach((c) => { const p = project(c, origin); const angle = (Math.atan2(p.y,p.x)+Math.PI*2)%(Math.PI*2); const bin = Math.min(best.length-1, Math.floor(angle/(Math.PI*2)*best.length)); const d = Math.hypot(p.x,p.y); if (!best[bin] || d > best[bin].d) best[bin] = { d, c }; });
    const ringCoords = best.filter(Boolean).map((x)=>x.c); if (ringCoords.length < 3) return null;
    const ring = ringCoords.map((c)=>[c.longitude,c.latitude]); ring.push([...ring[0]]); return ring;
  };
  window.smoothRing = (ring, iterations = 1) => {
    let current = (ring || []).slice(); if (current.length < 4) return current;
    for (let it=0; it<Math.max(0, iterations); it+=1) {
      const closed = current[0][0] === current[current.length-1][0] && current[0][1] === current[current.length-1][1]; const pts = closed ? current.slice(0,-1) : current; const next = [];
      for (let i=0;i<pts.length;i+=1) { const a=pts[i], b=pts[(i+1)%pts.length]; next.push(a); next.push([(a[0]+b[0])/2,(a[1]+b[1])/2]); }
      next.push([...next[0]]); current = next;
    }
    return current;
  };
  window.getApproximateRingAreaSquareMetres = (ring) => {
    const pts = (ring || []).filter((p)=>Array.isArray(p) && p.length >= 2); if (pts.length < 4) return 0;
    const origin = { latitude: pts[0][1], longitude: pts[0][0] }; const projected = pts.map((p)=>project({latitude:p[1], longitude:p[0]}, origin)); let area = 0;
    for (let i=0;i<projected.length-1;i+=1) area += projected[i].x*projected[i+1].y - projected[i+1].x*projected[i].y;
    return Math.abs(area)/2;
  };

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const symbolSvg = (symbol = 'circle', color = '#21618c', size = 18) => {
    const fill = esc(color); const common = `fill="${fill}" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"`;
    const shapes = { square:`<rect x="5" y="5" width="14" height="14" rx="2" ${common}/>`, diamond:`<path d="M12 3 L21 12 L12 21 L3 12 Z" ${common}/>`, triangle:`<path d="M12 3 L22 20 L2 20 Z" ${common}/>`, cross:`<path d="M9 3 H15 V9 H21 V15 H15 V21 H9 V15 H3 V9 H9 Z" ${common}/>`, hex:`<path d="M7 4 H17 L22 12 L17 20 H7 L2 12 Z" ${common}/>`, star:`<path d="M12 2 L15 8 L22 9 L17 14 L18 21 L12 18 L6 21 L7 14 L2 9 L9 8 Z" ${common}/>`, pentagon:`<path d="M12 3 L21 10 L17 21 H7 L3 10 Z" ${common}/>`, ring:`<circle cx="12" cy="12" r="8" fill="none" stroke="${fill}" stroke-width="4"/>` };
    return `<svg class="amenity-symbol-svg" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${shapes[symbol] || `<circle cx="12" cy="12" r="8" ${common}/>`}</svg>`;
  };
  const amenityCards = () => Array.from(document.querySelectorAll('.amenity-card')).map((card) => ({ name: card.querySelector('input[data-field="name"]')?.value || 'Amenity', symbol: card.querySelector('select[data-field="symbol"]')?.value || 'circle', color: card.querySelector('input[data-field="color"]')?.value || '#21618c', visible: card.querySelector('input[data-field="visible"]')?.checked !== false, showInLegend: card.querySelector('input[data-field="showInLegend"]')?.checked !== false }));
  const symbolForColour = (colour) => amenityCards().find((item) => item.visible && item.color.toLowerCase() === String(colour || '').toLowerCase())?.symbol || 'circle';
  window.leafletAmenityIcon = (colour, symbol) => L.divIcon({ className:'amenity-leaflet-icon', html:symbolSvg(symbol || symbolForColour(colour), colour || '#21618c', 18), iconSize:[22,22], iconAnchor:[11,11], popupAnchor:[0,-10] });
  window.buildLeafletLegendMarkup = (bands = []) => { const mode = document.querySelector('.mode-chip.active')?.textContent?.trim() || 'Walking'; const bandRows = bands.map((band,i)=>`<span class="legend-row"><i class="legend-band" style="background:${esc(band.fill || ['#00f7ff','#ff0000','#22ff00'][i%3])}"></i><b>${esc(band.label)}</b></span>`).join(''); const amenities = amenityCards().filter((item)=>item.visible && item.showInLegend).slice(0,30).map((item)=>`<span class="legend-row legend-amenity-row"><i class="legend-symbol">${symbolSvg(item.symbol,item.color,15)}</i><b>${esc(item.name)}</b></span>`).join(''); return `<strong>${esc(mode)} bands</strong>${bandRows}<span class="legend-row"><i class="legend-site-pin"></i><b>Site</b></span>${amenities ? `<strong class="legend-subhead">Amenities</strong>${amenities}` : ''}`; };
  const rebuild = () => { addPolish(); const rail=document.querySelector('.control-rail'), main=document.querySelector('.main-stage'); if(!rail||!main)return; const access=document.getElementById('accessCoordinates'); if(access){access.value=''; access.closest('label')?.remove();} document.getElementById('projectNote')?.closest('label')?.remove(); const toolbar=document.querySelector('.workspace-toolbar'), advanced=document.querySelector('.advanced-panel'), manual=document.querySelector('.manual-edit-panel'), outputs=document.querySelector('.outputs-stage'); const actions=document.querySelector('.toolbar-block-actions')||toolbar?.querySelector('.toolbar-block-actions'), mode=document.querySelector('.toolbar-block-mode')||toolbar?.querySelector('.toolbar-block-mode'), exports=document.querySelector('.toolbar-block-export')||toolbar?.querySelector('.toolbar-block-export'), status=document.querySelector('.toolbar-block-status')||toolbar?.querySelector('.toolbar-block-status'); const after=(node,ref)=>node&&ref?.parentElement===rail&&rail.insertBefore(node,ref.nextSibling); if(advanced?.parentElement===rail){after(actions,advanced); after(mode,actions||advanced);} else { if(actions)rail.appendChild(actions); if(mode)rail.appendChild(mode); } document.querySelectorAll('.list-panel').forEach((list)=>rail.appendChild(list)); if(manual)rail.appendChild(manual); if(exports)rail.appendChild(exports); outputs?.remove(); if(status)rail.appendChild(status); toolbar?.remove(); document.querySelector('.bottom-panels')?.remove(); document.querySelectorAll('.amenity-symbol').forEach((node)=>{const card=node.closest('.amenity-card'); node.innerHTML=symbolSvg(card?.querySelector('select[data-field="symbol"]')?.value||'circle', card?.querySelector('input[data-field="color"]')?.value||'#21618c', 18);}); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rebuild, { once:true }); else rebuild(); window.addEventListener('load', rebuild, { once:true }); setInterval(rebuild, 1200);
})();
