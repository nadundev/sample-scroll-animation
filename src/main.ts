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

const TEXT = 'Cyber Threats Neutralized •       ';
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

// Performance optimizations
const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
let cachedTextWidth: number | null = null;
let cachedFont: string | null = null; // Track font changes
let offCanvas: HTMLCanvasElement | null = null;
let offCtx: CanvasRenderingContext2D | null = null;
let maskCanvas: HTMLCanvasElement | null = null;
let maskCtx: CanvasRenderingContext2D | null = null;

// Premium visual enhancements
let glowIntensity = 0;
let targetGlowIntensity = 0;
const GLOW_EASE = 0.05;

function getTextWidth(ctx: CanvasRenderingContext2D, text: string, font: string) {
  // Reset cache if font changed
  if (cachedTextWidth === null || cachedFont !== font) {
    ctx.font = font;
    cachedTextWidth = ctx.measureText(text).width;
    cachedFont = font;
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
  mainCanvas.height = IMAGE_SIZE * devicePixelRatio;
  
  mainCanvas.style.width = window.innerWidth + 'px';
  mainCanvas.style.height = IMAGE_SIZE + 'px';
  
  mainCtx.scale(devicePixelRatio, devicePixelRatio);
  
  // Reset cached values on resize
  cachedTextWidth = null;
  cachedFont = null;
  
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
  const textWidth = getTextWidth(ctx, TEXT, FONT) + PADDING;
  const breathingOffset = Math.sin(time * BREATHING_SPEED) * BREATHING_AMPLITUDE;
  const parallaxOffset = (mouseX - window.innerWidth / 2) * PARALLAX_STRENGTH;
  const totalOffset = (scrollY + xOffset + breathingOffset + parallaxOffset) % textWidth;
  
  ctx.save();
  ctx.font = FONT;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = isGlowing ? HIGHLIGHT_COLOR : TEXT_COLOR;
  
  // Calculate precise starting position to avoid overlaps
  const startX = -totalOffset - textWidth;
  
  // Draw enough instances with proper spacing
  let x = startX;
  while (x < width + textWidth * 2) {
    if (isGlowing) {
      drawPremiumText(ctx, TEXT, x, yPosition + Math.sin(time * 0.001 + x * 0.01) * 2, true);
    } else {
      drawPremiumText(ctx, TEXT, x, yPosition);
    }
    x += textWidth; // Ensure exact spacing
  }
  ctx.restore();
}

function drawMain(scrollY: number) {
  // Clear canvas to transparent
  mainCtx.clearRect(0, 0, window.innerWidth, IMAGE_SIZE);
  
  const imgX = (window.innerWidth - IMAGE_SIZE) / 2;
  const mouseInfluence = {
    x: (mouseX - window.innerWidth / 2) * 0.02,
    y: (mouseY - IMAGE_SIZE / 2) * 0.02
  };
  
  // LAYER 1: Enhanced image with subtle transform
  mainCtx.save();
  mainCtx.translate(imgX + IMAGE_SIZE/2 + mouseInfluence.x, IMAGE_SIZE/2 + mouseInfluence.y);
  
  // Subtle breathing scale effect
  const breathingScale = 1 + Math.sin(time * BREATHING_SPEED * 0.7) * 0.015;
  mainCtx.scale(breathingScale, breathingScale);
  
  // Add subtle rotation based on mouse
  const rotation = (mouseX - window.innerWidth / 2) * 0.00005;
  mainCtx.rotate(rotation);
  
  mainCtx.drawImage(img, -IMAGE_SIZE/2, -IMAGE_SIZE/2, IMAGE_SIZE, IMAGE_SIZE);
  mainCtx.restore();

  // LAYER 2: Background text with enhanced movement
  drawScrollingText(mainCtx, scrollY, window.innerWidth, IMAGE_SIZE / 2);

  // LAYER 3: Premium inverted text effect
  if (!offCtx || !maskCtx) return;
  
  offCtx.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
  maskCtx.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);

  // Draw transformed image on offscreen canvas
  offCtx.save();
  offCtx.translate(IMAGE_SIZE/2 + mouseInfluence.x, IMAGE_SIZE/2 + mouseInfluence.y);
  offCtx.scale(breathingScale, breathingScale);
  offCtx.rotate(rotation);
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
  
  const textWidth = getTextWidth(maskCtx, TEXT, FONT) + PADDING;
  const breathingOffset = Math.sin(time * BREATHING_SPEED) * BREATHING_AMPLITUDE;
  const parallaxOffset = (mouseX - window.innerWidth / 2) * PARALLAX_STRENGTH;
  const totalOffset = (scrollY + breathingOffset + parallaxOffset) % textWidth;
  
  // Match the exact positioning logic from drawScrollingText
  const adjustedOffset = totalOffset + imgX + mouseInfluence.x;
  const startX = -adjustedOffset - textWidth;
  
  let x = startX;
  while (x < IMAGE_SIZE + textWidth * 2) {
    maskCtx.fillText(TEXT, x, IMAGE_SIZE / 2 + Math.sin(time * 0.001 + x * 0.01) * 2 - mouseInfluence.y);
    x += textWidth; // Ensure exact spacing matches main text
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
    mainCtx.drawImage(offCanvas!, imgX, 0, IMAGE_SIZE, IMAGE_SIZE);
    mainCtx.restore();
  }
  
  mainCtx.drawImage(offCanvas!, imgX, 0, IMAGE_SIZE, IMAGE_SIZE);
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
  handleResize();
  animate();
};

window.addEventListener('resize', handleResize);
window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('touchmove', handleTouch, { passive: true });
window.addEventListener('touchstart', handleTouch, { passive: true });