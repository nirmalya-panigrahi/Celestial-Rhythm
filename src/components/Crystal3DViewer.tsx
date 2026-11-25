import {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import type {CrystalItem} from '../types/astral';
import {CRYSTAL_PALETTES, CrystalSpecimenGraphic} from './VisualAssets';

interface Crystal3DViewerProps {
  crystal: CrystalItem;
}

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function createBandedMalachiteTexture(
  light: string,
  mid: string,
  dark: string,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, 256, 256);
    const centers = [
      [84, 90, 95],
      [176, 154, 82],
      [110, 196, 62],
    ];
    for (const [cx, cy, maxR] of centers) {
      for (let r = maxR; r > 4; r -= 7) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = r % 21 < 7 ? light : r % 21 < 14 ? mid : dark;
        ctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStriatedTexture(light: string, mid: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = mid;
    ctx.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 4) {
      ctx.fillStyle = x % 8 === 0 ? light : mid;
      ctx.globalAlpha = x % 12 === 0 ? 0.55 : 0.2;
      ctx.fillRect(x, 0, 2, 256);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createHexPrismGeometry(radius: number, height: number): THREE.BufferGeometry {
  const shaftH = height * 0.72;
  const tipH = height * 0.28;
  const shaft = new THREE.CylinderGeometry(radius, radius * 1.05, shaftH, 6, 1);
  shaft.translate(0, shaftH / 2, 0);

  const tip = new THREE.ConeGeometry(radius, tipH, 6, 1);
  tip.translate(0, shaftH + tipH / 2, 0);

  // Merge shaft and pyramidal termination cleanly into one BufferGeometry
  const sNonIdx = shaft.toNonIndexed();
  const tNonIdx = tip.toNonIndexed();
  const sPos = sNonIdx.getAttribute('position') as THREE.BufferAttribute;
  const tPos = tNonIdx.getAttribute('position') as THREE.BufferAttribute;
  const sNorm = sNonIdx.getAttribute('normal') as THREE.BufferAttribute;
  const tNorm = tNonIdx.getAttribute('normal') as THREE.BufferAttribute;

  const totalVerts = sPos.count + tPos.count;
  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);

  positions.set(sPos.array as Float32Array, 0);
  positions.set(tPos.array as Float32Array, sPos.count * 3);
  normals.set(sNorm.array as Float32Array, 0);
  normals.set(tNorm.array as Float32Array, sNorm.count * 3);

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.computeVertexNormals();

  shaft.dispose();
  tip.dispose();
  sNonIdx.dispose();
  tNonIdx.dispose();
  return merged;
}

export function Crystal3DViewer({crystal}: Crystal3DViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglReady, setWebglReady] = useState<boolean>(() => hasWebGL());
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !webglReady) return;

    const isSoftwareGl = detectSoftwareGl();
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglReady(false);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));

    const width = Math.max(240, container.clientWidth || 380);
    const height = Math.max(240, container.clientHeight || 320);
    renderer.setSize(width, height);

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.innerHTML = '';
    container.appendChild(canvas);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => setContextLost(false);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 1.45, 4.4);

    const controls = new OrbitControls(camera, canvas);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.7;

    // 3-point mineralogical studio lighting
    scene.add(new THREE.HemisphereLight(0xc7d2fe, 0x070a14, 0.9));
    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    keyLight.position.set(3.5, 5, 3.5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.3);
    rimLight.position.set(-4, 1.5, -3.5);
    scene.add(rimLight);

    const disposables: Array<{dispose: () => void}> = [];
    const cluster = new THREE.Group();
    cluster.position.y = -0.35;
    scene.add(cluster);

    const [lightHex, midHex, darkHex] = CRYSTAL_PALETTES[crystal.id] ?? [
      '#e2e8f0',
      '#8ab4f8',
      '#1e293b',
    ];

    const isMetallic = crystal.id === 'pyrite' || crystal.id === 'hematite';
    const isIridescent =
      crystal.id === 'labradorite' || crystal.id === 'moonstone' || crystal.id === 'sunstone';
    const isOpaqueMineral =
      crystal.id === 'malachite' ||
      crystal.id === 'lapis-lazuli' ||
      crystal.id === 'red-jasper' ||
      crystal.id === 'obsidian' ||
      crystal.id === 'chrysocolla' ||
      crystal.id === 'rhodonite' ||
      crystal.id === 'rhodochrosite' ||
      crystal.id === 'tigers-eye';

    let proceduralTex: THREE.CanvasTexture | null = null;
    if (crystal.id === 'malachite') {
      proceduralTex = createBandedMalachiteTexture(lightHex, midHex, darkHex);
      disposables.push(proceduralTex);
    } else if (crystal.id === 'selenite' || crystal.id === 'kyanite' || crystal.id === 'tigers-eye') {
      proceduralTex = createStriatedTexture(lightHex, midHex);
      disposables.push(proceduralTex);
    }

    const primaryMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(isMetallic ? lightHex : midHex),
      map: proceduralTex,
      metalness: isMetallic ? 0.92 : isOpaqueMineral ? 0.12 : 0.04,
      roughness: isMetallic ? 0.16 : isOpaqueMineral ? 0.24 : 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      ior: isMetallic ? 1.5 : 1.68,
      iridescence: isIridescent ? 0.95 : 0.18,
      iridescenceIOR: 1.45,
      transmission: isSoftwareGl || isMetallic || isOpaqueMineral ? 0 : 0.72,
      thickness: 1.4,
      attenuationColor: new THREE.Color(darkHex),
      attenuationDistance: 1.5,
      transparent: isSoftwareGl && !isMetallic && !isOpaqueMineral,
      opacity: isSoftwareGl && !isMetallic && !isOpaqueMineral ? 0.78 : 1,
      emissive: new THREE.Color(darkHex),
      emissiveIntensity: 0.18,
    });
    disposables.push(primaryMat);

    const sys = crystal.crystalSystem.toLowerCase();

    if (sys.includes('isometric')) {
      // Cluster of 7 interpenetrating isometric cubes / dodecahedra
      const cubeGeo = new THREE.BoxGeometry(0.75, 0.75, 0.75);
      disposables.push(cubeGeo);
      const specs = [
        {pos: [0, 0.42, 0], rot: [0.2, 0.4, 0.1], s: 1.15},
        {pos: [-0.46, 0.24, 0.28], rot: [0.5, 0.8, 0.3], s: 0.72},
        {pos: [0.48, 0.28, -0.22], rot: [-0.3, 0.5, 0.6], s: 0.8},
        {pos: [0.16, 0.32, 0.45], rot: [0.7, 0.2, -0.4], s: 0.62},
        {pos: [-0.26, 0.22, -0.42], rot: [0.1, -0.6, 0.5], s: 0.68},
        {pos: [0.35, 0.75, 0.12], rot: [0.4, 0.3, 0.7], s: 0.48},
      ];
      specs.forEach((sp) => {
        const m = new THREE.Mesh(cubeGeo, primaryMat);
        m.position.set(sp.pos[0], sp.pos[1], sp.pos[2]);
        m.rotation.set(sp.rot[0], sp.rot[1], sp.rot[2]);
        m.scale.setScalar(sp.s);
        cluster.add(m);
      });
    } else if (crystal.id === 'malachite') {
      // Botryoidal velvet-emerald crystal domes
      const domeGeo = new THREE.SphereGeometry(0.55, 28, 24);
      disposables.push(domeGeo);
      const domes = [
        {pos: [0, 0.38, 0], s: 1.15},
        {pos: [-0.52, 0.22, 0.24], s: 0.78},
        {pos: [0.5, 0.26, -0.18], s: 0.82},
        {pos: [0.22, 0.22, 0.48], s: 0.66},
        {pos: [-0.25, 0.18, -0.46], s: 0.68},
        {pos: [0.05, 0.74, 0.14], s: 0.52},
      ];
      domes.forEach((d) => {
        const m = new THREE.Mesh(domeGeo, primaryMat);
        m.position.set(d.pos[0], d.pos[1], d.pos[2]);
        m.scale.setScalar(d.s);
        cluster.add(m);
      });
    } else if (sys.includes('monoclinic') || sys.includes('triclinic') || sys.includes('orthorhombic')) {
      // Radiating fan of 9 elongated monoclinic/triclinic crystal blades
      const bladeGeo = new THREE.BoxGeometry(0.28, 1.45, 0.14);
      bladeGeo.translate(0, 0.65, 0);
      disposables.push(bladeGeo);
      for (let i = 0; i < 9; i++) {
        const angle = (i / 9) * Math.PI * 2;
        const tilt = i === 0 ? 0.05 : 0.28 + (i % 3) * 0.14;
        const m = new THREE.Mesh(bladeGeo, primaryMat);
        m.position.set(Math.cos(angle) * (i === 0 ? 0 : 0.24), 0.04, Math.sin(angle) * (i === 0 ? 0 : 0.24));
        m.rotation.set(Math.sin(angle) * tilt, angle, Math.cos(angle) * tilt);
        const sc = i === 0 ? 1.15 : 0.68 + (i % 3) * 0.16;
        m.scale.set(sc, sc * (0.9 + (i % 2) * 0.2), sc);
        cluster.add(m);
      }
    } else if (sys.includes('amorphous')) {
      // Conchoidal obsidian glassy shards
      const shardGeo = new THREE.ConeGeometry(0.45, 1.55, 5);
      shardGeo.translate(0, 0.72, 0);
      disposables.push(shardGeo);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const m = new THREE.Mesh(shardGeo, primaryMat);
        m.position.set(Math.cos(a) * (i === 0 ? 0 : 0.28), 0, Math.sin(a) * (i === 0 ? 0 : 0.28));
        m.rotation.set(Math.sin(a) * 0.25, a * 1.4, Math.cos(a) * 0.25);
        m.scale.setScalar(i === 0 ? 1.15 : 0.62 + (i % 3) * 0.15);
        cluster.add(m);
      }
    } else {
      // Multi-point Hexagonal/Trigonal terminated quartz cluster (9 prisms)
      const mainPrismGeo = createHexPrismGeometry(0.24, 1.55);
      const sidePrismGeo = createHexPrismGeometry(0.16, 1.05);
      disposables.push(mainPrismGeo, sidePrismGeo);

      const mainPoint = new THREE.Mesh(mainPrismGeo, primaryMat);
      mainPoint.rotation.set(0.08, 0.2, -0.06);
      cluster.add(mainPoint);

      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = 0.28 + (i % 2) * 0.16;
        const tilt = 0.26 + (i % 3) * 0.15;
        const side = new THREE.Mesh(sidePrismGeo, primaryMat);
        side.position.set(Math.cos(angle) * r, 0.02, Math.sin(angle) * r);
        side.rotation.set(Math.sin(angle) * tilt, angle, -Math.cos(angle) * tilt);
        side.scale.setScalar(0.75 + (i % 3) * 0.18);
        cluster.add(side);
      }
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();

    const afterDraw = (cb: () => void) => {
      try {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (!gl || typeof gl.fenceSync !== 'function') {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } catch {
        frameId = window.setTimeout(cb, 80);
      }
    };

    const tick = (nowMs: number) => {
      if (disposed) return;
      const dt = Math.min(0.1, Math.max(0.001, (nowMs - lastTime) / 1000));
      lastTime = nowMs;

      if (!prefersReducedMotion) {
        cluster.rotation.y += dt * 0.32;
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(() => tick(performance.now()));
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    const handleResize = () => {
      if (!container || disposed) return;
      const w = Math.max(220, container.clientWidth);
      const h = Math.max(220, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    ro?.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro?.disconnect();
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      controls.dispose();
      envTex.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, [crystal.id, crystal.crystalSystem, webglReady]);

  const [, midHex] = CRYSTAL_PALETTES[crystal.id] ?? ['#e2e8f0', '#8ab4f8', '#1e293b'];

  return (
    <div className="relative flex h-[280px] w-full items-center justify-center sm:h-[340px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-52 w-52 rounded-full opacity-25 blur-3xl transition-colors duration-500"
        style={{backgroundColor: midHex}}
      />
      {webglReady && !contextLost ? (
        <div
          ref={mountRef}
          className="relative z-10 h-full w-full cursor-grab active:cursor-grabbing"
          aria-label={`Interactive 3D crystal mesh for ${crystal.name}`}
        />
      ) : (
        <div className="relative z-10 flex items-center justify-center p-6">
          <CrystalSpecimenGraphic crystal={crystal} large selected />
        </div>
      )}
    </div>
  );
}
