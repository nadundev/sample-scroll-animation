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
const PADDING = 120; // Increased spacing for premium feel
const IMAGE_SIZE = 800;

// Enhanced animation variables
let animatedScrollY = 0;
let mouseX = 0;
let mouseY = 0;
let targetMouseX = 0;
let targetMouseY = 0;
let time = 0;
const EASE = 0.065; // Smoother easing
const MOUSE_EASE = 0.08;
const PARALLAX_STRENGTH = 0.3;
const BREATHING_AMPLITUDE = 8;
const BREATHING_SPEED = 0.002;

// Gradient system variables
const GRADIENT_SIZE = IMAGE_SIZE * 1.2; // Slightly larger than image
const GRADIENT_OPACITY = 0.9;

// Performance optimizations
const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
let cachedTextWidth: number | null = null;
let offCanvas: HTMLCanvasElement | null = null;
let offCtx: CanvasRenderingContext2D | null = null;
let maskCanvas: HTMLCanvasElement | null = null;
let maskCtx: CanvasRenderingContext2D | null = null;

// Premium visual enhancements
let glowIntensity = 0;
let targetGlowIntensity = 0;
const GLOW_EASE = 0.05;

function getTextWidth(ctx: CanvasRenderingContext2D, text: string, font: string) {
  // Always recalculate to ensure accuracy with font loading
  ctx.font = font;
  const width = ctx.measureText(text).width;
  
  // Only cache if we get a reasonable width (font is loaded)
  if (width > 0 && width < 10000) {
    cachedTextWidth = width;
    return width;
  }
  
  // Fallback to cached value if available, otherwise estimate
  return cachedTextWidth || text.length * FONT_SIZE * 0.6;
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
  
  // Force recalculation of text width on resize
  cachedTextWidth = null;
  
  initOffscreenCanvases();
}

function drawPremiumText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, isGlowing = false) {
  if (isGlowing && glowIntensity > 0) {
    // Multi-layer glow effect
    ctx.save();
    ctx.shadowColor = HIGHLIGHT_COLOR;
    ctx.shadowBlur = 30 * glowIntensity;
    ctx.globalAlpha = 0.8 * glowIntensity;
    ctx.fillText(text, x, y);
    
    ctx.shadowBlur = 60 * glowIntensity;
    ctx.globalAlpha = 0.4 * glowIntensity;
    ctx.fillText(text, x, y);
    
    ctx.shadowBlur = 100 * glowIntensity;
    ctx.globalAlpha = 0.2 * glowIntensity;
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
  
  // Get fresh text width measurement
  const textWidth = getTextWidth(ctx, TEXT, FONT) + PADDING;
  const breathingOffset = Math.sin(time * BREATHING_SPEED) * BREATHING_AMPLITUDE;
  const parallaxOffset = (mouseX - window.innerWidth / 2) * PARALLAX_STRENGTH;
  const totalOffset = (scrollY + xOffset + breathingOffset + parallaxOffset) % textWidth;
  
  // Ensure we start far enough left to cover the entire screen
  const startX = -totalOffset - textWidth * 2;
  const endX = width + textWidth;
  
  // Draw text instances with consistent spacing
  let x = startX;
  while (x < endX) {
    const yOffset = isGlowing ? Math.sin(time * 0.001 + x * 0.01) * 2 : 0;
    
    if (isGlowing) {
      drawPremiumText(ctx, TEXT, x, yPosition + yOffset, true);
    } else {
      drawPremiumText(ctx, TEXT, x, yPosition + yOffset);
    }
    x += textWidth;
  }
  ctx.restore();
}

function calculateImageTransforms() {
  const mouseInfluence = {
    x: (mouseX - window.innerWidth / 2) * 0.02,
    y: (mouseY - IMAGE_SIZE / 2) * 0.02
  };
  
  // Subtle breathing scale effect
  const breathingScale = 1 + Math.sin(time * BREATHING_SPEED * 0.7) * 0.015;
  
  // Add subtle rotation based on mouse
  const rotation = (mouseX - window.innerWidth / 2) * 0.00005;
  
  return { mouseInfluence, breathingScale, rotation };
}

function drawSubtleGradient(ctx: CanvasRenderingContext2D, imgX: number) {
  ctx.save();
  
  // Create radial gradient centered on the image
  const centerX = imgX + IMAGE_SIZE / 2;
  const centerY = window.innerHeight / 2;
  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, GRADIENT_SIZE / 2
  );
  
  // Subtle gradient from highlight color to transparent
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
  // Clear canvas to transparent
  mainCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  
  const imgX = (window.innerWidth - IMAGE_SIZE) / 2;
  const transforms = calculateImageTransforms();
  
  // LAYER 0: Draw subtle gradient behind image
  drawSubtleGradient(mainCtx, imgX);
  
  // LAYER 1: Enhanced image with subtle transform
  mainCtx.save();
  mainCtx.translate(imgX + IMAGE_SIZE/2 + transforms.mouseInfluence.x, window.innerHeight/2 + transforms.mouseInfluence.y);
  
  mainCtx.scale(transforms.breathingScale, transforms.breathingScale);
  mainCtx.rotate(transforms.rotation);
  
  mainCtx.drawImage(img, -IMAGE_SIZE/2, -IMAGE_SIZE/2, IMAGE_SIZE, IMAGE_SIZE);
  mainCtx.restore();

  // LAYER 2: Background text with enhanced movement
  drawScrollingText(mainCtx, scrollY, window.innerWidth, window.innerHeight / 2);

  // LAYER 3: Premium inverted text effect
  if (!offCtx || !maskCtx) return;
  
  offCtx.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
  maskCtx.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);

  // Draw transformed image on offscreen canvas (matching main image)
  offCtx.save();
  offCtx.translate(IMAGE_SIZE/2 + transforms.mouseInfluence.x, IMAGE_SIZE/2 + transforms.mouseInfluence.y);
  offCtx.scale(transforms.breathingScale, transforms.breathingScale);
  offCtx.rotate(transforms.rotation);
  offCtx.drawImage(img, -IMAGE_SIZE/2, -IMAGE_SIZE/2, IMAGE_SIZE, IMAGE_SIZE);
  offCtx.restore();
  
  const scaledImageSize = IMAGE_SIZE * devicePixelRatio;
  const imageData = offCtx.getImageData(0, 0, scaledImageSize, scaledImageSize);
  const data = imageData.data;
  
  // Enhanced text mask with precise positioning to match background text
  maskCtx.font = FONT;
  maskCtx.textBaseline = 'middle';
  maskCtx.textAlign = 'left';
  maskCtx.fillStyle = '#fff';
  
  // Use fresh text width calculation for mask
  const textWidth = getTextWidth(maskCtx, TEXT, FONT) + PADDING;
  const breathingOffset = Math.sin(time * BREATHING_SPEED) * BREATHING_AMPLITUDE;
  const parallaxOffset = (mouseX - window.innerWidth / 2) * PARALLAX_STRENGTH;
  const totalOffset = (scrollY + breathingOffset + parallaxOffset) % textWidth;
  
  // Match the exact positioning logic from drawScrollingText
  const adjustedOffset = totalOffset + imgX + transforms.mouseInfluence.x;
  const startX = -adjustedOffset - textWidth * 2;
  
  let x = startX;
  while (x < IMAGE_SIZE + textWidth) {
    const yOffset = Math.sin(time * 0.001 + x * 0.01) * 2 - transforms.mouseInfluence.y;
    maskCtx.fillText(TEXT, x, IMAGE_SIZE / 2 + yOffset);
    x += textWidth;
  }
  
  const maskData = maskCtx.getImageData(0, 0, scaledImageSize, scaledImageSize);
  const maskPixels = maskData.data;
  
  // Enhanced color inversion with dynamic tinting
  const len = data.length;
  const tintStrength = 0.1 + Math.sin(time * 0.002) * 0.05;
  
  for (let i = 0; i < len; i += 4) {
    const alpha = data[i + 3];
    const maskAlpha = maskPixels[i + 3];
    
    if (maskAlpha > 0 && alpha > 0) {
      // Enhanced difference blend with color tinting
      const invR = 255 - data[i];
      const invG = 255 - data[i + 1];
      const invB = 255 - data[i + 2];
      
      // Add subtle color tinting based on position and time
      const tintR = Math.min(255, invR + (HIGHLIGHT_COLOR.slice(1, 3) === '00' ? 0 : parseInt(HIGHLIGHT_COLOR.slice(1, 3), 16)) * tintStrength);
      const tintG = Math.min(255, invG + (HIGHLIGHT_COLOR.slice(3, 5) === '66' ? parseInt(HIGHLIGHT_COLOR.slice(3, 5), 16) : 0) * tintStrength);
      const tintB = Math.min(255, invB + (HIGHLIGHT_COLOR.slice(5, 7) === 'ff' ? parseInt(HIGHLIGHT_COLOR.slice(5, 7), 16) : 0) * tintStrength);
      
      data[i] = tintR;
      data[i + 1] = tintG;
      data[i + 2] = tintB;
    }
  }
  
  offCtx.putImageData(imageData, 0, 0);
  
  // Add premium glow effect around the processed image
  if (glowIntensity > 0) {
    mainCtx.save();
    mainCtx.shadowColor = HIGHLIGHT_COLOR;
    mainCtx.shadowBlur = 40 * glowIntensity;
    mainCtx.globalAlpha = 0.3 * glowIntensity;
    mainCtx.drawImage(offCanvas!, imgX, window.innerHeight / 2 - IMAGE_SIZE / 2, IMAGE_SIZE, IMAGE_SIZE);
    mainCtx.restore();
  }
  
  mainCtx.drawImage(offCanvas!, imgX, window.innerHeight / 2 - IMAGE_SIZE / 2, IMAGE_SIZE, IMAGE_SIZE);
}

function animate() {
  time = performance.now();
  
  // Smooth mouse following
  mouseX += (targetMouseX - mouseX) * MOUSE_EASE;
  mouseY += (targetMouseY - mouseY) * MOUSE_EASE;
  
  // Enhanced scroll easing with momentum
  const target = window.scrollY || window.pageYOffset;
  const scrollDiff = target - animatedScrollY;
  animatedScrollY += scrollDiff * EASE;
  
  if (Math.abs(scrollDiff) < 0.1) animatedScrollY = target;
  
  // Dynamic glow based on scroll speed
  const scrollSpeed = Math.abs(scrollDiff);
  targetGlowIntensity = Math.min(1, scrollSpeed * 0.01);
  glowIntensity += (targetGlowIntensity - glowIntensity) * GLOW_EASE;
  
  drawMain(animatedScrollY);
  requestAnimationFrame(animate);
}

function handleResize() {
  resizeCanvas();
  drawMain(animatedScrollY);
}

// Enhanced mouse tracking
function handleMouseMove(e: MouseEvent) {
  targetMouseX = e.clientX;
  targetMouseY = e.clientY;
}

// Touch support for mobile
function handleTouch(e: TouchEvent) {
  if (e.touches.length > 0) {
    targetMouseX = e.touches[0].clientX;
    targetMouseY = e.touches[0].clientY;
  }
}

img.onload = () => {
  // Force font loading check
  setTimeout(() => {
    cachedTextWidth = null;
    handleResize();
  }, 100);
  
  handleResize();
  animate();
};

window.addEventListener('resize', handleResize);
window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('touchmove', handleTouch, { passive: true });
window.addEventListener('touchstart', handleTouch, { passive: true });