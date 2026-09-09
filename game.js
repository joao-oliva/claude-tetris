'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS = [
  null,
  '#4dd0e1', // I - cyan
  '#ffd54f', // O - yellow
  '#ba68c8', // T - purple
  '#81c784', // S - green
  '#e57373', // Z - red
  '#90caf9', // J - pale blue
  '#ffb74d', // L - orange
  '#b0bec5', // Nut - metallic grey
  '#ff2d95', // Tinte - magenta
];

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
  [[8,8,8],[8,0,8],[8,8,8]],                  // Nut (tuerca) - 3x3 ring, hollow center
  [[9]],                                      // Tinte - 1x1
];

// ---- Skins ----
// Paleta pastel: mismos 9 índices, tonos suaves.
const PASTEL_COLORS = [
  null,
  '#a8e6ef', // I
  '#fff2b3', // O
  '#e0bce8', // T
  '#c3ecc6', // S
  '#f5b8b8', // Z
  '#c6e0f9', // J
  '#ffdcb3', // L
  '#dcdfe3', // Nut
  '#ffc6e0', // Tinte
];

// Neón: colores saturados/brillantes sobre fondo oscuro.
const NEON_COLORS = [
  null,
  '#00e5ff',
  '#fff200',
  '#e040fb',
  '#00e676',
  '#ff1744',
  '#2979ff',
  '#ff9100',
  '#eeeeee',
  '#ff00c8',
];

const SKINS = {
  retro: {
    colors: COLORS,
    boardBg: null, // usa las variables de tema existentes
    draw(context, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      const color = SKINS.retro.colors[colorIndex];
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = color;
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      // highlight
      context.fillStyle = 'rgba(255,255,255,0.12)';
      context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
      context.globalAlpha = 1;
    },
  },
  neon: {
    colors: NEON_COLORS,
    boardBg: '#05050a',
    draw(context, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      const color = SKINS.neon.colors[colorIndex];
      context.globalAlpha = alpha ?? 1;
      context.shadowBlur = 12;
      context.shadowColor = color;
      context.fillStyle = color;
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      context.shadowBlur = 0; // evita que el glow se filtre a lo dibujado después
      context.fillStyle = 'rgba(255,255,255,0.25)';
      context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
      context.globalAlpha = 1;
    },
  },
  pastel: {
    colors: PASTEL_COLORS,
    boardBg: '#fdf7fb',
    draw(context, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      const color = SKINS.pastel.colors[colorIndex];
      const px = x * size + 1;
      const py = y * size + 1;
      const w = size - 2;
      const h = size - 2;
      const radius = Math.min(6, w / 3, h / 3);
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = color;
      if (typeof context.roundRect === 'function') {
        context.beginPath();
        context.roundRect(px, py, w, h, radius);
        context.fill();
      } else {
        context.fillRect(px, py, w, h);
      }
      context.fillStyle = 'rgba(255,255,255,0.35)';
      if (typeof context.roundRect === 'function') {
        context.beginPath();
        context.roundRect(px, py, w, 4, [radius, radius, 0, 0]);
        context.fill();
      } else {
        context.fillRect(px, py, w, 4);
      }
      context.globalAlpha = 1;
    },
  },
  pixel: {
    colors: COLORS,
    boardBg: '#101014',
    draw(context, x, y, colorIndex, size, alpha) {
      if (!colorIndex) return;
      const color = SKINS.pixel.colors[colorIndex];
      const px = x * size + 1;
      const py = y * size + 1;
      const w = size - 2;
      const h = size - 2;
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = color;
      context.fillRect(px, py, w, h);
      // patrón de dithering: cuadritos alternos más claros/oscuros
      const cell = Math.max(2, Math.floor(size / 8));
      for (let gy = 0; gy * cell < h; gy++) {
        for (let gx = 0; gx * cell < w; gx++) {
          if ((gx + gy) % 2 === 0) continue;
          context.fillStyle = (gx + gy) % 4 === 1 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)';
          context.fillRect(
            px + gx * cell,
            py + gy * cell,
            Math.min(cell, px + w - (px + gx * cell)),
            Math.min(cell, py + h - (py + gy * cell))
          );
        }
      }
      context.globalAlpha = 1;
    },
  },
};

const skinSelect = document.getElementById('skin-select');

const LINE_SCORES = [0, 100, 300, 500, 800];
const NUT_TYPE = 8;
const TINT_TYPE = 9;          // pieza especial "Tinte"
const TINT_INTERVAL = 20;     // aparece cada 20 piezas generadas
const WILD_FLAG = 100;        // board[r][c] = tipoOriginal + WILD_FLAG => comodín

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const tintCountdownEl = document.getElementById('tint-countdown');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const themeToggle = document.getElementById('theme-toggle');

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId, piecesGenerated, currentSkin;

function baseType(v) { return v % WILD_FLAG; }   // color original de la celda
function isWild(v) { return v >= WILD_FLAG; }    // celda convertida en comodín

function getThemeVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function applyTheme(isLight) {
  document.body.classList.toggle('light-theme', isLight);
  themeToggle.checked = isLight;
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  applyTheme(saved === 'light');
}

themeToggle.addEventListener('change', () => {
  const isLight = themeToggle.checked;
  applyTheme(isLight);
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

function applySkin(name) {
  const skinName = SKINS[name] ? name : 'retro';
  currentSkin = skinName;
  if (skinSelect) skinSelect.value = skinName;
  document.body.classList.remove('skin-neon', 'skin-pastel', 'skin-pixel');
  if (skinName !== 'retro') document.body.classList.add(`skin-${skinName}`);
  if (typeof board !== 'undefined' && board) draw();
}

function initSkin() {
  let saved = null;
  try { saved = localStorage.getItem('tetris.skin'); } catch (e) {}
  applySkin(saved || 'retro');
}

if (skinSelect) {
  skinSelect.addEventListener('change', () => {
    applySkin(skinSelect.value);
    try { localStorage.setItem('tetris.skin', skinSelect.value); } catch (e) {}
  });
}

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  piecesGenerated++;
  const type = (piecesGenerated % TINT_INTERVAL === 0)
    ? TINT_TYPE
    : Math.floor(Math.random() * 8) + 1;
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function isRowComplete(row) {
  const used = new Array(COLS).fill(false);   // comodines ya asignados a un hueco
  for (let c = 0; c < COLS; c++) {
    if (row[c]) continue;                     // celda ocupada
    // hueco: buscar un comodín contiguo libre (izquierda primero, luego derecha)
    if (c > 0 && isWild(row[c - 1]) && !used[c - 1]) { used[c - 1] = true; continue; }
    if (c < COLS - 1 && isWild(row[c + 1]) && !used[c + 1]) { used[c + 1] = true; continue; }
    return false;
  }
  return true;
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (isRowComplete(board[r])) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    updateHUD();
  }
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function applyTint() {
  const belowRow = current.y + 1;
  if (belowRow >= ROWS) return;                       // aterrizó en el suelo: sin efecto
  const target = baseType(board[belowRow][current.x]);
  if (!target) return;                                // celda vacía debajo: sin efecto
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c] && baseType(board[r][c]) === target)
        board[r][c] = target + WILD_FLAG;             // idempotente si ya era comodín
}

function lockPiece() {
  if (current.type === TINT_TYPE) applyTint();
  else merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
  tintCountdownEl.textContent = TINT_INTERVAL - (piecesGenerated % TINT_INTERVAL);
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  SKINS[currentSkin || 'retro'].draw(context, x, y, colorIndex, size, alpha);
}

function drawNutHole(context, x, y, size, alpha) {
  const cx = x * size + size / 2;
  const cy = y * size + size / 2;
  const r = size * 0.3;
  context.globalAlpha = alpha ?? 1;
  context.beginPath();
  context.arc(cx, cy, r, 0, Math.PI * 2);
  context.fillStyle = getThemeVar('--board-bg'); // tapa las líneas de la rejilla
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = SKINS[currentSkin || 'retro'].colors[NUT_TYPE];
  context.stroke();
  context.globalAlpha = 1;
}

function drawWildMark(context, x, y, size, alpha) {
  const cx = x * size + size / 2;
  const cy = y * size + size / 2;
  const r = size * 0.28;
  context.globalAlpha = alpha ?? 1;
  context.beginPath();
  context.moveTo(cx, cy - r);
  context.lineTo(cx + r, cy);
  context.lineTo(cx, cy + r);
  context.lineTo(cx - r, cy);
  context.closePath();
  context.fillStyle = 'rgba(255,255,255,0.85)';
  context.fill();
  context.lineWidth = 1;
  context.strokeStyle = 'rgba(0,0,0,0.35)';
  context.stroke();
  context.globalAlpha = 1;
}

function drawTintMark(context, x, y, size, alpha) {
  const cx = x * size + size / 2;
  const cy = y * size + size / 2;
  const r = size * 0.28;
  context.globalAlpha = alpha ?? 1;
  context.beginPath();
  context.arc(cx, cy, r, 0, Math.PI * 2);
  context.fillStyle = 'rgba(255,255,255,0.9)';
  context.fill();
  context.globalAlpha = 1;
}

function drawGrid() {
  ctx.strokeStyle = getThemeVar('--grid-line');
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const v = board[r][c];
      drawBlock(ctx, c, r, baseType(v), BLOCK);
      if (isWild(v)) drawWildMark(ctx, c, r, BLOCK);
    }

  // ghost
  const gy = ghostY();
  const ghostAlpha = Number(getThemeVar('--ghost-alpha'));
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, ghostAlpha);
  if (current.type === NUT_TYPE)
    drawNutHole(ctx, current.x + 1, gy + 1, BLOCK, ghostAlpha);
  if (current.type === TINT_TYPE)
    drawTintMark(ctx, current.x, gy, BLOCK, ghostAlpha);

  // current piece
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);
  if (current.type === NUT_TYPE)
    drawNutHole(ctx, current.x + 1, current.y + 1, BLOCK);
  if (current.type === TINT_TYPE)
    drawTintMark(ctx, current.x, current.y, BLOCK);
}

function drawNext() {
  const NB = 30;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
  if (next.type === NUT_TYPE)
    drawNutHole(nextCtx, offX + 1, offY + 1, NB);
  if (next.type === TINT_TYPE)
    drawTintMark(nextCtx, offX, offY, NB);
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;
  overlay.classList.remove('hidden');
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (!paused) {
    lastTime = performance.now();
    loop(lastTime);
  } else {
    cancelAnimationFrame(animId);
    overlayTitle.textContent = 'PAUSA';
    overlayScore.textContent = '';
    overlay.classList.remove('hidden');
  }
}

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }
  draw();
  if (gameOver || paused) return;
  animId = requestAnimationFrame(loop);
}

function init() {
  initTheme();
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  paused = false;
  gameOver = false;
  dropInterval = 1000;
  dropAccum = 0;
  lastTime = performance.now();
  piecesGenerated = 0;
  next = randomPiece();
  spawn();
  updateHUD();
  overlay.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (e.code === 'KeyP') { togglePause(); return; }
  if (paused || gameOver) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', init);

initSkin();
init();
