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

function getTextWidth(ctx: CanvasRenderingContext2D, text: string, font: string) {
  ctx.font = font;
  return ctx.measureText(text).width;
}

function resizeCanvas() {
  mainCanvas.width = window.innerWidth;
  mainCanvas.height = IMAGE_SIZE;
}

function drawMain(scrollY: number) {
  mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
  // Draw image centered
  const imgX = (mainCanvas.width - IMAGE_SIZE) / 2;
  mainCtx.drawImage(img, imgX, 0, IMAGE_SIZE, IMAGE_SIZE);

  // Calculate scroll offset
  const textWidth = getTextWidth(mainCtx, TEXT, FONT) + PADDING;
  const offset = scrollY % textWidth;

  // Draw scrolling text (black, normal) across the whole canvas
  mainCtx.save();
  mainCtx.font = FONT;
  mainCtx.textBaseline = 'middle';
  mainCtx.textAlign = 'left';
  mainCtx.fillStyle = TEXT_COLOR;
  let x = -offset;
  while (x < mainCanvas.width) {
    mainCtx.fillText(TEXT, x, mainCanvas.height / 2);
    x += textWidth;
  }
  mainCtx.restore();

  // --- Offscreen canvas for invert effect ---
  const offCanvas = document.createElement('canvas');
  offCanvas.width = IMAGE_SIZE;
  offCanvas.height = IMAGE_SIZE;
  const offCtx = offCanvas.getContext('2d')!;

  // Draw the image
  offCtx.drawImage(img, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
  
  // Get image data to check for transparency
  const imageData = offCtx.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
  const data = imageData.data;
  
  // Create a mask for non-transparent pixels
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = IMAGE_SIZE;
  maskCanvas.height = IMAGE_SIZE;
  const maskCtx = maskCanvas.getContext('2d')!;
  
  // Draw the text on the mask
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
  const maskData = maskCtx.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
  const maskPixels = maskData.data;
  
  // Only apply difference where there's actual image content (not transparent)
  for (let i = 0; i < data.length; i += 4) {
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
  
  // Draw the offscreen canvas back onto the main canvas
  mainCtx.drawImage(offCanvas, imgX, 0);
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
