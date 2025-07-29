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
const TEXT_COLOR = '#fff';
const PADDING = 64; // px between repeats
const IMAGE_SIZE = 800;

function getTextWidth(ctx: CanvasRenderingContext2D, text: string, font: string) {
  ctx.font = font;
  return ctx.measureText(text).width;
}

function resizeCanvas() {
  mainCanvas.width = window.innerWidth;
  mainCanvas.height = IMAGE_SIZE;
}

function drawMain() {
  mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
  // Draw image centered
  const imgX = (mainCanvas.width - IMAGE_SIZE) / 2;
  mainCtx.drawImage(img, imgX, 0, IMAGE_SIZE, IMAGE_SIZE);

  // Calculate scroll offset
  const textWidth = getTextWidth(mainCtx, TEXT, FONT) + PADDING;
  const scrollY = window.scrollY || window.pageYOffset;
  const offset = scrollY % textWidth;

  // Draw scrolling text (white, normal) across the whole canvas
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
  // Set blend mode to difference and draw the text
  offCtx.globalCompositeOperation = 'difference';
  offCtx.fillStyle = '#fff';
  offCtx.font = FONT;
  offCtx.textBaseline = 'middle';
  offCtx.textAlign = 'left';
  x = -offset - imgX; // adjust for main canvas scroll and image position
  while (x < IMAGE_SIZE) {
    offCtx.fillText(TEXT, x, IMAGE_SIZE / 2);
    x += textWidth;
  }
  // Draw the offscreen canvas back onto the main canvas
  mainCtx.drawImage(offCanvas, imgX, 0);
}

function drawAll() {
  resizeCanvas();
  drawMain();
}

img.onload = () => {
  drawAll();
};
window.addEventListener('scroll', drawAll);
window.addEventListener('resize', drawAll);
