import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
  uniform float time;
  uniform vec2 mouse;
  varying float vElevation;
  varying vec3 vViewPosition;

  void main() {
    vec3 pos = position;

    float bigWaves = 0.1 * sin(pos.x * 0.05 + time) + 0.1 * sin(pos.z * 0.04 + time * 0.8);
    float midWaves = 0.05 * sin(pos.x * 0.2 + time * 1.5) * cos(pos.z * 0.15 + time);
    float smallRipples = 0.02 * sin(pos.x * 0.5 + time * 2.0) * sin(pos.z * 0.5 + time * 2.0);
    float microDetail = 0.01 * sin(pos.x + time * 3.0) * cos(pos.z + time * 3.0);

    float elevation = bigWaves + midWaves + smallRipples + microDetail;
    pos.y += elevation;
    vElevation = pos.y;

    vec2 mousePos = mouse * 200.0 - 100.0;
    vec2 toMouse = pos.xz - mousePos;
    float mouseDistance = length(toMouse);
    float mouseEffect = exp(-mouseDistance * mouseDistance * 0.01) * 3.0;
    pos.y -= mouseEffect;

    vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -modelViewPosition.xyz;
    gl_Position = projectionMatrix * modelViewPosition;
  }
`;

const fragmentShader = `
  uniform float time;
  uniform vec3 colorDeep;
  uniform vec3 colorShallow;
  uniform vec3 lightPosition;
  varying float vElevation;
  varying vec3 vViewPosition;

  void main() {
    vec3 worldNormal = normalize(vec3(0.0, 1.0, 0.0));
    vec3 viewDirection = normalize(vViewPosition);
    vec3 lightDirection = normalize(lightPosition - vec3(0.0, 0.0, 0.0));

    float hemiMix = (dot(worldNormal, lightDirection) * 0.5 + 0.5);
    vec3 hemiColor = mix(vec3(0.85, 0.80, 1.0), vec3(1.0, 1.0, 1.0), hemiMix);

    float fresnel = pow(1.0 - max(dot(viewDirection, worldNormal), 0.0), 3.0);
    vec3 finalColor = mix(colorShallow * hemiColor, vec3(1.0, 1.0, 1.0), fresnel * 0.8 + vElevation * 0.2);

    gl_FragColor = vec4(finalColor, 0.88);
  }
`;

export default function OceanCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf3f0ff, 400, 900);

    const aspect = window.innerWidth / window.innerHeight;
    const cameraHeight = 130;
    const cameraWidth = cameraHeight * aspect;
    const near = 1;
    const far = 2000;

    const camera = new THREE.OrthographicCamera(
      -cameraWidth, cameraWidth, cameraHeight, -cameraHeight, near, far
    );
    camera.position.set(300, 100, 300);
    camera.lookAt(scene.position);

    // Optimized antialiasing and pixel ratio for ultra-smooth 60fps on mobile and desktop
    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Responsive segments for maximum FPS without visual compromise
    const segments = isMobile ? 48 : 96;
    const geometry = new THREE.PlaneGeometry(600, 600, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        mouse: { value: new THREE.Vector2(0.5, 0.5) },
        colorDeep: { value: new THREE.Color(0.35, 0.20, 0.70) },
        colorShallow: { value: new THREE.Color(0.75, 0.65, 0.95) },
        lightPosition: { value: new THREE.Vector3(50, 50, 50) }
      },
      vertexShader,
      fragmentShader,
      wireframe: false,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const clock = new THREE.Clock();

    let mouseThrottled = false;
    const onMouseMove = (e: MouseEvent) => {
      if (mouseThrottled) return;
      mouseThrottled = true;
      requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth;
        const y = 1.0 - e.clientY / window.innerHeight;
        material.uniforms.mouse.value.set(x, y);
        mouseThrottled = false;
      });
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Smooth render loop (vertex displacement runs on GPU)
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (!isVisibleRef.current) return;
      material.uniforms.time.value = clock.getElapsedTime() * 0.8;
      renderer.render(scene, camera);
    };
    animate();

    // Pause render when scrolled past hero section to save 100% CPU/battery
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    let resizeTimer: number;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const newAspect = window.innerWidth / window.innerHeight;
        const newCameraWidth = cameraHeight * newAspect;
        camera.left = -newCameraWidth;
        camera.right = newCameraWidth;
        camera.top = cameraHeight;
        camera.bottom = -cameraHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }, 100);
    };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}