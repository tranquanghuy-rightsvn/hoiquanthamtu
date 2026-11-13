(function(){
'use strict';
const $ = id => document.getElementById(id);
if (typeof BABYLON === 'undefined') { $('err').hidden = false; $('intro').hidden = true; return; }

const canvas = $('c');
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0,0,0,1);
scene.collisionsEnabled = true;
scene.doNotHandleCursors = true;

const V3 = (x,y,z) => new BABYLON.Vector3(x,y,z);
const C3 = (r,g,b) => new BABYLON.Color3(r,g,b);
const MB = BABYLON.MeshBuilder;

function mat(name, r, g, b, opt){
  const m = new BABYLON.StandardMaterial(name, scene);
  m.diffuseColor = C3(r,g,b);
  m.specularColor = C3(0.04,0.04,0.04);
  if (opt) Object.assign(m, opt);
  return m;
}
function box(name, w, h, d, x, y, z, m, collide){
  const b = MB.CreateBox(name, {width:w, height:h, depth:d}, scene);
  b.position.set(x,y,z); b.material = m; b.checkCollisions = !!collide;
  return b;
}
function tag(mesh, id, label){ mesh.metadata = {id:id, label:label}; return mesh; }

/* ---------- Camera ---------- */
const cam = new BABYLON.UniversalCamera('cam', V3(0,1.6,-1.75), scene);
cam.setTarget(V3(0,1.1,1));
cam.minZ = 0.05; cam.fov = 1.05; cam.inertia = 0.6; cam.angularSensibility = 2000;
cam.inputs.removeByType('FreeCameraKeyboardMoveInput');
cam.checkCollisions = true; cam.ellipsoid = V3(0.3,0.8,0.3);

/* ---------- Lights ---------- */
const hemi = new BABYLON.HemisphericLight('hemi', V3(0,1,0), scene);
hemi.intensity = 0.3; hemi.groundColor = C3(0.08,0.08,0.1);
const bulbLight = new BABYLON.PointLight('bulbLight', V3(0,2.4,0), scene);
bulbLight.diffuse = C3(1,0.86,0.62); bulbLight.intensity = 0.9; bulbLight.range = 14;
const camLight = new BABYLON.SpotLight('camLight', V3(0,0,0), V3(0,0,1), 0.9, 10, scene);
camLight.parent = cam; camLight.intensity = 1.8; camLight.range = 9; camLight.diffuse = C3(1,0.96,0.85);
camLight.setEnabled(false);
const beamGlow = new BABYLON.PointLight('beamGlow', V3(0.8,2.5,1.2), scene);
beamGlow.diffuse = C3(0.7,1,0.8); beamGlow.intensity = 0.45; beamGlow.range = 4;
beamGlow.setEnabled(false);

/* ---------- Materials ---------- */
const mWall = mat('wall', 0.40,0.43,0.42);
const mFloor = mat('floor', 0.17,0.18,0.19);
const mCeil = mat('ceil', 0.27,0.28,0.29);
const mSteel = mat('steel', 0.33,0.36,0.38, {specularColor: C3(0.25,0.25,0.25)});
const mDark = mat('dark', 0.06,0.07,0.08);
const mDoor = mat('door', 0.20,0.27,0.25, {specularColor: C3(0.15,0.15,0.15)});
const mCab = mat('cab', 0.30,0.36,0.33, {specularColor: C3(0.2,0.2,0.2)});
const mCarton = mat('carton', 0.55,0.40,0.24);
const mPaper = mat('paper', 0.85,0.82,0.72);
const mJacket = mat('jacket', 0.10,0.13,0.22);
const mGlass = mat('glass', 0.04,0.06,0.08, {specularColor: C3(0.9,0.9,0.9), specularPower: 90});
const mMirror = mat('mirror', 0.70,0.82,0.88, {specularColor: C3(1,1,1), specularPower: 120, emissiveColor: C3(0.12,0.16,0.18)});
const mOrange = mat('orange', 0.95,0.45,0.10);
const mKey = mat('key', 0.03,0.10,0.05, {emissiveColor: C3(0.05,0.45,0.2)});
const mBulb = mat('bulbM', 1,0.9,0.6, {emissiveColor: C3(1,0.88,0.6)});
const mBeam = mat('beam', 1,0.95,0.7, {emissiveColor: C3(1,0.95,0.7), disableLighting: true, alpha: 0.28});
const mSpot = mat('spot', 1,1,0.85, {emissiveColor: C3(1,1,0.85), disableLighting: true, alpha: 0.16, backFaceCulling: false});
const mExit = mat('exit', 1,1,1, {emissiveColor: C3(1,1,0.95), disableLighting: true});

/* ---------- Room: 6 x 5 x 3 m ---------- */
box('floor', 6.4,0.2,5.4, 0,-0.1,0, mFloor, false);
box('ceil', 6.4,0.2,5.4, 0,3.1,0, mCeil, false);
box('wallN', 6.4,3,0.2, 0,1.5,2.6, mWall, true);
box('wallS', 6.4,3,0.2, 0,1.5,-2.6, mWall, true);
box('wallE', 0.2,3,5.4, 3.1,1.5,0, mWall, true);
box('wallW', 0.2,3,5.4, -3.1,1.5,0, mWall, true);

/* Door (north wall) with hinge */
const hinge = new BABYLON.TransformNode('hinge', scene);
hinge.position.set(2.075,0,2.44);
const door = box('door', 0.95,2.1,0.08, 0,0,0, mDoor, true);
door.parent = hinge; door.position.set(-0.475,1.05,0);
tag(door, 'door', 'Cửa sắt');
const exitGlow = box('exit', 0.95,2.1,0.01, 1.6,1.05,2.492, mExit, false);
exitGlow.isPickable = false; exitGlow.setEnabled(false);
tag(box('keypad', 0.18,0.26,0.04, 0.85,1.35,2.48, mDark, false), 'keypad', 'Bảng mã');
tag(box('keyLcd', 0.13,0.04,0.006, 0.85,1.44,2.458, mKey, false), 'keypad', 'Bảng mã');
const mBtn = mat('btn', 0.55,0.57,0.56);
for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++)
  tag(box('key'+r+c, 0.03,0.03,0.008, 0.85+(c-1)*0.042,1.385-r*0.042,2.457, mBtn, false), 'keypad', 'Bảng mã');

/* Table, notebook, chair, jacket */
tag(box('tableTop', 1.4,0.06,0.8, 0,0.75,0, mSteel, true), 'table', 'Bàn sắt');
[[-0.62,-0.32],[0.62,-0.32],[-0.62,0.32],[0.62,0.32]].forEach((p,i) => box('leg'+i, 0.05,0.72,0.05, p[0],0.36,p[1], mSteel, false));
const mNote = mat('noteM', 0.12,0.23,0.24);
const note = box('note', 0.2,0.025,0.28, -0.25,0.793,-0.08, mNote, false);
note.rotation.y = 0.3; tag(note, 'note', 'Cuốn sổ');
[['noteLabel',0.11,0.002,0.05, 0,0.0135,0.04, mPaper], ['noteBand',0.012,0.028,0.283, 0.07,0,0, mDark]].forEach(d => {
  const m = box(d[0], d[1],d[2],d[3], 0,0,0, d[7], false);
  m.parent = note; m.position.set(d[4],d[5],d[6]); tag(m, 'note', 'Cuốn sổ');
});
function makeChair(name, x, z, ry){
  const n = new BABYLON.TransformNode(name, scene);
  n.position.set(x,0,z); n.rotation.y = ry;
  const parts = [[0.42,0.04,0.42, 0,0.45,0, true], [0.42,0.2,0.03, 0,0.85,-0.195], [0.42,0.035,0.03, 0,0.62,-0.195],
    [0.035,0.5,0.035, -0.19,0.7,-0.195], [0.035,0.5,0.035, 0.19,0.7,-0.195],
    [0.035,0.45,0.035, -0.19,0.225,-0.19], [0.035,0.45,0.035, 0.19,0.225,-0.19],
    [0.035,0.45,0.035, -0.19,0.225,0.19], [0.035,0.45,0.035, 0.19,0.225,0.19],
    [0.36,0.025,0.025, 0,0.16,0.19], [0.025,0.025,0.36, -0.19,0.16,0], [0.025,0.025,0.36, 0.19,0.16,0]];
  parts.forEach((d, i) => {
    const m = box(name+i, d[0],d[1],d[2], 0,0,0, mSteel, !!d[6]);
    m.parent = n; m.position.set(d[3],d[4],d[5]); tag(m, 'chair', 'Ghế sắt');
  });
}
makeChair('chairA', 0,-0.85, 0);
makeChair('chairB', 0,0.85, Math.PI);
tag(box('jacket', 0.46,0.4,0.07, 0,0.79,-1.085, mJacket, false), 'jacket', 'Áo khoác');

/* Cabinet with gun */
tag(box('cab', 0.8,1.8,0.5, -2.55,0.9,-2.2, mCab, true), 'cab', 'Tủ sắt');
const cabInner = box('cabInner', 0.7,1.66,0.01, -2.55,0.9,-1.944, mDark, false); cabInner.isPickable = false;
const cabHinge = new BABYLON.TransformNode('cabHinge', scene);
cabHinge.position.set(-2.93,0,-1.92);
const cabDoor = box('cabDoor', 0.76,1.72,0.04, 0,0,0, mCab, false);
cabDoor.parent = cabHinge; cabDoor.position.set(0.38,0.9,0);
tag(cabDoor, 'cab', 'Tủ sắt');
const shelf = box('shelf', 0.7,0.03,0.14, -2.55,1.1,-1.88, mSteel, false);
tag(shelf, 'cab', 'Tủ sắt'); shelf.setEnabled(false);
const mBlue = mat('blue', 0.10,0.36,0.95, {specularColor: C3(0.4,0.4,0.5), emissiveColor: C3(0.02,0.07,0.2)});
function makeGun(name, pickable){
  const g = new BABYLON.TransformNode(name, scene);
  const parts = [
    box(name+'Slide', 0.30,0.06,0.045, 0.02,0.04,0, mBlue, false),
    box(name+'Barrel', 0.06,0.035,0.035, 0.19,0.035,0, mOrange, false),
    box(name+'Grip', 0.055,0.14,0.04, -0.09,-0.05,0, mBlue, false),
    box(name+'Guard', 0.09,0.012,0.03, -0.01,-0.03,0, mBlue, false),
    box(name+'Sight', 0.02,0.015,0.015, 0.14,0.078,0, mDark, false)
  ];
  parts[2].rotation.z = 0.25;
  parts.forEach(m => { m.parent = g; m.isPickable = !!pickable; if (pickable) tag(m, 'gun', 'Khẩu súng'); });
  return {node:g, parts:parts};
}
const gun = makeGun('gun', true).node;
gun.position.set(-2.55,1.15,-1.87);
gun.setEnabled(false);
/* Gun held in hand (first-person view) */
const handObj = makeGun('hand', false), hand = handObj.node;
hand.parent = cam; hand.position.set(0.2,-0.19,0.48); hand.rotation.y = -Math.PI/2 + 0.06;
handObj.parts.forEach(m => { m.renderingGroupId = 1; });
hand.setEnabled(false);
/* Flashlight and mirror held in hand */
const handFlash = new BABYLON.TransformNode('handFlash', scene);
handFlash.parent = cam; handFlash.position.set(0.22,-0.2,0.45);
const hfBody = MB.CreateCylinder('hfBody', {height:0.2, diameter:0.05}, scene);
hfBody.parent = handFlash; hfBody.rotation.x = Math.PI/2; hfBody.material = mDark;
const hfHead = MB.CreateCylinder('hfHead', {height:0.05, diameter:0.075}, scene);
hfHead.parent = handFlash; hfHead.rotation.x = Math.PI/2; hfHead.position.set(0,0,0.12); hfHead.material = mSteel;
const handMirror = box('handMirror', 0.22,0.012,0.22, 0,0,0, mMirror, false);
handMirror.parent = cam; handMirror.position.set(0.24,-0.2,0.5); handMirror.rotation.x = -0.9;
[hfBody, hfHead, handMirror].forEach(m => { m.isPickable = false; m.renderingGroupId = 1; });
handFlash.setEnabled(false); handMirror.setEnabled(false);

/* Wooden puzzle box on the table */
const mWood = mat('wood', 0.42,0.27,0.14);
const mWood2 = mat('wood2', 0.62,0.44,0.24);
const mFelt = mat('felt', 0.25,0.05,0.07);
tag(box('wbox', 0.36,0.14,0.26, 0.38,0.85,0.08, mWood, false), 'wbox', 'Hộp gỗ');
tag(box('wfelt', 0.32,0.005,0.22, 0.38,0.9225,0.08, mFelt, false), 'wbox', 'Hộp gỗ');
const wHinge = new BABYLON.TransformNode('wHinge', scene);
wHinge.position.set(0.38,0.925,0.21);
[['wlid',0.37,0.025,0.27, 0,0.0125,-0.13, mWood],
 ['wbarA',0.34,0.012,0.03, 0,0.031,-0.13, mWood2],
 ['wbarB',0.03,0.012,0.24, -0.07,0.031,-0.13, mWood2],
 ['wbarC',0.03,0.012,0.24, 0.07,0.031,-0.13, mWood2]].forEach(d => {
  const m = box(d[0], d[1],d[2],d[3], 0,0,0, d[7], false);
  m.parent = wHinge; m.position.set(d[4],d[5],d[6]); tag(m, 'wbox', 'Hộp gỗ');
});
const flashItem = MB.CreateCylinder('flashItem', {height:0.2, diameter:0.05}, scene);
flashItem.rotation.z = Math.PI/2; flashItem.position.set(0.33,0.952,0.04); flashItem.material = mDark;
tag(flashItem, 'flashItem', 'Đèn pin'); flashItem.setEnabled(false);

/* Carton, bin, one-way mirror, speaker, calendar */
tag(box('carton', 0.6,0.4,0.5, 2.5,0.2,-2.05, mCarton, true), 'carton', 'Thùng carton');
tag(box('cartonTop', 0.54,0.01,0.44, 2.5,0.402,-2.05, mPaper, false), 'carton', 'Thùng carton');
const lidHinge = new BABYLON.TransformNode('lidHinge', scene);
lidHinge.position.set(2.5,0.41,-2.3);
const lid = box('lid', 0.62,0.02,0.52, 0,0,0, mCarton, false);
lid.parent = lidHinge; lid.position.set(0,0.01,0.26); tag(lid, 'carton', 'Thùng carton');
const mirrorItem = box('mirrorItem', 0.3,0.012,0.3, 2.5,0.416,-2.05, mMirror, false);
mirrorItem.rotation.y = 0.4; tag(mirrorItem, 'mirrorItem', 'Tấm gương'); mirrorItem.setEnabled(false);
const bin = MB.CreateCylinder('bin', {height:0.4, diameter:0.3}, scene);
bin.position.set(2.65,0.2,1.9); bin.material = mDark; tag(bin, 'bin', 'Thùng rác');
tag(box('oneway', 2.2,1.0,0.02, 0.7,1.6,-2.49, mGlass, false), 'oneway', 'Tấm kính tối màu');
tag(box('speaker', 0.3,0.2,0.2, -2.8,2.8,2.3, mDark, false), 'speaker', 'Loa');
box('calBack', 0.02,0.52,0.38, 2.99,1.6,-0.6, mPaper, false).isPickable = false;
const TODAY = new Date();
const WEEKDAY = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'][TODAY.getDay()];
const calTex = new BABYLON.DynamicTexture('calTex', {width:256, height:352}, scene, true);
(function(){
  const g = calTex.getContext();
  g.fillStyle = '#f4f0e4'; g.fillRect(0,0,256,352);
  g.fillStyle = '#b3372f'; g.fillRect(0,0,256,70);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#ffffff'; g.font = 'bold 27px Arial, sans-serif';
  g.fillText('Tháng ' + (TODAY.getMonth()+1) + ' năm ' + TODAY.getFullYear(), 128, 36);
  g.fillStyle = '#1d2226'; g.font = 'bold 170px Arial, sans-serif';
  g.fillText(String(TODAY.getDate()), 128, 180);
  g.font = 'bold 36px Arial, sans-serif';
  g.fillText(WEEKDAY, 128, 304);
  calTex.update();
})();
const mCal = new BABYLON.StandardMaterial('calM', scene);
mCal.diffuseTexture = calTex; mCal.specularColor = C3(0,0,0); mCal.emissiveColor = C3(0.14,0.14,0.14);
const cal = MB.CreatePlane('cal', {width:0.36, height:0.5}, scene);
cal.position.set(2.975,1.6,-0.6); cal.rotation.y = Math.PI/2; cal.material = mCal;
tag(cal, 'cal', 'Tờ lịch');

/* Bulb */
const wire = MB.CreateCylinder('wire', {height:0.5, diameter:0.015}, scene);
wire.position.set(0,2.75,0); wire.material = mDark; wire.isPickable = false;
const bulb = MB.CreateSphere('bulb', {diameter:0.16}, scene);
bulb.position.set(0,2.45,0); bulb.material = mBulb; tag(bulb, 'bulb', 'Bóng đèn');
const bulbHit = MB.CreateSphere('bulbHit', {diameter:0.55}, scene);
bulbHit.position.set(0,2.45,0); bulbHit.visibility = 0; tag(bulbHit, 'bulb', 'Bóng đèn');

/* Flashlight slot (west wall) */
box('holderPlate', 0.02,0.22,0.18, -2.99,1.2,1.2, mSteel, false);
box('holderArm', 0.38,0.025,0.05, -2.81,1.146,1.2, mSteel, false);
box('holderBrace', 0.02,0.1,0.03, -2.97,1.1,1.2, mSteel, false);
[-2.86,-2.7].forEach((x, i) => {
  const r = MB.CreateTorus('holderRing'+i, {diameter:0.09, thickness:0.014, tessellation:24}, scene);
  r.position.set(x,1.2,1.2); r.rotation.z = Math.PI/2; r.material = mSteel;
});
const slotHit = box('slotHit', 0.4,0.4,0.4, -2.82,1.2,1.2, mSteel, false);
slotHit.visibility = 0; tag(slotHit, 'slot', 'Khe kẹp trên tường');
const flashP = new BABYLON.TransformNode('flashP', scene);
const fBody = MB.CreateCylinder('fBody', {height:0.24, diameter:0.06}, scene);
fBody.parent = flashP; fBody.rotation.z = Math.PI/2; fBody.position.set(-2.78,1.2,1.2); fBody.material = mDark;
const fHead = MB.CreateCylinder('fHead', {height:0.06, diameter:0.09}, scene);
fHead.parent = flashP; fHead.rotation.z = Math.PI/2; fHead.position.set(-2.65,1.2,1.2); fHead.material = mSteel;
fBody.isPickable = false; fHead.isPickable = false;
flashP.setEnabled(false);

/* Mirror tray (east side): swivels in 45° steps, 8 positions */
const MIR_TILT = 0.07;                          /* mirror leans back a little, so reflections rise */
const MIR_X = 2.5, MIR_Y = 1.2, MIR_Z = 1.2;
tag(box('pedestal', 0.3,0.95,0.3, MIR_X,0.475,MIR_Z, mSteel, true), 'tray', 'Giá xoay');
const swivel = new BABYLON.TransformNode('swivel', scene);
swivel.position.set(MIR_X,1.03,MIR_Z);
const tray = box('tray', 0.44,0.03,0.44, 0,0,0, mSteel, false);
tray.parent = swivel; tray.position.set(0.024,MIR_Y - 1.03,0); tray.rotation.z = Math.PI/2 - MIR_TILT; tag(tray, 'tray', 'Giá xoay');
const mirrorP = box('mirrorP', 0.38,0.015,0.38, 0,0,0, mMirror, false);
mirrorP.parent = swivel; mirrorP.position.set(0,MIR_Y - 1.03,0); mirrorP.rotation.z = Math.PI/2 - MIR_TILT;
tag(mirrorP, 'tray', 'Tấm gương (xoay)'); mirrorP.setEnabled(false);
const MIR_STEP = Math.PI / 4;
let mirrorIdx = 5, turning = false;             /* 0 = facing the flashlight; starts turned away */
swivel.rotation.y = mirrorIdx * MIR_STEP;

/* Beams: flashlight -> mirror -> a wall. Only 3 mirror positions face the light: 7, 0, 1.
   Each throws a spot on a different wall; only position 0 (west wall) shows the code. */
const pA = V3(-2.62,1.2,1.2), pM = V3(MIR_X - 0.01,MIR_Y,MIR_Z);
const beam1 = MB.CreateTube('beam1', {path:[pA,pM], radius:0.025, tessellation:12}, scene);
beam1.material = mBeam; beam1.isPickable = false; beam1.setEnabled(false);
const CODE_IDX = 1;                              /* mirror turned toward the wall beside the door */
function reflect(idx){
  const yaw = idx * MIR_STEP, c = Math.cos(MIR_TILT);
  const n = V3(-c*Math.cos(yaw), Math.sin(MIR_TILT), c*Math.sin(yaw));
  const d = V3(1,0,0);
  if (BABYLON.Vector3.Dot(d, n) >= 0) return null;
  return d.subtract(n.scale(2 * BABYLON.Vector3.Dot(d, n)));
}
function wallHit(o, r){
  const W = [[0, 2.985, V3(-1,0,0)], [0, -2.985, V3(1,0,0)], [2, 2.485, V3(0,0,-1)], [2, -2.485, V3(0,0,1)], [1, 2.985, V3(0,-1,0)]];
  let best = null;
  W.forEach(w => {
    const k = ['x','y','z'][w[0]], dk = r[k];
    if (Math.abs(dk) < 1e-6) return;
    const t = (w[1] - o[k]) / dk;
    if (t > 0.05 && (!best || t < best.t)) best = {t:t, n:w[2]};
  });
  return {p:o.add(r.scale(best.t)), n:best.n};
}
const REFL = {};
[7, 0, 1].forEach(idx => {
  const r = reflect(idx), hit = wallHit(pM, r);
  const beam = MB.CreateTube('beamR'+idx, {path:[pM, hit.p], radius:0.03, tessellation:12}, scene);
  beam.material = mBeam;
  const spot = MB.CreateDisc('spotR'+idx, {radius: idx === CODE_IDX ? 0.36 : 0.32, tessellation:40}, scene);
  spot.material = mSpot;
  spot.position = hit.p.add(hit.n.scale(0.006));
  spot.lookAt(spot.position.subtract(hit.n));      /* disc front faces the room */
  [beam, spot].forEach(m => { m.isPickable = false; m.setEnabled(false); });
  REFL[idx] = {beam:beam, spot:spot, p:hit.p, n:hit.n, seen:false};
});

/* Hidden code on the wall, drawn with seven-segment bars: it reads I L E O.
   Turned upside down it is 0 3 7 1. */
const codeTex = new BABYLON.DynamicTexture('codeTex', {width:480, height:192}, scene, true);
codeTex.hasAlpha = true;
(function(){
  const g = codeTex.getContext();
  g.clearRect(0,0,480,192);
  const W = 64, H = 128, T = 13, GAP = 46, x0 = (480 - (4*W + 3*GAP)) / 2, y0 = 32;
  const SEG = {a:[0,0,W,T], g:[0,(H-T)/2,W,T], d:[0,H-T,W,T],
               f:[0,0,T,H/2], e:[0,H/2,T,H/2], b:[W-T,0,T,H/2], c:[W-T,H/2,T,H/2]};
  g.shadowColor = 'rgba(200,255,220,.9)'; g.shadowBlur = 14; g.fillStyle = '#d8ffe4';
  ['ef','def','adefg','abcdef'].forEach((segs, n) => {
    segs.split('').forEach(k => { const q = SEG[k]; g.fillRect(x0 + n*(W+GAP) + q[0], y0 + q[1], q[2], q[3]); });
  });
  codeTex.update();
})();
const mCode = new BABYLON.StandardMaterial('codeM', scene);
mCode.diffuseTexture = codeTex; mCode.emissiveTexture = codeTex; mCode.opacityTexture = codeTex;
mCode.disableLighting = true; mCode.alpha = 0; mCode.backFaceCulling = false;
const wallCode = MB.CreatePlane('wallCode', {width:0.6, height:0.24}, scene);
(function(){
  const h = REFL[CODE_IDX];
  wallCode.position = h.p.add(h.n.scale(0.01));
  wallCode.lookAt(wallCode.position.subtract(h.n));
})();
wallCode.material = mCode; wallCode.isPickable = false; wallCode.setEnabled(false);

/* ================= Decoration ================= */
function deco(m){ m.isPickable = false; return m; }
function canvasTex(name, w, h, draw){
  const t = new BABYLON.DynamicTexture(name, {width:w, height:h}, scene, true);
  draw(t.getContext(), w, h); t.update(); return t;
}
function speckle(g, w, h, n, a){
  for (let i = 0; i < n; i++) {
    const v = Math.random() < 0.5 ? 0 : 255;
    g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (Math.random()*a) + ')';
    g.fillRect(Math.random()*w, Math.random()*h, 1 + Math.random()*2, 1 + Math.random()*2);
  }
}
/* Painted concrete walls: pale upper half, dark green lower band, drip stains */
const wallTex = canvasTex('wallTex', 1024, 512, (g, w, h) => {
  g.fillStyle = '#8f9a94'; g.fillRect(0,0,w,h);
  g.fillStyle = '#4b5d55'; g.fillRect(0,h*0.62,w,h*0.38);
  g.fillStyle = '#2c3833'; g.fillRect(0,h*0.62-4,w,6);
  speckle(g, w, h, 9000, 0.07);
  for (let i = 0; i < 14; i++) {
    const x = Math.random()*w, y0 = Math.random()*h*0.5, len = 40 + Math.random()*160;
    const gr = g.createLinearGradient(0,y0,0,y0+len);
    gr.addColorStop(0,'rgba(30,35,30,.22)'); gr.addColorStop(1,'rgba(30,35,30,0)');
    g.fillStyle = gr; g.fillRect(x,y0,3 + Math.random()*10,len);
  }
  const gr = g.createLinearGradient(0,h*0.84,0,h);
  gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(1,'rgba(0,0,0,.38)');
  g.fillStyle = gr; g.fillRect(0,h*0.84,w,h*0.16);
});
const mWallT = new BABYLON.StandardMaterial('wallT', scene);
mWallT.diffuseTexture = wallTex; mWallT.specularColor = C3(0.03,0.03,0.03);
[[6,0,2.497,0],[6,0,-2.497,Math.PI],[5,2.997,0,Math.PI/2],[5,-2.997,0,-Math.PI/2]].forEach((d, i) => {
  const p = deco(MB.CreatePlane('wallSkin'+i, {width:d[0], height:3}, scene));
  p.position.set(d[1],1.5,d[2]); p.rotation.y = d[3]; p.material = mWallT; p.receiveShadows = true;
});
/* Tiled floor */
const floorTex = canvasTex('floorTex', 256, 256, (g, w, h) => {
  g.fillStyle = '#3b3f42'; g.fillRect(0,0,w,h);
  speckle(g, w, h, 2600, 0.09);
  g.strokeStyle = '#191b1d'; g.lineWidth = 5; g.strokeRect(0,0,w,h);
});
floorTex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE; floorTex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
floorTex.uScale = 10; floorTex.vScale = 8.33;
const mFloorT = new BABYLON.StandardMaterial('floorT', scene);
mFloorT.diffuseTexture = floorTex; mFloorT.specularColor = C3(0.12,0.12,0.12); mFloorT.specularPower = 40;
const floorSkin = deco(MB.CreatePlane('floorSkin', {width:6, height:5}, scene));
floorSkin.rotation.x = Math.PI/2; floorSkin.position.y = 0.002; floorSkin.material = mFloorT; floorSkin.receiveShadows = true;
/* Wood grain for the puzzle box */
mWood.diffuseTexture = canvasTex('woodTex', 256, 256, (g, w, h) => {
  g.fillStyle = '#7a5230'; g.fillRect(0,0,w,h);
  for (let i = 0; i < 70; i++) {
    g.strokeStyle = 'rgba(' + (Math.random() < 0.5 ? '40,24,10' : '170,125,80') + ',' + (0.08 + Math.random()*0.2) + ')';
    g.lineWidth = 1 + Math.random()*2;
    const y = Math.random()*h; g.beginPath(); g.moveTo(0,y);
    g.bezierCurveTo(w*0.3,y + Math.random()*10 - 5, w*0.6,y + Math.random()*10 - 5, w,y + Math.random()*6 - 3); g.stroke();
  }
});
mWood.diffuseColor = C3(1,1,1);

const mBase = mat('base', 0.12,0.14,0.14);
const mPipe = mat('pipe', 0.32,0.26,0.2, {specularColor: C3(0.3,0.3,0.3)});
const mBrass = mat('brass', 0.78,0.62,0.26, {specularColor: C3(0.7,0.6,0.3), specularPower: 50});
const mShade = mat('shade', 0.1,0.2,0.16, {specularColor: C3(0.3,0.3,0.3)});
const mTape = mat('tape', 0.74,0.63,0.42);
const mLed = mat('led', 0.2,0,0, {emissiveColor: C3(1,0.1,0.1), disableLighting: true});
const mLens = mat('lens', 1,0.95,0.7, {emissiveColor: C3(1,0.95,0.7), disableLighting: true});
/* Baseboards, door frame, handle and window */
[[4.1,0.1,0.02, -0.95,0.05,2.487],[0.9,0.1,0.02, 2.55,0.05,2.487],[6,0.1,0.02, 0,0.05,-2.487],[0.02,0.1,5, 2.987,0.05,0],[0.02,0.1,5, -2.987,0.05,0]]
  .forEach((d, i) => deco(box('skirt'+i, d[0],d[1],d[2], d[3],d[4],d[5], mBase, false)));
[[0.06,2.16,0.07, 1.095,1.08,2.465],[0.06,2.16,0.07, 2.105,1.08,2.465],[1.07,0.06,0.07, 1.6,2.13,2.465]]
  .forEach((d, i) => deco(box('frame'+i, d[0],d[1],d[2], d[3],d[4],d[5], mDark, false)));
[['doorPlate',0.04,0.12,0.02, -0.38,-0.05,-0.045, mSteel], ['doorLever',0.13,0.025,0.02, -0.33,-0.04,-0.065, mSteel], ['doorWin',0.24,0.34,0.01, 0,0.55,-0.042, mGlass]]
  .forEach(d => { const m = box(d[0], d[1],d[2],d[3], 0,0,0, d[7], false); m.parent = door; m.position.set(d[4],d[5],d[6]); tag(m, 'door', 'Cửa sắt'); });
/* Lamp shade and ceiling conduit */
const shade = deco(MB.CreateCylinder('shade', {diameterTop:0.1, diameterBottom:0.42, height:0.18, tessellation:24}, scene));
shade.position.set(0,2.6,0); shade.material = mShade;
deco(box('conduit', 0.03,0.03,2.5, 0,2.985,-1.25, mDark, false));
/* Table details */
[[1.24,0.03,0.03, 0,0.2,-0.32],[1.24,0.03,0.03, 0,0.2,0.32],[0.03,0.03,0.64, -0.62,0.2,0],[0.03,0.03,0.64, 0.62,0.2,0],[1.3,0.07,0.02, 0,0.685,-0.36],[1.3,0.07,0.02, 0,0.685,0.36]]
  .forEach((d, i) => deco(box('tableBar'+i, d[0],d[1],d[2], d[3],d[4],d[5], mSteel, false)));
const cuffRing = MB.CreateTorus('cuffRing', {diameter:0.09, thickness:0.012, tessellation:20}, scene);
cuffRing.position.set(-0.05,0.787,0.27); cuffRing.material = mSteel; tag(cuffRing, 'table', 'Bàn sắt');
deco(box('cuffPlate', 0.06,0.006,0.04, -0.05,0.783,0.3, mDark, false));
/* Cabinet handle and vents */
[['cabHandle',0.02,0.14,0.03, 0.3,0.1,0.035, mSteel], ['cabVent0',0.3,0.012,0.006, 0,0.55,0.021, mDark], ['cabVent1',0.3,0.012,0.006, 0,0.59,0.021, mDark],
 ['cabVent2',0.3,0.012,0.006, 0,0.63,0.021, mDark], ['cabVent3',0.3,0.012,0.006, 0,0.67,0.021, mDark]]
  .forEach(d => { const m = box(d[0], d[1],d[2],d[3], 0,0,0, d[7], false); m.parent = cabDoor; m.position.set(d[4],d[5],d[6]); tag(m, 'cab', 'Tủ sắt'); });
/* Wooden box brass corners, carton tape */
[[-0.17,-0.01],[0.17,-0.01],[-0.17,-0.25],[0.17,-0.25]].forEach((q, i) => {
  const m = box('brass'+i, 0.035,0.012,0.035, 0,0,0, mBrass, false);
  m.parent = wHinge; m.position.set(q[0],0.031,q[1]); tag(m, 'wbox', 'Hộp gỗ');
});
tag(box('wLock', 0.05,0.05,0.008, 0.38,0.86,-0.052, mBrass, false), 'wbox', 'Hộp gỗ');
const tape = box('tape', 0.07,0.004,0.52, 0,0,0, mTape, false);
tape.parent = lidHinge; tape.position.set(0,0.022,0.26); tag(tape, 'carton', 'Thùng carton');
/* One-way glass frame, calendar binding, mirror stand base */
[[2.3,0.05,0.04, 0.7,2.125,-2.478],[2.3,0.05,0.04, 0.7,1.075,-2.478],[0.05,1.0,0.04, -0.425,1.6,-2.478],[0.05,1.0,0.04, 1.825,1.6,-2.478]]
  .forEach((d, i) => deco(box('glassFrame'+i, d[0],d[1],d[2], d[3],d[4],d[5], mSteel, false)));
deco(box('calBind', 0.024,0.03,0.38, 2.976,1.86,-0.6, mDark, false));
deco(box('standBase', 0.46,0.03,0.46, MIR_X,0.015,MIR_Z, mSteel, false));
const standJoint = deco(MB.CreateCylinder('standJoint', {height:0.08, diameter:0.07}, scene));
standJoint.position.set(MIR_X,0.98,MIR_Z); standJoint.material = mDark;
/* Pipes and wall vent */
const pipeH = deco(MB.CreateCylinder('pipeH', {height:5, diameter:0.07}, scene));
pipeH.rotation.x = Math.PI/2; pipeH.position.set(2.93,2.72,0); pipeH.material = mPipe;
const pipeV = deco(MB.CreateCylinder('pipeV', {height:3, diameter:0.07}, scene));
pipeV.position.set(2.93,1.5,2.42); pipeV.material = mPipe;
deco(box('vent', 0.02,0.3,0.5, -2.985,2.5,-0.5, mDark, false));
for (let i = 0; i < 5; i++) deco(box('ventSlat'+i, 0.026,0.02,0.46, -2.98,2.39 + i*0.055,-0.5, mSteel, false));
/* Security camera with a blinking light */
const cctv = new BABYLON.TransformNode('cctv', scene);
cctv.position.set(2.72,2.78,-2.25); cctv.rotation.y = -0.75; cctv.rotation.x = 0.35;
const cctvBody = box('cctvBody', 0.1,0.09,0.22, 0,0,0, mDark, false); cctvBody.parent = cctv;
const cctvLens = MB.CreateCylinder('cctvLens', {height:0.05, diameter:0.06}, scene);
cctvLens.parent = cctv; cctvLens.rotation.x = Math.PI/2; cctvLens.position.set(0,0,0.13); cctvLens.material = mGlass;
const cctvLed = MB.CreateSphere('cctvLed', {diameter:0.022}, scene);
cctvLed.parent = cctv; cctvLed.position.set(0.032,0.03,0.112); cctvLed.material = mLed;
[cctvBody, cctvLens, cctvLed].forEach(m => tag(m, 'cctv', 'Camera'));
deco(box('cctvMount', 0.03,0.2,0.03, 2.72,2.9,-2.25, mDark, false));
/* Flashlight lenses */
const hfLens = deco(MB.CreateCylinder('hfLens', {height:0.004, diameter:0.062}, scene));
hfLens.parent = handFlash; hfLens.rotation.x = Math.PI/2; hfLens.position.set(0,0,0.146); hfLens.material = mLens; hfLens.renderingGroupId = 1;
const fLens = deco(MB.CreateCylinder('fLens', {height:0.004, diameter:0.075}, scene));
fLens.parent = flashP; fLens.rotation.z = Math.PI/2; fLens.position.set(-2.619,1.2,1.2); fLens.material = mLens;

/* Soft glow on lit things, shadows from the ceiling bulb */
try { const glow = new BABYLON.GlowLayer('glow', scene); glow.intensity = 0.4; } catch (e) {}
try {
  const sg = new BABYLON.ShadowGenerator(1024, bulbLight);
  sg.usePoissonSampling = true; sg.setDarkness(0.45);
  const SKIP = /^(wall|floor|ceil|beam|seg|hand|hf|bulb|wire|shade|conduit|exit|spot|slotHit|cal|gun|skirt|frame|glassFrame|oneway|vent|pipe|cctv|speaker|muzzle|flashItem|mirrorItem|mirrorP|fBody|fHead|fLens|shelf|cabInner|key)/;
  scene.meshes.forEach(m => { if (!SKIP.test(m.name)) sg.addShadowCaster(m); });
} catch (e) {}

/* ---------- State ---------- */
const S = {hasFlash:false, hasMirror:false, hasGun:false, placedFlash:false, placedMirror:false,
           flashOn:false, dark:false, cabOpen:false, cartonOpen:false, boxOpen:false, held:null, codeSeen:false, solved:false};
let modal = true;

/* ---------- Audio ---------- */
let AC = null, hum = null;
function audioInit(){
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
    o.type = 'sawtooth'; o.frequency.value = 100; f.type = 'lowpass'; f.frequency.value = 380; g.gain.value = 0.012;
    o.connect(f); f.connect(g); g.connect(AC.destination); o.start();
    hum = g;
  } catch (e) { AC = null; }
}
function tone(freq, dur, type, vol, delay){
  if (!AC) return;
  const t = AC.currentTime + (delay || 0);
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(vol || 0.07, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.03);
}
function noise(dur, freq, vol, type){
  if (!AC) return;
  const n = Math.floor(AC.sampleRate * dur);
  const buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random()*2 - 1) * (1 - i/n);
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = buf; f.type = type || 'lowpass'; f.frequency.value = freq; g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(AC.destination); s.start();
}
const sfx = {
  pick(){ tone(660,0.08,'sine',0.06); tone(880,0.12,'sine',0.06,0.07); },
  click(){ tone(1300,0.03,'square',0.035); },
  key(){ tone(900,0.05,'square',0.03); },
  metal(){ noise(0.35,900,0.18); tone(140,0.3,'triangle',0.05); },
  shot(){ noise(0.12,2600,0.5); },
  glass(){ noise(0.55,5000,0.22,'highpass'); tone(2400,0.2,'sine',0.03,0.05); tone(3100,0.25,'sine',0.02,0.12); },
  bad(){ tone(110,0.35,'sawtooth',0.1); },
  ok(){ tone(523,0.15,'sine',0.07); tone(659,0.15,'sine',0.07,0.12); tone(784,0.3,'sine',0.07,0.24); },
  door(){ noise(1.3,260,0.22); tone(70,1.1,'sawtooth',0.03); },
  stat(){ noise(0.3,2800,0.07,'bandpass'); }
};

/* ---------- Subtitles ---------- */
const sub = $('sub');
let typeTimer = null, hideTimer = null;
function say(text, who, keep){
  clearInterval(typeTimer); clearTimeout(hideTimer);
  sub.className = who ? 'j' : '';
  sub.textContent = '';
  let holder = sub;
  if (who) { const b = document.createElement('b'); b.textContent = who; sub.appendChild(b); holder = document.createElement('span'); sub.appendChild(holder); }
  let i = 0;
  typeTimer = setInterval(() => {
    i++; holder.textContent = text.slice(0, i);
    if (i >= text.length) { clearInterval(typeTimer); typeDone = null; if (!keep) hideTimer = setTimeout(() => { sub.textContent = ''; }, 3200 + text.length * 35); }
  }, who ? 34 : 20);
  typeDone = () => { clearInterval(typeTimer); typeDone = null; holder.textContent = text; };
}
let typeDone = null;
/* "Tiếp" button: first press finishes the line being typed, the next press moves on */
function nextLine(){
  const btn = $('next');
  btn.hidden = false; btn.focus();
  return new Promise(res => {
    const go = () => {
      if (typeDone) { typeDone(); return; }
      btn.onclick = null; window.removeEventListener('keydown', key);
      btn.hidden = true; res();
    };
    const key = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
    btn.onclick = go; window.addEventListener('keydown', key);
  });
}
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Inventory ---------- */
const inv = $('inv');
const ITEMS = [['flash','Đèn pin'], ['mirror','Tấm gương'], ['gun','Súng nhựa']];
function owned(id){
  if (id === 'flash') return S.hasFlash && !S.placedFlash;
  if (id === 'mirror') return S.hasMirror && !S.placedMirror;
  return S.hasGun;
}
const ICON = {
  flash: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="19" width="25" height="10" rx="2" fill="#2b3136" stroke="#0e1113"/><path d="M30 17l10-4v22l-10-4z" fill="#6a757d" stroke="#0e1113"/><rect x="12" y="21" width="6" height="3" rx="1" fill="#e8b45a"/><path d="M42 16l4-2M43 24h4M42 32l4 2" stroke="#ffe9a8" stroke-width="2" stroke-linecap="round"/></svg>',
  mirror: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="7" width="28" height="34" rx="3" fill="#b9d6e2" stroke="#5a4a36" stroke-width="3"/><path d="M16 30l11-15M23 34l9-12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".85"/></svg>',
  gun: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 24h10l-3 15H6z" fill="#1a5cf2" stroke="#0c2f86"/><rect x="5" y="14" width="34" height="10" rx="2" fill="#1a5cf2" stroke="#0c2f86"/><rect x="39" y="16" width="6" height="6" fill="#f2731a" stroke="#8a3d08"/><path d="M19 24c0 7 7 7 8 0" fill="none" stroke="#0c2f86" stroke-width="2"/><rect x="30" y="11" width="4" height="3" fill="#0c2f86"/></svg>',
  diary: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="11" y="6" width="27" height="36" rx="3" fill="#1f3a3d" stroke="#0e1c1e" stroke-width="2"/><rect x="11" y="6" width="5" height="36" fill="#142628"/><rect x="20" y="13" width="14" height="7" rx="1" fill="#e9e2cf"/><path d="M34 7v34" stroke="#d0483f" stroke-width="2"/></svg>'
};
function invButton(icon, name, note, on, fn){
  const b = document.createElement('button');
  b.innerHTML = ICON[icon] + '<span></span><small></small>';
  b.children[1].textContent = name; b.children[2].textContent = note;
  if (on) b.className = 'on';
  b.onclick = () => { b.blur(); fn(); };
  inv.appendChild(b);
}
function drawInv(){
  inv.textContent = '';
  ITEMS.forEach(it => {
    if (!owned(it[0])) return;
    const on = S.held === it[0];
    invButton(it[0], it[1], on ? 'đang cầm' : '', on, () => toggleHeld(it[0]));
  });
  if (S.hasDiary) invButton('diary', 'Cuốn sổ', 'phím N', false, openDiary);
}
function openDiary(){
  if (!S.hasDiary || modal || S.solved) return;
  sfx.click();
  $('diaryCover').hidden = false; $('diaryPage').hidden = true;
  openModal('diary');
}

/* ---------- Item held in hand ---------- */
function setHeld(id){
  S.held = (id && owned(id)) ? id : null;
  hand.setEnabled(S.held === 'gun');
  handFlash.setEnabled(S.held === 'flash');
  handMirror.setEnabled(S.held === 'mirror');
  camLight.setEnabled(S.dark && S.held === 'flash' && !S.solved);
  canvas.style.cursor = S.held === 'gun' ? 'crosshair' : 'grab';
  drawInv();
}
function toggleHeld(id){
  if (!owned(id) || S.solved || modal) return;
  sfx.click(); setHeld(S.held === id ? null : id);
  if (S.held === 'gun') say('Cầm súng lên. Click để bắn, bấm G để cất.');
}
let lastShot = 0;
const mBullet = mat('bullet', 1,0.55,0.15, {emissiveColor: C3(1,0.5,0.12)});
const mTrail = mat('trail', 1,0.85,0.5, {emissiveColor: C3(1,0.85,0.5), disableLighting: true, alpha: 0.55});
const mMuzzle = mat('muzzle', 1,0.9,0.5, {emissiveColor: C3(1,0.9,0.55), disableLighting: true, alpha: 0.9});
const muzzle = MB.CreateSphere('muzzle', {diameter:0.07, segments:8}, scene);
muzzle.parent = hand; muzzle.position.set(0.24,0.035,0); muzzle.material = mMuzzle;
muzzle.renderingGroupId = 1; muzzle.isPickable = false; muzzle.setEnabled(false);
const bullets = [], pellets = [];
function fire(t, p){
  const now = Date.now();
  if (now - lastShot < 350) return;
  lastShot = now;
  tween(180, k => { const r = Math.sin(k * Math.PI); hand.position.z = 0.48 - 0.05*r; hand.rotation.x = -0.18*r; });
  muzzle.setEnabled(true); muzzle.scaling.setAll(1);
  tween(90, k => { muzzle.scaling.setAll(1 + k); }, () => muzzle.setEnabled(false));
  sfx.shot();
  /* Bullet leaves the muzzle and flies to where the player aimed */
  hand.computeWorldMatrix(true); muzzle.computeWorldMatrix(true);
  const from = muzzle.getAbsolutePosition().clone();
  let to;
  if (p && p.hit) to = p.pickedPoint.clone();
  else { const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, null, cam); to = ray.origin.add(ray.direction.scale(8)); }
  if (BABYLON.Vector3.Distance(cam.position, to) < BABYLON.Vector3.Distance(cam.position, from) + 0.05) to = from.add(cam.getDirection(V3(0,0,1)).scale(0.3));
  const node = new BABYLON.TransformNode('bulletN', scene);
  node.position = from.clone(); node.lookAt(to);
  const ball = MB.CreateSphere('bullet', {diameter:0.03, segments:8}, scene);
  ball.parent = node; ball.material = mBullet;
  const trail = MB.CreateCylinder('trail', {height:0.22, diameterTop:0.018, diameterBottom:0.002, tessellation:8}, scene);
  trail.parent = node; trail.rotation.x = Math.PI/2; trail.position.z = -0.12; trail.material = mTrail;
  [ball, trail].forEach(m => { m.isPickable = false; });
  const dist = BABYLON.Vector3.Distance(from, to);
  const dir = to.subtract(from).normalize();
  bullets.push({node:node, from:from, dir:dir, dist:dist, d:0, speed:22, onHit: () => {
    if (t && t.id === 'bulb' && !S.dark) { shoot(); return; }
    tone(1800, 0.04, 'square', 0.03);
    spawnPellet(to, dir, p && p.hit ? p.getNormal(true) : null);
    if (t && t.id === 'bulb') say('Chỉ còn cái đuôi đèn.');
    else if (t) say('Đang cầm súng. Bấm G để cất rồi mới lục soát được.');
    else say('Viên đạn nhựa nảy ra, chẳng để lại gì.');
  }});
}
function spawnPellet(at, dir, n){
  const m = MB.CreateSphere('pellet', {diameter:0.025, segments:6}, scene);
  m.material = mBullet; m.isPickable = false;
  m.position = at.subtract(dir.scale(0.03));
  let v = dir.scale(-1.6);
  if (n) v = dir.subtract(n.scale(2 * BABYLON.Vector3.Dot(dir, n))).scale(1.8);
  v.x += (Math.random() - 0.5) * 0.6; v.z += (Math.random() - 0.5) * 0.6; v.y += 0.6;
  shards.push({m:m, v:v});
  pellets.push(m);
  if (pellets.length > 12) pellets.shift().dispose();
}
function moveBullets(dt){
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.d = Math.min(b.dist, b.d + b.speed * dt / 1000);
    b.node.position = b.from.add(b.dir.scale(b.d));
    if (b.d >= b.dist) { bullets.splice(i,1); b.node.dispose(false, true); b.onHit(); }
  }
}

/* ---------- Movement ---------- */
const held = {}, vel = {x:0, z:0}, WALK = 2.7;
window.addEventListener('keydown', e => {
  if (modal) return;
  held[e.code] = true;
  if (e.code === 'KeyN') { openDiary(); return; }
  if (e.code === 'KeyG') toggleHeld('gun');
  if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3') {
    const list = ITEMS.filter(it => owned(it[0])), it = list[Number(e.code.slice(5)) - 1];
    if (it) toggleHeld(it[0]);
  }
  if (e.code.indexOf('Arrow') === 0 || e.code === 'Space') e.preventDefault();
});
window.addEventListener('keyup', e => { held[e.code] = false; });
window.addEventListener('blur', () => { for (const k in held) held[k] = false; });
document.querySelectorAll('.pad [data-k]').forEach(b => {
  const k = b.dataset.k;
  const on = e => { e.preventDefault(); if (modal) return; held[k] = true; b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (_) {} };
  const off = () => { held[k] = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on);
  ['pointerup','pointercancel','lostpointercapture'].forEach(t => b.addEventListener(t, off));
  b.addEventListener('contextmenu', e => e.preventDefault());
});
function walk(dt){
  const s = Math.min(dt, 50) / 1000;
  let fx = 0, fz = 0;
  if (!modal) {
    if (held.KeyW || held.ArrowUp) fz += 1;
    if (held.KeyS || held.ArrowDown) fz -= 1;
    if (held.KeyD || held.ArrowRight) fx += 1;
    if (held.KeyA || held.ArrowLeft) fx -= 1;
    const tr = (held.TurnR ? 1 : 0) - (held.TurnL ? 1 : 0), lk = (held.LookD ? 1 : 0) - (held.LookU ? 1 : 0);
    if (tr) cam.rotation.y += tr * 1.9 * s;
    if (lk) cam.rotation.x = Math.max(-1.2, Math.min(1.2, cam.rotation.x + lk * 1.3 * s));
  }
  const len = Math.hypot(fx, fz) || 1; fx /= len; fz /= len;
  const yaw = cam.rotation.y, sn = Math.sin(yaw), cs = Math.cos(yaw);
  const tx = (sn*fz + cs*fx) * WALK, tz = (cs*fz - sn*fx) * WALK;
  const a = 1 - Math.exp(-s * 16);
  vel.x += (tx - vel.x) * a; vel.z += (tz - vel.z) * a;
  if (Math.abs(vel.x) < 0.01 && Math.abs(vel.z) < 0.01) return;
  const k = s * (1 - cam.inertia);
  cam.cameraDirection.x += vel.x * k;
  cam.cameraDirection.z += vel.z * k;
}

/* ---------- Tweens and shards ---------- */
const tweens = [], shards = [];
function tween(ms, fn, done){ tweens.push({t:0, ms:ms, fn:fn, done:done}); }
let flick = 1;
scene.onBeforeRenderObservable.add(() => {
  const dt = engine.getDeltaTime();
  walk(dt);
  moveBullets(dt);
  for (let i = tweens.length - 1; i >= 0; i--) {
    const w = tweens[i]; w.t += dt;
    const k = Math.min(1, w.t / w.ms);
    w.fn(k*k*(3 - 2*k));
    if (k >= 1) { tweens.splice(i,1); if (w.done) w.done(); }
  }
  for (let i = shards.length - 1; i >= 0; i--) {
    const s = shards[i]; s.v.y -= 9.8 * dt / 1000;
    s.m.position.addInPlace(s.v.scale(dt / 1000));
    s.m.rotation.x += 0.2; s.m.rotation.z += 0.15;
    if (s.m.position.y < 0.02) { s.m.position.y = 0.02; shards.splice(i,1); }
  }
  if (!S.dark) {
    if (Math.random() < 0.012) flick = 0.45;
    flick += (1 - flick) * 0.18;
    bulbLight.intensity = 0.9 * flick;
  }
  mLed.emissiveColor.r = (Date.now() % 1400 < 700) ? 1 : 0.12;
  cam.position.y = 1.6;
});

/* ---------- Puzzle logic ---------- */
function refresh(){
  const on = S.placedFlash && S.flashOn && S.dark;
  const hitIdx = (on && S.placedMirror && REFL[mirrorIdx]) ? mirrorIdx : -1;
  beam1.setEnabled(on);
  Object.keys(REFL).forEach(k => { const r = REFL[k], v = Number(k) === hitIdx; r.beam.setEnabled(v); r.spot.setEnabled(v); });
  beamGlow.setEnabled(hitIdx >= 0);
  if (hitIdx >= 0) beamGlow.position = REFL[hitIdx].p.add(REFL[hitIdx].n.scale(0.5));
  const code = hitIdx === CODE_IDX;
  wallCode.setEnabled(code);
  camLight.setEnabled(S.dark && S.held === 'flash' && !S.solved);
  if (code && !S.codeSeen) {
    S.codeSeen = true; REFL[hitIdx].seen = true;
    tween(1400, k => { mCode.alpha = k; });
    say('Tia sáng hắt lên bức tường cạnh cửa. Có mấy nét sáng hiện ra… là chữ gì vậy?');
  } else if (code) mCode.alpha = 1;
  else if (hitIdx >= 0 && !REFL[hitIdx].seen) {
    REFL[hitIdx].seen = true;
    say('Tia sáng hắt lên tường, chỉ là một vệt sáng trống trơn. Có lẽ chưa đúng góc.');
  }
  drawInv();
}
function shoot(){
  const fl = $('flash'); fl.style.transition = 'none'; fl.style.opacity = '0.5';
  setTimeout(() => { fl.style.transition = 'opacity .5s'; fl.style.opacity = '0'; }, 40);
  sfx.glass();
  S.dark = true;
  bulb.setEnabled(false); bulbHit.metadata.label = 'Đuôi đèn';
  bulbLight.intensity = 0;
  if (hum) hum.gain.value = 0.004;
  for (let i = 0; i < 10; i++) {
    const m = box('shard'+i, 0.03,0.004,0.04, 0,2.45,0, mGlass, false);
    m.isPickable = false;
    shards.push({m:m, v:V3((Math.random()-0.5)*2.4, Math.random()*1.2, (Math.random()-0.5)*2.4)});
  }
  tween(500, k => { hemi.intensity = 0.32 - 0.14*k; });
  say('Bóng đèn vỡ tan. Căn phòng tối sầm lại.');
  refresh();
}

function use(id){
  switch (id) {
    case 'note':
      S.hasDiary = true; note.setEnabled(false); sfx.pick(); drawInv(); openDiary();
      break;
    case 'table': say('Bàn sắt, lạnh ngắt. Mình đã gục ở đây bao lâu rồi?'); break;
    case 'chair': say('Ghế sắt, loại hay thấy trong phòng hỏi cung.'); break;
    case 'jacket': say('Áo khoác của mình à? Các túi đều trống.'); break;
    case 'cab':
      if (!S.cabOpen) {
        S.cabOpen = true; sfx.metal(); shelf.setEnabled(true); gun.setEnabled(true);
        tween(700, k => { cabHinge.rotation.y = -1.55 * k; });
        say('Tủ không khóa. Bên trong có… một khẩu súng?');
      } else if (!S.hasGun) use('gun');
      else say('Tủ trống.');
      break;
    case 'gun':
      S.hasGun = true; gun.setEnabled(false); sfx.pick(); setHeld('gun');
      say('Súng bắn đạn nhựa, xanh như đồ chơi. Click để bắn, bấm G để cất.');
      refresh();
      break;
    case 'carton':
      if (!S.cartonOpen) {
        S.cartonOpen = true; noise(0.25,700,0.15); mirrorItem.setEnabled(true);
        tween(600, k => { lidHinge.rotation.x = -1.75 * k; });
        say('Trong thùng toàn giấy vụn… và một thứ gì đó lấp lánh.');
      } else if (!S.hasMirror) use('mirrorItem');
      else say('Chỉ còn giấy vụn.');
      break;
    case 'mirrorItem':
      S.hasMirror = true; mirrorItem.setEnabled(false); sfx.pick(); setHeld('mirror');
      say('Một tấm gương nhỏ. Mình cầm nó trên tay.');
      refresh();
      break;
    case 'wbox':
      if (!S.boxOpen) { sfx.click(); openModal('boxp'); }
      else if (!S.hasFlash) use('flashItem');
      else say('Hộp đã trống.');
      break;
    case 'flashItem':
      S.hasFlash = true; flashItem.setEnabled(false); sfx.pick(); setHeld('flash');
      say('Một cây đèn pin, vẫn còn pin. Mình cầm nó trên tay.');
      refresh();
      break;
    case 'bin': say('Thùng rác trống. Sạch đến mức đáng ngờ.'); break;
    case 'oneway': say('Kính một chiều. Mình chỉ thấy chính mình. Có ai đang đứng ở phía bên kia không?'); break;
    case 'speaker': say('Một cái loa gắn trên trần. Nó đang im lặng.'); break;
    case 'cal': say('Hôm nay là ngày ' + TODAY.getDate() + ' tháng ' + (TODAY.getMonth()+1) + ' năm ' + TODAY.getFullYear() + ' sao? Sao mình không có một chút ký ức gì hết.'); break;
    case 'slot':
      if (!S.placedFlash) {
        if (S.held === 'flash') {
          S.placedFlash = true; S.flashOn = true; flashP.setEnabled(true); sfx.click(); setHeld(null);
          slotHit.metadata.label = 'Đèn pin (bật / tắt)';
          say(S.dark ? 'Vừa khít. Tia sáng chĩa thẳng sang bên kia phòng.' : 'Vừa khít.');
          refresh();
        } else if (S.held === 'mirror') say('Tấm gương không vừa cái kẹp này.');
        else if (S.hasFlash) say('Phải cầm đèn pin trên tay đã.');
        else say('Một cái kẹp kim loại trên tường, vừa một vật hình trụ.');
      } else {
        S.flashOn = !S.flashOn; sfx.click();
        say(S.flashOn ? 'Bật đèn pin.' : 'Tắt đèn pin.');
        refresh();
      }
      break;
    case 'tray':
      if (!S.placedMirror) {
        if (S.held === 'mirror') {
          S.placedMirror = true; mirrorP.setEnabled(true); sfx.click(); setHeld(null);
          say('Tấm gương khớp vào giá. Cái giá này xoay được.'); refresh();
        } else if (S.held === 'flash') say('Đèn pin không nằm yên được trên cái giá nghiêng này.');
        else if (S.hasMirror) say('Phải cầm tấm gương trên tay đã.');
        else say('Một cái giá nghiêng gắn trên trục xoay. Thứ gì đó phẳng từng được đặt ở đây.');
      } else if (!turning) {
        turning = true;
        const a0 = swivel.rotation.y, next = (mirrorIdx + 1) % 8;
        mirrorIdx = -1; refresh(); sfx.metal();
        tween(300, k => { swivel.rotation.y = a0 + k * MIR_STEP; }, () => { mirrorIdx = next; swivel.rotation.y = next * MIR_STEP; turning = false; refresh(); });
      }
      break;
    case 'cctv': say('Một cái camera. Đèn đỏ vẫn nhấp nháy. Có ai đó đang xem.'); break;
    case 'bulb':
      if (S.dark) say('Chỉ còn cái đuôi đèn.');
      else if (S.hasGun) say('Bóng đèn treo quá cao. Phải cầm súng lên đã (phím G).');
      else say('Bóng đèn treo quá cao, không với tới. Phòng này cũng chẳng có công tắc nào.');
      break;
    case 'door':
    case 'keypad':
      if (S.solved) break;
      sfx.click(); entry = ''; drawLcd(); openModal('pad');
      break;
  }
}

/* ---------- Pointer ---------- */
const hover = $('hover');
const FAR = {bulb:1, speaker:1, cctv:1};
function findTag(mesh){ let m = mesh; while (m) { if (m.metadata && m.metadata.id) return m.metadata; m = m.parent; } return null; }
let downX = 0, downY = 0;
scene.onPointerObservable.add(pi => {
  if (modal) return;
  const T = BABYLON.PointerEventTypes;
  if (pi.type === T.POINTERDOWN) { downX = scene.pointerX; downY = scene.pointerY; return; }
  if (pi.type !== T.POINTERMOVE && pi.type !== T.POINTERUP) return;
  const p = scene.pick(scene.pointerX, scene.pointerY);
  const t = (p && p.hit) ? findTag(p.pickedMesh) : null;
  if (pi.type === T.POINTERMOVE) {
    hover.textContent = t ? t.label : '';
    hover.style.opacity = t ? '1' : '0';
    canvas.style.cursor = S.held === 'gun' ? 'crosshair' : (t ? 'pointer' : 'grab');
    return;
  }
  if (Math.hypot(scene.pointerX - downX, scene.pointerY - downY) > 8) return;
  if (S.held === 'gun') { fire(t, p); return; }
  if (!t) return;
  if (p.distance > 3.2 && !FAR[t.id]) { say('Xa quá. Phải lại gần hơn.'); return; }
  use(t.id);
});

/* ---------- Modals ---------- */
function openModal(id){ modal = true; cam.detachControl(); hover.style.opacity = '0'; $(id).hidden = false; }
function closeModal(id){ $(id).hidden = true; modal = false; cam.attachControl(canvas, true); canvas.focus(); }
$('padClose').onclick = () => closeModal('pad');
$('boxClose').onclick = () => closeModal('boxp');
$('diaryCover').onclick = () => { $('diaryCover').hidden = true; $('diaryPage').hidden = false; $('diaryText').focus(); };
$('diaryClose').onclick = () => {
  closeModal('diary');
  if (!S.diarySeen) { S.diarySeen = true; say('Sổ trống trơn. Mình giữ nó bên người. Bấm N để mở lại.'); }
};

/* ---------- Wooden box lock: sliding blocks, shortest solution is 17 slides ---------- */
const RH_INIT = [
  {r:2,c:0,len:2,h:true,key:true}, {r:4,c:1,len:2,h:true}, {r:3,c:5,len:2,h:false}, {r:0,c:1,len:3,h:true},
  {r:5,c:1,len:3,h:true}, {r:2,c:3,len:2,h:false}, {r:4,c:0,len:2,h:false}, {r:1,c:1,len:2,h:true},
  {r:1,c:5,len:2,h:false}, {r:0,c:4,len:2,h:false}, {r:4,c:3,len:2,h:true}, {r:2,c:2,len:2,h:false}, {r:5,c:4,len:2,h:true}
];
const RH_COL = ['#d9b45a','#a8743f','#96643a','#b98a52','#8a5a33','#c29a63','#b07d47','#9c6b3c','#a57a48','#8f6238','#bd9058','#94683d','#ad8250'];
const CELL = 44, OFF = 18, rhEls = [];
let rh = [], rhMoves = 0, rhDone = false;
function rhMsg(t){ $('boxMsg').textContent = t || ('Số lần trượt: ' + rhMoves); }
function rhPlace(i){ rhEls[i].style.transform = 'translate(' + (OFF + rh[i].c*CELL) + 'px,' + (OFF + rh[i].r*CELL) + 'px)'; }
function rhReset(){ rh = RH_INIT.map(b => Object.assign({}, b)); rhMoves = 0; rh.forEach((b, i) => rhPlace(i)); rhMsg(); }
function rhBusy(r, c, skip){
  if (r < 0 || r > 5 || c < 0 || c > 5) return true;
  return rh.some((b, i) => i !== skip && (b.h ? (b.r === r && c >= b.c && c < b.c + b.len) : (b.c === c && r >= b.r && r < b.r + b.len)));
}
function openBox(){
  closeModal('boxp'); S.boxOpen = true; sfx.ok();
  flashItem.setEnabled(true);
  tween(700, k => { wHinge.rotation.x = 1.9 * k; });
  say('Nắp hộp bật mở. Bên trong có một cây đèn pin.');
}
function rhMove(i, dir, quiet){
  if (rhDone) return false;
  const b = rh[i];
  const r = b.h ? b.r : (dir > 0 ? b.r + b.len : b.r - 1);
  const c = b.h ? (dir > 0 ? b.c + b.len : b.c - 1) : b.c;
  if (rhBusy(r, c, i)) {
    if (quiet) return false;
    tone(150, 0.08, 'square', 0.04);
    const inner = rhEls[i].firstChild;
    inner.classList.remove('no'); void inner.getBoundingClientRect(); inner.classList.add('no');
    return false;
  }
  if (b.h) b.c += dir; else b.r += dir;
  rhMoves++; noise(0.08, 900, 0.1); rhPlace(i); rhMsg();
  if (b.key && b.c === 4) {
    rhDone = true;
    setTimeout(() => {
      rhEls[i].style.transform = 'translate(' + (OFF + 7*CELL) + 'px,' + (OFF + b.r*CELL) + 'px)';
      sfx.metal(); rhMsg('Thanh đồng trượt ra khỏi khe. Nắp hộp lỏng ra.');
    }, 250);
    setTimeout(openBox, 1400);
  }
  return true;
}
(function(){
  const NS = 'http://www.w3.org/2000/svg', svg = $('boxSvg');
  RH_INIT.forEach((b, i) => {
    const w = (b.h ? b.len : 1) * CELL - 4, h = (b.h ? 1 : b.len) * CELL - 4;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'blk'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button');
    g.setAttribute('aria-label', (b.key ? 'Thanh đồng' : 'Thanh gỗ') + (b.h ? ' nằm ngang' : ' dựng dọc'));
    const inner = document.createElementNS(NS, 'g');
    const a1 = b.h ? '11,' + (h/2+2) + ' 19,' + (h/2-4) + ' 19,' + (h/2+8) : (w/2+2) + ',11 ' + (w/2-4) + ',19 ' + (w/2+8) + ',19';
    const a2 = b.h ? (w-7) + ',' + (h/2+2) + ' ' + (w-15) + ',' + (h/2-4) + ' ' + (w-15) + ',' + (h/2+8) : (w/2+2) + ',' + (h-7) + ' ' + (w/2-4) + ',' + (h-15) + ' ' + (w/2+8) + ',' + (h-15);
    inner.innerHTML =
      '<rect x="2" y="2" width="' + w + '" height="' + h + '" rx="5" fill="' + RH_COL[i] + '" stroke="#2a1b0d" stroke-width="2"/>' +
      '<polygon points="' + a1 + '" fill="#2a1b0d" fill-opacity=".45"/>' +
      '<polygon points="' + a2 + '" fill="#2a1b0d" fill-opacity=".45"/>' +
      (b.key ? '<circle cx="' + (w/2+2) + '" cy="' + (h/2+2) + '" r="6" fill="#2a1b0d"/>' : '');
    g.appendChild(inner); svg.appendChild(g); rhEls.push(g);
    /* Drag a block along its track; a plain click still slides it one cell */
    let drag = null, dragged = false;
    g.addEventListener('pointerdown', e => {
      drag = {x:e.clientX, y:e.clientY, steps:0, blocked:false}; dragged = false;
      try { g.setPointerCapture(e.pointerId); } catch (_) {}
    });
    g.addEventListener('pointermove', e => {
      if (!drag) return;
      const raw = b.h ? e.clientX - drag.x : e.clientY - drag.y;
      if (Math.abs(raw) > 6) dragged = true;
      if (!dragged) return;
      const cells = raw / (svg.getBoundingClientRect().width / 300) / CELL;
      while (cells - drag.steps > 0.5 || cells - drag.steps < -0.5) {
        const dir = cells > drag.steps ? 1 : -1;
        if (!rhMove(i, dir, true)) {
          if (!drag.blocked) { drag.blocked = true; tone(150, 0.08, 'square', 0.04); }
          break;
        }
        drag.steps += dir; drag.blocked = false;
      }
    });
    ['pointerup','pointercancel'].forEach(t => g.addEventListener(t, () => { drag = null; }));
    g.addEventListener('click', e => {
      if (dragged) { dragged = false; return; }
      const rc = g.getBoundingClientRect();
      const dir = b.h ? (e.clientX < rc.left + rc.width/2 ? -1 : 1) : (e.clientY < rc.top + rc.height/2 ? -1 : 1);
      rhMove(i, dir);
    });
    g.addEventListener('keydown', e => {
      let dir = 0;
      if (b.h) dir = e.key === 'ArrowLeft' ? -1 : (e.key === 'ArrowRight' ? 1 : 0);
      else dir = e.key === 'ArrowUp' ? -1 : (e.key === 'ArrowDown' ? 1 : 0);
      if (dir) { e.preventDefault(); rhMove(i, dir); }
    });
  });
  rhReset();
})();
$('boxReset').onclick = () => { if (!rhDone) rhReset(); };

/* ---------- Keypad ---------- */
let entry = '';
const lcd = $('lcd'), keys = $('keys');
function drawLcd(){ lcd.textContent = entry.padEnd(4, '_'); }
function press(k){
  if ($('pad').hidden) return;
  if (k === 'x') { entry = entry.slice(0,-1); sfx.key(); drawLcd(); return; }
  if (k === 'ok') { check(); return; }
  if (entry.length >= 4) return;
  entry += k; sfx.key(); drawLcd();
  if (entry.length === 4) setTimeout(check, 250);
}
function check(){
  if (entry.length < 4) return;
  if (entry === '0371') { win(); return; }
  sfx.bad(); entry = ''; drawLcd();
  const b = $('padBox'); b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad');
}
['1','2','3','4','5','6','7','8','9','x','0','ok'].forEach(k => {
  const b = document.createElement('button');
  b.textContent = k === 'x' ? 'Xóa' : (k === 'ok' ? 'Nhập' : k);
  b.onclick = () => press(k);
  keys.appendChild(b);
});
window.addEventListener('keydown', e => {
  if ($('pad').hidden) return;
  if (e.key >= '0' && e.key <= '9') press(e.key);
  else if (e.key === 'Backspace') press('x');
  else if (e.key === 'Enter') press('ok');
  else if (e.key === 'Escape') closeModal('pad');
});

/* ---------- Ending ---------- */
async function win(){
  S.solved = true; setHeld(null); sfx.ok();
  mKey.emissiveColor = C3(0.2,1,0.5);
  await wait(500);
  closeModal('pad'); modal = true; cam.detachControl();
  document.body.classList.add('ending');
  $('help').hidden = true; refresh();
  sfx.door();
  door.checkCollisions = false; exitGlow.setEnabled(true);
  bulbLight.position.set(1.6,1.6,2.1); bulbLight.diffuse = C3(1,1,0.95);
  tween(1600, k => { hinge.rotation.y = -1.25 * k; bulbLight.intensity = 1.1 * k; });
  say('0371… Tay mình bấm dãy số này như đã bấm cả nghìn lần.');
  await wait(4200);
  const lines = [
    '0371.',
    'Anh có nhận ra con số đó không, thanh tra? Số hiệu của anh đấy.',
    'Anh từng là cảnh sát số một của Sở. Chưa vụ án nào làm khó được anh.',
    'Cho đến cái đêm anh đụng độ tôi. Một phát súng, và anh quên sạch.',
    'Tôi là J. Ngủ ngon nhé. Mai gặp lại.'
  ];
  for (const l of lines) { sfx.stat(); say(l, 'Ngài J', true); await nextLine(); }
  sub.textContent = '';
  say('J… Mình từng là cảnh sát. Và hắn là kẻ đã bắn mình.');
  await wait(4200);
  $('fade').style.opacity = '1';
  await wait(2400);
  sub.textContent = '';
  $('end').hidden = false;
}
$('again').onclick = () => { try { location.reload(); } catch (e) {} };

/* ---------- Start ---------- */
$('start').onclick = async () => {
  audioInit();
  $('intro').hidden = true;
  modal = false; cam.attachControl(canvas, true); canvas.focus();
  $('fade').style.opacity = '0';
  await wait(1200);
  say('Đầu mình… Đây là đâu? Mình là ai?');
  await wait(4600);
  if (!S.solved && !S.hasFlash && !S.hasGun && !S.hasMirror) say('Trên bàn có một cuốn sổ và một cái hộp gỗ.');
  setTimeout(() => { $('help').style.transition = 'opacity 2s'; $('help').style.opacity = '0.35'; }, 15000);
};

/* Keep held items inside the frame on narrow (portrait) screens */
const HELD = [[hand, 0.2, -0.19], [handFlash, 0.22, -0.2], [handMirror, 0.24, -0.2]];
function fitHeld(){
  const th = Math.tan(cam.fov / 2) * engine.getAspectRatio(cam);
  const narrow = th < 0.8, k = narrow ? Math.max(0.6, th / 0.8) : 1;
  HELD.forEach(([m, x, y]) => {
    m.position.x = Math.min(x, m.position.z * th * 0.5);
    m.position.y = narrow ? y * 0.6 : y;
    m.scaling.setAll(k);
  });
}
fitHeld();
engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => { engine.resize(); fitHeld(); });
})();
