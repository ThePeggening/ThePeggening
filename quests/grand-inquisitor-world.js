// GRAND INQUISITOR CICERO / THE UNWRITTEN VERDICT
// Presentation only. Progression, collision, damage and save state belong to the quest runtime.
// All six chambers have a continuous 64 x 80 floor at origin.y.
const GrandInquisitorWorld = (() => {
  'use strict';
  const TAU = Math.PI * 2;
  const TITLES = [
    ['THE THREE SEALS', 'AUTHORITY MUST ANSWER'],
    ['THE MIRROR ARCHIVE', 'SAME ORIGIN / DIFFERENT HISTORY'],
    ['THE WITNESS PROCESSION', 'KEEP THE TESTIMONY ALIVE'],
    ['THE HOUR WITHOUT MERCY', 'EVEN A CLOCK CAN BE COMPELLED'],
    ['THE FALSE TRIBUNAL', 'THE CROWN DOES NOT OWN THE TRUTH'],
    ['BEYOND THE VERDICT', '414']
  ];

  function create(options = {}) {
    const T = options.THREE || (typeof THREE !== 'undefined' ? THREE : null);
    if (!T) throw new Error('GrandInquisitorWorld requires THREE.');
    const mobile = options.quality !== 'desktop';
    const o = options.origin || { x: 1600, y: 24, z: 1600 };
    const origin = { x: finite(o.x, 1600), y: finite(o.y, 24), z: finite(o.z, 1600) };
    const root = new T.Group();
    root.name = 'grand-inquisitor-cosmic-sanctum';
    root.userData.questWorld = 'grand-inquisitor';
    const rooms = [];
    const geometries = new Set(), materials = new Set(), textures = new Set();
    const geometryCache = new Map();
    const dummy = new T.Object3D(), axisY = new T.Vector3(0, 1, 0);
    const tmpA = new T.Vector3(), tmpB = new T.Vector3();
    let activeStage = -1, elapsed = 0, disposed = false;
    function finite(v, fallback = 0) { return Number.isFinite(Number(v)) ? Number(v) : fallback; }
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
    const V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
    const G = (key, make) => {
      if (!geometryCache.has(key)) { const g = make(); geometries.add(g); geometryCache.set(key, g); }
      return geometryCache.get(key);
    };
    const ownG = g => { geometries.add(g); return g; };
    const ownM = m => { materials.add(m); return m; };
    const ownTexture = t => {
      textures.add(t);
      if (T.SRGBColorSpace !== undefined && 'colorSpace' in t) t.colorSpace = T.SRGBColorSpace;
      else if (T.sRGBEncoding !== undefined) t.encoding = T.sRGBEncoding;
      return t;
    };
    const standard = (color, extra = {}) => ownM(new T.MeshStandardMaterial({ color, roughness: .82, metalness: .16, ...extra }));
    const basic = (color, extra = {}) => ownM(new T.MeshBasicMaterial({ color, ...extra }));
    const boxG = G('box', () => new T.BoxGeometry(1, 1, 1));
    const cylinderG = G('cylinder', () => new T.CylinderGeometry(1, 1, 1, mobile ? 10 : 16));
    const coneG = G('cone', () => new T.ConeGeometry(1, 1, mobile ? 10 : 16));
    const planeG = G('plane', () => new T.PlaneGeometry(1, 1));
    const orbG = G('orb', () => new T.IcosahedronGeometry(1, 1));
    const torusG = G('torus', () => new T.TorusGeometry(1, .023, 5, mobile ? 40 : 64));
    const fatTorusG = G('fat-torus', () => new T.TorusGeometry(1, .065, 6, mobile ? 40 : 64));

    // Seeded, shared maps keep every room deterministic and avoid network assets.
    function random(seed) {
      let s = seed >>> 0;
      return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    }
    function canvasTexture(w, h, paint) {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) throw new Error('Grand Inquisitor requires a 2D canvas texture context.');
      paint(ctx, w, h);
      const t = ownTexture(new T.CanvasTexture(c)); t.anisotropy = mobile ? 2 : 4; return t;
    }
    const stoneMap = canvasTexture(512, 512, (c, w, h) => {
      const r = random(41419); c.fillStyle = '#343845'; c.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 64) for (let x = -128; x < w; x += 128) {
        const xx = x + (Math.floor(y / 64) % 2) * 64, light = 43 + Math.floor(r() * 16);
        c.fillStyle = 'rgb(' + light + ',' + (light + 4) + ',' + (light + 13) + ')'; c.fillRect(xx + 2, y + 2, 124, 60);
        c.strokeStyle = 'rgba(176,187,203,.12)'; c.strokeRect(xx + 3, y + 3, 122, 58);
      }
      for (let n = 0; n < 6500; n++) { const a = r(); c.fillStyle = a > .5 ? 'rgba(190,195,203,.035)' : 'rgba(0,0,0,.08)'; c.fillRect(r() * w, r() * h, 1 + r() * 6, 1 + r() * 2); }
      c.strokeStyle = 'rgba(173,171,160,.12)'; c.lineWidth = .8;
      for (let n = 0; n < 24; n++) { let x = r() * w, y = r() * h; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += r() * 36 - 18; y += r() * 22; c.lineTo(x, y); } c.stroke(); }
    });
    stoneMap.wrapS = stoneMap.wrapT = T.RepeatWrapping; stoneMap.repeat.set(2, 3);
    const floorMap = canvasTexture(1024, 1024, (c, w, h) => {
      const r = random(41004); c.fillStyle = '#343844'; c.fillRect(0, 0, w, h);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        const k = 43 + Math.floor(r() * 10); c.fillStyle = 'rgb(' + k + ',' + (k + 5) + ',' + (k + 14) + ')'; c.fillRect(x * 128 + 2, y * 128 + 2, 124, 124);
        c.strokeStyle = 'rgba(209,211,205,.1)'; c.strokeRect(x * 128 + 4, y * 128 + 4, 120, 120);
      }
      for (let n = 0; n < 9000; n++) { c.fillStyle = n % 2 ? 'rgba(245,233,201,.025)' : 'rgba(0,0,0,.06)'; c.fillRect(r() * w, r() * h, 1 + r() * 7, 1); }
      c.strokeStyle = 'rgba(200,172,112,.32)'; c.lineWidth = 2;
      for (let x = 64; x < w; x += 128) for (let y = 64; y < h; y += 128) {
        c.beginPath(); c.moveTo(x, y - 9); c.lineTo(x + 9, y); c.lineTo(x, y + 9); c.lineTo(x - 9, y); c.closePath(); c.stroke();
      }
    });
    const glowMap = canvasTexture(128, 128, (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.10, 'rgba(255,255,255,.65)'); g.addColorStop(.34, 'rgba(255,255,255,.13)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    });
    const skyMap = canvasTexture(1536, 768, (c, w, h) => {
      const r = random(414414); c.fillStyle = '#050917'; c.fillRect(0, 0, w, h);
      const clouds = [[.27,.36,.30,'70,48,90'],[.58,.36,.28,'36,67,111'],[.81,.50,.23,'112,38,65'],[.44,.63,.16,'118,98,61'],[.31,.42,.14,'66,82,114']];
      for (const [x,y,size,color] of clouds) { const g = c.createRadialGradient(x*w,y*h,0,x*w,y*h,size*w); g.addColorStop(0,'rgba('+color+',.5)'); g.addColorStop(.55,'rgba('+color+',.13)'); g.addColorStop(1,'rgba('+color+',0)'); c.fillStyle=g;c.fillRect(0,0,w,h); }
      c.globalCompositeOperation = 'screen';
      for (let n = 0; n < 90; n++) { const x = r()*w, y = h*(.28+.27*Math.sin(x/w*TAU)+r()*.23), size = 10+r()*85; const g=c.createRadialGradient(x,y,0,x,y,size);g.addColorStop(0,'rgba(131,116,144,.035)');g.addColorStop(1,'rgba(50,61,103,0)');c.fillStyle=g;c.fillRect(x-size,y-size,size*2,size*2); }
      for (let n=0;n<2100;n++){const x=r()*w,y=r()*h,s=r()>.985?1.7:.35+r()*.6;c.fillStyle=n%8?'rgba(232,231,223,'+(.22+r()*.64)+')':'rgba(239,183,115,.8)';c.beginPath();c.arc(x,y,s,0,TAU);c.fill();if(s>1.4){c.fillStyle='rgba(232,231,223,.15)';c.fillRect(x-4,y-.3,8,.6);c.fillRect(x-.3,y-4,.6,8);}}
      c.globalCompositeOperation='source-over';
    });
    const bannerMap = canvasTexture(256, 512, (c,w,h) => {
      const g=c.createLinearGradient(0,0,w,0);g.addColorStop(0,'#340c1d');g.addColorStop(.5,'#942840');g.addColorStop(1,'#430d24');c.fillStyle=g;c.fillRect(0,0,w,h);
      c.strokeStyle='#c3a675';c.lineWidth=4;c.strokeRect(14,10,w-28,h-26);c.lineWidth=1;c.strokeRect(22,16,w-44,h-40);
      c.translate(w/2,h*.38);c.strokeStyle='#e3c788';c.lineWidth=3;c.beginPath();c.arc(0,0,53,0,TAU);c.stroke();
      c.beginPath();c.moveTo(-39,0);c.quadraticCurveTo(0,-29,39,0);c.quadraticCurveTo(0,29,-39,0);c.stroke();c.beginPath();c.arc(0,0,11,0,TAU);c.stroke();
      for(let n=0;n<12;n++){const a=n/12*TAU;c.beginPath();c.moveTo(Math.cos(a)*59,Math.sin(a)*59);c.lineTo(Math.cos(a)*69,Math.sin(a)*69);c.stroke();}
      c.beginPath();c.moveTo(0,73);c.lineTo(0,180);c.moveTo(-18,105);c.lineTo(18,105);c.stroke();
    });
    const glassMap=canvasTexture(256,512,(c,w,h)=>{
      const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#7190ba');g.addColorStop(.46,'#38355d');g.addColorStop(1,'#77253b');c.fillStyle=g;c.fillRect(0,0,w,h);
      c.strokeStyle='rgba(229,195,128,.72)';c.lineWidth=4;
      for(let n=0;n<7;n++){c.beginPath();c.moveTo(0,n*85-90);c.lineTo(w,n*85+150);c.stroke();c.beginPath();c.moveTo(w,n*85-90);c.lineTo(0,n*85+150);c.stroke();}
      c.fillStyle='rgba(255,228,171,.6)';c.beginPath();c.arc(w/2,h*.32,48,0,TAU);c.fill();c.strokeStyle='#c9a96d';c.lineWidth=7;c.stroke();
      c.strokeStyle='#182033';c.lineWidth=6;c.beginPath();c.moveTo(w/2,0);c.lineTo(w/2,h);c.moveTo(0,h*.66);c.lineTo(w,h*.66);c.stroke();
    });
    const M={
      stone:standard('#abb2c3',{map:stoneMap,roughness:.93}),
      dark:standard('#171f2d',{roughness:.94}),
      edge:standard('#5c6475',{roughness:.78,metalness:.30}),
      floor:standard('#a6b1c6',{map:floorMap,roughness:.88,metalness:.18}),
      gold:standard('#bca879',{roughness:.60,metalness:.65,emissive:'#654824',emissiveIntensity:.12}),
      pale:standard('#ddd5bc',{roughness:.66,metalness:.32}),
      red:standard('#731d35',{roughness:.86,metalness:.05}),
      cloth:standard('#ba7583',{map:bannerMap,roughness:1,metalness:0,side:T.DoubleSide}),
      goldHot:basic('#ffdfa1',{toneMapped:false}),
      crimsonHot:basic('#e65270',{toneMapped:false}),
      whiteHot:basic('#fff0cd',{toneMapped:false}),
      blueHot:basic('#a6cce6',{toneMapped:false}),
      dimGold:basic('#776646'),
      contact:basic('#000000',{map:glowMap,transparent:true,opacity:.66,side:T.DoubleSide,depthWrite:false}),
      glass:basic('#d1dbef',{map:glassMap,side:T.DoubleSide,transparent:true,opacity:.64,depthWrite:false}),
      beam:basic('#c8d9ff',{transparent:true,opacity:.035,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}),
      goldBeam:basic('#ffd78a',{transparent:true,opacity:.075,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}),
      redBeam:basic('#d9466b',{transparent:true,opacity:.07,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false})
    };
    const haloMaterials={
      gold:ownM(new T.SpriteMaterial({map:glowMap,color:'#f2c47a',transparent:true,opacity:.42,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false})),
      white:ownM(new T.SpriteMaterial({map:glowMap,color:'#d7e4ff',transparent:true,opacity:.45,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false})),
      red:ownM(new T.SpriteMaterial({map:glowMap,color:'#d23b60',transparent:true,opacity:.37,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}))
    };
    function mesh(parent,g,m,x=0,y=0,z=0,sx=1,sy=sx,sz=sx){const a=new T.Mesh(g,m);a.position.set(x,y,z);a.scale.set(sx,sy,sz);parent.add(a);return a;}
    function box(parent,x,y,z,w,h,d,m=M.stone,ry=0){const a=mesh(parent,boxG,m,x,y,z,w,h,d);a.rotation.y=ry;return a;}
    function cylinder(parent,x,y,z,r,h,m=M.gold){return mesh(parent,cylinderG,m,x,y,z,r,h,r);}
    function ring(parent,x,y,z,r,m=M.gold,thick=false){return mesh(parent,thick?fatTorusG:torusG,m,x,y,z,r,r,r);}
    function group(parent,x=0,y=0,z=0){const a=new T.Group();a.position.set(x,y,z);parent.add(a);return a;}
    function halo(parent,x,y,z,size,color='gold'){const a=new T.Sprite(haloMaterials[color]);a.position.set(x,y,z);a.scale.set(size,size,1);parent.add(a);return a;}
    function instanced(parent,g,m,list){
      if(!list.length)return null;
      const a=new T.InstancedMesh(g,m,list.length);
      for(let i=0;i<list.length;i++){const p=list[i];dummy.position.set(p[0],p[1],p[2]);dummy.rotation.set(p[6]||0,p[7]||0,p[8]||0);dummy.scale.set(p[3]===undefined?1:p[3],p[4]===undefined?1:p[4],p[5]===undefined?1:p[5]);dummy.updateMatrix();a.setMatrixAt(i,dummy.matrix);}
      a.instanceMatrix.needsUpdate=true;parent.add(a);return a;
    }
    function lines(parent,points,color='#ddbf85',opacity=.65){
      const g=ownG(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(points,3));
      const a=new T.LineSegments(g,ownM(new T.LineBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity>=1})));parent.add(a);return a;
    }
    function beamBetween(parent,a,b,width=.07,mat=M.goldHot){
      const len=tmpA.copy(b).sub(a).length();const beam=mesh(parent,cylinderG,mat,(a.x+b.x)*.5,(a.y+b.y)*.5,(a.z+b.z)*.5,width,len,width);beam.quaternion.setFromUnitVectors(axisY,tmpA.normalize());return beam;
    }
    const textCache=new Map();
    function label(parent,text,x,y,z,w=5,h=.9,subtitle='',color='#ead8ae'){
      const key=text+'|'+subtitle+'|'+color;
      let mat=textCache.get(key);
      if(!mat){const t=canvasTexture(768,subtitle?192:128,(c,cw,ch)=>{
        c.fillStyle='rgba(11,17,29,.97)';c.fillRect(0,0,cw,ch);
        c.strokeStyle='rgba(194,167,115,.65)';c.lineWidth=2;c.strokeRect(6,6,cw-12,ch-12);
        c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font='600 '+(subtitle?42:48)+'px Georgia, serif';
        const max=cw-42,base=subtitle?42:48;if(c.measureText(text).width>max)c.font='600 '+Math.max(18,Math.floor(base*max/c.measureText(text).width))+'px Georgia, serif';
        c.fillText(text,cw/2,subtitle?ch*.37:ch/2);
        if(subtitle){c.fillStyle='#aeb9cb';c.font='24px Arial, sans-serif';if(c.measureText(subtitle).width>max)c.font=Math.max(16,Math.floor(24*max/c.measureText(subtitle).width))+'px Arial, sans-serif';c.fillText(subtitle,cw/2,ch*.76);}
      });mat=basic('#ffffff',{map:t,side:T.DoubleSide,toneMapped:false});textCache.set(key,mat);}
      return mesh(parent,planeG,mat,x,y,z,w,h,1);
    }
    function archGeometry(width,spring,height,tube){
      return G('arch:'+width+':'+spring+':'+height+':'+tube,()=>{
        const pts=[],n=14;
        for(let i=0;i<=n;i++){const t=i/n,u=1-t;pts.push(V(-width*.5*u*u-width*.47*2*u*t,spring*u*u+(height-2)*2*u*t+height*t*t,0));}
        for(let i=1;i<=n;i++){const t=i/n,u=1-t;pts.push(V(width*.47*2*u*t+width*.5*t*t,height*u*u+(height-2)*2*u*t+spring*t*t,0));}
        return new T.TubeGeometry(new T.CatmullRomCurve3(pts),mobile?32:48,tube,5,false);
      });
    }
    function makeWindowGeometry(){
      return G('pointed-window',()=>{const s=new T.Shape();s.moveTo(-2.8,0);s.lineTo(-2.8,10.5);s.quadraticCurveTo(-2.8,14,0,17);s.quadraticCurveTo(2.8,14,2.8,10.5);s.lineTo(2.8,0);s.closePath();const g=new T.ShapeGeometry(s,mobile?8:12);const uv=g.getAttribute('uv'),p=g.getAttribute('position');for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+2.8)/5.6,p.getY(i)/17);return g;});
    }
    const flagG=G('folded-banner',()=>{
      const g=new T.PlaneGeometry(4.2,10,8,12),p=g.getAttribute('position');
      for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,Math.sin(x*3.3)*.18+Math.sin(y*.7+x)*.12);if(y<-4.95)p.setY(i,y+(.65-Math.abs(x)*.25));}
      g.computeVertexNormals();return g;
    });
    function makeRoom(index){
      const rr=group(root,origin.x,origin.y,origin.z-index*160);rr.name='inquisitor-chamber-'+index;
      const room={root:rr,index,targets:[],visual:{flags:[],stations:[],clockRings:[],contactPoints:[]}};rooms.push(room);
      // The foundation is intentionally unbroken, including beneath every spectacle.
      room.foundation=box(rr,0,-.70,0,64,1.3,80,M.stone);room.foundation.name='continuous-floor-foundation';
      room.floor=box(rr,0,-.025,0,64,.05,80,M.floor);room.floor.name='continuous-floor-surface';
      box(rr,0,.015,1,6,.025,70,M.red);
      const floorTrim=[];for(const x of [-3.05,3.05,-23.5,23.5])floorTrim.push([x,.045,0,.075,.025,76]);
      for(const z of [-37,-23,-9,5,19,33])floorTrim.push([0,.05,z,47,.022,.055]);
      instanced(rr,boxG,M.gold,floorTrim);
      for(const radius of [10.8,11.1,17.5]){const a=ring(rr,0,.07,-7,radius,M.dimGold);a.rotation.x=-Math.PI/2;}
      const floorRunes=[];for(let i=0;i<36;i++){const a=i/36*TAU;floorRunes.push([Math.sin(a)*16.8,.08,-7+Math.cos(a)*16.8,.1,.025,.46,0,a,0]);}instanced(rr,boxG,M.gold,floorRunes);
      const walls=[],moulding=[],shafts=[],slender=[],collars=[],bases=[],spires=[],glass=[];
      for(const side of [-1,1]){
        walls.push([side*31.35,1.5,0,1.3,3,80]);moulding.push([side*30.55,.22,0,1.6,.42,80],[side*30.65,3.08,0,1.25,.22,80]);
        for(let n=0;n<5;n++){
          const z=-28+n*14,x=side*26;
          room.visual.contactPoints.push([x,.031,z,6.0,6.0,1,-Math.PI/2,0,0]);
          shafts.push([x,8.2,z,.84,15.2,.84]);
          for(const dx of [-.77,.77])for(const dz of [-.61,.61])slender.push([x+dx,8.2,z+dz,.18,15.0,.18]);
          bases.push([x,.21,z,2.9,.4,2.9],[x,.55,z,2.4,.26,2.4],[x,.91,z,1.95,.46,1.95],[x,15.7,z,2.0,.5,2.0],[x,16.06,z,2.8,.24,2.8]);
          for(const y of [1.4,6.2,14.9])collars.push([x,y,z,1.03,.12,1.03]);
          glass.push([side*30.61,4.2,z,1,1,1,0,-side*Math.PI/2,0]);
          walls.push([side*31.0,13.4,z-4.2,1.4,19,1.4],[side*31.0,13.4,z+4.2,1.4,19,1.4]);
          spires.push([side*37,13,z,1.35,9,1.35],[side*44,18,z-3,1.8,15,1.8]);
          walls.push([side*37,5,z,3.3,12,3.3],[side*44,6,z-3,4.2,14,4.2]);
        }
      }
      instanced(rr,boxG,M.stone,walls);instanced(rr,boxG,M.edge,moulding);instanced(rr,cylinderG,M.stone,shafts);instanced(rr,cylinderG,M.edge,slender);
      instanced(rr,boxG,M.edge,bases);instanced(rr,cylinderG,M.gold,collars);instanced(rr,coneG,M.dark,spires);instanced(rr,makeWindowGeometry(),M.glass,glass);
      const ribs=[],goldRibs=[],sideRibs=[];
      for(let n=0;n<5;n++){ribs.push([0,0,-28+n*14,1,1,1]);goldRibs.push([0,-.08,-27.6+n*14,1,1,1]);}
      for(const side of [-1,1])for(let n=0;n<4;n++)sideRibs.push([side*26,0,-21+n*14,1,1,1,0,Math.PI/2,0]);
      instanced(rr,archGeometry(52,16,31,.36),M.edge,ribs);instanced(rr,archGeometry(52,16,30.9,.08),M.gold,goldRibs);instanced(rr,archGeometry(14,16,23,.25),M.edge,sideRibs);
      const windowFrames=[];for(const side of [-1,1])for(let n=0;n<5;n++)windowFrames.push([side*30.3,4.2,-28+n*14,1,1,1,0,-side*Math.PI/2,0]);
      instanced(rr,archGeometry(5.6,10.5,17,.10),M.gold,windowFrames);
      for(const side of [-1,1])for(const z of [-19,16]){const f=mesh(rr,flagG,M.cloth,side*22.65,16.8,z);f.rotation.y=side*.12;room.visual.flags.push(f);box(rr,side*22.65,22,z,4.7,.10,.10,M.gold);}
      const sky=mesh(rr,G('sky',()=>new T.SphereGeometry(126,mobile?32:48,mobile?18:24)),basic('#ffffff',{map:skyMap,side:T.BackSide,depthWrite:false,fog:false}),0,12,-9);sky.renderOrder=-10;
      // Lighting is deliberately broad enough to read a dark costume on a phone.
      const fill=new T.PointLight('#d0def4',1.8,88,1);fill.position.set(0,13,15);rr.add(fill);
      const back=new T.PointLight(index===4?'#ffcf9b':'#f0d4ae',1.5,70,1);back.position.set(0,18,-22);rr.add(back);
      room.visual.fill=fill;room.visual.backLight=back;
      for(const side of [-1,1]){const b=mesh(rr,coneG,M.beam,side*14,15,-9,5.8,28,5.8);b.rotation.z=side*.18;}
      const r=random(414+index),count=mobile?150:310,p=new Float32Array(count*3);
      for(let n=0;n<count;n++){p[n*3]=r()*58-29;p[n*3+1]=2+r()*32;p[n*3+2]=r()*76-38;}
      const pg=ownG(new T.BufferGeometry());pg.setAttribute('position',new T.BufferAttribute(p,3));
      const pm=ownM(new T.PointsMaterial({map:glowMap,color:'#e4d8b5',size:mobile?.12:.095,transparent:true,opacity:.6,depthWrite:false,blending:T.AdditiveBlending,sizeAttenuation:true}));
      const dust=new T.Points(pg,pm);rr.add(dust);room.visual.dust=dust;
      room.visual.title=label(rr,TITLES[index][0],0,26.8,-32.8,26,3.05,TITLES[index][1]);
      return room;
    }
    const ambient=new T.HemisphereLight('#c4d4ed','#63505a',.90);root.add(ambient);
    const key=new T.DirectionalLight('#ffedce',1.22);key.position.set(origin.x+16,origin.y+34,origin.z+19);key.target.position.set(origin.x,origin.y+4,origin.z-8);root.add(key);root.add(key.target);

    function station(room,index,kind,x,y,z,title,sub=''){
      const g=group(room.root,x,0,z);g.name='inquisitor-'+kind+'-'+index;
      room.visual.contactPoints.push([x,.031,z,4.8,4.8,1,-Math.PI/2,0,0]);
      cylinder(g,0,.15,0,1.8,.28,M.edge);cylinder(g,0,.35,0,1.48,.16,M.gold);cylinder(g,0,.72,0,.88,.63,M.stone);
      const head=cylinder(g,0,1.13,0,1.13,.19,M.gold);head.rotation.y=Math.PI/8;
      const glow=standard('#cdb581',{emissive:'#ffbc74',emissiveIntensity:1.12,roughness:.5,metalness:.25});
      const receiver=mesh(g,orbG,glow,0,y,0,.44);receiver.rotation.z=Math.PI/4;
      const orbit=ring(g,0,y,0,.87,M.goldHot);orbit.rotation.x=.3;
      const floor=ring(g,0,.09,0,2.08,M.goldHot);floor.rotation.x=-Math.PI/2;
      const haloMesh=halo(g,0,y,0,3.4,'gold');
      label(g,title,0,3.0,-.38,4.9,.88,sub);
      const item={id:'grand-inquisitor-'+kind+'-'+index,kind,pos:V(origin.x+x,origin.y+y,origin.z-room.index*160+z),mesh:receiver};
      room.targets.push(item);
      const visual={root:g,mesh:receiver,material:glow,orbit,floor,halo:haloMesh,index,done:false,label:g.children[g.children.length-1]};room.visual.stations.push(visual);return visual;
    }
    function updateStation(s,done,time){
      if(s.done!==done){s.done=done;s.material.color.set(done?'#ece5c5':'#cdb581');s.material.emissive.set(done?'#bce6e3':'#ffbc74');s.material.emissiveIntensity=done?.8:1.12;s.floor.material=done?M.blueHot:M.goldHot;s.orbit.material=done?M.blueHot:M.goldHot;}
      s.mesh.rotation.y=time*.48+s.index;s.orbit.rotation.z=time*.36+s.index;s.halo.scale.setScalar(done?2.7:3.25+Math.sin(time*1.5+s.index)*.16);
    }
    function door(room,z,width,height){
      const assembly=group(room.root,0,0,z),left=group(assembly,-width/4,0,0),right=group(assembly,width/4,0,0);
      // Solid wing walls prevent seeing the final revelation around closed doors.
      const wing=(64-width)/2,wingTrim=[];
      for(const side of [-1,1]){
        box(assembly,side*(width/2+wing/2),height/2,0,wing,height,2.0,M.stone);
        for(const inset of [2.0,wing-1.7])wingTrim.push([side*(width/2+inset),height/2,1.08,.16,height-2,.16]);
        wingTrim.push([side*(width/2+wing/2),2.1,1.09,wing-.7,.12,.16]);
      }
      instanced(assembly,boxG,M.gold,wingTrim);
      for(const slab of [left,right]){
        box(slab,0,height/2,0,width/2-.1,height,1.2,M.dark);box(slab,0,height/2,.67,width/2-1.0,height-1.3,.12,M.stone);
        const trim=[],studs=[];for(const x of [-width/4+.43,width/4-.43])trim.push([x,height/2,.8,.12,height-.45,.13]);
        for(const y of [1,height-1,height*.38,height*.68])trim.push([0,y,.8,width/2-.68,.09,.13]);
        for(const x of [-width/4+.9,width/4-.9])for(let n=0;n<8;n++)studs.push([x,2+n*(height-4)/7,.87,.13,.13,.13]);
        instanced(slab,boxG,M.gold,trim);instanced(slab,orbG,M.gold,studs);
        const sun=ring(slab,0,height*.61,.86,width*.135,M.gold);sun.scale.y*=1.4;
        for(let n=0;n<2;n++)box(slab,0,height*.26+n*height*.46,.8,.16,height*.30,.14,M.gold);
      }
      const frame=group(assembly);box(frame,-width/2-.6,height*.45,0,1.3,height*.9,2.1,M.edge);box(frame,width/2+.6,height*.45,0,1.3,height*.9,2.1,M.edge);
      mesh(frame,archGeometry(width+1.2,height*.78,height+3,.42),M.edge,0,0,0);mesh(frame,archGeometry(width,height*.79,height+2.6,.10),M.gold,0,0,.65);
      return {root:assembly,left,right,width,height,open:0};
    }

    // I / THE THREE SEALS. A twenty-four metre gate and a suspended broken aureole.
    {
      const room=makeRoom(0),v=room.visual;
      [[-15,1.8,0],[15,1.8,-10],[0,1.8,-27]].forEach((p,i)=>station(room,i,'seal',...p,'SEAL '+['I','II','III'][i],'BREAK THE FALSE AUTHORITY'));
      v.gate=door(room,-30,24,23);
      const iris=group(room.root,0,12.5,-28.5);v.iris=iris;
      ring(iris,0,0,0,6.8,M.gold,true);ring(iris,0,0,.05,5.9,M.crimsonHot);ring(iris,0,0,.1,4.7,M.gold);
      const teeth=[];for(let i=0;i<24;i++){const a=i/24*TAU;teeth.push([Math.sin(a)*6.8,Math.cos(a)*6.8,0,.10,.72,.16,0,0,-a]);}instanced(iris,boxG,M.gold,teeth);
      v.sealLights=[];for(let i=0;i<3;i++){const a=-Math.PI/2+i*TAU/3;const b=mesh(iris,orbG,M.crimsonHot,Math.cos(a)*3.8,Math.sin(a)*3.8,.4,.54);v.sealLights.push(b);}
      halo(iris,0,0,-.05,16,'red');
      const chain=[];for(let i=0;i<27;i++){const t=i/26;chain.push([-11+t*22,3+t*18,-28,.50,.75,.50,0,(i%2)*Math.PI/2,-.83]);chain.push([-11+t*22,21-t*18,-28,.50,.75,.50,0,(i%2)*Math.PI/2,.83]);}
      v.chains=instanced(room.root,fatTorusG,M.gold,chain);
      const fragments=[];for(let i=0;i<14;i++){const a=i/14*TAU;fragments.push([Math.sin(a)*15,19+Math.cos(a)*9,-20,.45,1.4,.6,0,0,-a]);}v.fragments=instanced(room.root,boxG,M.edge,fragments);
    }
    // II / THE MIRROR ARCHIVE. Four physical positions, three fixed matching clues.
    {
      const room=makeRoom(1),v=room.visual;v.mirrors=[];v.discs=[];v.mirrorLinks=[];
      const runeMap=canvasTexture(512,128,(c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#f1d89a';c.font='bold 54px Georgia';c.textAlign='center';c.textBaseline='middle';['0','I','II','III'].forEach((s,i)=>c.fillText(s,64+i*128,64));});
      const runeMat=basic('#ffffff',{map:runeMap,transparent:true,side:T.DoubleSide,depthWrite:false,toneMapped:false});
      const runeG=G('four-rune-wheel',()=>{
        const pos=[],uv=[],idx=[];for(let i=0;i<4;i++){const a=i*Math.PI/2,x=Math.sin(a)*1.72,y=Math.cos(a)*1.72,k=i*4;pos.push(x-.3,y-.22,.07,x+.3,y-.22,.07,x+.3,y+.22,.07,x-.3,y+.22,.07);uv.push(i/4,0,(i+1)/4,0,(i+1)/4,1,i/4,1);idx.push(k,k+1,k+2,k,k+2,k+3);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
      });
      const positions=[[-17,1.5,8],[17,1.5,-5],[0,1.5,-24]],correct=[3,1,2];
      for(let i=0;i<3;i++){
        const p=positions[i],s=station(room,i,'mirror',...p,'MIRROR '+['I','II','III'][i],'MATCH '+['0','I','II','III'][correct[i]]);s.label.position.y=5.6;
        const fixed=group(s.root,0,3.05,-.38),rotor=group(fixed);ring(rotor,0,0,0,2.1,M.gold,true);ring(rotor,0,0,.05,1.37,M.dimGold);mesh(rotor,runeG,runeMat);
        box(rotor,0,.52,.10,.06,1.08,.08,M.goldHot);box(rotor,.52,0,.10,1.08,.06,.08,M.goldHot);
        mesh(fixed,coneG,M.whiteHot,0,2.44,.05,.16,.35,.12).rotation.z=Math.PI;
        const inner=ring(fixed,0,0,.11,.88,M.crimsonHot);v.mirrors.push({root:rotor,inner,angle:0,correct:correct[i]});
        const path=lines(room.root,[p[0],.13,p[2],p[0],.13,-18,p[0],.13,-18,i===0?-11:11,.13,-18],'#d8ba78',.72);v.mirrorLinks.push(path);
      }
      for(const side of [-1,1]){
        const disc=group(room.root,side*11.0,15,-20.5);disc.rotation.y=-side*.13;
        const backing=cylinder(disc,0,0,-.15,10.1,.28,M.dark);backing.rotation.x=Math.PI/2;
        ring(disc,0,0,0,10.1,M.gold,true);ring(disc,0,0,.05,9.4,side<0?M.blueHot:M.crimsonHot);ring(disc,0,0,.05,7.7,M.gold);ring(disc,0,0,.05,4.7,M.gold);
        const dial=group(disc,0,0,.12),marks=[];for(let n=0;n<64;n++){const a=n/64*TAU;marks.push([Math.sin(a)*8.9,Math.cos(a)*8.9,0,n%4===0?.10:.055,n%4===0?.75:.30,.07,0,0,-a]);}instanced(dial,boxG,M.gold,marks);
        const spiral=[];for(let n=0;n<180;n++){const a=n/180*TAU*2.8,b=(n+1)/180*TAU*2.8,r=1.6+n/180*5.3,s=1.6+(n+1)/180*5.3;spiral.push(Math.cos(a)*r,Math.sin(a)*r,.14,Math.cos(b)*s,Math.sin(b)*s,.14);}lines(dial,spiral,side<0?'#bad8df':'#d57789',.8);
        const hub=mesh(dial,orbG,side<0?M.blueHot:M.crimsonHot,0,0,.1,1.15);halo(disc,0,0,.2,21,side<0?'white':'red');v.discs.push({root:disc,dial,hub});
        label(room.root,side<0?'ETHEREUM':'PULSECHAIN',side*11,3.6,-18.9,8,1.05);
      }
      const pdai=group(room.root,0,7.4,-17.9);v.pdaiRecord=pdai;
      ring(pdai,0,0,-.18,2.5,M.gold);halo(pdai,0,0,-.25,7.7,'gold');
      label(pdai,'pDAI',0,0,.1,6.3,1.75,'ORIGIN RECORD');
    }
    // III / THE WITNESS PROCESSION. The witness is a physical, moving constellation.
    {
      const room=makeRoom(2),v=room.visual;v.guards=[];
      [[-16,1.5,10],[16,1.5,-6],[-8,1.5,-25]].forEach((p,i)=>station(room,i,'relay',...p,'RELAY '+['I','II','III'][i],'PROTECT THE WITNESS'));
      const stacks=[],spines=[],seals=[],r=random(81414);
      for(const side of [-1,1])for(let n=0;n<6;n++){
        const x=side*28,z=-32+n*12;stacks.push([x,4.5,z,2.8,9,5.2]);
        for(let shelf=0;shelf<4;shelf++)for(let book=0;book<9;book++){const zz=z-2+book*.49;spines.push([x-side*1.47,1+shelf*2.05,zz,.18,1.1+r()*.47,.31]);if(book%3===0)seals.push([x-side*1.59,1.2+shelf*2.05,zz,.04,.14,.20]);}
      }
      instanced(room.root,boxG,M.dark,stacks);instanced(room.root,boxG,M.red,spines);instanced(room.root,boxG,M.gold,seals);
      for(let i=0;i<3;i++){
        const p=room.targets[i].pos,x=p.x-origin.x+(i===1?-5:5),z=p.z-(origin.z-320)-3;
        const g=group(room.root,x,2.5,z),body=mesh(g,coneG,M.dark,0,-.8,0,.9,3.4,.74);body.rotation.z=Math.PI;
        mesh(g,orbG,M.edge,0,1.2,0,.43);box(g,0,1.21,.41,.65,.07,.05,M.crimsonHot);
        const crown=ring(g,0,1.59,0,.67,M.gold);crown.rotation.x=Math.PI/2;
        box(g,1.0,-.1,0,.10,3.7,.10,M.gold);mesh(g,orbG,M.crimsonHot,1.0,1.9,0,.20);halo(g,0,.7,0,4,'red');
        v.guards.push({root:g,baseY:2.5,index:i});
      }
      v.witness=group(room.root,0,4.6,24);v.witness.name='living-witness';
      mesh(v.witness,orbG,M.whiteHot,0,0,0,.49);halo(v.witness,0,0,0,7,'white');
      v.witnessRings=[];for(let n=0;n<3;n++){const q=ring(v.witness,0,0,0,1.05+n*.34,n===1?M.blueHot:M.goldHot);q.rotation.set(n*.9,n*.6,0);v.witnessRings.push(q);}
      const trail=new Float32Array(30*3);for(let n=0;n<30;n++){trail[n*3]=0;trail[n*3+1]=4.6;trail[n*3+2]=24;}
      const trailG=ownG(new T.BufferGeometry());trailG.setAttribute('position',new T.BufferAttribute(trail,3));
      const trailM=ownM(new T.PointsMaterial({map:glowMap,color:'#d3e9f8',size:.28,transparent:true,opacity:.45,blending:T.AdditiveBlending,depthWrite:false}));
      v.witnessTrail=new T.Points(trailG,trailM);v.witnessTrail.frustumCulled=false;room.root.add(v.witnessTrail);v.trail=trail;
      const track=[0,.11,26,-16,.11,10,-16,.11,10,16,.11,-6,16,.11,-6,-8,.11,-25];v.witnessPath=lines(room.root,track,'#b9d5e2',.55);
      const archive=group(room.root,0,16,-32);ring(archive,0,0,0,8.5,M.gold,true);ring(archive,0,0,0,7.5,M.blueHot);halo(archive,0,0,-.2,20,'white');label(archive,'pDAI',0,0,.2,9,1.9,'SURVIVING RECORD');v.archive=archive;
    }
    // IV / THE HOUR WITHOUT MERCY. Exact red/gold collision bands; outer lanes stay safe.
    {
      const room=makeRoom(3),v=room.visual;
      [[-13,1.5,12],[13,1.5,-6],[-13,1.5,-24]].forEach((p,i)=>station(room,i,'clock',...p,'CLOCK '+['I','II','III'][i],'STRIKE ON GOLD'));
      v.clockBands=[];
      for(let i=0;i<3;i++){
        const g=group(room.root,0,12,[10,-8,-26][i]),outer=ring(g,0,0,0,11.3,M.gold,true);ring(g,0,0,.06,10.4,M.crimsonHot);ring(g,0,0,0,9.2,M.gold);
        const marks=[];for(let n=0;n<60;n++){const a=n/60*TAU;marks.push([Math.sin(a)*10.0,Math.cos(a)*10.0,.04,n%5===0?.17:.065,n%5===0?.76:.29,.12,0,0,-a]);}instanced(g,boxG,M.pale,marks);
        const gear=group(g),teeth=[];for(let n=0;n<36;n++){const a=n/36*TAU;teeth.push([Math.sin(a)*11.6,Math.cos(a)*11.6,0,.36,.59,.36,0,0,-a]);}instanced(gear,boxG,M.gold,teeth);
        const hands=group(g,0,0,.22);box(hands,0,4.1,0,.12,8.2,.16,M.goldHot);box(hands,2.6,0,.1,5.2,.23,.16,M.pale);mesh(hands,orbG,M.goldHot,0,0,.12,.43);
        v.clockRings.push({root:g,gear,hands,outer,angle:0,open:0,index:i});
        const floorBand=group(room.root,0,.115,[10,-8,-26][i]);
        const floorMaterial=basic('#dc5373',{transparent:true,opacity:.24,side:T.DoubleSide,depthWrite:false,toneMapped:false});
        const face=mesh(floorBand,planeG,floorMaterial,0,0,0,20,2.3,1);face.rotation.x=-Math.PI/2;
        const edge=lines(floorBand,[-10,.012,-1.15,10,.012,-1.15,-10,.012,1.15,10,.012,1.15,-10,.012,-1.15,-10,.012,1.15,10,.012,-1.15,10,.012,1.15],'#f2aa97',.92);
        const bandMarks=[];for(let n=0;n<10;n++)bandMarks.push([-9+n*2,.02,0,.14,.02,1.35,0,-.38,0]);
        const stripes=instanced(floorBand,boxG,M.crimsonHot,bandMarks);v.clockBands.push({root:floorBand,face,material:floorMaterial,edge,stripes});
      }
      label(room.root,'THE MECHANISM CAN BE STOPPED',0,3.8,-34.5,19,1.2);
    }
    // V / THE FALSE TRIBUNAL. Three breakable crown bands, with a reachable strike receiver.
    {
      const room=makeRoom(4),v=room.visual;
      [[-18,1.5,10],[18,1.5,0],[0,1.5,-23]].forEach((p,i)=>station(room,i,'tribunal',...p,'TESTIMONY '+['I','II','III'][i],'EXPOSE THE CROWN'));
      const coreStation=station(room,3,'core',0,1.8,-7,'THE FALSE CROWN','STRIKE WHEN EXPOSED');coreStation.label.position.set(0,3.6,1.8);v.coreStation=coreStation;
      const crown=group(room.root,0,11,-10);v.crown=crown;v.crownBands=[];v.breakAges=[-1,-1,-1];v.previousBossPhase=0;v.coreCollapse=0;
      v.core=mesh(crown,G('boss-core',()=>new T.IcosahedronGeometry(2.45,1)),standard('#382e43',{emissive:'#d44468',emissiveIntensity:.3,metalness:.55,roughness:.38}),0,0,0);
      const edges=ownG(new T.EdgesGeometry(v.core.geometry));v.coreCracks=new T.LineSegments(edges,ownM(new T.LineBasicMaterial({color:'#e85d7e',transparent:true,opacity:.8})));crown.add(v.coreCracks);
      v.coreHalo=halo(crown,0,0,0,25,'red');
      v.collapseRing=ring(crown,0,0,0,1,M.whiteHot);v.collapseRing.visible=false;
      for(let i=0;i<3;i++){
        const band=group(crown);band.rotation.set(.18+i*.46,0,-.22+i*.32);
        ring(band,0,0,0,6.3+i*1.55,M.gold,true);ring(band,0,0,.04,6.03+i*1.55,M.crimsonHot);
        const points=[],stones=[];for(let n=0;n<16;n++){const a=n/16*TAU,r=6.3+i*1.55;points.push([Math.sin(a)*(r+.75),Math.cos(a)*(r+.75),0,.26,1.5,.36,0,0,-a]);stones.push([Math.sin(a)*r,Math.cos(a)*r,.23,.22,.35,.18,0,0,-a]);}
        instanced(band,coneG,M.gold,points);instanced(band,orbG,M.crimsonHot,stones);v.crownBands.push(band);
      }
      v.strikeBeam=beamBetween(room.root,V(0,2.2,-7),V(0,10,-10),.18,M.goldBeam);v.strikeBeam.visible=false;
      const shards=new T.InstancedMesh(boxG,M.gold,36);shards.frustumCulled=false;
      if(T.DynamicDrawUsage!==undefined)shards.instanceMatrix.setUsage(T.DynamicDrawUsage);
      dummy.position.set(0,0,0);dummy.rotation.set(0,0,0);dummy.scale.set(0,0,0);dummy.updateMatrix();for(let i=0;i<36;i++)shards.setMatrixAt(i,dummy.matrix);shards.instanceMatrix.needsUpdate=true;crown.add(shards);v.shards=shards;
      const seats=[],seatTrim=[];for(const side of [-1,1])for(const z of [-29,-13,3,19]){
        seats.push([side*26,1.5,z,4,3,4],[side*27,7,z,1.2,12,4],[side*25,3.4,z-1.7,3,.5,.6],[side*25,3.4,z+1.7,3,.5,.6]);
        seatTrim.push([side*26.25,8.5,z-1.2,.12,8,.12],[side*26.25,8.5,z+1.2,.12,8,.12]);
      }instanced(room.root,boxG,M.dark,seats);instanced(room.root,boxG,M.gold,seatTrim);
      const seals=[];for(let i=0;i<3;i++){const a=i/3*TAU;seals.push([Math.sin(a)*20.7,.12,-9+Math.cos(a)*20.7,1.2,.07,1.2,0,a,0]);}instanced(room.root,orbG,M.goldHot,seals);
      v.arenaHalo=ring(room.root,0,.12,-9,21.4,M.crimsonHot);v.arenaHalo.rotation.x=-Math.PI/2;
      v.judgementBand=group(room.root,0,.13,8);
      v.judgementMaterial=basic('#eec18a',{transparent:true,opacity:.15,side:T.DoubleSide,depthWrite:false,toneMapped:false});
      const judgementFace=mesh(v.judgementBand,planeG,v.judgementMaterial,0,0,0,48,2.3,1);judgementFace.rotation.x=-Math.PI/2;
      v.judgementEdge=lines(v.judgementBand,[-24,.014,-1.15,24,.014,-1.15,-24,.014,1.15,24,.014,1.15,-24,.014,-1.15,-24,.014,1.15,24,.014,-1.15,24,.014,1.15],'#e5bc85',.80);
      const judgementMarks=[];for(let i=0;i<24;i++)judgementMarks.push([-23+i*2,.028,0,.14,.025,1.4,0,.40,0]);
      v.judgementMarks=instanced(v.judgementBand,boxG,M.goldHot,judgementMarks);
    }
    // VI / BEYOND THE VERDICT. The doors reveal a cathedral-sized chain constellation.
    {
      const room=makeRoom(5),v=room.visual;station(room,0,'verdict',0,1.5,-20,'OPEN THE RECORD','THE VERDICT IS YOURS');
      v.gate=door(room,-25,27,28);v.network=group(room.root,0,0,0);v.network.name='414-chain-constellation';
      v.title.position.set(0,27,-23.8);v.title.scale.set(22,2.2,1);
      const gateway=group(v.network,0,24,-84);ring(gateway,0,0,0,23,M.gold);ring(gateway,0,0,.1,21.8,M.blueHot);halo(gateway,0,0,1,70,'white');
      label(gateway,'414',0,0,.3,17,7,'','#e8d8b3');
      // Remove the opaque plaque: the final glyph floats directly in the cosmos.
      const glyph=gateway.children[gateway.children.length-1];
      const glyphMap=canvasTexture(768,256,(c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#f4e2b8';c.textAlign='center';c.textBaseline='middle';c.font='600 218px Georgia, serif';c.fillText('414',w/2,h*.52);});
      glyph.material=basic('#ffffff',{map:glyphMap,transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false});
      const nodes=[],networkLines=[],nodePos=[];const r=random(9414);
      for(let i=0;i<44;i++){
        const lane=i%4,a=Math.floor(i/4)/11*TAU+lane*.27,radius=17+lane*8,x=Math.cos(a)*radius,y=22+Math.sin(a)*radius*.55,z=-64-lane*13+Math.sin(a*2)*6;
        nodePos.push([x,y,z]);nodes.push([x,y,z,.24+(i%7===0?.31:0),.24+(i%7===0?.31:0),.24+(i%7===0?.31:0)]);
      }
      for(let i=0;i<nodePos.length;i++){const a=nodePos[i],b=nodePos[(i+4)%nodePos.length];networkLines.push(...a,...b);if(i%3===0)networkLines.push(...a,...nodePos[(i+9)%nodePos.length]);}
      instanced(v.network,orbG,M.goldHot,nodes);lines(v.network,networkLines,'#c5ba8b',.44);
      const city=[],citySpire=[];for(const side of [-1,1])for(let i=0;i<18;i++){const x=side*(18+r()*41),z=-60-r()*60,h=7+r()*29;city.push([x,h*.5-2,z,2+r()*3,h,3+r()*3]);citySpire.push([x,h+1,z,1.1,7,1.1]);}
      instanced(v.network,boxG,M.dark,city);instanced(v.network,coneG,M.edge,citySpire);
      v.revealLight=mesh(room.root,coneG,M.goldBeam,0,13,-23,10.0,25,10.0);v.revealLight.rotation.x=.25;
      const edge=lines(room.root,[-13.5,.11,-25,-13.5,.11,15,13.5,.11,-25,13.5,.11,15],'#f1d398',.8);v.thresholdLines=edge;
    }

    for(const room of rooms)room.visual.contactShadows=instanced(room.root,planeG,M.contact,room.visual.contactPoints);
    function stageIndex(stage){return clamp(Math.floor(finite(stage,0)),0,5);}
    function setStage(stage){
      if(disposed)return;const s=stageIndex(stage);activeStage=s;
      for(let i=0;i<rooms.length;i++)rooms[i].root.visible=i===s;
      // Direction remains identical across isolated chambers; no point-light cross-talk.
      key.position.set(origin.x+16,origin.y+34,origin.z-s*160+19);key.target.position.set(origin.x,origin.y+4,origin.z-s*160-8);
      root.updateMatrixWorld(true);
    }
    function target(stage,index){const room=rooms[stageIndex(stage)],t=room.targets[Math.floor(finite(index,0))];return t?t.pos.clone():spawn(stage);}
    function spawn(stage){return V(origin.x,origin.y,origin.z-stageIndex(stage)*160+30);}
    function tick(dt,state={}){
      if(disposed)return;
      if(!state||typeof state!=='object')state={};
      const delta=clamp(finite(dt,0),0,.1);elapsed+=delta;
      const stage=state.stage===undefined?(activeStage<0?0:activeStage):stageIndex(state.stage);
      if(stage!==activeStage)setStage(stage);
      const time=Number.isFinite(state.clock)?state.clock:elapsed,room=rooms[stage],v=room.visual;
      for(let i=0;i<v.flags.length;i++)v.flags[i].rotation.y=(i<2?-.12:.12)+Math.sin(time*.48+i)*.025;
      v.dust.rotation.y=Math.sin(time*.034)*.018;v.dust.position.y=Math.sin(time*.18)*.2;
      if(stage===0){
        let count=0;for(let i=0;i<3;i++){const done=!!(state.seals&&state.seals[i]);if(done)count++;updateStation(v.stations[i],done,time);v.sealLights[i].material=done?M.blueHot:M.crimsonHot;}
        v.gate.open+=(Number(count===3)-v.gate.open)*Math.min(1,delta*1.45);const open=v.gate.open;
        v.gate.left.position.x=-6-open*10.2;v.gate.right.position.x=6+open*10.2;
        v.iris.rotation.z=-time*.04;v.iris.scale.setScalar(Math.max(.03,1-open));v.iris.visible=open<.97;v.chains.visible=open<.15;
        v.fragments.rotation.z=Math.sin(time*.075)*.014;v.backLight.intensity=1.5+open*.55;
      }else if(stage===1){
        for(let i=0;i<3;i++){
          const m=v.mirrors[i],turn=clamp(Math.floor(finite(state.turns&&state.turns[i],0)),0,3),done=state.aligned?!!state.aligned[i]:turn===m.correct;
          const angle=turn*Math.PI/2;let diff=(angle-m.angle+Math.PI)%TAU;if(diff<0)diff+=TAU;diff-=Math.PI;m.angle+=diff*Math.min(1,delta*9.5);m.root.rotation.z=m.angle;
          m.inner.material=done?M.blueHot:M.crimsonHot;v.mirrorLinks[i].material.color.set(done?'#c7eee2':'#806857');v.mirrorLinks[i].material.opacity=done?.85:.35;updateStation(v.stations[i],done,time);
        }
        for(let i=0;i<2;i++){v.discs[i].dial.rotation.z=time*(i?-.035:.035);v.discs[i].hub.rotation.y=time*.3;}
      }else if(stage===2){
        for(let i=0;i<3;i++){
          const done=Array.isArray(state.relay)?!!state.relay[i]:i<clamp(finite(state.relay,0),0,3);updateStation(v.stations[i],done,time);const guard=v.guards[i],hp=state.guardHP&&state.guardHP[i];
          guard.root.visible=!state.externalCombat&&!done&&(hp===undefined||finite(hp,1)>0);guard.root.position.y=guard.baseY+Math.sin(time*1.6+i)*.18;guard.root.rotation.y=Math.sin(time*.55+i)*.2;
        }
        const loc=state.witnessLocal;
        if(loc){tmpA.set(finite(loc[0]===undefined?loc.x:loc[0],0),finite(loc[1]===undefined?loc.y:loc[1],4.6),finite(loc[2]===undefined?loc.z:loc[2],24));v.witness.position.copy(tmpA);}
        v.witness.rotation.y=time*.22;for(let i=0;i<3;i++){v.witnessRings[i].rotation.x=time*(.21+i*.08)+i*.9;v.witnessRings[i].rotation.z=time*(.18+i*.04);}
        for(let i=29;i>0;i--){v.trail[i*3]=v.trail[(i-1)*3];v.trail[i*3+1]=v.trail[(i-1)*3+1];v.trail[i*3+2]=v.trail[(i-1)*3+2];}
        v.trail[0]=v.witness.position.x;v.trail[1]=v.witness.position.y;v.trail[2]=v.witness.position.z;v.witnessTrail.geometry.attributes.position.needsUpdate=true;v.archive.rotation.z=Math.sin(time*.06)*.035;
      }else if(stage===3){
        let nextClock=3;for(let i=0;i<3;i++)if(!(state.locks&&state.locks[i])){nextClock=i;break;}
        for(let i=0;i<3;i++){
          const c=v.clockRings[i],done=!!(state.locks&&state.locks[i]),charged=((time+i*.8)%5.6+5.6)%5.6<2.6;
          const active=i===nextClock,safe=active&&state.clockOpen!==undefined?!!state.clockOpen:!charged;updateStation(v.stations[i],done,time);
          if(!done)c.angle+=delta*(.22+i*.095)*(i===1?-1:1);c.gear.rotation.z=c.angle*.3;c.hands.rotation.z=c.angle;c.outer.material=done?M.blueHot:(charged?M.crimsonHot:M.goldHot);
          c.open+=(Number(done)-c.open)*Math.min(1,delta*1.8);c.root.rotation.y=c.open*(i%2?-.72:.72);c.root.position.y=12+c.open*3.4;
          const band=v.clockBands[i];band.root.visible=active;band.material.color.set(safe?'#f0ce87':'#df5574');band.material.opacity=safe?.19:.29;band.edge.material.color.set(safe?'#ffe6ab':'#ff829d');band.stripes.material=safe?M.goldHot:M.crimsonHot;
          if(active){v.stations[i].floor.material=safe?M.goldHot:M.crimsonHot;v.stations[i].orbit.material=safe?M.goldHot:M.crimsonHot;v.stations[i].material.emissive.set(safe?'#ffcb82':'#cf4464');}
        }
      }else if(stage===4){
        const phase=clamp(Math.floor(finite(state.bossPhase,0)),0,3),exposed=!!state.bossExposed;
        // The finisher first frames the real player; its crown impact is at 2.8 seconds.
        const shatteredPhase=phase===3&&time<2.8?2:phase;
        const activeStation=clamp(Math.floor(finite(state.bossStation,phase)),0,3);
        for(let i=0;i<3;i++){
          const s=v.stations[i],done=i<phase,ready=!exposed&&i===activeStation&&phase<3;updateStation(s,done,time);
          if(!done){s.orbit.material=ready?M.goldHot:M.dimGold;s.floor.material=ready?M.goldHot:M.dimGold;s.material.emissiveIntensity=ready?1.12:.16;s.halo.visible=ready;}else s.halo.visible=true;
          if(shatteredPhase>i&&v.previousBossPhase<=i)v.breakAges[i]=0;v.crownBands[i].visible=i>=shatteredPhase;v.crownBands[i].rotation.z=(-.22+i*.32)+time*(i%2?-.13:.10);v.crownBands[i].rotation.y=Math.sin(time*.19+i)*.2;
        }
        if(shatteredPhase<v.previousBossPhase){
          for(let i=0;i<3;i++)v.breakAges[i]=-1;v.coreCollapse=0;
          dummy.position.set(0,0,0);dummy.rotation.set(0,0,0);dummy.scale.set(0,0,0);dummy.updateMatrix();for(let i=0;i<36;i++)v.shards.setMatrixAt(i,dummy.matrix);v.shards.instanceMatrix.needsUpdate=true;
        }
        v.previousBossPhase=shatteredPhase;v.crown.position.y=11+Math.sin(time*.6)*.40;v.core.rotation.set(time*.12,time*.19,time*.06);v.coreCracks.rotation.copy(v.core.rotation);v.coreCracks.material.color.set(exposed?'#fff0c2':'#e85d7e');v.core.material.emissive.set(exposed?'#eac58b':'#d44468');v.core.material.emissiveIntensity=exposed?1.25:.33;
        v.coreCollapse+=(Number(shatteredPhase===3)-v.coreCollapse)*Math.min(1,delta*1.7);
        const remnant=Math.max(.025,1-v.coreCollapse*.98);v.core.scale.setScalar(remnant);v.coreCracks.scale.setScalar(remnant);v.core.visible=v.coreCracks.visible=v.coreCollapse<.97;
        v.coreHalo.material=phase===3?haloMaterials.white:(exposed?haloMaterials.gold:haloMaterials.red);v.coreHalo.scale.setScalar(phase===3?24+v.coreCollapse*40:(exposed?29:24));v.coreHalo.visible=v.coreCollapse<.97;
        v.collapseRing.visible=phase===3&&v.coreCollapse>.01&&v.coreCollapse<.98;v.collapseRing.scale.setScalar(1+v.coreCollapse*28);
        v.strikeBeam.visible=exposed&&phase<3;v.coreStation.orbit.material=exposed?M.whiteHot:M.crimsonHot;v.coreStation.floor.material=exposed?M.goldHot:M.crimsonHot;v.coreStation.mesh.rotation.y=time*.6;v.coreStation.material.emissive.set(exposed?'#ffe3a4':'#952945');
        v.arenaHalo.material=exposed?M.goldHot:M.crimsonHot;v.backLight.intensity=exposed?2.0:1.5;
        const hazardTime=state.hazardPhase===undefined?((time%6)+6)%6:clamp(finite(state.hazardPhase,0),0,1)*6;
        const striking=hazardTime>=3.7&&hazardTime<4.2;v.judgementBand.position.z=8-phase*8;v.judgementBand.visible=phase<3&&hazardTime<4.2;
        v.judgementMaterial.color.set(striking?'#f04c72':'#e6bc78');v.judgementMaterial.opacity=striking?.48:.10+hazardTime/3.7*.15;v.judgementEdge.material.color.set(striking?'#ff83a1':'#f1d6a0');v.judgementMarks.material=striking?M.crimsonHot:M.goldHot;
        let shardChanged=false;
        for(let band=0;band<3;band++)if(v.breakAges[band]>=0){
          const age=v.breakAges[band]=Math.min(4.01,v.breakAges[band]+delta),life=clamp(1-age/4,0,1),r=6.3+band*1.55;shardChanged=true;
          for(let n=0;n<12;n++){const a=n/12*TAU+band*.24,d=r+age*(3.5+(n%3)*.5);dummy.position.set(Math.sin(a)*d,Math.cos(a)*r+age*(2+(n%4))-.9*age*age,(n%3-1)*age*3);dummy.rotation.set(a+age,a*.7+age*1.5,age*2);dummy.scale.set(.44*life,1.0*life,.37*life);dummy.updateMatrix();v.shards.setMatrixAt(band*12+n,dummy.matrix);}
          if(age>4)v.breakAges[band]=-1;
        }
        if(shardChanged)v.shards.instanceMatrix.needsUpdate=true;
        v.crown.scale.setScalar(shatteredPhase===3?.78:1);
      }else if(stage===5){
        const open=clamp(finite(state.doorOpen,0),0,1);v.gate.open+=(open-v.gate.open)*Math.min(1,delta*3.5);const a=v.gate.open;
        v.gate.left.position.x=-6.75-a*14.2;v.gate.right.position.x=6.75+a*14.2;v.gate.left.rotation.y=-a*.045;v.gate.right.rotation.y=a*.045;
        v.network.rotation.z=Math.sin(time*.021)*.012;v.revealLight.visible=a>.03;v.revealLight.scale.x=5+a*9;v.revealLight.scale.z=5+a*9;v.backLight.intensity=1.5+a*1.3;updateStation(v.stations[0],open>.96,time);
      }
    }
    function dispose(){
      if(disposed)return;disposed=true;
      if(root.parent)root.parent.remove(root);
      for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();
      for(const room of rooms)room.targets.length=0;
      while(root.children.length)root.remove(root.children[root.children.length-1]);geometries.clear();materials.clear();textures.clear();geometryCache.clear();textCache.clear();
    }
    setStage(0);
    return {root,rooms,target,spawn,setStage,tick,dispose};
  }
  return {create};
})();
