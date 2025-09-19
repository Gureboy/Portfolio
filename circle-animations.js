// circle-animations.js
// Animaciones de círculos para Daniel Salini Portfolio - Optimizado 2025
(function initCircleAnimations2025() {
  'use strict';
  
  // Configuration and constants
  const CONFIG = {
    ANIMATION_DELAYS: {
      FAST: 0.1,
      MEDIUM: 0.2,
      SLOW: 0.3
    },
    COLORS: {
      PRIMARY: 'rgba(255, 255, 255, 0.9)',
      SECONDARY: 'rgba(255, 122, 0, 0.8)',
      FADE: (opacity) => `rgba(255, 255, 255, ${opacity / 100})`
    },
    SIZES: {
      SMALL: 3,
      MEDIUM: 6,
      LARGE: 8
    }
  };

  // Utility functions
  const utils = {
    createDot: (className = 'dot', size = CONFIG.SIZES.MEDIUM) => {
      const dot = document.createElement('div');
      dot.className = className;
      dot.style.width = dot.style.height = `${size}px`;
      return dot;
    },
    
    positionElement: (element, x, y, size) => {
      element.style.left = `calc(50% + ${x}px - ${size / 2}px)`;
      element.style.top = `calc(50% + ${y}px - ${size / 2}px)`;
    },
    
    setAnimation: (element, name, duration, delay = 0) => {
      element.style.animation = `${name} ${duration}s infinite ease-in-out`;
      if (delay) element.style.animationDelay = `${delay}s`;
    },
    
    clearContainer: (id) => {
      const container = document.getElementById(id);
      if (!container) return null;
      container.innerHTML = '';
      return container;
    },
    
    // Performance optimization - RAF for smooth animations
    requestFrame: (callback) => {
      if (window.requestAnimationFrame) {
        return window.requestAnimationFrame(callback);
      }
      return setTimeout(callback, 16);
    }
  };

  // Enhanced setup functions with better performance
  function setupPulsatingCircles() {
    const c = utils.clearContainer("anim1");
    if (!c) return;
    
    // Center dot with better styling
    const center = utils.createDot('dot pulse-dot', CONFIG.SIZES.LARGE);
    center.style.background = 'linear-gradient(45deg, rgba(255, 255, 255, 0.9), rgba(255, 122, 0, 0.6))';
    center.style.boxShadow = '0 0 15px rgba(255, 122, 0, 0.7), 0 0 5px rgba(255, 255, 255, 0.5)';
    center.style.borderRadius = '50%';
    utils.positionElement(center, 0, 0, CONFIG.SIZES.LARGE);
    c.appendChild(center);
    
    // Create rings with optimized generation
    const rings = [
      { radius: 15, count: 6, size: 3.5 },
      { radius: 30, count: 9, size: 3.2 },
      { radius: 45, count: 12, size: 2.8 },
      { radius: 60, count: 15, size: 2.4 }
    ];
    
    rings.forEach((ring, ringIndex) => {
      const fragment = document.createDocumentFragment();
      
      for (let i = 0; i < ring.count; i++) {
        const dot = utils.createDot('dot pulse-dot', ring.size);
        const angle = (i / ring.count) * 2 * Math.PI;
        const x = Math.cos(angle) * ring.radius;
        const y = Math.sin(angle) * ring.radius;
        
        utils.positionElement(dot, x, y, ring.size);
        dot.style.animationDelay = `${ringIndex * CONFIG.ANIMATION_DELAYS.MEDIUM + i * CONFIG.ANIMATION_DELAYS.FAST}s`;
        dot.style.background = CONFIG.COLORS.FADE(90 - ringIndex * 15);
        
        fragment.appendChild(dot);
      }
      
      c.appendChild(fragment);
    });
  }

  function setupRotatingCircles() {
    const c = utils.clearContainer("anim2");
    if (!c) return;
    
    // Center dot with enhanced glow
    const center = utils.createDot('dot', CONFIG.SIZES.LARGE);
    center.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 122, 0, 0.6) 100%)';
    center.style.boxShadow = '0 0 20px rgba(255, 122, 0, 0.8)';
    utils.positionElement(center, 0, 0, CONFIG.SIZES.LARGE);
    c.appendChild(center);
    
    // Create orbital rings with performance optimization
    for (let r = 0; r < 3; r++) {
      const orbit = document.createElement('div');
      orbit.className = 'orbit-container';
      orbit.style.animationDuration = `${8 + r * 4}s`;
      orbit.style.animationDirection = r % 2 ? 'reverse' : 'normal';
      orbit.style.willChange = 'transform'; // Performance hint
      
      const radius = 20 + r * 20;
      const count = 6 + r * 3;
      
      for (let i = 0; i < count; i++) {
        const dot = utils.createDot('dot', 4 - r * 0.5);
        const angle = (i / count) * 2 * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        utils.positionElement(dot, x, y, 4 - r * 0.5);
        dot.style.background = CONFIG.COLORS.FADE(90 - r * 15);
        
        orbit.appendChild(dot);
      }
      
      c.appendChild(orbit);
    }
  }

  function setupSequentialRings() {
    const c = utils.clearContainer("anim3");
    if (!c) return;
    
    // Center dot
    const center = utils.createDot('dot', CONFIG.SIZES.SMALL);
    center.style.background = CONFIG.COLORS.PRIMARY;
    utils.positionElement(center, 0, 0, CONFIG.SIZES.SMALL);
    c.appendChild(center);
    
    // Create expanding rings with optimized timing
    const maxRings = 5;
    const baseRadius = 15;
    const baseCount = 8;
    
    for (let i = 0; i < maxRings; i++) {
      const radius = baseRadius + i * 15;
      const count = baseCount + i * 4;
      const fragment = document.createDocumentFragment();
      
      for (let j = 0; j < count; j++) {
        const dot = utils.createDot('dot sequential-dot', 3 + i * 0.2);
        const angle = (j / count) * 2 * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        utils.positionElement(dot, x, y, 3 + i * 0.2);
        dot.style.animation = `expandRing 3s infinite`;
        dot.style.animationDelay = `${i * CONFIG.ANIMATION_DELAYS.SLOW + j * CONFIG.ANIMATION_DELAYS.FAST}s`;
        dot.style.background = CONFIG.COLORS.FADE(90 - i * 15);
        
        fragment.appendChild(dot);
      }
      
      c.appendChild(fragment);
    }
  }

  function setupConcentricRotations() {
    const c = utils.clearContainer("anim4");
    if (!c) return;
    
    const wrap = document.createElement("div");
    wrap.className = "concentric-container";
    c.appendChild(wrap);
    
    // Center dot
    const center = utils.createDot('dot', CONFIG.SIZES.SMALL);
    center.style.background = CONFIG.COLORS.PRIMARY;
    utils.positionElement(center, 0, 0, CONFIG.SIZES.SMALL);
    wrap.appendChild(center);
    
    // Create concentric rings with optimized performance
    const maxRings = 8;
    const baseRadius = 10;
    
    for (let r = 0; r < maxRings; r++) {
      const ring = document.createElement("div");
      ring.className = "concentric-ring";
      ring.style.animationDuration = `${3 * Math.pow(1.5, r)}s`;
      
      const radius = baseRadius + r * 10;
      const circ = 2 * Math.PI * radius;
      const count = Math.max(6, Math.floor(circ / 10));
      const fragment = document.createDocumentFragment();
      
      for (let i = 0; i < count; i++) {
        const dot = utils.createDot('dot', 4);
        const angle = (i / count) * 2 * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        utils.positionElement(dot, x, y, 4);
        dot.style.background = CONFIG.COLORS.FADE(90 - r * 5);
        dot.style.willChange = 'transform, opacity';
        
        fragment.appendChild(dot);
      }
      
      ring.appendChild(fragment);
      wrap.appendChild(ring);
    }
  }

  function setupCircularWaves() {
    const c = utils.clearContainer("anim5");
    if (!c) return;
    
    // Center dot
    const center = utils.createDot('dot', CONFIG.SIZES.LARGE);
    center.style.background = CONFIG.COLORS.PRIMARY;
    utils.positionElement(center, 0, 0, CONFIG.SIZES.LARGE);
    c.appendChild(center);
    
    // Create wave rings with optimized timing
    const maxRings = 5;
    const baseRadius = 15;
    const baseCount = 8;
    const fragment = document.createDocumentFragment();
    
    for (let r = 0; r < maxRings; r++) {
      const radius = baseRadius + r * 15;
      const count = baseCount + r * 4;
      
      for (let i = 0; i < count; i++) {
        const dot = utils.createDot('dot circular-wave-dot', 3 + r * 0.2);
        const angle = (i / count) * 2 * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        utils.positionElement(dot, x, y, 3 + r * 0.2);
        dot.style.animationDelay = `${r * CONFIG.ANIMATION_DELAYS.MEDIUM + i * CONFIG.ANIMATION_DELAYS.FAST}s`;
        dot.style.background = CONFIG.COLORS.FADE(90 - r * 10);
        
        fragment.appendChild(dot);
      }
    }
    
    c.appendChild(fragment);
  }

  function setupExpandingLines() {
    const c = utils.clearContainer("anim6");
    if (!c) return;
    
    // Center dot
    const center = utils.createDot('dot', CONFIG.SIZES.SMALL);
    center.style.background = CONFIG.COLORS.PRIMARY;
    utils.positionElement(center, 0, 0, CONFIG.SIZES.SMALL);
    c.appendChild(center);
    
    // Create expanding lines with optimized performance
    const maxGroups = 3;
    const baseDelay = 2;
    
    for (let g = 0; g < maxGroups; g++) {
      const lineContainer = document.createElement("div");
      lineContainer.className = "line-container";
      lineContainer.style.animationDuration = `${8 + g * 4}s`;
      lineContainer.style.animationDirection = g % 2 ? "reverse" : "normal";
      
      for (let i = 0; i < 12; i++) {
        const line = document.createElement("div");
        line.className = "expanding-line";
        line.style.animationDelay = `${(i / 12) * baseDelay}s`;
        line.style.transform = `rotate(${(360 / 12) * i}deg)`;
        
        const dot = utils.createDot('dot', 3);
        dot.style.background = `rgba(255,255,255,0.8)`;
        line.appendChild(dot);
        lineContainer.appendChild(line);
      }
      
      c.appendChild(lineContainer);
    }
  }

  function setupBreathingGrid() {
    const c = utils.clearContainer("anim7");
    if (!c) return;
    
    const grid = 9;
    const spacing = 16;
    const ds = 4;
    const offset = -(spacing * (grid - 1)) / 2;
    const fragment = document.createDocumentFragment();
    
    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; x++) {
        const d = document.createElement("div");
        d.className = "dot breathing-dot";
        const px = offset + x * spacing;
        const py = offset + y * spacing;
        d.style.width = d.style.height = `${ds}px`;
        d.style.left = `calc(50% + ${px}px - ${ds / 2}px)`;
        d.style.top = `calc(50% + ${py}px - ${ds / 2}px)`;
        const center = (grid - 1) / 2;
        const dist = Math.hypot(x - center, y - center);
        const maxD = Math.hypot(center, center);
        d.style.animationDelay = `${(dist / maxD) * 1.5}s`;
        d.style.background = `rgba(255,255,255,${(90 - (dist / maxD) * 40) / 100})`;
        
        fragment.appendChild(d);
      }
    }
    
    c.appendChild(fragment);
  }

  // Enhanced ripple effect with better performance
  function setupRippleEffect() {
    const c = utils.clearContainer("anim8");
    if (!c) return;
    
    // Center dot with glow effect
    const center = utils.createDot('dot', CONFIG.SIZES.LARGE);
    center.style.background = CONFIG.COLORS.PRIMARY;
    center.style.boxShadow = '0 0 15px rgba(255, 122, 0, 0.7)';
    center.style.zIndex = '10';
    utils.positionElement(center, 0, 0, CONFIG.SIZES.LARGE);
    c.appendChild(center);
    
    // Ripple container with better performance
    const rippleContainer = document.createElement('div');
    rippleContainer.className = 'ripple-container';
    c.appendChild(rippleContainer);
    
    // Create ripple rings with staggered animation
    const numRipples = 4;
    const rippleDuration = 4;
    
    for (let i = 0; i < numRipples; i++) {
      const ripple = document.createElement('div');
      ripple.className = 'ripple-ring';
      ripple.style.animationDelay = `${i * (rippleDuration / numRipples)}s`;
      ripple.style.willChange = 'transform, opacity';
      rippleContainer.appendChild(ripple);
    }
    
    // Create reactive dots with optimized positioning
    const ringConfigs = [
      { radius: 15, count: 6, size: 5 },
      { radius: 30, count: 9, size: 4.5 },
      { radius: 45, count: 12, size: 4 },
      { radius: 60, count: 15, size: 3.5 },
      { radius: 75, count: 18, size: 3 }
    ];
    
    const maxRadius = 80;
    const fragment = document.createDocumentFragment();
    
    ringConfigs.forEach((config, ring) => {
      for (let i = 0; i < config.count; i++) {
        const angle = (i / config.count) * 2 * Math.PI;
        const x = Math.cos(angle) * config.radius;
        const y = Math.sin(angle) * config.radius;
        const distanceFromCenter = Math.sqrt(x * x + y * y) / maxRadius;
        
        const dot = utils.createDot('ripple-wave-dot', config.size);
        utils.positionElement(dot, x, y, config.size);
        
        dot.style.animation = 'rippleWave 1s infinite ease-in-out';
        dot.style.animationDelay = `${distanceFromCenter * (rippleDuration / 1.2)}s`;
        dot.style.background = CONFIG.COLORS.FADE(90 - ring * 12);
        dot.style.willChange = 'transform, opacity';
        
        fragment.appendChild(dot);
      }
    });
    
    c.appendChild(fragment);
  }

  // Enhanced Fibonacci spiral with better mathematical accuracy
  function setupFibonacciSpiral() {
    const c = utils.clearContainer("anim9");
    if (!c) return;
    
    const container = document.createElement('div');
    container.className = 'fibonacci-container';
    c.appendChild(container);
    
    // Center dot
    const center = utils.createDot('dot', CONFIG.SIZES.MEDIUM);
    center.style.background = CONFIG.COLORS.PRIMARY;
    utils.positionElement(center, 0, 0, CONFIG.SIZES.MEDIUM);
    container.appendChild(center);
    
    // Golden angle for perfect spiral
    const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
    const NUM_POINTS = 100;
    const SCALE_FACTOR = 0.8;
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < NUM_POINTS; i++) {
      const angle = i * GOLDEN_ANGLE;
      const radius = SCALE_FACTOR * Math.sqrt(i) * 4;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const size = Math.max(1, 3 - (i / NUM_POINTS) * 1.5);
      
      if (size >= 1) {
        const dot = utils.createDot('fibonacci-dot', size);
        utils.positionElement(dot, x, y, size);
        dot.style.animationDelay = `${(i / NUM_POINTS) * 3}s`;
        dot.style.background = CONFIG.COLORS.FADE(90 - (i / NUM_POINTS) * 60);
        dot.style.willChange = 'transform, opacity';
        
        fragment.appendChild(dot);
      }
    }
    
    container.appendChild(fragment);
  }

  function setupHalftoneGradient() {
    const c = utils.clearContainer("anim10");
    if (!c) return;
    
    const w = document.createElement("div");
    w.className = "halftone-container";
    c.appendChild(w);
    const radii = [20, 40, 60, 80];
    radii.forEach((radius, i) => {
      const count = 12 + i * 8,
        size = 6 - i;
      for (let j = 0; j < count; j++) {
        const d = document.createElement("div");
        d.className = "halftone-dot";
        d.style.width = d.style.height = `${size}px`;
        const angle = (j / count) * 2 * Math.PI;
        const x = Math.cos(angle) * radius,
          y = Math.sin(angle) * radius;
        d.style.left = `calc(50% + ${x}px - ${size / 2}px)`;
        d.style.top = `calc(50% + ${y}px - ${size / 2}px)`;
        d.style.animationDelay = `${(i * 0.3 + j / count).toFixed(2)}s`;
        d.style.background = `rgba(255,255,255,${(90 - i * 15) / 100})`;
        w.appendChild(d);
      }
    });
  }

  function setupSilverSpiral() {
    const c = utils.clearContainer("anim11");
    if (!c) return;
    
    const w = document.createElement("div");
    w.className = "silver-container";
    c.appendChild(w);
    const N = 120,
      angleStep = Math.PI * (2 - Math.sqrt(2)),
      scale = 1.2;
    for (let i = 0; i < N; i++) {
      const angle = i * angleStep,
        rad = scale * Math.sqrt(i) * 6;
      const size = 4 - (i / N) * 2;
      if (size < 1) continue;
      const d = document.createElement("div");
      d.className = "silver-dot";
      d.style.width = d.style.height = `${size}px`;
      d.style.left = `calc(50% + ${Math.cos(angle) * rad}px - ${size / 2}px)`;
      d.style.top = `calc(50% + ${Math.sin(angle) * rad}px - ${size / 2}px)`;
      d.style.animationDelay = `${(i / N) * 2}s`;
      w.appendChild(d);
    }
  }

  function setupFibonacciConcentric() {
    const c = utils.clearContainer("anim12");
    if (!c) return;
    
    const N = 200;
    const SIZE = 180;
    const DOT_RADIUS = 2;
    const MARGIN = 4;
    const CENTER = SIZE / 2;
    const MAX_RADIUS = CENTER - MARGIN - DOT_RADIUS;
    const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
    const DURATION = 3;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", SIZE);
    svg.setAttribute("height", SIZE);
    svg.setAttribute("viewBox", `0 0 ${SIZE} ${SIZE}`);
    c.appendChild(svg);
    for (let i = 0; i < N; i++) {
      const idx = i + 0.5;
      const frac = idx / N;
      const r = Math.sqrt(frac) * MAX_RADIUS;
      const theta = idx * GOLDEN_ANGLE;
      const x = CENTER + r * Math.cos(theta);
      const y = CENTER + r * Math.sin(theta);
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", x);
      circle.setAttribute("cy", y);
      circle.setAttribute("r", DOT_RADIUS);
      circle.setAttribute("fill", "#fff");
      circle.setAttribute("opacity", "0.6");
      svg.appendChild(circle);
      // radius pulse
      const animR = document.createElementNS(svgNS, "animate");
      animR.setAttribute("attributeName", "r");
      animR.setAttribute(
        "values",
        `${DOT_RADIUS * 0.5};${DOT_RADIUS * 1.5};${DOT_RADIUS * 0.5}`
      );
      animR.setAttribute("dur", `${DURATION}s`);
      animR.setAttribute("begin", `${frac * DURATION}s`);
      animR.setAttribute("repeatCount", "indefinite");
      animR.setAttribute("calcMode", "spline");
      animR.setAttribute("keySplines", "0.4 0 0.6 1;0.4 0 0.6 1");
      circle.appendChild(animR);
      // opacity pulse
      const animO = document.createElementNS(svgNS, "animate");
      animO.setAttribute("attributeName", "opacity");
      animO.setAttribute("values", "0.3;1;0.3");
      animO.setAttribute("dur", `${DURATION}s`);
      animO.setAttribute("begin", `${frac * DURATION}s`);
      animO.setAttribute("repeatCount", "indefinite");
      animO.setAttribute("calcMode", "spline");
      animO.setAttribute("keySplines", "0.4 0 0.6 1;0.4 0 0.6 1");
      circle.appendChild(animO);
    }
  }

  // Nueva animación para la 13ª posición
  function setupAdvancedSpiral() {
    const c = utils.clearContainer("anim13");
    if (!c) return;
    
    const container = document.createElement('div');
    container.className = 'advanced-spiral-container';
    container.style.position = 'absolute';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.animation = 'rotateSlow 35s infinite linear';
    container.style.transformOrigin = 'center';
    c.appendChild(container);
    
    // Center dot
    const center = utils.createDot('dot', CONFIG.SIZES.MEDIUM);
    center.style.background = 'radial-gradient(circle, #ff7a00, #7fd7ff)';
    center.style.boxShadow = '0 0 15px rgba(255, 122, 0, 0.8)';
    utils.positionElement(center, 0, 0, CONFIG.SIZES.MEDIUM);
    container.appendChild(center);
    
    // Advanced spiral pattern
    const NUM_POINTS = 150;
    const SPIRAL_FACTOR = 1.2;
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < NUM_POINTS; i++) {
      const angle = i * 0.3;
      const radius = SPIRAL_FACTOR * Math.sqrt(i) * 3;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const size = Math.max(1, 4 - (i / NUM_POINTS) * 2);
      
      if (size >= 1) {
        const dot = utils.createDot('advanced-spiral-dot', size);
        utils.positionElement(dot, x, y, size);
        dot.style.animationDelay = `${(i / NUM_POINTS) * 4}s`;
        dot.style.background = `hsl(${30 + (i / NUM_POINTS) * 180}, 70%, ${70 - (i / NUM_POINTS) * 30}%)`;
        dot.style.willChange = 'transform, opacity';
        dot.style.animation = 'advancedPulse 4s infinite ease-in-out';
        
        fragment.appendChild(dot);
      }
    }
    
    container.appendChild(fragment);
  }

  // Add missing CSS animations
  function injectAdditionalStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes expandRing {
        0% { 
          transform: scale(0); 
          opacity: 0; 
        } 
        20% { 
          transform: scale(1); 
          opacity: 1; 
        } 
        40%, 100% { 
          transform: scale(1.1); 
          opacity: 0; 
        } 
      }
      
      @keyframes rippleWave { 
        0%, 100% { 
          transform: scale(0.8); 
          opacity: 0.3; 
        } 
        50% { 
          transform: scale(1.8); 
          opacity: 1; 
        } 
      }
      
      .sequential-dot {
        will-change: transform, opacity;
        border-radius: 50%;
      }
      
      .dot {
        border-radius: 50%;
        box-shadow: 0 0 3px rgba(255, 255, 255, 0.3);
        transition: all 0.3s ease;
      }
      
      .animation-container:hover .dot {
        box-shadow: 0 0 8px rgba(255, 122, 0, 0.6);
      }
      
      .advanced-spiral-container {
        position: absolute;
        width: 100%;
        height: 100%;
        animation: rotateSlow 35s infinite linear;
        transform-origin: center;
        will-change: transform;
      }
      
      .advanced-spiral-dot {
        position: absolute;
        border-radius: 50%;
        background: #fff;
        animation: advancedPulse 4s infinite ease-in-out;
        will-change: transform, opacity;
      }
      
      @keyframes advancedPulse {
        0%, 100% {
          opacity: 0.3;
          transform: scale(0.8);
        }
        50% {
          opacity: 1;
          transform: scale(1.3);
        }
      }
      
      .music-hint::after {
        content: "🎵";
        position: absolute;
        top: 5px;
        right: 5px;
        font-size: 1.4em;
        opacity: 0.7;
        animation: 
          pulse 2s infinite,
          musicNote 4s ease-in-out infinite;
      }
      
      @keyframes musicNote {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-8px) rotate(5deg); }
        75% { transform: translateY(-3px) rotate(-5deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // Enhanced performance monitor with better error handling
  const performanceMonitor = {
    observer: null,
    isSupported: false,
    
    init() {
      this.isSupported = 'IntersectionObserver' in window;
      if (this.isSupported) {
        this.setupIntersectionObserver();
      }
    },
    
    setupIntersectionObserver() {
      try {
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            const animations = entry.target.querySelectorAll('[style*="animation"]');
            if (entry.isIntersecting) {
              animations.forEach(el => {
                el.style.animationPlayState = 'running';
              });
            } else {
              // Pause animations when not visible to save performance
              animations.forEach(el => {
                el.style.animationPlayState = 'paused';
              });
            }
          });
        }, { 
          threshold: 0.1,
          rootMargin: '50px'
        });
        
        document.querySelectorAll('.animation-container').forEach(container => {
          this.observer.observe(container);
        });
      } catch (error) {
        console.warn('IntersectionObserver setup failed:', error);
        this.isSupported = false;
      }
    },
    
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    }
  };

  // Memory optimization for animations
  const AnimationOptimizer = {
    activeAnimations: new Set(),
    
    pauseOffscreen() {
      const containers = document.querySelectorAll('.animation-container');
      containers.forEach(container => {
        const rect = container.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        const animation = container.querySelector('[style*="animation"]');
        if (animation) {
          animation.style.animationPlayState = isVisible ? 'running' : 'paused';
        }
      });
    },
    
    cleanup() {
      // Remove unused dots
      document.querySelectorAll('.dot').forEach(dot => {
        if (!dot.offsetParent) dot.remove();
      });
    }
  };

  // Optimize on scroll
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      AnimationOptimizer.pauseOffscreen();
    }, 100);
  });

  // Cleanup every 30 seconds
  setInterval(AnimationOptimizer.cleanup, 30000);

  // Enhanced initialization with better error handling and progressive loading
  function initializeAnimations() {
    try {
      // Inject additional styles first
      injectAdditionalStyles();
      
      const animations = [
        { func: setupPulsatingCircles, name: 'Pulsating Circles' },
        { func: setupRotatingCircles, name: 'Rotating Circles' },
        { func: setupSequentialRings, name: 'Sequential Rings' },
        { func: setupConcentricRotations, name: 'Concentric Rotations' },
        { func: setupCircularWaves, name: 'Circular Waves' },
        { func: setupExpandingLines, name: 'Expanding Lines' },
        { func: setupBreathingGrid, name: 'Breathing Grid' },
        { func: setupRippleEffect, name: 'Ripple Effect' },
        { func: setupFibonacciSpiral, name: 'Fibonacci Spiral' },
        { func: setupHalftoneGradient, name: 'Halftone Gradient' }, // Música
        { func: setupSilverSpiral, name: 'Silver Spiral' }, // Easter Egg
        { func: setupFibonacciConcentric, name: 'Fibonacci Concentric' }, // Contacto
        { func: setupAdvancedSpiral, name: 'Advanced Spiral' } // Más sobre mí
      ];
      
      let index = 0;
      let startTime = performance.now();
      
      function runNext() {
        if (index < animations.length) {
          try {
            const animationStartTime = performance.now();
            animations[index].func();
            const animationEndTime = performance.now();
            
            if (animationEndTime - animationStartTime > 50) {
              console.warn(`Animation "${animations[index].name}" took ${(animationEndTime - animationStartTime).toFixed(2)}ms to initialize`);
            }
            
            index++;
            
            // Throttle initialization to prevent blocking
            if (performance.now() - startTime > 100) {
              setTimeout(() => {
                startTime = performance.now();
                utils.requestFrame(runNext);
              }, 10);
            } else {
              utils.requestFrame(runNext);
            }
          } catch (error) {
            console.error(`Error initializing animation "${animations[index].name}":`, error);
            index++;
            utils.requestFrame(runNext);
          }
        } else {
          // All animations loaded
          finishInitialization();
        }
      }
      
      utils.requestFrame(runNext);
      
    } catch (error) {
      console.error('Critical error initializing circle animations:', error);
      fallbackInitialization();
    }
  }
  
  function finishInitialization() {
    try {
      addCornerDecorations();
      performanceMonitor.init();
      
      // Mark containers as loaded for CSS animations
      document.querySelectorAll('.circle-container').forEach((container, index) => {
        setTimeout(() => {
          container.classList.add('loaded');
        }, index * 50);
      });
      
      // Dispatch custom event for external scripts
      document.dispatchEvent(new CustomEvent('circleAnimationsLoaded', {
        detail: { timestamp: Date.now() }
      }));
      
    } catch (error) {
      console.error('Error finishing initialization:', error);
    }
  }
  
  function fallbackInitialization() {
    try {
      setupPulsatingCircles();
      setupRotatingCircles();
      addCornerDecorations();
    } catch (error) {
      console.error('Fallback initialization also failed:', error);
    }
  }

  // Enhanced visibility handling with debouncing
  let visibilityTimeout;
  function handleVisibilityChange() {
    clearTimeout(visibilityTimeout);
    visibilityTimeout = setTimeout(() => {
      const containers = document.querySelectorAll('.animation-container');
      containers.forEach(container => {
        const animations = container.querySelectorAll('[style*="animation"]');
        animations.forEach(el => {
          if (document.hidden) {
            el.style.animationPlayState = 'paused';
          } else {
            el.style.animationPlayState = 'running';
          }
        });
      });
    }, 100);
  }

  // Enhanced event listeners with better performance
  function setupEventListeners() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeAnimations, { once: true });
    } else {
      // Small delay to ensure DOM is fully rendered
      setTimeout(initializeAnimations, 10);
    }

    // Handle visibility changes for performance
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Handle page unload cleanup
    window.addEventListener('beforeunload', () => {
      performanceMonitor.destroy();
      clearTimeout(visibilityTimeout);
    }, { once: true });
    
    // Handle reduced motion preferences
    if (window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      function handleReducedMotion(e) {
        const containers = document.querySelectorAll('.animation-container');
        containers.forEach(container => {
          if (e.matches) {
            container.style.animation = 'none';
            container.querySelectorAll('*').forEach(el => {
              el.style.animation = 'none';
            });
          } else {
            // Re-initialize animations if motion is enabled
            setTimeout(initializeAnimations, 100);
          }
        });
      }
      
      prefersReducedMotion.addListener(handleReducedMotion);
      handleReducedMotion(prefersReducedMotion);
    }
  }

  // Initialize everything
  setupEventListeners();

})();
