import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initThreeScene, onMouseMove, onScrollProgress, resizeThreeScene, destroyThreeScene } from './three-scene.js';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

let scrollTrigger1, scrollTrigger2, cardTriggers = [], stepTriggers = [], teamTriggers = [];
let teamTiltCleanups = [];
let veoAnimationId;
let listeners = {};

// Keep Veo player variables bound local to landing lifecycle
let isPlaying = true;
let videoProgress = 0;
let t = 0;

export function initLandingPage() {
  // Reset local state variables
  isPlaying = true;
  videoProgress = 0;
  t = 0;

  // 1. Initialize Three.js Scene
  const threeTarget = document.getElementById('three-target');
  const canvasContainer = document.getElementById('canvas-container');

  if (threeTarget) {
    initThreeScene(threeTarget);
  }

  // 2. Scroll-Linked 3D Scene Controls
  scrollTrigger1 = ScrollTrigger.create({
    trigger: "#integrations-sec",
    start: "top bottom",
    endTrigger: "#roadmap-sec",
    end: "bottom top",
    onToggle: self => {
      if (canvasContainer) {
        if (self.isActive) {
          canvasContainer.classList.add('active');
        } else {
          canvasContainer.classList.remove('active');
        }
      }
    }
  });

  scrollTrigger2 = gsap.to({}, {
    scrollTrigger: {
      trigger: "#integrations-sec",
      start: "top top",
      endTrigger: "#roadmap-sec",
      end: "bottom bottom",
      scrub: 0.5,
      onUpdate: self => {
        onScrollProgress(self.progress);
      }
    }
  });

  // 3. Integration Glass Cards
  const cards = ['chatgpt', 'leetcode', 'geeksforgeeks'];
  cards.forEach(id => {
    let trg = ScrollTrigger.create({
      trigger: `#panel-${id}`,
      start: "top center+=100",
      end: "bottom center-=100",
      onToggle: self => {
        const card = document.getElementById(`card-${id}`);
        if (card) {
          if (self.isActive) {
            card.classList.add('active');
          } else {
            card.classList.remove('active');
          }
        }
      }
    });
    cardTriggers.push(trg);
  });

  // 4. Roadmap Steps
  const steps = [1, 2, 3];
  steps.forEach(num => {
    let trg = ScrollTrigger.create({
      trigger: `#step-${num}`,
      start: "top center+=150",
      end: "bottom center-=50",
      onToggle: self => {
        const stepEl = document.getElementById(`step-${num}`);
        if (stepEl) {
          if (self.isActive) {
            stepEl.classList.add('active');
          } else {
            stepEl.classList.remove('active');
          }
        }
      }
    });
    stepTriggers.push(trg);
  });

  // 5. Parallax Mouse Move
  listeners.mousemove = (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    onMouseMove(x, y);
  };
  window.addEventListener('mousemove', listeners.mousemove);

  // 6. Header scroll effect
  const header = document.getElementById('main-header');
  listeners.scroll = () => {
    if (header) {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  };
  window.addEventListener('scroll', listeners.scroll);

  // 7. Handle Resizing
  listeners.resize = () => {
    resizeThreeScene();
  };
  window.addEventListener('resize', listeners.resize);

  // 8. Custom Generative Veo Video Player
  initVeoPlayer();

  // 9. Update page scroll progress indicator
  listeners.scrollProgress = () => {
    const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (totalScroll > 0) {
      const scrollPercent = (window.scrollY / totalScroll) * 100;
      const progressIndicator = document.getElementById('scroll-indicator');
      if (progressIndicator) {
        progressIndicator.style.width = `${scrollPercent}%`;
      }
    }
  };
  window.addEventListener('scroll', listeners.scrollProgress);

  // 10. Card Spotlights
  initCardSpotlights();

  // 11. Team section: staggered reveal + 3D tilt + glow
  initTeamInteractions();
}

function initVeoPlayer() {
  const veoCanvas = document.getElementById('veo-intro-canvas');
  const veoPlayBtn = document.getElementById('veo-play-button');
  const veoPlayIcon = document.getElementById('veo-play-icon');
  const veoProgressBar = document.getElementById('veo-progress-bar');
  const veoProgressContainer = document.getElementById('veo-progress-container');

  if (!veoCanvas) return;

  const ctx = veoCanvas.getContext('2d');
  
  const resizeCanvas = () => {
    veoCanvas.width = veoCanvas.clientWidth * window.devicePixelRatio;
    veoCanvas.height = veoCanvas.clientHeight * window.devicePixelRatio;
  };
  resizeCanvas();
  listeners.veoresize = resizeCanvas;
  window.addEventListener('resize', listeners.veoresize);

  const renderVeoVideo = () => {
    if (!ctx) return;
    const w = veoCanvas.width;
    const h = veoCanvas.height;
    ctx.clearRect(0, 0, w, h);
    
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, h);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    
    const gridCount = 20;
    const spacingX = w / gridCount;
    
    for (let i = 0; i <= gridCount; i++) {
      ctx.beginPath();
      ctx.moveTo(i * spacingX, 0);
      ctx.bezierCurveTo(
        i * spacingX + Math.sin(t * 0.02 + i) * 30, h * 0.3,
        i * spacingX - Math.sin(t * 0.01 + i) * 30, h * 0.7,
        i * spacingX, h
      );
      ctx.stroke();
    }
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const particleCount = 80;
    for (let i = 0; i < particleCount; i++) {
      const px = (i / particleCount) * w;
      const wave1 = Math.sin(i * 0.15 + t * 0.05) * (h * 0.15);
      const wave2 = Math.cos(i * 0.08 - t * 0.03) * (h * 0.08);
      const py = h / 2 + wave1 + wave2;
      const size = Math.abs(Math.sin(i + t * 0.02)) * 3 + 1;
      
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
      
      if (i > 0 && i % 4 === 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - w/particleCount, py);
        ctx.stroke();
      }
    }
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '10px monospace';
    const letters = ["0", "1", "V", "E", "O", "A", "I", "S", "E", "C", "{", "}"];
    for (let i = 0; i < 8; i++) {
      const lx = ((i * 123 + t * 0.5) % w);
      const ly = (i * 45 + Math.sin(t * 0.01 + i) * 20) % h;
      const char = letters[i % letters.length];
      ctx.fillText(char, lx, ly);
    }
    
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(t * 0.005);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-w * 0.15, -h * 0.2, w * 0.3, h * 0.4);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.rotate(-t * 0.01);
    ctx.strokeRect(-w * 0.1, -h * 0.13, w * 0.2, h * 0.26);
    ctx.restore();
    
    if (isPlaying) {
      t += 1;
      videoProgress += 0.12;
      if (videoProgress >= 100) {
        videoProgress = 0;
      }
      if (veoProgressBar) veoProgressBar.style.width = `${videoProgress}%`;
    }
    
    veoAnimationId = requestAnimationFrame(renderVeoVideo);
  };

  const togglePlay = () => {
    isPlaying = !isPlaying;
    if (veoPlayIcon) {
      if (isPlaying) {
        veoPlayIcon.innerHTML = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`;
      } else {
        veoPlayIcon.innerHTML = `<path d="M8 5v14l11-7z"/>`;
      }
    }
  };

  listeners.veoplayclick = togglePlay;
  veoPlayBtn.addEventListener('click', listeners.veoplayclick);
  
  listeners.veoprogressclick = (e) => {
    const rect = veoProgressContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    videoProgress = (clickX / width) * 100;
    if (veoProgressBar) veoProgressBar.style.width = `${videoProgress}%`;
  };
  veoProgressContainer.addEventListener('click', listeners.veoprogressclick);

  renderVeoVideo();
  
  isPlaying = false;
  togglePlay();
}

function initCardSpotlights() {
  const targetCards = document.querySelectorAll('.glass-info-card, .audience-card');
  targetCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

function initTeamInteractions() {
  const cards = Array.from(document.querySelectorAll('.team-card'));
  if (!cards.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  cards.forEach((card, index) => {
    // Staggered scroll reveal
    const trg = ScrollTrigger.create({
      trigger: card,
      start: "top bottom-=80",
      onEnter: () => {
        setTimeout(() => card.classList.add('reveal'), (index % 4) * 90);
      },
      once: true
    });
    teamTriggers.push(trg);

    if (prefersReduced) return;

    const inner = card.querySelector('.team-card-inner');
    const glow = card.querySelector('.team-card-glow');
    const MAX_TILT = 9;

    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rotY = (px - 0.5) * (MAX_TILT * 2);
      const rotX = (0.5 - py) * (MAX_TILT * 2);
      card.style.transform = `translateY(-6px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      if (glow) {
        glow.style.setProperty('--mouse-x', `${px * 100}%`);
        glow.style.setProperty('--mouse-y', `${py * 100}%`);
      }
    };
    const onLeave = () => {
      card.style.transform = '';
    };

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
    teamTiltCleanups.push(() => {
      card.removeEventListener('mousemove', onMove);
      card.removeEventListener('mouseleave', onLeave);
    });
  });
}

export function destroyLandingPage() {
  // Clean up animation loops
  cancelAnimationFrame(veoAnimationId);
  destroyThreeScene();

  // Clean up GSAP and ScrollTriggers
  if (scrollTrigger1) scrollTrigger1.kill();
  if (scrollTrigger2) scrollTrigger2.kill();
  cardTriggers.forEach(t => t.kill());
  stepTriggers.forEach(t => t.kill());
  teamTriggers.forEach(t => t.kill());
  teamTiltCleanups.forEach(fn => fn());
  cardTriggers = [];
  stepTriggers = [];
  teamTriggers = [];
  teamTiltCleanups = [];

  // Remove event listeners
  window.removeEventListener('mousemove', listeners.mousemove);
  window.removeEventListener('scroll', listeners.scroll);
  window.removeEventListener('resize', listeners.resize);
  window.removeEventListener('scroll', listeners.scrollProgress);
  window.removeEventListener('resize', listeners.veoresize);

  const veoPlayBtn = document.getElementById('veo-play-button');
  if (veoPlayBtn && listeners.veoplayclick) {
    veoPlayBtn.removeEventListener('click', listeners.veoplayclick);
  }

  const veoProgressContainer = document.getElementById('veo-progress-container');
  if (veoProgressContainer && listeners.veoprogressclick) {
    veoProgressContainer.removeEventListener('click', listeners.veoprogressclick);
  }

  listeners = {};
}


