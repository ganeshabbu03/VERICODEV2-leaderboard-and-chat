import * as THREE from 'three';

let scene, camera, renderer;
let centralCore, centralCoreWireframe, satellites = [], orbitLines = [];
let syncBeams = [];
let ideWindow, scanBar, codeCanvas, codeContext, codeTexture;
let particles;
let container;
let isInitialized = false;
let animationFrameId;

// Interaction state
let mouseX = 0, mouseY = 0;
let targetCameraX = 0, targetCameraY = 0;
let scrollProgress = 0;

// Integration details mapping to orbit indices
const integrationConfig = [
  { id: 'chatgpt', color: 0xaa66ff, type: 'octahedron' },      // Node 0: ChatGPT (purple octahedron)
  { id: 'leetcode', color: 0xff7733, type: 'torus' },         // Node 1: LeetCode (orange torus)
  { id: 'geeksforgeeks', color: 0x33cc88, type: 'cone' }      // Node 2: GeeksforGeeks (green cone)
];

// Create texture dynamically for the 3D IDE Screen
function createCodeCanvasTexture() {
  codeCanvas = document.createElement('canvas');
  codeCanvas.width = 512;
  codeCanvas.height = 512;
  codeContext = codeCanvas.getContext('2d');
  
  // Create texture
  codeTexture = new THREE.CanvasTexture(codeCanvas);
  updateCodeCanvas(0); // initial render
  return codeTexture;
}

// Draw code and scanning animation onto the texture
let scanLineY = 0;
let codeOffset = 0;
const codeLines = [
  { text: "import { verify } from 'vericode-ai';", type: "import", secure: true },
  { text: "const app = express();", type: "code", secure: true },
  { text: "app.post('/api/compile', async (req, res) => {", type: "code", secure: true },
  { text: "  const { code } = req.body;", type: "code", secure: true },
  { text: "  // WARNING: Insecure evaluation detected", type: "warning", secure: false, resolvedText: "  // SECURE: Sandbox runner instantiated" },
  { text: "  eval(code); // Remote Code Execution!", type: "error", secure: false, resolvedText: "  await Sandbox.run(code, { timeout: 1000 });" },
  { text: "  res.status(200).send({ success: true });", type: "code", secure: true },
  { text: "});", type: "code", secure: true },
  { text: "function auditCode(input) {", type: "code", secure: true },
  { text: "  if (input.hash === null) throw Error();", type: "code", secure: true },
  { text: "  return Crypto.secureVerify(input);", type: "code", secure: true },
  { text: "}", type: "code", secure: true }
];

function updateCodeCanvas(time) {
  if (!codeContext) return;
  
  // Clear background
  codeContext.fillStyle = '#0a0a0a';
  codeContext.fillRect(0, 0, 512, 512);
  
  // Draw terminal grid scanlines (Holographic details)
  codeContext.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  codeContext.lineWidth = 1;
  for (let y = 40; y < 512; y += 8) {
    codeContext.beginPath();
    codeContext.moveTo(0, y);
    codeContext.lineTo(512, y);
    codeContext.stroke();
  }
  for (let x = 0; x < 512; x += 16) {
    codeContext.beginPath();
    codeContext.moveTo(x, 40);
    codeContext.lineTo(x, 512);
    codeContext.stroke();
  }
  
  // Draw cyber binary rain/grid background
  codeContext.fillStyle = 'rgba(255, 255, 255, 0.015)';
  codeContext.font = '8px monospace';
  for (let col = 0; col < 16; col++) {
    for (let row = 0; row < 16; row++) {
      const rand = Math.sin(col * 31.2 + row * 19.7 + time * 0.002) > 0.0 ? "1" : "0";
      codeContext.fillText(rand, col * 32 + 8, row * 28 + 60);
    }
  }
  
  // Draw IDE window chrome
  codeContext.fillStyle = '#1c1c1c';
  codeContext.fillRect(0, 0, 512, 40);
  
  // Window dots
  codeContext.fillStyle = '#ff5f56'; // red
  codeContext.beginPath(); codeContext.arc(25, 20, 6, 0, Math.PI * 2); codeContext.fill();
  codeContext.fillStyle = '#ffbd2e'; // yellow
  codeContext.beginPath(); codeContext.arc(45, 20, 6, 0, Math.PI * 2); codeContext.fill();
  codeContext.fillStyle = '#27c93f'; // green
  codeContext.beginPath(); codeContext.arc(65, 20, 6, 0, Math.PI * 2); codeContext.fill();
  
  // Title
  codeContext.fillStyle = '#888888';
  codeContext.font = 'bold 14px "Courier New", Courier, monospace';
  codeContext.fillText('vericode_ide.js - Secure Sandbox', 90, 25);
  
  // Draw code editor contents
  codeContext.font = '16px "Courier New", Courier, monospace';
  let startY = 80;
  let lineHeight = 28;
  
  scanLineY = (scanLineY + 1.5) % 450;
  const currentScanY = startY + scanLineY;
  
  codeLines.forEach((line, index) => {
    let yPos = startY + (index * lineHeight);
    
    // Determine status based on scanning position
    let isAudited = currentScanY > yPos;
    let textToDraw = line.text;
    
    if (!line.secure) {
      if (isAudited) {
        textToDraw = line.resolvedText;
        codeContext.fillStyle = '#55ff55'; // Clean secure green
      } else {
        codeContext.fillStyle = line.type === 'error' ? '#ff3333' : '#ffaa00'; // danger color
      }
    } else {
      codeContext.fillStyle = '#e0e0e0'; // standard monochrome text
    }
    
    // Draw text
    codeContext.fillText(textToDraw, 40, yPos);
    
    // Draw small status icon
    if (!line.secure) {
      codeContext.fillStyle = isAudited ? '#55ff55' : '#ff3333';
      codeContext.fillRect(15, yPos - 12, 10, 10);
    } else {
      codeContext.fillStyle = '#444444';
      codeContext.fillRect(17, yPos - 10, 6, 6);
    }
  });
  
  // Draw laser scan line
  codeContext.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  codeContext.lineWidth = 2;
  codeContext.shadowBlur = 10;
  codeContext.shadowColor = '#ffffff';
  codeContext.beginPath();
  codeContext.moveTo(0, currentScanY);
  codeContext.lineTo(512, currentScanY);
  codeContext.stroke();
  
  // Reset shadow for next cycles
  codeContext.shadowBlur = 0;
  
  // Mark texture for update
  codeTexture.needsUpdate = true;
}

export function initThreeScene(containerEl) {
  if (isInitialized) return;
  container = containerEl;
  
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  // Scene
  scene = new THREE.Scene();
  
  // Camera
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 10;
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);
  
  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);
  
  const pointLight1 = new THREE.PointLight(0xffffff, 2, 20);
  pointLight1.position.set(-5, 3, 2);
  scene.add(pointLight1);
  
  const pointLight2 = new THREE.PointLight(0xffffff, 1.5, 15);
  pointLight2.position.set(0, -3, 3);
  scene.add(pointLight2);
  
  // 1. Central Core - Sleek Iridescent Glass Torus Knot (Vibrant Shifting Colors)
  const coreGeo = new THREE.TorusKnotGeometry(0.9, 0.35, 120, 16);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    transmission: 0.7, // glass transparency
    thickness: 1.2,    // refraction
    iridescence: 1.0,  // rainbow colors shifting in light
    iridescenceIOR: 1.8,
    iridescenceThicknessRange: [100, 400],
    flatShading: false
  });
  centralCore = new THREE.Mesh(coreGeo, coreMat);
  scene.add(centralCore);
  
  // 1b. Central Core Wireframe - Reverse rotating outer shell
  const coreWireGeo = new THREE.TorusKnotGeometry(0.95, 0.36, 120, 16);
  const coreWireMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.15
  });
  centralCoreWireframe = new THREE.Mesh(coreWireGeo, coreWireMat);
  scene.add(centralCoreWireframe);
  
  // 2. Orbiting Satellite Nodes
  const orbitRadii = [3.2, 4.2, 5.2];
  const orbitSpeeds = [0.8, -0.6, 0.4];
  
  integrationConfig.forEach((cfg, index) => {
    let nodeGeo;
    let nodeMat;
    
    if (cfg.type === 'octahedron') {
      nodeGeo = new THREE.OctahedronGeometry(0.35, 0);
      nodeMat = new THREE.MeshPhysicalMaterial({
        color: cfg.color,
        metalness: 0.1,
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transmission: 0.3,
        thickness: 0.5
      });
    } else if (cfg.type === 'torus') {
      nodeGeo = new THREE.TorusGeometry(0.24, 0.09, 12, 24);
      nodeMat = new THREE.MeshPhysicalMaterial({
        color: cfg.color,
        metalness: 0.1,
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transmission: 0.3,
        thickness: 0.5
      });
    } else { // cone
      nodeGeo = new THREE.ConeGeometry(0.25, 0.5, 4);
      nodeMat = new THREE.MeshPhysicalMaterial({
        color: cfg.color,
        metalness: 0.1,
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transmission: 0.3,
        thickness: 0.5
      });
    }
    
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    
    // Save metadata
    node.userData = {
      id: cfg.id,
      radius: orbitRadii[index],
      speed: orbitSpeeds[index],
      angle: Math.random() * Math.PI * 2,
      baseScale: 1
    };
    
    scene.add(node);
    satellites.push(node);
    
    // Orbit line (thin, semi-transparent circle)
    const lineGeo = new THREE.RingGeometry(orbitRadii[index] - 0.01, orbitRadii[index] + 0.01, 64);
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0x555555,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    const orbitLine = new THREE.Mesh(lineGeo, lineMat);
    orbitLine.rotation.x = Math.PI / 2;
    scene.add(orbitLine);
    orbitLines.push(orbitLine);

    // Create dynamic connection sync beam line
    const beamGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    const beamMat = new THREE.LineBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.0
    });
    const syncBeam = new THREE.Line(beamGeo, beamMat);
    scene.add(syncBeam);
    syncBeams.push(syncBeam);
  });
  
  // 3. Background Floating Particles
  const particleCount = 600;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    // Distribute randomly in a cube
    particlePositions[i] = (Math.random() - 0.5) * 25;     // X
    particlePositions[i + 1] = (Math.random() - 0.5) * 25; // Y
    particlePositions[i + 2] = (Math.random() - 0.5) * 20; // Z
  }
  
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  
  const particleMat = new THREE.PointsMaterial({
    color: 0xbbbbbb,
    size: 0.04,
    transparent: true,
    opacity: 0.5
  });
  
  particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);
  
  // 4. 3D IDE Window Monolith (Hidden initially)
  const ideTexture = createCodeCanvasTexture();
  const ideGeo = new THREE.BoxGeometry(4.2, 3.0, 0.1);
  
  // Multi-materials for the box. Front face gets the canvas texture, other faces get high glossy black acrylic.
  const acrylicMat = new THREE.MeshPhysicalMaterial({
    color: 0x111111,
    metalness: 0.8,
    roughness: 0.1,
    clearcoat: 1.0
  });
  const screenMat = new THREE.MeshStandardMaterial({
    map: ideTexture,
    roughness: 0.2
  });
  
  const materials = [
    acrylicMat, // Right
    acrylicMat, // Left
    acrylicMat, // Top
    acrylicMat, // Bottom
    screenMat,  // Front
    acrylicMat  // Back
  ];
  
  ideWindow = new THREE.Mesh(ideGeo, materials);
  ideWindow.position.set(0, 0, 0);
  ideWindow.scale.set(0.001, 0.001, 0.001); // start collapsed
  scene.add(ideWindow);

  // 4b. 3D Physical Scan Bar Cylinder
  const scanBarGeo = new THREE.CylinderGeometry(0.015, 0.015, 4.3, 8);
  const scanBarMat = new THREE.MeshBasicMaterial({
    color: 0x55ff55,
    transparent: true,
    opacity: 0.0 // start transparent
  });
  scanBar = new THREE.Mesh(scanBarGeo, scanBarMat);
  scanBar.rotation.z = Math.PI / 2;
  scanBar.position.z = 0.06; // slightly in front of the screen
  scanBar.position.y = 1.4;  // start at top
  ideWindow.add(scanBar);    // Attach scanBar directly as a child of ideWindow
  
  isInitialized = true;
  animate(0);
}

// Camera/Scene Parallax
export function onMouseMove(x, y) {
  mouseX = x;
  mouseY = y;
}

// Scroll Morphing function driven by GSAP
export function onScrollProgress(progress) {
  scrollProgress = progress;
}

// Animation loop
let lastTime = 0;
let lastTextureUpdate = 0;

function animate(time) {
  animationFrameId = requestAnimationFrame(animate);
  if (!isInitialized) return;
  
  const delta = (time - lastTime) * 0.001;
  lastTime = time;
  
  // Update canvas texture only when the IDE window is active and visible, throttled to ~30fps
  if (ideWindow && ideWindow.visible && (time - lastTextureUpdate > 33)) {
    updateCodeCanvas(time);
    lastTextureUpdate = time;
  }
  
  // 1. Core rotation & iridescence shift
  if (centralCore) {
    centralCore.rotation.y += 0.005;
    centralCore.rotation.x += 0.002;
    // Tweak iridescence params dynamically to create a shifting rainbow surface
    centralCore.material.iridescenceIOR = 1.6 + 0.4 * Math.sin(time * 0.001);
  }

  // 1b. Core wireframe reverse rotation & dynamic scale pulse
  if (centralCoreWireframe) {
    centralCoreWireframe.rotation.y -= 0.003;
    centralCoreWireframe.rotation.x -= 0.001;
    const pulseScale = 1.0 + 0.035 * Math.sin(time * 0.002);
    centralCoreWireframe.scale.set(pulseScale, pulseScale, pulseScale);
  }
  
  // 2. Parallax Camera movement interpolation
  targetCameraX = mouseX * 2.0;
  targetCameraY = -mouseY * 1.5;
  
  // Move camera slightly based on mouse, but lock it more during IDE stage
  const lockFactor = scrollProgress > 0.5 ? (1.0 - (scrollProgress - 0.5) * 2) : 1.0;
  camera.position.x += (targetCameraX * lockFactor - camera.position.x) * 0.05;
  camera.position.y += (targetCameraY * lockFactor - camera.position.y) * 0.05;
  camera.lookAt(0, 0, 0);
  
  // 3. Scroll Morph Logic
  // Progress ranges:
  // [0.0 to 0.4]: Satellites spiral in to central core, core stays active.
  // [0.4 to 0.6]: Central core shrinks / disappears; IDE window scales up.
  // [0.6 to 1.0]: IDE window stabilizes, tilts and stays interactive.
  
  if (scrollProgress <= 0.4) {
    // --- STAGE 1: Orbiting ---
    const t = scrollProgress / 0.4; // 0 to 1
    
    // Satellites orbiting and spiraling
    satellites.forEach((sat, index) => {
      // Base angle increments normally over time
      sat.userData.angle += sat.userData.speed * delta;
      
      // Interpolate radius from original to 0
      const currentRadius = THREE.MathUtils.lerp(sat.userData.radius, 0.0, t);
      
      sat.position.x = Math.cos(sat.userData.angle) * currentRadius;
      sat.position.z = Math.sin(sat.userData.angle) * currentRadius;
      
      // Slowly rotate individual nodes
      sat.rotation.y += 0.01;
      sat.rotation.x += 0.005;
      
      // Shrink scales slightly as they spiral in
      const scale = THREE.MathUtils.lerp(sat.userData.baseScale, 0.01, t);
      sat.scale.set(scale, scale, scale);
      
      // Fade out orbit lines
      if (orbitLines[index]) {
        orbitLines[index].material.opacity = (1 - t) * 0.15;
        orbitLines[index].scale.set(1 - t, 1 - t, 1 - t);
      }

      // Update sync line beam endpoint vertices
      const beam = syncBeams[index];
      if (beam) {
        const posAttr = beam.geometry.attributes.position;
        posAttr.setXYZ(0, 0, 0, 0);
        posAttr.setXYZ(1, sat.position.x, sat.position.y, sat.position.z);
        posAttr.needsUpdate = true;
        // Fade in beams as scroll starts, pulse with time, and fade out at spiral end
        const proximityOpacity = (1.0 - t) * 0.45;
        beam.material.opacity = proximityOpacity * (0.6 + 0.4 * Math.sin(time * 0.01 + index * 2.0));
      }
    });
    
    // Central core normal size and position
    centralCore.scale.set(1, 1, 1);
    centralCore.visible = true;

    if (centralCoreWireframe) {
      centralCoreWireframe.visible = true;
      const pulseScale = 1.0 + 0.035 * Math.sin(time * 0.002);
      centralCoreWireframe.scale.set(pulseScale, pulseScale, pulseScale);
    }
    
    // Hide IDE Window & physical scan bar
    ideWindow.scale.set(0.001, 0.001, 0.001);
    ideWindow.visible = false;
    if (scanBar) scanBar.material.opacity = 0.0;
    
  } else if (scrollProgress > 0.4 && scrollProgress <= 0.65) {
    // --- STAGE 2: Morphing Transition ---
    const t = (scrollProgress - 0.4) / 0.25; // 0 to 1
    
    // Hide satellites and beams
    satellites.forEach(sat => sat.scale.set(0.001, 0.001, 0.001));
    orbitLines.forEach(line => line.material.opacity = 0);
    syncBeams.forEach(beam => beam.material.opacity = 0);
    
    // Shrink and flatten core + wireframe
    const coreScale = THREE.MathUtils.lerp(1.0, 0.0, t);
    centralCore.scale.set(coreScale, coreScale, coreScale);
    if (coreScale < 0.02) centralCore.visible = false;

    if (centralCoreWireframe) {
      centralCoreWireframe.scale.set(coreScale, coreScale, coreScale);
      if (coreScale < 0.02) centralCoreWireframe.visible = false;
    }
    
    // Grow and rotate IDE window
    ideWindow.visible = true;
    const ideScale = THREE.MathUtils.lerp(0.001, 1.0, t);
    ideWindow.scale.set(ideScale, ideScale, ideScale);
    
    // Rotate from lying down flat (x = pi/2) to facing front (x = 0)
    ideWindow.rotation.x = THREE.MathUtils.lerp(Math.PI / 4, 0.0, t);
    ideWindow.rotation.y = THREE.MathUtils.lerp(Math.PI, Math.PI * 2, t);
    ideWindow.position.y = THREE.MathUtils.lerp(-1.0, 0.0, t);

    // Fade in 3D scan bar
    if (scanBar) {
      scanBar.material.opacity = THREE.MathUtils.lerp(0.0, 0.75, t);
      scanBar.position.y = 1.4 - (scanLineY / 450) * 2.8;
    }
    
  } else {
    // --- STAGE 3: IDE Screen Showcase ---
    const t = (scrollProgress - 0.65) / 0.35; // 0 to 1
    
    // Ensure core and satellites are hidden
    centralCore.visible = false;
    if (centralCoreWireframe) centralCoreWireframe.visible = false;
    satellites.forEach(sat => sat.scale.set(0.001, 0.001, 0.001));
    syncBeams.forEach(beam => beam.material.opacity = 0);
    
    // Render IDE Window full scale
    ideWindow.visible = true;
    ideWindow.scale.set(1.0, 1.0, 1.0);
    
    // Micro-rotation based on time + hover mouse coordinates
    ideWindow.rotation.y = Math.PI * 2 + (mouseX * 0.15) + (Math.sin(time * 0.001) * 0.03);
    ideWindow.rotation.x = -(mouseY * 0.1) + (Math.cos(time * 0.001) * 0.01);
    ideWindow.position.y = 0;

    // Pulse the 3D physical scan bar and slide it in sync
    if (scanBar) {
      scanBar.material.opacity = 0.5 + 0.25 * Math.sin(time * 0.02);
      scanBar.position.y = 1.4 - (scanLineY / 450) * 2.8;
    }
  }
  
  // Drift particles
  if (particles) {
    particles.rotation.y += 0.0006;
    particles.rotation.x += 0.0003;
  }
  
  renderer.render(scene, camera);
}

// Window resizing handler
export function resizeThreeScene() {
  if (!isInitialized || !container) return;
  
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

export function destroyThreeScene() {
  if (!isInitialized) return;
  cancelAnimationFrame(animationFrameId);
  if (renderer && renderer.domElement && renderer.domElement.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement);
  }
  scene.traverse(object => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(m => m.dispose());
      } else {
        object.material.dispose();
      }
    }
  });
  if (codeTexture) codeTexture.dispose();
  renderer.dispose();
  isInitialized = false;
  satellites = [];
  orbitLines = [];
  syncBeams = [];
}
