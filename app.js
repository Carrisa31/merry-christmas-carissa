import * as THREE from './vendor/three.module.js';

const $ = s => document.querySelector(s);
const world = $('#world');
const mobile = matchMedia('(max-width:700px)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)').matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
} catch (error) {
  $('#loading').innerHTML = '<span class="loading-star">✦</span><p>请用支持 WebGL 的浏览器打开圣诞树</p>';
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
world.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, .1, 100);
const tree = new THREE.Group(); scene.add(tree);
scene.add(new THREE.AmbientLight(0x748cb4, 2.2));
const light = new THREE.PointLight(0xffe2a1, 95, 20, 2); light.position.set(-3, 5, 6); scene.add(light);
const rim = new THREE.PointLight(0xb2d5ff, 60, 20, 2); rim.position.set(4, 2, -3); scene.add(rim);
const lower = new THREE.PointLight(0xffd47b, 35, 12, 2); lower.position.set(0, -3, 3); scene.add(lower);

let seed = 20261225;
const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const range = (a,b) => a + rand()*(b-a);
const lerp = THREE.MathUtils.lerp;
const clamp = THREE.MathUtils.clamp;
const goldColors = [0xffc756,0xffe9ad,0xffe4a5,0xf6c46a,0xfaf2cf,0xc89742,0xffd485];

function makeGlowTexture() {
  const c = document.createElement('canvas'); c.width=c.height=128;
  const g=c.getContext('2d'); const grad=g.createRadialGradient(64,64,0,64,64,64);
  grad.addColorStop(0,'rgba(255,255,255,1)'); grad.addColorStop(.06,'rgba(255,255,255,1)');
  grad.addColorStop(.16,'rgba(255,235,171,.6)'); grad.addColorStop(.38,'rgba(255,208,102,.15)'); grad.addColorStop(1,'rgba(255,208,102,0)');
  g.fillStyle=grad;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);
}
const glowTexture=makeGlowTexture();
function pointsMaterial(size,opacity=1) {
 return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{time:{value:0},size:{value:size},alpha:{value:opacity},pixelRatio:{value:Math.min(devicePixelRatio,1.8)}},
  vertexShader:`attribute vec3 color; attribute float phase; attribute float scale; varying vec3 vColor; varying float vAlpha; uniform float time; uniform float size; uniform float pixelRatio; void main(){vColor=color;vAlpha=.64+.36*sin(time*1.3+phase);vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(size*scale*pixelRatio*(15.0/-mv.z),1.0,90.0);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying vec3 vColor;varying float vAlpha;uniform float alpha;void main(){float d=length(gl_PointCoord-.5)*2.0;if(d>1.0)discard;float a=exp(-d*d*10.0)*.65+exp(-d*d*75.0);gl_FragColor=vec4(vColor,a*vAlpha*alpha);}`});
}
function pointCloud(positions,colors,sizes,phases,size,opacity=1,parent=tree) {
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setAttribute('scale',new THREE.Float32BufferAttribute(sizes,1));geo.setAttribute('phase',new THREE.Float32BufferAttribute(phases,1));
 const mesh=new THREE.Points(geo,pointsMaterial(size,opacity));mesh.frustumCulled=false;parent.add(mesh);return mesh;
}
function treePosition(y,theta,surface=false) {
 const h=(y+3.45)/6.95;
 const tier=1+.095*Math.sin(h*42);
 const r=(1-h)*2.55*tier*(surface?1:Math.sqrt(rand()));
 return new THREE.Vector3(Math.cos(theta)*r,y,Math.sin(theta)*r);
}
function scatteredPosition() {
 const theta=range(0,Math.PI*2),phi=Math.acos(range(-1,1)),r=range(3.1,6.8);
 return new THREE.Vector3(Math.cos(theta)*Math.sin(phi)*r,Math.cos(phi)*r*.73,Math.sin(theta)*Math.sin(phi)*r*.65);
}
const particleCount=mobile?6200:10500;
const basePositions=[],scatterPositions=[],particleColors=[],particleSizes=[],particlePhases=[];
for(let i=0;i<particleCount;i++){
 const p=treePosition(range(-3.45,3.5),rand()*Math.PI*2,i%4===0);basePositions.push(p.x,p.y,p.z);
 const s=scatteredPosition();scatterPositions.push(s.x,s.y,s.z);
 const c=new THREE.Color(goldColors[Math.floor(rand()*goldColors.length)]);if(i%17===0)c.set(0xff444d);if(i%23===0)c.set(0x8cc8c0);
 particleColors.push(c.r,c.g,c.b);particleSizes.push(i%45===0?range(1.8,2.9):range(.35,1.1));particlePhases.push(rand()*Math.PI*2);
}
const dust=pointCloud(basePositions,particleColors,particleSizes,particlePhases,13,.95);
const helixP=[],helixC=[],helixS=[],helixPh=[];
for(let i=0;i<1800;i++){
 const h=i/1800,y=3.4-h*6.8,theta=h*Math.PI*2*7.4,r=h*2.68;
 helixP.push(Math.cos(theta)*r+range(-.04,.04),y+range(-.05,.05),Math.sin(theta)*r+range(-.04,.04));
 const c=new THREE.Color(i%11===0?0xffffff:0xffce69);helixC.push(c.r,c.g,c.b);helixS.push(range(.35,.85));helixPh.push(h*40);
}
const ribbon=pointCloud(helixP,helixC,helixS,helixPh,12,.9);

const objectData=[];
const dummy = new THREE.Object3D();
function makeOrnaments(count,geometry,material,type) {
 const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;tree.add(mesh);
 const data=[];
 for(let i=0;i<count;i++){
  const p=treePosition(range(-3.3,3.15),range(0,Math.PI*2),true);const s=scatteredPosition();
  const size=type==='gift'?range(.075,.15):range(.042,.105);
  data.push({p,s,size,rx:range(0,Math.PI),rz:range(0,Math.PI)});
  mesh.setColorAt(i,new THREE.Color(type==='gold'?goldColors[i%goldColors.length]:type==='red'?[0xb9192f,0xdf243e,0x901d29][i%3]:[0xd6ac53,0xf0d49a,0x9e2532,0x385f59][i%4]));
 }
 objectData.push({mesh,data,type});return mesh;
}
makeOrnaments(mobile?190:320,new THREE.SphereGeometry(1,10,8),new THREE.MeshStandardMaterial({metalness:.83,roughness:.21}), 'gold');
makeOrnaments(135,new THREE.SphereGeometry(1,10,8),new THREE.MeshStandardMaterial({metalness:.65,roughness:.23}), 'red');
makeOrnaments(100,new THREE.BoxGeometry(1.4,1.6,1.3),new THREE.MeshStandardMaterial({metalness:.6,roughness:.3}),'gift');

// A dimensional five-point star, with a soft halo and fine light rays.
const shape=new THREE.Shape();
for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2===0?.32:.139;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?shape.lineTo(x,y):shape.moveTo(x,y);}shape.closePath();
const star=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.085,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025}),new THREE.MeshStandardMaterial({color:0xffd66b,emissive:0xffbd41,emissiveIntensity:1.15,metalness:.7,roughness:.2}));star.position.set(0,3.8,0);tree.add(star);
const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:0xffd16d,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));halo.position.set(0,3.8,0);halo.scale.set(2.4,2.4,1);tree.add(halo);
function flareTexture(){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');const g=ctx.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,'#fff8d8');g.addColorStop(.04,'#fff3ba');g.addColorStop(.2,'#ffe19777');g.addColorStop(1,'#ffdc8300');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);ctx.fillStyle='#ffefba';ctx.beginPath();ctx.moveTo(128,0);ctx.quadraticCurveTo(131,125,256,128);ctx.quadraticCurveTo(131,131,128,256);ctx.quadraticCurveTo(125,131,0,128);ctx.quadraticCurveTo(125,125,128,0);ctx.fill();return new THREE.CanvasTexture(c);}
const flareMap=flareTexture(),flares=[];
for(let i=0;i<23;i++) {const p=treePosition(range(-3.3,3.2),range(0,6.28),true);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:flareMap,color:0xffe0a0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.8}));sp.position.copy(p);sp.scale.setScalar(range(.24,.5));tree.add(sp);flares.push({sp,p,s:scatteredPosition(),phase:rand()*6.28});}

const skyPos=[],skyColors=[],skySizes=[],skyPh=[];
for(let i=0;i<(mobile?1200:2300);i++) {skyPos.push(range(-22,22),range(-15,16),range(-18,5));const c=new THREE.Color(i%8===0?0xffdda0:0xb9d8ff);skyColors.push(c.r,c.g,c.b);skySizes.push(range(.15,.7));skyPh.push(range(0,6.28));}
const snow=pointCloud(skyPos,skyColors,skySizes,skyPh,6,.7,scene);
const orbitP=[],orbitC=[],orbitS=[],orbitPh=[];
for(let i=0;i<720;i++){const a=range(0,Math.PI*2),r=range(2.2,4.5);orbitP.push(Math.cos(a)*r,-3.7+range(-.025,.025),Math.sin(a)*r*.8);const c=new THREE.Color(0xdcc38c);orbitC.push(c.r,c.g,c.b);orbitS.push(range(.2,.6));orbitPh.push(rand()*6.28);}
const orbit=pointCloud(orbitP,orbitC,orbitS,orbitPh,7,.3);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(14,9),new THREE.MeshBasicMaterial({map:glowTexture,color:0x688ad2,transparent:true,opacity:.12,depthWrite:false,blending:THREE.AdditiveBlending}));ground.rotation.x=-Math.PI/2;ground.position.y=-3.76;scene.add(ground);

let spread=0,targetSpread=0,rotation=.15,targetRotation=.15,tilt=0,targetTilt=0,zoom=1,autoRotate=!reducedMotion,pointerDown=false,lastPointer=null,moved=0,lastInteraction=0;
const photosGroup=new THREE.Group();tree.add(photosGroup);let photoObjects=[],savedPhotos=[],demoPhotos=[],memoryIndex=0;

function illustration(index){
 const c=document.createElement('canvas');c.width=400;c.height=500;const g=c.getContext('2d');
 const palettes=[['#102d59','#9abdc2'],['#522839','#d89988'],['#184447','#b8cb9c'],['#3d365e','#b3add4']];const [a,b]=palettes[index%4];
 const gradient=g.createLinearGradient(0,0,0,500);gradient.addColorStop(0,a);gradient.addColorStop(1,b);g.fillStyle=gradient;g.fillRect(0,0,400,500);
 g.fillStyle='#ffe4ad';g.beginPath();g.arc(295,95,32,0,Math.PI*2);g.fill();
 for(let i=0;i<70;i++){g.fillStyle='#fff5d4';g.globalAlpha=range(.2,.9);g.beginPath();g.arc(range(0,400),range(0,400),range(.7,2),0,7);g.fill();}g.globalAlpha=1;
 const snowColor=['#b9d1dd','#e9c7bb','#cbdbd3','#c6c1e2'][index%4];g.fillStyle=snowColor;g.beginPath();g.moveTo(0,370);g.quadraticCurveTo(120,300,400,380);g.lineTo(400,500);g.lineTo(0,500);g.fill();
 for(let i=0;i<6;i++){const x=35+i*67,y=range(255,345),h=range(75,145);g.fillStyle=index%2?'#2c3849':'#15373e';g.beginPath();g.moveTo(x,y-h);g.lineTo(x-30,y);g.lineTo(x+30,y);g.fill();g.fillRect(x-3,y-3,6,20);}
 const x=120+index%3*25;g.fillStyle='#704d40';g.fillRect(x,325,105,85);g.fillStyle='#eee2ca';g.beginPath();g.moveTo(x-15,330);g.lineTo(x+52,273);g.lineTo(x+120,330);g.fill();g.fillStyle='#ffd89b';g.fillRect(x+17,349,22,27);g.fillRect(x+65,349,22,27);g.fillStyle='#5c3833';g.fillRect(x+44,375,19,35);
 g.font='italic 27px Georgia';g.textAlign='center';g.fillStyle='#fff9e8';g.fillText(['A little winter magic','Home for Christmas','Under the same stars','Wish upon a star'][index%4],200,457);g.font='13px sans-serif';g.fillText('示例回忆 · 换上你的照片',200,484);
 return {id:'demo-'+index,src:c.toDataURL('image/jpeg',.88),name:'冬日星光 · 示例插画 '+(index+1),demo:true};
}
demoPhotos=Array.from({length:8},(_,i)=>illustration(i));
function currentPhotos(){return savedPhotos.length?savedPhotos:demoPhotos;}
const imageCache=new Map();
async function imageFrom(src){if(imageCache.has(src))return imageCache.get(src);const im=new Image();await new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=reject;im.src=src;});imageCache.set(src,im);return im;}
async function makePhotoTexture(photo){
 const img=await imageFrom(photo.src);const c=document.createElement('canvas');c.width=256;c.height=320;const ctx=c.getContext('2d');
 const grad=ctx.createLinearGradient(0,0,256,320);grad.addColorStop(0,'#ffe7a2');grad.addColorStop(.3,'#9a6f2d');grad.addColorStop(.56,'#e8c578');grad.addColorStop(1,'#bd8e46');ctx.fillStyle=grad;ctx.fillRect(0,0,256,320);ctx.strokeStyle='#fff2bb';ctx.lineWidth=2;ctx.strokeRect(4,4,248,312);ctx.fillStyle='#173449';ctx.fillRect(11,11,234,298);
 const scale=Math.max(230/img.width,294/img.height);ctx.save();ctx.beginPath();ctx.rect(13,13,230,294);ctx.clip();ctx.drawImage(img,128-img.width*scale/2,160-img.height*scale/2,img.width*scale,img.height*scale);ctx.restore();
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return tex;
}
let photoRevision=0;
async function rebuildPhotos(){
 const revision=++photoRevision;
 const list=currentPhotos();const textures=await Promise.all(list.map(makePhotoTexture));
 if(revision!==photoRevision){textures.forEach(t=>t.dispose());return;}
 photoObjects.forEach(o=>{photosGroup.remove(o.mesh);o.mesh.geometry.dispose();o.mesh.material.map.dispose();o.mesh.material.dispose();});photoObjects=[];
 list.forEach((photo,i)=>{
  const h=.19+((i*0.61803398875)%1)*.69,y=3.3-h*6.8,theta=i*2.399963+1.1,r=h*2.72;
  const p=new THREE.Vector3(Math.cos(theta)*r,y,Math.sin(theta)*r);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.53,.67),new THREE.MeshBasicMaterial({map:textures[i],side:THREE.DoubleSide,toneMapped:false}));
  mesh.position.copy(p);mesh.rotation.y=-theta+Math.PI/2;mesh.rotation.z=Math.sin(i*4)*.12;mesh.userData.index=i;photosGroup.add(mesh);photoObjects.push({mesh,p,s:scatteredPosition(),theta,i});
 });
 $('#photo-count').textContent=savedPhotos.length;renderGallery();
}

let dbPromise;
function database(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const request=indexedDB.open('christmas-memories',1);request.onupgradeneeded=()=>request.result.createObjectStore('photos',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});return dbPromise;}
async function dbAll(){const db=await database();return new Promise((resolve,reject)=>{const r=db.transaction('photos').objectStore('photos').getAll();r.onsuccess=()=>resolve(r.result.sort((a,b)=>a.created-b.created));r.onerror=()=>reject(r.error);});}
async function dbWrite(action,value){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('photos','readwrite');const s=tx.objectStore('photos');action==='put'?s.put(value):s.delete(value);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');for(const [dialog,status]of [['#gallery','#gallery-feedback'],['#gesture-help','#camera-feedback']]){if($(dialog).open){$(status).hidden=false;$(status).textContent=message;}}clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4300);}
function renderGallery(){
 const grid=$('#photo-grid');grid.replaceChildren();$('#gallery-empty').hidden=!!savedPhotos.length;
 savedPhotos.forEach((p,i)=>{const tile=document.createElement('div');tile.className='photo-tile';const im=document.createElement('img');im.src=p.src;im.alt=p.name;im.tabIndex=0;im.onclick=()=>{$('#gallery').close();showMemory(i);};im.onkeydown=e=>{if(e.key==='Enter')im.click();};const remove=document.createElement('button');remove.textContent='×';remove.setAttribute('aria-label','移除 '+p.name);remove.onclick=async()=>{try{await dbWrite('delete',p.id);savedPhotos=savedPhotos.filter(x=>x.id!==p.id);imageCache.delete(p.src);await rebuildPhotos();toast('已从圣诞树移除这张照片');}catch{toast('暂时无法移除，请稍后重试');}};tile.append(im,remove);grid.append(tile);});
}
$('#photos').onclick=()=>$('#gallery').showModal();$('#close-gallery').onclick=()=>$('#gallery').close();$('#upload').onclick=()=>$('#file-input').click();
$('#file-input').onchange=async e=>{
 const files=Array.from(e.target.files);e.target.value='';if(!files.length)return;
 const available=36-savedPhotos.length;if(!available){toast('已经挂满 36 张照片了，可先移除一些回忆');return;}
 $('#upload').disabled=true;$('#upload').textContent='正在把回忆挂上树梢…';let added=0,failed=0,large=0;
 try{
  for(const file of files.slice(0,available)){
   if(file.size>15*1024*1024){large++;continue;}
   let src;
   try{const url=URL.createObjectURL(file);let im;try{im=await imageFrom(url);}finally{URL.revokeObjectURL(url);imageCache.delete(url);}const max=1200,factor=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*factor));c.height=Math.max(1,Math.round(im.height*factor));c.getContext('2d').drawImage(im,0,0,c.width,c.height);src=c.toDataURL('image/jpeg',.86);const photo={id:crypto.randomUUID(),name:file.name.replace(/\.[^.]+$/,''),src,created:Date.now()};await dbWrite('put',photo);savedPhotos.push(photo);added++;}catch(error){console.warn('Photo import failed',error.name);failed++;}
  }
  if(added)await rebuildPhotos();const notes=[];if(added)notes.push(`${added} 张回忆，已经在星光里了`);if(large)notes.push(`${large} 张超过 15 MB`);if(failed)notes.push(`${failed} 张未能保存，请检查图片格式或浏览器空间`);if(files.length>available)notes.push(`最多保存 36 张`);toast(notes.join('；'));
 }finally{$('#upload').disabled=false;$('#upload').textContent='＋ 选择照片';}
};
function showMemory(index){const list=currentPhotos();if(!list.length)return;memoryIndex=(index+list.length)%list.length;const photo=list[memoryIndex];$('#memory-img').src=photo.src;$('#memory-img').alt=photo.name;$('#memory-caption').textContent=photo.name;if(!$('#memory').open)$('#memory').showModal();}
$('#close-memory').onclick=()=>$('#memory').close();$('#previous').onclick=()=>showMemory(memoryIndex-1);$('#next').onclick=()=>showMemory(memoryIndex+1);
document.addEventListener('keydown',e=>{if($('#memory').open){if(e.key==='ArrowLeft')showMemory(memoryIndex-1);if(e.key==='ArrowRight')showMemory(memoryIndex+1);}if(e.key==='Escape')setImmersive(false);});
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
function setSpread(value){targetSpread=value;$('#scatter').classList.toggle('active',value===1);$('#form').classList.toggle('active',value===0);$('#scatter').setAttribute('aria-pressed',String(value===1));$('#form').setAttribute('aria-pressed',String(value===0));lastInteraction=performance.now();}
$('#scatter').onclick=()=>setSpread(1);$('#form').onclick=()=>setSpread(0);
$('#rotate').onclick=()=>{autoRotate=!autoRotate;$('#rotate').setAttribute('aria-pressed',String(autoRotate));$('#rotate').classList.toggle('active',autoRotate);toast(autoRotate?'星光开始缓缓旋转':'已暂停自动旋转');};
function setImmersive(on){document.body.classList.toggle('immersive',on);$('#exit-immersive').hidden=!on;}
$('#immersive').onclick=()=>setImmersive(true);$('#exit-immersive').onclick=()=>setImmersive(false);
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
function selectPhoto(x,y){pointer.set(x/innerWidth*2-1,-y/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(photoObjects.map(x=>x.mesh));if(hits.length)showMemory(hits[0].object.userData.index);}
const pointers=new Map();let pinchDistance=0;
renderer.domElement.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});renderer.domElement.setPointerCapture(e.pointerId);pointerDown=true;lastPointer={x:e.clientX,y:e.clientY};moved=0;lastInteraction=performance.now();if(pointers.size===2){const [a,b]=[...pointers.values()];pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);}});
renderer.domElement.addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===2){const [a,b]=[...pointers.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinchDistance)zoom=clamp(zoom*pinchDistance/d,.65,1.6);pinchDistance=d;moved=100;return;}
 if(pointerDown&&lastPointer){const dx=e.clientX-lastPointer.x,dy=e.clientY-lastPointer.y;moved+=Math.abs(dx)+Math.abs(dy);targetRotation+=dx*.007;targetTilt=clamp(targetTilt+dy*.003,-.35,.35);lastPointer={x:e.clientX,y:e.clientY};lastInteraction=performance.now();}
});
function pointerUp(e){pointers.delete(e.pointerId);if(moved<8&&pointerDown)selectPhoto(e.clientX,e.clientY);pointerDown=pointers.size>0;lastPointer=null;lastInteraction=performance.now();}
renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);pointerDown=false;lastPointer=null;});
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom+e.deltaY*.00065,.65,1.6);lastInteraction=performance.now();},{passive:false});
renderer.domElement.addEventListener('dblclick',()=>{zoom=1;targetTilt=0;setSpread(targetSpread?0:1);});

// Locally synthesized bells; audio starts only after the music button is pressed.
let audioContext=null,musicOn=false,musicTimer=null,musicVoices=[];
const melody=[[76,1],[76,1],[76,2],[76,1],[76,1],[76,2],[76,1],[79,1],[72,1.5],[74,.5],[76,4],[77,1],[77,1],[77,1.5],[77,.5],[77,1],[76,1],[76,1],[76,.5],[76,.5],[76,1],[74,1],[74,1],[76,1],[74,2],[79,2]];
function playPhrase(){if(!musicOn)return;let when=audioContext.currentTime+.1;for(const [note,beat]of melody){const freq=440*2**((note-69)/12);for(const [multiple,vol]of [[1,.09],[2,.025],[3,.009]]){const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.value=freq*multiple;gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(vol,when+.012);gain.gain.exponentialRampToValueAtTime(.0001,when+1.6);osc.connect(gain).connect(audioContext.destination);osc.start(when);osc.stop(when+1.7);musicVoices.push(osc);osc.onended=()=>{musicVoices=musicVoices.filter(v=>v!==osc);};}when+=beat*.34;}musicTimer=setTimeout(playPhrase,(when-audioContext.currentTime)*1000+500);}
$('#music').onclick=async()=>{try{if(!audioContext)audioContext=new AudioContext();await audioContext.resume();musicOn=!musicOn;$('#music').classList.toggle('on',musicOn);$('#music').setAttribute('aria-label',musicOn?'关闭圣诞音乐':'播放圣诞音乐');if(musicOn)playPhrase();else{clearTimeout(musicTimer);musicVoices.forEach(v=>{try{v.stop();}catch{}});musicVoices=[];}}catch{toast('当前浏览器无法播放音乐');}};

let handLandmarker=null,cameraStream=null,handActive=false,handLoading=false,lastHandTime=0,lastVideoTime=-1,lastPinch=0,pinchWasDown=false,handFrame=0,handMode='',handModeSince=0,cameraGeneration=0,cameraWatchdog=0,lastFrameAt=0,darkSince=0;
const probeCanvas=document.createElement('canvas');probeCanvas.width=64;probeCanvas.height=48;const probeContext=probeCanvas.getContext('2d',{willReadFrequently:true});
function deadline(promise,ms,message){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),ms);})]).finally(()=>clearTimeout(timer));}
async function loadHandEngine(){
 if(window.__christmasOffline)return window.__christmasOffline();
 const {FilesetResolver,HandLandmarker}=await import('./vendor/vision_bundle.mjs');
 const fileset=await FilesetResolver.forVisionTasks('./vendor/wasm');
 return {HandLandmarker,fileset,baseOptions:{modelAssetPath:'./vendor/hand_landmarker.task',delegate:'CPU'}};
}
async function listCameras(){
 try{const devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');const select=$('#camera-device');const chosen=cameraStream?.getVideoTracks()[0]?.getSettings().deviceId;select.replaceChildren();devices.forEach((d,i)=>{const o=document.createElement('option');o.value=d.deviceId;o.textContent=d.label||`摄像头 ${i+1}`;select.append(o);});if(chosen)select.value=chosen;$('#camera-device-row').hidden=devices.length<2;}catch{$('#camera-device-row').hidden=true;}
}
function cameraFailure(message){stopCamera();$('#camera-feedback').hidden=false;$('#camera-feedback').textContent=message;if(!document.querySelector('dialog[open]'))$('#gesture-help').showModal();toast(message);}
async function waitForVideo(video){
 await deadline(video.play(),12000,'VIDEO_TIMEOUT');
 await deadline(new Promise((resolve,reject)=>{if(video.readyState>=2&&video.videoWidth){resolve();return;}const clean=()=>{video.removeEventListener('loadeddata',ready);video.removeEventListener('error',fail);};const ready=()=>{clean();resolve();};const fail=()=>{clean();reject(new Error('VIDEO_ERROR'));};video.addEventListener('loadeddata',ready,{once:true});video.addEventListener('error',fail,{once:true});}),12000,'VIDEO_TIMEOUT');
}
function probeCamera(video,now){
 if(video.readyState<2||!video.videoWidth)return false;
 try{probeContext.drawImage(video,0,0,64,48);const pixels=probeContext.getImageData(0,0,64,48).data;let dark=0;for(let i=0;i<pixels.length;i+=4)if((pixels[i]+pixels[i+1]+pixels[i+2])/3<25)dark++;const blocked=dark/(64*48)>.91;if(blocked){if(!darkSince)darkSince=now;}else darkSince=0;return blocked&&now-darkSince>2200;}catch{return false;}
}
$('#gesture').onclick=()=>{if(handActive){stopCamera();return;}$('#gesture-help').showModal();};$('#close-help').onclick=()=>$('#gesture-help').close();
const connections=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
async function startCamera(deviceId){
 if(handLoading||handActive)return;const generation=++cameraGeneration;handLoading=true;$('#start-camera').disabled=true;$('#start-camera').textContent='正在等待摄像头权限…';$('#camera-feedback').hidden=true;
 try{
  if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)throw new Error('UNSUPPORTED');
  if(document.permissionsPolicy?.allowsFeature&&!document.permissionsPolicy.allowsFeature('camera'))throw new Error('EMBEDDED_BLOCK');
  const request=navigator.mediaDevices.getUserMedia({video:deviceId?{deviceId:{exact:deviceId},width:{ideal:640},height:{ideal:480}}:{width:{ideal:640},height:{ideal:480},facingMode:{ideal:'user'}},audio:false});
  request.then(stream=>{if(generation!==cameraGeneration)stream.getTracks().forEach(t=>t.stop());},()=>{});
  const stream=await deadline(request,25000,'PERMISSION_TIMEOUT');if(generation!==cameraGeneration){stream.getTracks().forEach(t=>t.stop());return;}cameraStream=stream;
  const video=$('#camera');video.srcObject=cameraStream;$('#camera-panel').hidden=false;$('#camera-status').textContent='正在连接摄像头…';await waitForVideo(video);if(generation!==cameraGeneration)return;
  $('#camera-status').textContent='画面已连接，正在加载手势…';$('#start-camera').textContent='正在加载手势识别…';await listCameras();
  if(!handLandmarker){const {HandLandmarker,fileset,baseOptions}=await deadline(loadHandEngine(),25000,'MODEL_TIMEOUT');const engine=await deadline(HandLandmarker.createFromOptions(fileset,{baseOptions,runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.55,minHandPresenceConfidence:.55,minTrackingConfidence:.5}),30000,'MODEL_TIMEOUT');if(generation!==cameraGeneration){engine.close();return;}handLandmarker=engine;}
  const track=cameraStream.getVideoTracks()[0];track.addEventListener('ended',()=>{if(generation===cameraGeneration)cameraFailure('摄像头连接中断了，请检查相机隐私开关或重新选择摄像头。');},{once:true});
  handActive=true;$('#gesture-help').close();$('#gesture').classList.add('active');$('#gesture').setAttribute('aria-label','关闭手势魔法');lastVideoTime=-1;lastFrameAt=performance.now();darkSince=0;handMode='';pinchWasDown=false;
  cameraWatchdog=setInterval(()=>{if(handActive&&performance.now()-lastFrameAt>9000)cameraFailure('摄像头没有继续输出画面。请检查占用或隐私开关，也可以用系统浏览器重新打开。');},2000);
  handFrame=requestAnimationFrame(trackHand);toast('手势识别已启动，正在检查摄像头画面');
 }catch(error){if(generation!==cameraGeneration)return;stopCamera();const messages={UNSUPPORTED:'此打开方式无法使用摄像头。请使用系统 Chrome、Edge 或 Safari 打开 HTTPS 网页；离线文件也可能受浏览器限制。',EMBEDDED_BLOCK:'当前应用内嵌页面没有摄像头权限，请复制网址到系统 Chrome、Edge 或 Safari 打开。',VIDEO_TIMEOUT:'摄像头已连接，但没有正常出画面。请检查相机隐私开关、遮挡或是否被其他程序占用。',VIDEO_ERROR:'浏览器无法播放摄像头画面，请在系统浏览器中打开后重试。',PERMISSION_TIMEOUT:'没有收到摄像头权限结果。请检查地址栏的相机权限提示，再点一次开启。',MODEL_TIMEOUT:'手势组件加载超时。请重试；独立完整版已包含识别模型，无需在线下载。'};const message=messages[error.message]||(error.name==='NotAllowedError'?'相机访问被拒绝。请检查浏览器的相机权限及系统隐私设置；应用内打开时可改用系统浏览器。':error.name==='NotFoundError'?'没有找到可用摄像头，请连接摄像头后重试。':error.name==='NotReadableError'?'无法读取摄像头，请检查是否被其他应用占用、相机隐私开关是否关闭。':`手势组件未能启动（${error.name||'Error'}），可继续用鼠标或触屏操作。`);toast(message);console.warn('Camera initialization',error.name,error.message);
 }finally{if(generation===cameraGeneration){handLoading=false;$('#start-camera').disabled=false;$('#start-camera').textContent='开启摄像头';}}
}
function stopCamera(){cameraGeneration++;handActive=false;handLoading=false;$('#start-camera').disabled=false;$('#start-camera').textContent='开启摄像头';clearInterval(cameraWatchdog);cancelAnimationFrame(handFrame);if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;}$('#camera').srcObject=null;$('#camera-panel').hidden=true;$('#gesture').classList.remove('active');$('#gesture').setAttribute('aria-label','开启手势魔法');}
$('#start-camera').onclick=()=>startCamera();$('#stop-camera').onclick=stopCamera;$('#camera-device').onchange=async e=>{const id=e.target.value;stopCamera();await startCamera(id);};
function trackHand(now){
 if(!handActive)return;handFrame=requestAnimationFrame(trackHand);const video=$('#camera');if(now-lastHandTime<66||video.currentTime===lastVideoTime||video.readyState<2)return;lastHandTime=now;lastVideoTime=video.currentTime;lastFrameAt=now;
 try{
  const result=handLandmarker.detectForVideo(video,now),landmarks=result.landmarks?.[0],c=$('#hand-overlay');c.width=640;c.height=480;const ctx=c.getContext('2d');ctx.clearRect(0,0,640,480);
  if(!landmarks){const blocked=probeCamera(video,now);$('#camera-status').textContent=blocked?'画面接近黑屏，请检查相机开关': '把一只手放进画面';$('#camera-warning').hidden=!blocked;if(blocked)$('#camera-warning').textContent='请检查镜头遮挡、摄像头隐私开关，或切换摄像头。应用内打开时可改用系统浏览器。';handMode='';pinchWasDown=false;return;}
  $('#camera-warning').hidden=true;darkSince=0;
  const l=landmarks;ctx.strokeStyle='#e8d098';ctx.lineWidth=2;connections.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(l[a].x*640,l[a].y*480);ctx.lineTo(l[b].x*640,l[b].y*480);ctx.stroke();});ctx.fillStyle='#fff0bf';l.forEach(p=>{ctx.beginPath();ctx.arc(p.x*640,p.y*480,3.5,0,Math.PI*2);ctx.fill();});
  const dist=(a,b)=>Math.hypot(l[a].x-l[b].x,l[a].y-l[b].y),palm=dist(0,9);if(palm<.04)return;
  const pinching=dist(4,8)/palm<.32;const extended=[8,12,16,20].filter(t=>dist(t,0)>dist(t-2,0)*1.23).length;
  if(pinching&&!pinchWasDown&&now-lastPinch>1400&&!document.querySelector('dialog[open]')){lastPinch=now;const front=photoObjects.map(o=>{const v=o.mesh.getWorldPosition(new THREE.Vector3());return {i:o.i,z:v.z};}).sort((a,b)=>b.z-a.z);showMemory(front[0]?.i??0);}
  if(!pinching&&pinchWasDown&&$('#memory').open&&now-lastPinch>900)$('#memory').close();pinchWasDown=pinching;
  const mode=pinching?'pinch':extended>=3?'open':extended===0?'fist':'move';if(mode!==handMode){handMode=mode;handModeSince=now;}
  if(now-handModeSince>450&&!pinching){if(mode==='open')setSpread(1);if(mode==='fist')setSpread(0);}
  if(!pinching){targetRotation+=(.5-l[9].x)*.055;targetTilt=clamp((l[9].y-.5)*.5,-.25,.25);lastInteraction=now;}
  $('#camera-status').textContent=pinching?'捏合 · 回忆就在眼前':mode==='open'?'张开 · 星光散开':mode==='fist'?'握拳 · 聚成圣诞树':'移动 · 轻轻转动';
 }catch(error){console.warn('Hand tracking stopped',error.name);stopCamera();toast('手势识别已停止，可以重新开启');}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&handActive)stopCamera();});window.addEventListener('pagehide',()=>{stopCamera();if(audioContext)audioContext.close();});

let baseDistance=15.5,cameraY=.5,lookY=.05;
function resize(){const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);baseDistance=w/h<.8?20.2:w/h<1.2?17.7:15.4;cameraY=.6;lookY=w<=700?.05:.1;}
window.addEventListener('resize',resize);resize();
let lastTime=performance.now();const targetCamera=new THREE.Vector3();
camera.position.set(0,cameraY,baseDistance);camera.lookAt(0,lookY,0);
function animate(now){
 requestAnimationFrame(animate);if(document.hidden)return;const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;const t=now*.001;
 const ease=1-Math.exp(-dt*3.2);spread=lerp(spread,targetSpread,ease);if(autoRotate&&!pointerDown&&!$('#memory').open&&now-lastInteraction>1400)targetRotation+=dt*.105;
 rotation=lerp(rotation,targetRotation,1-Math.exp(-dt*7));tilt=lerp(tilt,targetTilt,ease);tree.rotation.y=rotation;tree.rotation.x=tilt;tree.position.x=innerWidth>1000?1.1:0;tree.position.y=innerWidth<=700?-.35:0;
 const arr=dust.geometry.attributes.position.array;for(let i=0;i<particleCount*3;i++)arr[i]=lerp(basePositions[i],scatterPositions[i],spread);dust.geometry.attributes.position.needsUpdate=true;
 for(const {mesh,data,type}of objectData){data.forEach((o,i)=>{dummy.position.lerpVectors(o.p,o.s,spread);dummy.rotation.set(o.rx+spread*t*.08,o.rz+spread*.3,o.rz);dummy.scale.setScalar(o.size);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.instanceMatrix.needsUpdate=true;}
 ribbon.material.uniforms.alpha.value=.95*(1-spread*.9);orbit.material.uniforms.alpha.value=.26*(1-spread*.7);
 for(const cloud of [dust,ribbon,snow,orbit])cloud.material.uniforms.time.value=t;
 const sn=snow.geometry.attributes.position.array;for(let i=1;i<sn.length;i+=3){sn[i]-=dt*(.07+(i%7)*.016);if(sn[i]<-15)sn[i]=16;}snow.geometry.attributes.position.needsUpdate=true;
 star.rotation.y=-rotation+Math.sin(t*.45)*.2;star.material.emissiveIntensity=.9+Math.sin(t*1.6)*.2;star.scale.setScalar(1-spread*.6);star.position.y=3.8+spread*.6;halo.position.copy(star.position);halo.material.opacity=(.6+Math.sin(t*1.4)*.15)*(1-spread*.7);
 flares.forEach(({sp,p,s,phase})=>{sp.position.lerpVectors(p,s,spread);sp.material.opacity=Math.pow((Math.sin(t*1.2+phase)+1)/2,4)*.8;});
 photoObjects.forEach(({mesh,p,s,theta,i})=>{mesh.position.lerpVectors(p,s,spread);mesh.position.y+=Math.sin(t*.65+i)*.022;mesh.rotation.y=lerp(-theta+Math.PI/2,-rotation,spread);mesh.rotation.z=Math.sin(i*4)*.12+Math.sin(t*.4+i)*.025;mesh.scale.setScalar(1+spread*.55);});
 targetCamera.set(0,cameraY,baseDistance*zoom);camera.position.lerp(targetCamera,1-Math.exp(-dt*4));camera.lookAt(0,lookY,0);renderer.render(scene,camera);
}
requestAnimationFrame(animate);
async function init(){try{savedPhotos=await dbAll();}catch{toast('浏览器未开放本地存储，暂时展示示例回忆');}await rebuildPhotos();$('#rotate').setAttribute('aria-pressed',String(autoRotate));if(autoRotate)$('#rotate').classList.add('active');setTimeout(()=>{$('#loading').style.opacity='0';setTimeout(()=>$('#loading').remove(),1100);},450);}
init().catch(error=>{console.error(error);$('#loading').remove();toast('部分回忆未能载入，请刷新后重试');});
