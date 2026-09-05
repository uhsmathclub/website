/* ============================================================================
   hat-generator.js — the REAL aperiodic hat (einstein) tiling.
   Pure JS extraction of Craig S. Kaplan's reference implementation
   (geometry.js + hat.js substitution), stripped of all p5.js/drawing code.
   Produces a flat list of hat polygons via the genuine HTPF metatile
   substitution. CC0 / public-domain math, per the SMKGS reference repo.
   ============================================================================ */
const HatGen = (function(){
  const hr3 = 0.8660254037844386;
  const ident = [1,0,0,0,1,0];
  function pt(x,y){ return {x,y}; }
  function hexPt(x,y){ return pt(x+0.5*y, hr3*y); }
  function inv(T){ const d=T[0]*T[4]-T[1]*T[3];
    return [T[4]/d,-T[1]/d,(T[1]*T[5]-T[2]*T[4])/d,-T[3]/d,T[0]/d,(T[2]*T[3]-T[0]*T[5])/d]; }
  function mul(A,B){ return [
    A[0]*B[0]+A[1]*B[3], A[0]*B[1]+A[1]*B[4], A[0]*B[2]+A[1]*B[5]+A[2],
    A[3]*B[0]+A[4]*B[3], A[3]*B[1]+A[4]*B[4], A[3]*B[2]+A[4]*B[5]+A[5]]; }
  function padd(p,q){ return {x:p.x+q.x, y:p.y+q.y}; }
  function psub(p,q){ return {x:p.x-q.x, y:p.y-q.y}; }
  function trot(a){ const c=Math.cos(a),s=Math.sin(a); return [c,-s,0,s,c,0]; }
  function ttrans(tx,ty){ return [1,0,tx,0,1,ty]; }
  function rotAbout(p,a){ return mul(ttrans(p.x,p.y), mul(trot(a), ttrans(-p.x,-p.y))); }
  function transPt(M,P){ return pt(M[0]*P.x+M[1]*P.y+M[2], M[3]*P.x+M[4]*P.y+M[5]); }
  function matchSeg(p,q){ return [q.x-p.x,p.y-q.y,p.x, q.y-p.y,q.x-p.x,p.y]; }
  function matchTwo(p1,q1,p2,q2){ return mul(matchSeg(p2,q2), inv(matchSeg(p1,q1))); }
  function intersect(p1,q1,p2,q2){
    const d=(q2.y-p2.y)*(q1.x-p1.x)-(q2.x-p2.x)*(q1.y-p1.y);
    const uA=((q2.x-p2.x)*(p1.y-p2.y)-(q2.y-p2.y)*(p1.x-p2.x))/d;
    return pt(p1.x+uA*(q1.x-p1.x), p1.y+uA*(q1.y-p1.y)); }

  const hat_outline = [
    hexPt(0,0),hexPt(-1,-1),hexPt(0,-2),hexPt(2,-2),hexPt(2,-1),hexPt(4,-2),
    hexPt(5,-1),hexPt(4,0),hexPt(3,0),hexPt(2,2),hexPt(0,3),hexPt(0,2),hexPt(-1,2)];

  class HatTile{
    constructor(label){ this.label=label; this.shape=hat_outline; }
    flatten(T,out){ out.push({label:this.label, T}); }
  }
  class MetaTile{
    constructor(shape,width){ this.shape=shape; this.width=width; this.children=[]; }
    addChild(T,geom){ this.children.push({T,geom}); }
    evalChild(n,i){ return transPt(this.children[n].T, this.children[n].geom.shape[i]); }
    recentre(){ let cx=0,cy=0; for(const p of this.shape){cx+=p.x;cy+=p.y;}
      cx/=this.shape.length; cy/=this.shape.length;
      for(let i=0;i<this.shape.length;i++) this.shape[i]=padd(this.shape[i],pt(-cx,-cy));
      const M=ttrans(-cx,-cy); for(const ch of this.children) ch.T=mul(M,ch.T); }
    flatten(T,out){ for(const ch of this.children) ch.geom.flatten(mul(T,ch.T),out); }
  }

  const H1_hat=new HatTile('H1'),H_hat=new HatTile('H'),T_hat=new HatTile('T'),
        P_hat=new HatTile('P'),F_hat=new HatTile('F');

  const H_init=(function(){
    const o=[pt(0,0),pt(4,0),pt(4.5,hr3),pt(2.5,5*hr3),pt(1.5,5*hr3),pt(-0.5,hr3)];
    const m=new MetaTile(o,2);
    m.addChild(matchTwo(hat_outline[5],hat_outline[7],o[5],o[0]),H_hat);
    m.addChild(matchTwo(hat_outline[9],hat_outline[11],o[1],o[2]),H_hat);
    m.addChild(matchTwo(hat_outline[5],hat_outline[7],o[3],o[4]),H_hat);
    m.addChild(mul(ttrans(2.5,hr3),mul([-0.5,-hr3,0,hr3,-0.5,0],[0.5,0,0,0,-0.5,0])),H1_hat);
    return m;}());
  const T_init=(function(){const o=[pt(0,0),pt(3,0),pt(1.5,3*hr3)];
    const m=new MetaTile(o,2); m.addChild([0.5,0,0.5,0,0.5,hr3],T_hat); return m;}());
  const P_init=(function(){const o=[pt(0,0),pt(4,0),pt(3,2*hr3),pt(-1,2*hr3)];
    const m=new MetaTile(o,2); m.addChild([0.5,0,1.5,0,0.5,hr3],P_hat);
    m.addChild(mul(ttrans(0,2*hr3),mul([0.5,hr3,0,-hr3,0.5,0],[0.5,0,0,0,0.5,0])),P_hat); return m;}());
  const F_init=(function(){const o=[pt(0,0),pt(3,0),pt(3.5,hr3),pt(3,2*hr3),pt(-1,2*hr3)];
    const m=new MetaTile(o,2); m.addChild([0.5,0,1.5,0,0.5,hr3],F_hat);
    m.addChild(mul(ttrans(0,2*hr3),mul([0.5,hr3,0,-hr3,0.5,0],[0.5,0,0,0,0.5,0])),F_hat); return m;}());

  function constructPatch(H,T,P,F){
    const rules=[['H'],[0,0,'P',2],[1,0,'H',2],[2,0,'P',2],[3,0,'H',2],[4,4,'P',2],
      [0,4,'F',3],[2,4,'F',3],[4,1,3,2,'F',0],[8,3,'H',0],[9,2,'P',0],[10,2,'H',0],
      [11,4,'P',2],[12,0,'H',2],[13,0,'F',3],[14,2,'F',1],[15,3,'H',4],[8,2,'F',1],
      [17,3,'H',0],[18,2,'P',0],[19,2,'H',2],[20,4,'F',3],[20,0,'P',2],[22,0,'H',2],
      [23,4,'F',3],[23,0,'F',3],[16,0,'P',2],[9,4,0,2,'T',2],[4,0,'F',3]];
    const ret=new MetaTile([],H.width); const shapes={H,T,P,F};
    for(const r of rules){
      if(r.length==1){ ret.addChild(ident,shapes[r[0]]); }
      else if(r.length==4){
        const poly=ret.children[r[0]].geom.shape, Tt=ret.children[r[0]].T;
        const Pp=transPt(Tt,poly[(r[1]+1)%poly.length]), Qq=transPt(Tt,poly[r[1]]);
        const ns=shapes[r[2]], np=ns.shape;
        ret.addChild(matchTwo(np[r[3]],np[(r[3]+1)%np.length],Pp,Qq),ns);
      } else {
        const cP=ret.children[r[0]],cQ=ret.children[r[2]];
        const Pp=transPt(cQ.T,cQ.geom.shape[r[3]]),Qq=transPt(cP.T,cP.geom.shape[r[1]]);
        const ns=shapes[r[4]],np=ns.shape;
        ret.addChild(matchTwo(np[r[5]],np[(r[5]+1)%np.length],Pp,Qq),ns);
      }
    }
    return ret;
  }
  function constructMetatiles(patch){
    const PI=Math.PI;
    const bps1=patch.evalChild(8,2),bps2=patch.evalChild(21,2);
    const rbps=transPt(rotAbout(bps1,-2*PI/3),bps2);
    const p72=patch.evalChild(7,2),p252=patch.evalChild(25,2);
    const llc=intersect(bps1,rbps,patch.evalChild(6,2),p72);
    let w=psub(patch.evalChild(6,2),llc);
    const H=[llc,bps1]; w=transPt(trot(-PI/3),w); H.push(padd(H[1],w));
    H.push(patch.evalChild(14,2)); w=transPt(trot(-PI/3),w); H.push(psub(H[3],w));
    H.push(patch.evalChild(6,2));
    const nH=new MetaTile(H,patch.width*2);
    for(const c of [0,9,16,27,26,6,1,8,10,15]) nH.addChild(patch.children[c].T,patch.children[c].geom);
    const nP=new MetaTile([p72,padd(p72,psub(bps1,llc)),bps1,llc],patch.width*2);
    for(const c of [7,2,3,4,28]) nP.addChild(patch.children[c].T,patch.children[c].geom);
    const nF=new MetaTile([bps2,patch.evalChild(24,2),patch.evalChild(25,0),p252,
      padd(p252,psub(llc,bps1))],patch.width*2);
    for(const c of [21,20,22,23,24,25]) nF.addChild(patch.children[c].T,patch.children[c].geom);
    const AAA=H[2],BBB=padd(H[1],psub(H[4],H[5])),CCC=transPt(rotAbout(BBB,-PI/3),AAA);
    const nT=new MetaTile([BBB,CCC,AAA],patch.width*2);
    nT.addChild(patch.children[11].T,patch.children[11].geom);
    nH.recentre();nP.recentre();nF.recentre();nT.recentre();
    return [nH,nT,nP,nF];
  }

  // Public: generate a patch inflated `levels` times, return flat hat list.
  // Each hat: {label, verts:[{x,y}*13], cx, cy} with 'H1' = reflected chirality.
  function generate(levels){
    let tiles=[H_init,T_init,P_init,F_init];
    for(let i=0;i<levels;i++){ tiles=constructMetatiles(constructPatch(...tiles)); }
    const flat=[]; tiles[0].flatten(ident,flat);
    return flat.map(o=>{
      const verts=hat_outline.map(p=>transPt(o.T,p));
      let cx=0,cy=0; for(const v of verts){cx+=v.x;cy+=v.y;} cx/=verts.length; cy/=verts.length;
      return {label:o.label, reflected:o.label==='H1', verts, cx, cy};
    });
  }
  return { generate, hat_outline };
})();
if(typeof module!=='undefined') module.exports=HatGen;
