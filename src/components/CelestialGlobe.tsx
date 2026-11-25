import {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {CHALDEAN_ORDER, PLANET_PROFILES} from '../data/planetaryData';
import type {PlanetId} from '../types/astral';
import type {BreathStateSnapshot} from '../utils/breathEngine';
import {BreathOrbOverlay} from './BreathOrbOverlay';

interface CelestialGlobeProps {
  activePlanet: PlanetId;
  sessionStatus: 'idle' | 'active' | 'paused' | 'completed';
  breathSnapshot: BreathStateSnapshot | null;
  remainingSec: number;
  embedded?: boolean;
}

const _vec3 = new THREE.Vector3();

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

function hasWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function CelestialGlobe({
  activePlanet,
  sessionStatus,
  breathSnapshot,
  remainingSec,
  embedded = false,
}: CelestialGlobeProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const activePlanetRef = useRef<PlanetId>(activePlanet);
  const [contextLost, setContextLost] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState<boolean>(() => hasWebGLSupport());

  useEffect(() => {
    activePlanetRef.current = activePlanet;
  }, [activePlanet]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !webglAvailable) return;

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
      setWebglAvailable(false);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));

    const width = Math.max(260, container.clientWidth || 480);
    const height = Math.max(260, container.clientHeight || 420);
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
    const onContextRestored = () => {
      setContextLost(false);
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070a14, 0.045);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 1.35, embedded ? 5.95 : 5.4);

    const controls = new OrbitControls(camera, canvas);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.6;
    controls.minPolarAngle = Math.PI * 0.2;
    controls.maxPolarAngle = Math.PI * 0.8;

    // 3-point celestial studio lighting
    const hemiLight = new THREE.HemisphereLight(0x8ab4f8, 0x070a14, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfde68a, 1.45);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 0.9);
    rimLight.position.set(-4, -2, -4);
    scene.add(rimLight);

    // Composite 3D Celestial Sphere Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const disposables: Array<{dispose: () => void}> = [];

    // 1. Wireframe latitude & longitude meridian sphere
    const radius = 1.82;
    const wireGeo = new THREE.SphereGeometry(radius, 24, 16);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x8ab4f8,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });
    const wireSphere = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireSphere);
    disposables.push(wireGeo, wireMat);

    // 2. Crisp Equatorial & Meridian rings
    const ringGeo = new THREE.TorusGeometry(radius + 0.02, 0.008, 12, 96);
    const silverRingMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      metalness: 0.82,
      roughness: 0.26,
      transparent: true,
      opacity: 0.65,
    });
    const equatorRing = new THREE.Mesh(ringGeo, silverRingMat);
    equatorRing.rotation.x = Math.PI / 2;
    globeGroup.add(equatorRing);

    const meridianRing = new THREE.Mesh(ringGeo, silverRingMat);
    globeGroup.add(meridianRing);

    const crossMeridian = new THREE.Mesh(ringGeo, silverRingMat);
    crossMeridian.rotation.y = Math.PI / 2;
    globeGroup.add(crossMeridian);
    disposables.push(ringGeo, silverRingMat);

    // 3. Angled Orbital Ecliptic Ring (23.4° obliquity) in antique gold
    const eclipticGroup = new THREE.Group();
    eclipticGroup.rotation.z = THREE.MathUtils.degToRad(23.4);
    eclipticGroup.rotation.x = THREE.MathUtils.degToRad(10);
    globeGroup.add(eclipticGroup);

    const eclipticGeo = new THREE.TorusGeometry(radius + 0.22, 0.02, 16, 120);
    const eclipticMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.22,
      emissive: 0x453108,
      emissiveIntensity: 0.35,
    });
    const eclipticRing = new THREE.Mesh(eclipticGeo, eclipticMat);
    eclipticRing.rotation.x = Math.PI / 2;
    eclipticGroup.add(eclipticRing);
    disposables.push(eclipticGeo, eclipticMat);

    // 4. Glowing star-node constellations on sphere surface
    const starCount = 64;
    const starPositions = new Float32Array(starCount * 3);
    const starVecs: THREE.Vector3[] = [];
    for (let i = 0; i < starCount; i++) {
      // Fibonacci sphere distribution for balanced celestial sky
      const phi = Math.acos(1 - (2 * (i + 0.5)) / starCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = radius + 0.04;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;
      starVecs.push(new THREE.Vector3(x, y, z));
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 0.065,
      transparent: true,
      opacity: 0.88,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    globeGroup.add(starPoints);
    disposables.push(starGeo, starMat);

    // Constellation connecting lines between nearby star nodes
    const lineCoords: number[] = [];
    for (let i = 0; i < starVecs.length; i++) {
      for (let j = i + 1; j < starVecs.length; j++) {
        if (starVecs[i].distanceTo(starVecs[j]) < 1.12) {
          lineCoords.push(
            starVecs[i].x,
            starVecs[i].y,
            starVecs[i].z,
            starVecs[j].x,
            starVecs[j].y,
            starVecs[j].z,
          );
        }
      }
    }
    const constellationGeo = new THREE.BufferGeometry();
    constellationGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineCoords, 3));
    const constellationMat = new THREE.LineBasicMaterial({
      color: 0x8ab4f8,
      transparent: true,
      opacity: 0.34,
    });
    const constellationLines = new THREE.LineSegments(constellationGeo, constellationMat);
    globeGroup.add(constellationLines);
    disposables.push(constellationGeo, constellationMat);

    // 5. Planetary nodes along the ecliptic ring
    const nodeGeo = new THREE.SphereGeometry(0.085, 20, 20);
    const haloGeo = new THREE.TorusGeometry(0.145, 0.012, 12, 48);
    disposables.push(nodeGeo, haloGeo);

    interface PlanetNodeEntry {
      id: PlanetId;
      mesh: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
      halo: THREE.Mesh;
      haloMat: THREE.MeshBasicMaterial;
    }

    const planetNodes: PlanetNodeEntry[] = CHALDEAN_ORDER.map((planetId, idx) => {
      const profile = PLANET_PROFILES[planetId];
      const angle = (idx / CHALDEAN_ORDER.length) * Math.PI * 2;
      const orbitR = radius + 0.22;

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(profile.accentHex),
        metalness: 0.45,
        roughness: 0.25,
        emissive: new THREE.Color(profile.accentHex),
        emissiveIntensity: 0.25,
      });

      const mesh = new THREE.Mesh(nodeGeo, mat);
      mesh.position.set(Math.cos(angle) * orbitR, 0, Math.sin(angle) * orbitR);

      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(profile.accentHex),
        transparent: true,
        opacity: 0.2,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.copy(mesh.position);
      halo.rotation.x = Math.PI / 2;

      eclipticGroup.add(mesh);
      eclipticGroup.add(halo);
      disposables.push(mat, haloMat);

      return {id: planetId, mesh, mat, halo, haloMat};
    });

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
        globeGroup.rotation.y += dt * 0.11;
        eclipticGroup.rotation.y += dt * 0.06;
      }

      const currentPlanet = activePlanetRef.current;
      const pulse = 1 + Math.sin(nowMs * 0.0038) * 0.22;

      for (let i = 0; i < planetNodes.length; i++) {
        const node = planetNodes[i];
        const isTarget = node.id === currentPlanet;
        const targetScale = isTarget ? (prefersReducedMotion ? 1.45 : 1.45 * pulse) : 0.85;
        _vec3.set(targetScale, targetScale, targetScale);
        node.mesh.scale.lerp(_vec3, 0.14);
        node.mat.emissiveIntensity = isTarget ? 1.35 : 0.2;

        const haloScale = isTarget ? (prefersReducedMotion ? 1.6 : 1.65 * pulse) : 0.9;
        _vec3.set(haloScale, haloScale, haloScale);
        node.halo.scale.lerp(_vec3, 0.14);
        node.haloMat.opacity = isTarget ? 0.85 : 0.15;
        node.halo.lookAt(camera.position);
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
      const w = Math.max(240, container.clientWidth);
      const h = Math.max(240, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      controls.dispose();
      envTexture.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, [webglAvailable]);

  const planetProfile = PLANET_PROFILES[activePlanet];

  return (
    <div
      className={`relative flex w-full flex-col justify-center overflow-visible ${
        embedded ? 'h-full min-h-0' : 'min-h-[380px] sm:min-h-[440px]'
      }`}
    >
      {webglAvailable && !contextLost ? (
        <div
          ref={mountRef}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          aria-label={`Interactive 3D celestial sphere highlighting ${planetProfile.name}`}
        />
      ) : (
        <div className="flex items-center justify-center p-6">
          <svg viewBox="0 0 280 280" className="h-64 w-64 opacity-85" aria-hidden="true">
            <circle cx="140" cy="140" r="102" stroke="#8ab4f8" strokeOpacity="0.35" fill="none" />
            <ellipse
              cx="140"
              cy="140"
              rx="102"
              ry="38"
              transform="rotate(-23.4 140 140)"
              stroke="#d4af37"
              strokeWidth="1.5"
              fill="none"
            />
            <ellipse
              cx="140"
              cy="140"
              rx="42"
              ry="102"
              stroke="#8ab4f8"
              strokeOpacity="0.25"
              fill="none"
            />
            <circle cx="212" cy="96" r="7" fill={planetProfile.accentHex} />
          </svg>
        </div>
      )}

      <div className="pointer-events-none relative z-10 flex items-center justify-center px-4 py-6">
        <BreathOrbOverlay
          isActive={sessionStatus === 'active'}
          isPaused={sessionStatus === 'paused'}
          isCompleted={sessionStatus === 'completed'}
          snapshot={breathSnapshot}
          remainingSec={remainingSec}
          accentHex={planetProfile.accentHex}
        />
      </div>
    </div>
  );
}
