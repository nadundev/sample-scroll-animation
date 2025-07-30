import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <div class="flex justify-center items-center h-screen">
    </div>
    <div class="flex justify-center items-center h-screen relative overflow-hidden">
      <canvas id="main-canvas" style="display:block; margin:auto; z-index:10;"></canvas>
    </div>
    <div class="flex justify-center items-center h-screen">
    </div>
  </div>
`;

const mainCanvas = document.getElementById('main-canvas') as HTMLCanvasElement;
const mainCtx = mainCanvas.getContext('2d')!;
const img = new window.Image();
img.src = '/image.png';

const TEXT = 'Cyber Threats Neutralized, 24/7';
const FONT_SIZE = 120;
const FONT = `500 ${FONT_SIZE}px sans-serif`;
const TEXT_COLOR = '#000';
const PADDING = 64; // px between repeats
const IMAGE_SIZE = 800;

let animatedScrollY = 0;
const EASE = 0.08; // Easing factor (smaller = smoother, slower)
// Cap device pixel ratio for performance while maintaining quality
const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

// Cache text width calculation
let cachedTextWidth: number | null = null;

// Reusable offscreen canvases to avoid constant creation/destruction
let offCanvas: HTMLCanvasElement | null = null;
let offCtx: CanvasRenderingContext2D | null = null;
let maskCanvas: HTMLCanvasElement | null = null;
let maskCtx: CanvasRenderingContext2D | null = null;

function getTextWidth(ctx: CanvasRenderingContext2D, text: string, font: string) {
  if (cachedTextWidth === null) {
    ctx.font = font;
    cachedTextWidth = ctx.measureText(text).width;
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
  
  // Only resize if dimensions changed
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
  // Set the actual canvas size (in memory)
  mainCanvas.width = window.innerWidth * devicePixelRatio;
  mainCanvas.height = IMAGE_SIZE * devicePixelRatio;
  
  // Set the CSS size (what the user sees)
  mainCanvas.style.width = window.innerWidth + 'px';
  mainCanvas.style.height = IMAGE_SIZE + 'px';
  
  // Scale the context to match the device pixel ratio
  mainCtx.scale(devicePixelRatio, devicePixelRatio);
  
  // Reset cached text width on resize
  cachedTextWidth = null;
  
  // Initialize offscreen canvases
  initOffscreenCanvases();
}

function drawScrollingText(ctx: CanvasRenderingContext2D, scrollY: number, width: number, yPosition: number, xOffset: number = 0) {
  const textWidth = getTextWidth(ctx, TEXT, FONT) + PADDING;
  const offset = (scrollY + xOffset) % textWidth;
  
  ctx.save();
  ctx.font = FONT;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = TEXT_COLOR;
  
  let x = -offset;
  while (x < width) {
    ctx.fillText(TEXT, x, yPosition);
    x += textWidth;
  }
  ctx.restore();
}

function drawMain(scrollY: number) {
  // Clear with scaled dimensions
  mainCtx.clearRect(0, 0, mainCanvas.width / devicePixelRatio, mainCanvas.height / devicePixelRatio);
  
  // Calculate scroll offset once
  const textWidth = getTextWidth(mainCtx, TEXT, FONT) + PADDING;
  const offset = scrollY % textWidth;
  const imgX = (window.innerWidth - IMAGE_SIZE) / 2;

  // LAYER 1: Draw image centered
  mainCtx.drawImage(img, imgX, 0, IMAGE_SIZE, IMAGE_SIZE);

  // LAYER 2: Draw scrolling text (black, normal) across the whole canvas
  mainCtx.save();
  mainCtx.font = FONT;
  mainCtx.textBaseline = 'middle';
  mainCtx.textAlign = 'left';
  mainCtx.fillStyle = TEXT_COLOR;
  let x = -offset;
  while (x < window.innerWidth) {
    mainCtx.fillText(TEXT, x, IMAGE_SIZE / 2);
    x += textWidth;
  }
  mainCtx.restore();

  // LAYER 3: Create inverted text effect ONLY over the image area
  if (!offCtx || !maskCtx) return;
  
  // Clear offscreen canvases efficiently
  offCtx.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
  maskCtx.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);

  // Draw the image on offscreen canvas
  offCtx.drawImage(img, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
  
  // Get image data to check for transparency
  const scaledImageSize = IMAGE_SIZE * devicePixelRatio;
  const imageData = offCtx.getImageData(0, 0, scaledImageSize, scaledImageSize);
  const data = imageData.data;
  
  // Draw the text mask with correct offset
  maskCtx.font = FONT;
  maskCtx.textBaseline = 'middle';
  maskCtx.textAlign = 'left';
  maskCtx.fillStyle = '#fff';
  x = -offset - imgX;
  while (x < IMAGE_SIZE) {
    maskCtx.fillText(TEXT, x, IMAGE_SIZE / 2);
    x += textWidth;
  }
  
  // Apply the mask to the image data
  const maskData = maskCtx.getImageData(0, 0, scaledImageSize, scaledImageSize);
  const maskPixels = maskData.data;
  
  // Only apply difference where there's actual image content (not transparent)
  const len = data.length;
  for (let i = 0; i < len; i += 4) {
    const alpha = data[i + 3]; // Alpha channel
    const maskAlpha = maskPixels[i + 3]; // Text mask alpha
    
    if (maskAlpha > 0 && alpha > 0) {
      // Apply difference blend only where text overlaps non-transparent image
      data[i] = 255 - data[i];     // Red
      data[i + 1] = 255 - data[i + 1]; // Green
      data[i + 2] = 255 - data[i + 2]; // Blue
    }
  }
  
  // Put the modified image data back
  offCtx.putImageData(imageData, 0, 0);
  
  // Draw the processed image back onto the main canvas at the image position
  mainCtx.drawImage(offCanvas!, imgX, 0, IMAGE_SIZE, IMAGE_SIZE);
}

function animate() {
  // Ease the animated scroll position toward the real scroll position
  const target = window.scrollY || window.pageYOffset;
  animatedScrollY += (target - animatedScrollY) * EASE;
  // If close enough, snap to target to avoid jitter
  if (Math.abs(target - animatedScrollY) < 0.1) animatedScrollY = target;
  drawMain(animatedScrollY);
  requestAnimationFrame(animate);
}

function handleResize() {
  resizeCanvas();
  drawMain(animatedScrollY);
}

img.onload = () => {
  handleResize();
  animate();
};
window.addEventListener('resize', handleResize);