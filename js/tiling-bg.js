/* ============================================================================
   tiling-bg.js — scrolling hat-tiling with a live header band.

   TWO canvases:
     #tiling-bg  (z-index:-2, behind everything)  → the quiet watermark tiling,
                 document-height, scrolls with the page.
     #tiling-header (z-index:21, fixed to viewport, IN FRONT of the content) →
                 every scroll frame we paint the hats that currently sit above a
                 fixed cutoff height, in opaque purple. They completely cover the
                 content scrolling underneath, so the header "background" IS the
                 tiling. The band's bottom is a jagged hat-outline edge, and
                 because the tiling scrolls the lit hats constantly change.

   The nav text/logo/toggle sit above the header canvas (z-index:22).
   Home page keeps its photo banner + jagged fade (unchanged behaviour there).
   Tiles are clickable (detach + fall) on precise pointers. Hover glow: off.
   ============================================================================ */
(function () {
  "use strict";

  const HOVER_GLOW = false;
  if (typeof HatGen === "undefined") return;

  const CUTOFF = 68;      // header cutoff height in the viewport (≈ --hdr-h)
  const OVER   = 260;
  // --- jagged header band: retracts as you scroll (non-banner pages) ---
  // At the top of the page the fringe of hats below the nav is full height; it
  // is decorative there. While you are reading it is just noise, so it pulls
  // back to a slim band once you have scrolled past SHRINK_OVER.
  const SHRINK_OVER = 240;   // px of scroll over which it retracts
  const CUT_MIN     = 44;    // hat threshold once retracted (from CUTOFF)
  const SOLID_MAX   = 70;    // solid strip then: just past the 68px nav
  const BAND_TOP    = 150;   // painted ceiling at scroll 0
  const BAND_MIN    = 70;    // painted ceiling once retracted     // extra canvas height so a big hat straddling the cutoff
                          // shows its full jagged lower outline (never clipped flat)
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function hexRGB(h){ h=h.replace("#",""); if(h.length===3) h=h.split("").map(c=>c+c).join("");
    return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
  let COL, RGB;
  function refreshPalette(){
    COL={ bg:cssVar("--bg"), tileA:cssVar("--tile-a"), tileB:cssVar("--tile-b"),
          tileC:cssVar("--tile-c"), act:cssVar("--accent"), line:cssVar("--tile-line") };
    RGB={ act:hexRGB(COL.act) };
  }
  function baseCol(l){ return l==="H1"?COL.tileB:(l==="F"?COL.tileC:COL.tileA); }

  const bg   = document.getElementById("tiling-bg");
  const hdr  = document.getElementById("tiling-header");
  if (!bg) return;
  const bctx = bg.getContext("2d");
  const hctx = hdr ? hdr.getContext("2d") : null;

  const bannerEl = document.querySelector(".banner-wrap .wsite-header-section");
  const HAS_BANNER = !!bannerEl;
  // Banner pages (home) use a STRAIGHT-bottomed header strip drawn OVER the banner;
  // non-banner pages use the JAGGED header. Either way the header is accent tiles.
  const STRAIGHT = HAS_BANNER;

  let W=0, DOCH=0, tiles=[], grid=null, cell=90, scale=1, ox=0, oy=0;

  // Measure the IN-FLOW page height only. scrollHeight also counts the tiling
  // canvases, which are absolutely positioned and sized from this value — so once
  // an embed (Discord/Tally) reported a smaller height, the now-oversized canvas
  // held the measurement at the old value, it never shrank back, and the leftover
  // canvas showed up as dead scroll space below the footer. offsetHeight ignores
  // out-of-flow boxes, so it always tracks the real page.
  function docHeight(){
    return Math.max(document.body.offsetHeight,
                    document.documentElement.offsetHeight, window.innerHeight);
  }
  function size(cv,ctx,w,h){ cv.width=Math.round(w*DPR); cv.height=Math.round(h*DPR);
    cv.style.width=w+"px"; cv.style.height=h+"px"; ctx.setTransform(DPR,0,0,DPR,0,0); }

  // Target on-screen hat size (px). Chosen to match the gallery look, applied to
  // EVERY page so tile size is identical everywhere regardless of page height.
  const TARGET_HAT_PX = 78;

  function build(){
    refreshPalette();
    W = document.documentElement.clientWidth;
    DOCH = docHeight();
    size(bg,bctx,W,DOCH);
    if (hdr) size(hdr,hctx,W,CUTOFF+OVER);

    // Pick inflation so the patch, drawn at the FIXED target hat size, is big
    // enough to cover the whole document with margin (no gaps). Larger docs need
    // more hats, but the hats stay the SAME on-screen size.
    let raw, pmnx=0, pmny=0, pmxx=0, pmxy=0, patchW=1;
    for (let levels = 3; levels <= 6; levels++){
      raw = HatGen.generate(levels);
      let minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9, sumw=0;
      for(const h of raw){ let a=1e9,b=-1e9;
        for(const v of h.verts){ if(v.x<minx)minx=v.x; if(v.x>maxx)maxx=v.x; if(v.y<miny)miny=v.y; if(v.y>maxy)maxy=v.y; if(v.x<a)a=v.x; if(v.x>b)b=v.x; }
        sumw += (b-a);
      }
      const pw=maxx-minx, ph=maxy-miny, avgHatUnits=sumw/raw.length;
      scale = TARGET_HAT_PX / avgHatUnits;         // FIXED tile size
      pmnx=minx; pmny=miny; pmxx=maxx; pmxy=maxy; patchW=pw;
      // Require the patch's gap-free CORE (inner 62%, since the boundary is ragged)
      // to exceed the document by ~2 tiles on every side → no edge gaps anywhere.
      const margin = TARGET_HAT_PX*2 + 120;
      const coverW = pw*scale*0.62, coverH = ph*scale*0.62;
      if (coverW >= W+margin && coverH >= DOCH+margin) break;
    }
    ox = W/2 - ((pmnx+pmxx)/2)*scale;
    oy = DOCH/2 - ((pmny+pmxy)/2)*scale;

    tiles=[];
    const cullM = TARGET_HAT_PX*2;
    for(const h of raw){
      const dcx=h.cx*scale+ox, dcy=h.cy*scale+oy;
      if(dcx<-cullM||dcx>W+cullM||dcy<-cullM||dcy>DOCH+cullM) continue;
      const dv=new Array(h.verts.length*2);
      let minY=1e9,maxY=-1e9;
      for(let i=0;i<h.verts.length;i++){ const X=h.verts[i].x*scale+ox, Y=h.verts[i].y*scale+oy;
        dv[i*2]=X; dv[i*2+1]=Y; if(Y<minY)minY=Y; if(Y>maxY)maxY=Y; }
      tiles.push({label:h.label, dv, dcx, dcy, minY, maxY, removed:false});
    }
    cell=Math.max(50,(patchW*scale)/Math.sqrt(tiles.length)*1.4);
    grid=new Map();
    for(let i=0;i<tiles.length;i++){ const t=tiles[i];
      const k=((t.dcx/cell)|0)+"|"+((t.dcy/cell)|0);
      let a=grid.get(k); if(!a){a=[];grid.set(k,a);} a.push(i); }

    drawBackground();
    drawHeaderBand();
  }

  // ---------- background watermark (quiet, no purple band) ----------
  function drawTileTo(ctx, t, fill, yoff){
    const v=t.dv; ctx.fillStyle=fill;
    ctx.beginPath(); ctx.moveTo(v[0], v[1]-(yoff||0));
    for(let j=2;j<v.length;j+=2) ctx.lineTo(v[j], v[j+1]-(yoff||0));
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  function drawBackground(){
    bctx.setTransform(DPR,0,0,DPR,0,0);
    bctx.fillStyle=COL.bg; bctx.fillRect(0,0,W,DOCH);
    bctx.lineWidth=0.5; bctx.strokeStyle=COL.line;
    for(let i=0;i<tiles.length;i++){ const t=tiles[i]; if(t.removed) continue;
      // quiet watermark everywhere; the header treatment lives on the front canvas.
      drawTileTo(bctx,t,baseCol(t.label),0);
    }
  }

  // ---------- header band: accent tiles in FRONT of content, on the fixed canvas ----
  // Drawn on ALL pages (including the home banner page — the strip sits OVER the
  // banner). STRAIGHT mode (banner pages): a straight horizontal bottom edge at the
  // cutoff (tiles are split by the line; accent above). JAGGED mode (other pages):
  // whole hats poking above the cutoff make a jagged bottom edge.
  function drawHeaderBand(){
    if(!hctx) return;
    const scrollY=window.scrollY;
    hctx.setTransform(DPR,0,0,DPR,0,0);
    hctx.clearRect(0,0,W,CUTOFF+OVER);
    hctx.fillStyle=COL.act;

    if(STRAIGHT){
      // solid accent strip with a straight bottom at the cutoff
      hctx.fillRect(0, 0, W, CUTOFF);
      // show the hat seams within the strip (clipped to the straight line)
      hctx.save();
      hctx.beginPath(); hctx.rect(0,0,W,CUTOFF); hctx.clip();
      hctx.lineWidth=0.6; hctx.strokeStyle=COL.line;
      for(let i=0;i<tiles.length;i++){ const t=tiles[i]; if(t.removed) continue;
        if(t.minY-scrollY>CUTOFF || t.maxY-scrollY<0) continue;
        const v=t.dv; hctx.beginPath(); hctx.moveTo(v[0],v[1]-scrollY);
        for(let j=2;j<v.length;j+=2) hctx.lineTo(v[j],v[j+1]-scrollY);
        hctx.closePath(); hctx.stroke();
      }
      hctx.restore();
      return;
    }

    // JAGGED: solid top strip, then whole hats poking above the cutoff.
    // Everything below is interpolated by p so the band retracts on scroll:
    // p = 0 at the top of the page, 1 once scrolled past SHRINK_OVER.
    const p     = Math.min(1, Math.max(0, scrollY / SHRINK_OVER));
    const cut   = CUTOFF     + (CUT_MIN    - CUTOFF)       * p;   // 68  -> 44
    // solid ramps at twice the rate: the strip behind the nav text must never
    // thin out mid-transition, even as fewer hats are drawn under it.
    const solid = (CUTOFF-22)+ (SOLID_MAX  - (CUTOFF-22))  * Math.min(1, p*2);
    const band  = BAND_TOP   + (BAND_MIN   - BAND_TOP)     * p;   // 150 -> 76

    hctx.save();
    hctx.beginPath(); hctx.rect(0, 0, W, band); hctx.clip();
    hctx.fillRect(0, 0, W, Math.max(0, solid));
    hctx.lineWidth=1; hctx.strokeStyle=COL.act;   // merge borders: stroke==fill → no seams
    for(let i=0;i<tiles.length;i++){
      const t=tiles[i]; if(t.removed) continue;
      const vyTop=t.minY-scrollY;
      if(vyTop>cut) continue;            // entirely below the cutoff → not header
      const v=t.dv;
      hctx.beginPath(); hctx.moveTo(v[0], v[1]-scrollY);
      for(let j=2;j<v.length;j+=2) hctx.lineTo(v[j], v[j+1]-scrollY);
      hctx.closePath(); hctx.fill(); hctx.stroke();
    }
    hctx.restore();
  }

  // Is a tile currently in the header band? (so clicking it does nothing)
  function tileInHeader(t){
    const vyTop=t.minY-window.scrollY;
    return vyTop <= CUTOFF;   // any hat reaching above the cutoff is header
  }

  // ---------- click → detach + fall ----------
  const COARSE = window.matchMedia("(pointer:coarse)").matches;
  function inPoly(px,py,t){ const v=t.dv; let inside=false;
    for(let i=0,j=v.length-2;i<v.length;j=i,i+=2){ const xi=v[i],yi=v[i+1],xj=v[j],yj=v[j+1];
      if(((yi>py)!==(yj>py)) && (px<(xj-xi)*(py-yi)/(yj-yi)+xi)) inside=!inside; } return inside; }
  function pick(px,py){ if(!grid)return -1; const gx=(px/cell)|0, gy=(py/cell)|0;
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
      const a=grid.get((gx+dx)+"|"+(gy+dy)); if(!a)continue;
      for(let i=0;i<a.length;i++){const t=tiles[a[i]]; if(!t.removed&&inPoly(px,py,t))return a[i];} }
    return -1; }

  function dropTileAt(clientX, clientY){
    const idx=pick(clientX, clientY+window.scrollY); if(idx<0) return false;
    const t=tiles[idx]; if(t.removed) return false;
    if(tileInHeader(t)) return false;    // header tiles are not interactive
    t.removed=true;
    // erase from background
    bctx.setTransform(DPR,0,0,DPR,0,0); bctx.fillStyle=COL.bg;
    const v=t.dv; bctx.beginPath(); bctx.moveTo(v[0],v[1]);
    for(let j=2;j<v.length;j+=2) bctx.lineTo(v[j],v[j+1]); bctx.closePath(); bctx.fill();
    // sprite
    let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
    for(let j=0;j<v.length;j+=2){ if(v[j]<minX)minX=v[j]; if(v[j]>maxX)maxX=v[j]; if(v[j+1]<minY)minY=v[j+1]; if(v[j+1]>maxY)maxY=v[j+1]; }
    const w=Math.ceil(maxX-minX)+6, h=Math.ceil(maxY-minY)+6, sy=window.scrollY;
    const fillCol = baseCol(t.label);
    const spr=document.createElement("canvas"); spr.width=w*DPR; spr.height=h*DPR;
    spr.style.cssText="position:fixed;z-index:8;pointer-events:none;width:"+w+"px;height:"+h+"px;left:"+
      (minX-3)+"px;top:"+(minY-3-sy)+"px;will-change:transform,opacity;opacity:.9;"+
      "transition:transform 1.2s cubic-bezier(.45,.05,.55,.95),opacity 1.2s ease-in;";
    const s=spr.getContext("2d"); s.setTransform(DPR,0,0,DPR,0,0);
    s.fillStyle=fillCol; s.beginPath(); s.moveTo(v[0]-minX+3,v[1]-minY+3);
    for(let j=2;j<v.length;j+=2) s.lineTo(v[j]-minX+3,v[j+1]-minY+3); s.closePath(); s.fill();
    document.body.appendChild(spr);
    const fallTo=window.innerHeight-(minY-sy)+60, spin=Math.random()*120-60;
    requestAnimationFrame(()=>{ spr.style.transform="translateY("+fallTo+"px) rotate("+spin+"deg)"; spr.style.opacity="0"; });
    spr.addEventListener("transitionend",()=>spr.remove(),{once:true});
    return true;
  }
  if(!COARSE){
    window.addEventListener("pointerdown", function(e){
      if(e.button!==0) return;
      const el=e.target;
      if(el.closest("a,button,input,textarea,select,iframe,label,.wsite-button,#theme-toggle,.hamburger")) return;
      // allow clicks on header nav area to still drop background tiles is fine, but
      // skip real content/panels and the mobile menu
      if(el.closest("#wsite-content,.banner,.footer-wrap,.mobile-nav")) return;
      dropTileAt(e.clientX, e.clientY);
    });
  }

  // ---------- loop: repaint the header band as the tiling scrolls ----------
  let prevScroll=-1;
  function loop(){
    const s=window.scrollY;
    if(s!==prevScroll){ drawHeaderBand(); prevScroll=s; }
    requestAnimationFrame(loop);
  }

  // Rebuild whenever the document's height can change. On banner pages the banner
  // background IMAGE and the embedded iframes (Discord/Tally) load asynchronously
  // and change the page height AFTER the first build(), so we listen broadly:
  //  - resize (debounced)
  //  - window "load" (all images/iframes finished)
  //  - ResizeObserver on <body> with a small threshold
  //  - the banner background image, fetched explicitly, rebuilds on decode
  let rt=null;
  function schedule(){ clearTimeout(rt); rt=setTimeout(build,120); }
  window.addEventListener("resize", schedule);
  window.addEventListener("themechange", ()=>{ refreshPalette(); drawBackground(); drawHeaderBand(); });
  window.addEventListener("load", schedule);
  if("ResizeObserver" in window){
    const ro=new ResizeObserver(()=>{ if(Math.abs(docHeight()-DOCH)>8) schedule(); });
    ro.observe(document.body);
    ro.observe(document.documentElement);
  }
  // a couple of delayed rebuilds catch late async layout (iframes reporting height)
  setTimeout(schedule, 600);
  setTimeout(schedule, 1600);
  // if the banner has a background image, rebuild once it has actually loaded
  if(bannerEl){
    const bgImg = getComputedStyle(bannerEl).backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
    if(bgImg && bgImg[1]){
      const im = new Image();
      im.onload = schedule; im.onerror = schedule;
      im.src = bgImg[1];
      if(im.complete) schedule();
    }
  }

  window.__tilingRebuild = build;
  build();
  requestAnimationFrame(loop);
})();
