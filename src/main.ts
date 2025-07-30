import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <div class="flex justify-center items-center h-screen">
      <div class="scroll-indicator">
        <p class="scroll-text">Scroll Down</p>
        <div class="scroll-arrow">↓</div>
      </div>
    </div>
    <div class="flex justify-center items-center h-screen relative overflow-hidden">
      <canvas id="main-canvas" style="display:block; margin:auto; z-index:10;"></canvas>
      <div class="absolute inset-0 pointer-events-none"></div>
    </div>
    <div class="flex justify-center items-center h-screen">
    </div>
  </div>
`;

const mainCanvas = document.getElementById('main-canvas') as HTMLCanvasElement;
const mainCtx = mainCanvas.getContext('2d')!;
const img = new window.Image();
img.src = '/image.png';

const TEXT = '24/7 Cyber Threats Neutralized';
const FONT_SIZE = 120;
const FONT = `700 ${FONT_SIZE}px 'Shne Breit', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
const TEXT_COLOR = '#000';
const HIGHLIGHT_COLOR = '#0066ff';
const PADDING = 120;
const IMAGE_SIZE = 800;

// Optimized animation variables for smoother scrolling
let animatedScrollY = 0;
let mouseX = 0;
let mouseY = 0;
let targetMouseX = 0;
let targetMouseY = 0;
let time = 0;
const EASE = 0.12; // Increased for more responsive feel
const MOUSE_EASE = 0.15; // Slightly more responsive mouse
const PARALLAX_STRENGTH = 0.2; // Reduced for smoother motion
const BREATHING_AMPLITUDE = 4; // Reduced for subtlety
const BREATHING_SPEED = 0.0015; // Slightly slower

// Gradient system variables
const GRADIENT_SIZE = IMAGE_SIZE * 1.2;
const GRADIENT_OPACITY = 0.9;

// Performance optimizations
const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
let cachedTextWidth: number = 0; // Initialize to 0
let isTextWidthCached = false; // Track if we have a valid cached width
let offCanvas: HTMLCanvasElement | null = null;
let offCtx: CanvasRenderingContext2D | null = null;
let maskCanvas: HTMLCanvasElement | null = null;
let maskCtx: CanvasRenderingContext2D | null = null;

// Advanced scroll smoothing improvements
let lastScrollTime = 0;
let scrollVelocity = 0;
let smoothedVelocity = 0;
let lastScrollY = 0;
let velocityHistory: number[] = [];
const VELOCITY_HISTORY_LENGTH = 5;

// Premium visual enhancements
let glowIntensity = 0;
let targetGlowIntensity = 0;
const GLOW_EASE = 0.08; // Slightly more responsive

function getTextWidth(ctx: CanvasRenderingContext2D, text: string, font: string) {
  // Use cached width if available and valid
  if (isTextWidthCached && cachedTextWidth > 0) {
    return cachedTextWidth;
  }
  
  ctx.font = font;
  const width = ctx.measureText(text).width;
  
  // Cache if we get a reasonable width
  if (width > 0 && width < 10000) {
    cachedTextWidth = width;
    isTextWidthCached = true;
    return width;
  }
  
  // Fallback estimate
  const fallback = text.length * FONT_SIZE * 0.6;
  if (!isTextWidthCached) {
    cachedTextWidth = fallback;
  }
  return cachedTextWidth;
}

function initOffscreenCanvases() {
  if (!offCanvas) {
    offCanvas = document.createElement('canvas');
    offCtx = offCanvas.getContext('2d')!;
    
    maskCanvas = document.createElement('canvas');
    maskCtx = maskCanvas.getContext('2d')!;
  }
  
  const scaledImageSize = IMAGE_SIZE * devicePixelRatio;
  if (offCanvas.width !== scaledImageSize || offCanvas.height !== scaledImageSize) {
    offCanvas.width = scaledImageSize;
    offCanvas.height = scaledImageSize;
    offCtx!.scale(devicePixelRatio, devicePixelRatio);
    
    maskCanvas!.width = scaledImageSize;
    maskCanvas!.height = scaledImageSize;
    maskCtx!.scale(devicePixelRatio, devicePixelRatio);
  }
}

function resizeCanvas() {
  mainCanvas.width = window.innerWidth * devicePixelRatio;
  mainCanvas.height = window.innerHeight * devicePixelRatio;
  
  mainCanvas.style.width = window.innerWidth + 'px';
  mainCanvas.style.height = window.innerHeight + 'px';
  
  mainCtx.scale(devicePixelRatio, devicePixelRatio);
  
  // Invalidate cached text width on resize
  isTextWidthCached = false;
  
  initOffscreenCanvases();
}

function drawPremiumText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, isGlowing = false) {
  if (isGlowing && glowIntensity > 0.01) { // Only draw glow if intensity is meaningful
    // Optimized glow with fewer layers
    ctx.save();
    ctx.shadowColor = HIGHLIGHT_COLOR;
    ctx.shadowBlur = 25 * glowIntensity;
    ctx.globalAlpha = 0.6 * glowIntensity;
    ctx.fillText(text, x, y);
    
    ctx.shadowBlur = 45 * glowIntensity;
    ctx.globalAlpha = 0.3 * glowIntensity;
    ctx.fillText(text, x, y);
    ctx.restore();
  }
  
  // Main text
  ctx.fillText(text, x, y);
}

function drawScrollingText(ctx: CanvasRenderingContext2D, scrollY: number, width: number, yPosition: number, xOffset: number = 0, isGlowing = false) {
  ctx.save();
  ctx.font = FONT;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = isGlowing ? HIGHLIGHT_COLOR : TEXT_COLOR;
  
  // Use optimized text width calculation
  const textWidth = getTextWidth(ctx, TEXT, FONT) + PADDING;
  
  // Ultra-smooth motion calculations with multiple smoothing layers
  const breathingOffset = Math.sin(time * BREATHING_SPEED) * BREATHING_AMPLITUDE;
  const parallaxOffset = (mouseX - window.innerWidth / 2) * PARALLAX_STRENGTH;
  
  // Multi-layer smoothing for buttery smooth scroll
  const primaryOffset = scrollY * 0.6; // Reduced direct scroll influence
  const velocityOffset = smoothedVelocity * 8; // Use smoothed velocity for prediction
  const smoothScrollOffset = primaryOffset + velocityOffset;
  
  // Apply smoothing to the total offset calculation
  const totalOffset = (smoothScrollOffset + xOffset + breathingOffset + parallaxOffset) % textWidth;
  
  // Optimized text positioning
  const startX = -totalOffset - textWidth;
  const endX = width + textWidth;
  
  // Draw text instances with consistent spacing
  let x = startX;
  let instanceCount = 0;
  const maxInstances = Math.ceil((endX - startX) / textWidth) + 1;
  
  while (x < endX && instanceCount < maxInstances) {
    const yOffset = isGlowing ? Math.sin(time * 0.0006 + x * 0.006) * 1.2 : 0; // Even smoother oscillation
    
    drawPremiumText(ctx, TEXT, x, yPosition + yOffset, isGlowing);
    x += textWidth;
    instanceCount++;
  }
  ctx.restore();
}

function calculateImageTransforms() {
  // Smoother mouse influence
  const mouseInfluence = {
    x: (mouseX - window.innerWidth / 2) * 0.015, // Slightly reduced
    y: (mouseY - IMAGE_SIZE / 2) * 0.015
  };
  
  // Subtle breathing scale effect
  const breathingScale = 1 + Math.sin(time * BREATHING_SPEED * 0.8) * 0.01; // Reduced amplitude
  
  // Smoother rotation
  const rotation = (mouseX - window.innerWidth / 2) * 0.00003; // Reduced for smoothness
  
  return { mouseInfluence, breathingScale, rotation };
}

function drawSubtleGradient(ctx: CanvasRenderingContext2D, imgX: number) {
  ctx.save();
  
  const centerX = imgX + IMAGE_SIZE / 2;
  const centerY = window.innerHeight / 2;
  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, GRADIENT_SIZE / 2
  );
  
  gradient.addColorStop(0, `${HIGHLIGHT_COLOR}${Math.round(GRADIENT_OPACITY * 255).toString(16).padStart(2, '0')}`);
  gradient.addColorStop(0.7, `${HIGHLIGHT_COLOR}10`);
  gradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(
    centerX - GRADIENT_SIZE / 2, 
    centerY - GRADIENT_SIZE / 2, 
    GRADIENT_SIZE, 
    GRADIENT_SIZE
  );
  
  ctx.restore();
}

function drawMain(scrollY: number) {
  mainCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  
  const imgX = (window.innerWidth - IMAGE_SIZE) / 2;
  const transforms = calculateImageTransforms();
  
  // LAYER 0: Subtle gradient
  drawSubtleGradient(mainCtx, imgX);
  
  // LAYER 1: Enhanced image
  mainCtx.save();
  mainCtx.translate(imgX + IMAGE_SIZE/2 + transforms.mouseInfluence.x, window.innerHeight/2 + transforms.mouseInfluence.y);
  mainCtx.scale(transforms.breathingScale, transforms.breathingScale);
  mainCtx.rotate(transforms.rotation);
  mainCtx.drawImage(img, -IMAGE_SIZE/2, -IMAGE_SIZE/2, IMAGE_SIZE, IMAGE_SIZE);
  mainCtx.restore();

  // LAYER 2: Background text with smooth scrolling
  drawScrollingText(mainCtx, scrollY, window.innerWidth, window.innerHeight / 2);

  // LAYER 3: Optimized masked text effect
  if (!offCtx || !maskCtx) return;
  
  offCtx.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
  maskCtx.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);

  // Draw image on offscreen canvas
  offCtx.save();
  offCtx.translate(IMAGE_SIZE/2 + transforms.mouseInfluence.x, IMAGE_SIZE/2 + transforms.mouseInfluence.y);
  offCtx.scale(transforms.breathingScale, transforms.breathingScale);
  offCtx.rotate(transforms.rotation);
  offCtx.drawImage(img, -IMAGE_SIZE/2, -IMAGE_SIZE/2, IMAGE_SIZE, IMAGE_SIZE);
  offCtx.restore();
  
  const scaledImageSize = IMAGE_SIZE * devicePixelRatio;
  const imageData = offCtx.getImageData(0, 0, scaledImageSize, scaledImageSize);
  const data = imageData.data;
  
  // Create text mask with smooth positioning
  maskCtx.font = FONT;
  maskCtx.textBaseline = 'middle';
  maskCtx.textAlign = 'left';
  maskCtx.fillStyle = '#fff';
  
  const textWidth = getTextWidth(maskCtx, TEXT, FONT) + PADDING;
  const breathingOffset = Math.sin(time * BREATHING_SPEED) * BREATHING_AMPLITUDE;
  const parallaxOffset = (mouseX - window.innerWidth / 2) * PARALLAX_STRENGTH;
  
  // Apply same ultra-smooth scrolling to mask
  const primaryOffset = scrollY * 0.6;
  const velocityOffset = smoothedVelocity * 8;
  const smoothScrollOffset = primaryOffset + velocityOffset;
  const totalOffset = (smoothScrollOffset + breathingOffset + parallaxOffset) % textWidth;
  
  const adjustedOffset = totalOffset + imgX + transforms.mouseInfluence.x;
  const startX = -adjustedOffset - textWidth;
  
  let x = startX;
  while (x < IMAGE_SIZE + textWidth) {
    const yOffset = Math.sin(time * 0.0008 + x * 0.008) * 1.5 - transforms.mouseInfluence.y;
    maskCtx.fillText(TEXT, x, IMAGE_SIZE / 2 + yOffset);
    x += textWidth;
  }
  
  const maskData = maskCtx.getImageData(0, 0, scaledImageSize, scaledImageSize);
  const maskPixels = maskData.data;
  
  // Optimized color inversion
  const len = data.length;
  const tintStrength = 0.08 + Math.sin(time * 0.0015) * 0.03;
  
  for (let i = 0; i < len; i += 4) {
    const alpha = data[i + 3];
    const maskAlpha = maskPixels[i + 3];
    
    if (maskAlpha > 0 && alpha > 0) {
      const invR = 255 - data[i];
      const invG = 255 - data[i + 1];
      const invB = 255 - data[i + 2];
      
      // Subtle color tinting
      const tintR = Math.min(255, invR + 0 * tintStrength);
      const tintG = Math.min(255, invG + 102 * tintStrength);
      const tintB = Math.min(255, invB + 255 * tintStrength);
      
      data[i] = tintR;
      data[i + 1] = tintG;
      data[i + 2] = tintB;
    }
  }
  
  offCtx.putImageData(imageData, 0, 0);
  
  // Optimized glow effect
  if (glowIntensity > 0.02) {
    mainCtx.save();
    mainCtx.shadowColor = HIGHLIGHT_COLOR;
    mainCtx.shadowBlur = 30 * glowIntensity;
    mainCtx.globalAlpha = 0.25 * glowIntensity;
    mainCtx.drawImage(offCanvas!, imgX, window.innerHeight / 2 - IMAGE_SIZE / 2, IMAGE_SIZE, IMAGE_SIZE);
    mainCtx.restore();
  }
  
  mainCtx.drawImage(offCanvas!, imgX, window.innerHeight / 2 - IMAGE_SIZE / 2, IMAGE_SIZE, IMAGE_SIZE);
}

function animate() {
  const currentTime = performance.now();
  time = currentTime;
  
  // Advanced scroll velocity calculation with smoothing
  const currentScrollY = window.scrollY || window.pageYOffset;
  const deltaTime = Math.max(currentTime - lastScrollTime, 1); // Prevent division by zero
  
  if (deltaTime > 0) {
    // Calculate raw velocity
    const rawVelocity = (currentScrollY - lastScrollY) / deltaTime * 16.67;
    
    // Add to velocity history for smoothing
    velocityHistory.push(rawVelocity);
    if (velocityHistory.length > VELOCITY_HISTORY_LENGTH) {
      velocityHistory.shift();
    }
    
    // Calculate smoothed velocity using weighted average
    let weightedSum = 0;
    let totalWeight = 0;
    for (let i = 0; i < velocityHistory.length; i++) {
      const weight = (i + 1) / velocityHistory.length; // More recent values have higher weight
      weightedSum += velocityHistory[i] * weight;
      totalWeight += weight;
    }
    
    scrollVelocity = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    // Apply additional smoothing to velocity
    smoothedVelocity += (scrollVelocity - smoothedVelocity) * 0.15;
    
    // Clamp smoothed velocity to prevent extreme values
    smoothedVelocity = Math.max(-30, Math.min(30, smoothedVelocity));
  }
  
  lastScrollY = currentScrollY;
  lastScrollTime = currentTime;
  
  // Smooth mouse following
  mouseX += (targetMouseX - mouseX) * MOUSE_EASE;
  mouseY += (targetMouseY - mouseY) * MOUSE_EASE;
  
  // Ultra-smooth scroll easing with momentum preservation
  const target = currentScrollY;
  const scrollDiff = target - animatedScrollY;
  
  // Use adaptive easing based on scroll speed
  const dynamicEase = Math.min(0.2, EASE + Math.abs(smoothedVelocity) * 0.002);
  animatedScrollY += scrollDiff * dynamicEase;
  
  // Snap to target when very close
  if (Math.abs(scrollDiff) < 0.1) animatedScrollY = target;
  
  // Dynamic glow based on smoothed scroll velocity
  const scrollSpeed = Math.abs(smoothedVelocity);
  targetGlowIntensity = Math.min(1, scrollSpeed * 0.03);
  glowIntensity += (targetGlowIntensity - glowIntensity) * GLOW_EASE;
  
  drawMain(animatedScrollY);
  requestAnimationFrame(animate);
}

function handleResize() {
  resizeCanvas();
  drawMain(animatedScrollY);
}

function handleMouseMove(e: MouseEvent) {
  targetMouseX = e.clientX;
  targetMouseY = e.clientY;
}

function handleTouch(e: TouchEvent) {
  if (e.touches.length > 0) {
    targetMouseX = e.touches[0].clientX;
    targetMouseY = e.touches[0].clientY;
  }
}

// Initialize text width cache when image loads
img.onload = () => {
  // Pre-calculate text width with a brief delay for font loading
  setTimeout(() => {
    mainCtx.font = FONT;
    const width = mainCtx.measureText(TEXT).width;
    if (width > 0) {
      cachedTextWidth = width;
      isTextWidthCached = true;
    }
    handleResize();
  }, 150);
  
  handleResize();
  animate();
};

window.addEventListener('resize', handleResize);
window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('touchmove', handleTouch, { passive: true });
window.addEventListener('touchstart', handleTouch, { passive: true });