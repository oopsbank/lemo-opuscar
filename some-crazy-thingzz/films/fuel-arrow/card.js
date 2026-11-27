// card.js — a flat cartoon on an upright card in the 3D set (the lit-billboard idea of Lemo-Opuscar's hd-2d, without pixels).
// · The card's 2D canvas is redrawn every frame at roughly its projected resolution; outline widths are set in SCREEN pixels, so lines keep their weight at any shot size.
// · The card is self-lit and tinted by the light it stands in (sun / shade test against the set), so white heads stay white but warm in sun and cool in shade.
// · A hidden card turned toward the sun casts the full silhouette shadow onto the set; a soft contact blob grounds the feet.
import * as THREE from 'three';
import { Toon } from './toon.js';
import { drawChar } from './cast.js';
import { clamp, lerp } from '/core/lib.js';

const BOX = { x0: -95, x1: 95, y0: -275, y1: 15 };   // drawing box in cm (feet at y = 0)
const BW = BOX.x1 - BOX.x0, BH = BOX.y1 - BOX.y0;
const SIZES = [192, 256, 384, 512, 768, 1024, 1536, 2048];

function blobTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); return t;
}
let _blob = null;

export class Card {
  constructor(scene, spec, o = {}) {
    this.spec = spec; this.scale = (spec.height ?? 1.72) / 1.72;   // metres per 100 cm, scaled to the character's height
    this.wM = BW / 100 * this.scale; this.hM = BH / 100 * this.scale;
    this.cv = document.createElement('canvas'); this.g = this.cv.getContext('2d'); this.T = new Toon(this.g);
    this.size = 0; this.tex = null;
    // plane centred at x = 0, y = −(y0+y1)/2 cm above the feet (feet on the group origin)
    this.geo = new THREE.PlaneGeometry(this.wM, this.hM); this.geo.translate(0, -(BOX.y0 + BOX.y1) / 2 / 100 * this.scale, 0);
    this.mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: .04, side: THREE.DoubleSide, depthWrite: true, fog: false });
    this.mesh = new THREE.Mesh(this.geo, this.mat); this.mesh.renderOrder = 2;
    // shadow caster: same picture, turned to face the sun, invisible to the camera
    this.shMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, alphaTest: .5, side: THREE.DoubleSide });   // the shadow pass copies map + alphaTest from this material
    this.caster = new THREE.Mesh(this.geo, this.shMat); this.caster.castShadow = true;
    _blob = _blob || blobTex();
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(.9 * this.scale, .42 * this.scale), new THREE.MeshBasicMaterial({ map: _blob, color: '#1a1020', transparent: true, opacity: .55, depthWrite: false }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.renderOrder = 1;
    this.group = new THREE.Group(); this.group.add(this.mesh, this.caster, this.blob); scene.add(this.group);
    this.pos = new THREE.Vector3(); this.pose = {}; this.away = 1; this.light = 1; this.visible = true;
  }
  setTexSize(n) {
    if (n === this.size) return;
    this.size = n; this.cv.width = Math.round(n * BW / BH); this.cv.height = n;
    if (this.tex) this.tex.dispose();
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    this.mat.map = this.tex; this.shMat.map = this.tex; this.mat.needsUpdate = true; this.shMat.needsUpdate = true;
  }
  // per frame: camera, screen height in px, sun direction (toward the sun), tint colours, line width in screen px
  update(cam, screenH, sunDir, o = {}) {
    this.group.visible = this.visible; if (!this.visible) return;
    const p = this.pos; this.group.position.copy(p);
    // face the camera around the vertical axis (cards stay upright)
    const dx = cam.position.x - p.x, dz = cam.position.z - p.z; this.mesh.rotation.y = Math.atan2(dx, dz);
    this.caster.rotation.y = Math.atan2(sunDir.x, sunDir.z);
    // projected height → canvas resolution, px per screen px
    const a = p.clone().project(cam), b = p.clone().add(new THREE.Vector3(0, this.hM, 0)).project(cam);
    const projH = Math.max(8, Math.abs(b.y - a.y) / 2 * screenH);
    const want = projH * 1.4; this.setTexSize(SIZES.find(s => s >= want) ?? 2048);
    const k = this.size / projH;   // canvas px per screen px
    // which side is away from the sun on screen
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    this.away = right.dot(sunDir) > 0 ? -1 : 1;
    const g = this.g, T = this.T; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.cv.width, this.cv.height);
    T.reset(); const s = this.size / BH; T.scale(s); T.translate(-BOX.x0, -BOX.y0);
    const lwS = o.lw ?? 7;
    drawChar(T, this.spec, this.pose, { lw: lwS * k, limb: (o.limb ?? 15) * k, away: this.away });
    this.tex.needsUpdate = true;
    const c = this.light; this.mat.color.copy(o.shadeTint).lerp(o.sunTint, c);
    this.blob.position.set(0, .012, 0);
  }
}
