// Camera-facing instanced sprites (one draw call): flames, smoke, steam, water spray
import * as THREE from 'three';

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// soft puff with a lit top and shaded bottom (reads as a lump of smoke in sunlight)
export const puffTex = () => canvasTex(128, 128, (g, w, h) => {
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (let i = 0; i < 9; i++) {
    const x = 64 + (rnd() - .5) * 40, y = 64 + (rnd() - .5) * 36, r = 26 + rnd() * 22;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(.6, 'rgba(255,255,255,.3)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  // shading: multiply the alpha-weighted white by a top-light gradient
  const id = g.getImageData(0, 0, w, h), d = id.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (y * w + x) * 4, l = 1.12 - .5 * (y / h); d[k] = Math.min(255, d[k] * l); d[k + 1] = Math.min(255, d[k + 1] * l); d[k + 2] = Math.min(255, d[k + 2] * l * .98); }
  g.putImageData(id, 0, 0);
});
// flame tongue: bright core at the base, orange, fading to the tip
export const flameTex = () => canvasTex(64, 128, (g, w, h) => {
  const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(255,240,190,1)'); gr.addColorStop(.25, 'rgba(255,190,80,.95)'); gr.addColorStop(.6, 'rgba(255,110,30,.7)'); gr.addColorStop(1, 'rgba(255,60,10,0)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(w / 2, 0); g.bezierCurveTo(w * .95, h * .45, w * 1.0, h * .8, w / 2, h); g.bezierCurveTo(0, h * .8, w * .05, h * .45, w / 2, 0); g.fill();
  // soften edges
  g.globalCompositeOperation = 'destination-in'; const e = g.createRadialGradient(w / 2, h * .7, 0, w / 2, h * .7, h * .7); e.addColorStop(.5, 'rgba(0,0,0,1)'); e.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = e; g.fillRect(0, 0, w, h);
});
export const dotTex = () => canvasTex(32, 32, (g, w, h) => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.5, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });

// n sprites; anchor 0 = centred, 1 = grow up from the base; additive or normal blending
export function makeSprites(scene, n, tex, { additive = false, anchor = 0, fog = true } = {}) {
  const base = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index; geo.setAttribute('position', base.getAttribute('position')); geo.setAttribute('uv', base.getAttribute('uv'));
  const pos = new Float32Array(n * 3), size = new Float32Array(n * 2), col = new Float32Array(n * 4), rot = new Float32Array(n);
  const aP = new THREE.InstancedBufferAttribute(pos, 3), aS = new THREE.InstancedBufferAttribute(size, 2), aC = new THREE.InstancedBufferAttribute(col, 4), aR = new THREE.InstancedBufferAttribute(rot, 1);
  for (const a of [aP, aS, aC, aR]) a.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('iPos', aP); geo.setAttribute('iSize', aS); geo.setAttribute('iCol', aC); geo.setAttribute('iRot', aR);
  geo.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 } },
    vertexShader: `attribute vec3 iPos; attribute vec2 iSize; attribute vec4 iCol; attribute float iRot; varying vec2 vUv; varying vec4 vCol; varying float vFogD;
      void main(){ vUv = uv; vCol = iCol; vec4 mv = modelViewMatrix * vec4(iPos, 1.);
        vec2 p = vec2(position.x, position.y + ${anchor ? '.5' : '0.'}) * iSize; float c = cos(iRot), s = sin(iRot); mv.xy += vec2(c * p.x - s * p.y, s * p.x + c * p.y);
        vFogD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D map; uniform vec3 fogColor; uniform float fogDensity; varying vec2 vUv; varying vec4 vCol; varying float vFogD;
      void main(){ vec4 t = texture2D(map, vUv); vec4 c = vec4(t.rgb * vCol.rgb, t.a * vCol.a);
        float f = 1. - exp(-fogDensity * fogDensity * vFogD * vFogD); c.rgb = mix(c.rgb, fogColor * ${additive ? '0.' : '1.'}, f);
        if (c.a < .004) discard; gl_FragColor = c; }`,
    transparent: true, depthWrite: false, depthTest: true,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = additive ? 3 : 2; scene.add(mesh);
  return {
    mesh, n,
    set(i, x, y, z, sx, sy, r, g, b, a, ro = 0) { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; size[i * 2] = sx; size[i * 2 + 1] = sy; col[i * 4] = r; col[i * 4 + 1] = g; col[i * 4 + 2] = b; col[i * 4 + 3] = a; rot[i] = ro; },
    hide(i) { size[i * 2] = size[i * 2 + 1] = 0; col[i * 4 + 3] = 0; },
    commit(fog) { aP.needsUpdate = aS.needsUpdate = aC.needsUpdate = aR.needsUpdate = true; if (fog && fog.isFogExp2) { mat.uniforms.fogColor.value.copy(fog.color); mat.uniforms.fogDensity.value = fog.density; } },
    // back-to-front order for normal blending: reorder the instance arrays by view depth
    sortBy(camera) {
      const idx = Array.from({ length: n }, (_, i) => i), v = new THREE.Vector3(), d = new Float32Array(n);
      for (let i = 0; i < n; i++) { v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]).applyMatrix4(camera.matrixWorldInverse); d[i] = v.z; }
      idx.sort((a, b) => d[a] - d[b]);
      const P2 = pos.slice(), S2 = size.slice(), C2 = col.slice(), R2 = rot.slice();
      idx.forEach((j, i) => { pos.set(P2.subarray(j * 3, j * 3 + 3), i * 3); size.set(S2.subarray(j * 2, j * 2 + 2), i * 2); col.set(C2.subarray(j * 4, j * 4 + 4), i * 4); rot[i] = R2[j]; });
    },
  };
}
