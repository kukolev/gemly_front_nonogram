<script setup>
import {computed, ref, onMounted, onUnmounted, watch} from 'vue';

const props = defineProps({
  size: {
    type: Object,
    default: () => ({rows: 5, cols: 5})
  },
  rowValues: {
    type: Array,
    required: true
  },
  colValues: {
    type: Array,
    required: true
  },
  solution: {
    type: Array,
    required: false
  },
  initialGrid: {
    type: Array,
    required: false
  },
  initialMarkedRowClues: {
    type: Array,
    required: false
  },
  initialMarkedColClues: {
    type: Array,
    required: false
  },
  initialHistory: {
    type: Array,
    required: false
  },
  initialHistoryIndex: {
    type: Number,
    required: false
  },
  touchMarkMode: {
    type: Boolean,
    default: false
  },
  helpMode: {
    type: Boolean,
    default: false
  }
});

// ── Canvas refs ──────────────────────────────────────────────────────────────
const scrollContainerRef = ref(null);
const cornerCanvasRef    = ref(null);
const colHeaderCanvasRef = ref(null);
const rowHeaderCanvasRef = ref(null);
const bgCanvasRef        = ref(null);   // main grid background
const canvasRef          = ref(null);   // main grid interactive

// ── Responsive cell size ─────────────────────────────────────────────────────
const isMobileSize = ref(window.innerWidth <= 640);
const handleResize = () => { isMobileSize.value = window.innerWidth <= 640; };
const CELL_SIZE = computed(() => isMobileSize.value ? 20 : 13);

// ── Puzzle state ─────────────────────────────────────────────────────────────
const grid = ref(
    props.initialGrid ? JSON.parse(JSON.stringify(props.initialGrid)) :
    Array.from({length: props.size.rows}, () =>
        Array.from({length: props.size.cols}, () => 0)
    )
);

const maxRowClues = computed(() => Math.max(...props.rowValues.map(v => v.length), 0));
const maxColClues = computed(() => Math.max(...props.colValues.map(v => v.length), 0));

const markedRowClues = ref(
    props.initialMarkedRowClues ? JSON.parse(JSON.stringify(props.initialMarkedRowClues)) :
    props.rowValues.map(() => Array(maxRowClues.value).fill(false))
);

const markedColClues = ref(
    props.initialMarkedColClues ? JSON.parse(JSON.stringify(props.initialMarkedColClues)) :
    props.colValues.map(() => Array(maxColClues.value).fill(false))
);

const errors = ref(
    Array.from({length: props.size.rows}, () =>
        Array.from({length: props.size.cols}, () => false)
    )
);

const isDrawing    = ref(false);
const isSolved     = ref(false);
const drawingState = ref(null);
const hoveredRow   = ref(null);
const hoveredCol   = ref(null);
const cursorClientX = ref(0);
const cursorClientY = ref(0);
const startRow     = ref(null);
const startCol     = ref(null);
const lockedAxis   = ref(null);

const showCongrats  = ref(false);
const congratsStyle = ref({});

const emit = defineEmits(['clue-click', 'change', 'solved', 'congrats-toggled']);

// ── Celebrations ─────────────────────────────────────────────────────────────
const triggerCongratulations = () => {
  if (showCongrats.value) return;
  congratsStyle.value = {
    top: '100px', left: '500px',
    transform: 'translate(-50%, -50%)',
    position: 'fixed',
    fontSize: '6rem', fontWeight: 'bold',
    color: '#ff4081',
    textShadow: '4px 4px 8px rgba(0,0,0,0.5)',
    pointerEvents: 'none', zIndex: 10000, whiteSpace: 'nowrap'
  };
  showCongrats.value = true;
  emit('congrats-toggled', true);
  setTimeout(() => { showCongrats.value = false; emit('congrats-toggled', false); }, 3000);
};

// ── Drawing state machine ─────────────────────────────────────────────────────
const startDrawing = (event, r, c) => {
  if (event.button !== 0 && event.button !== 2) return;
  startRow.value = r; startCol.value = c;
  lockedAxis.value = null;
  hoveredRow.value = r; hoveredCol.value = c;
  isDrawing.value = true;
  const currentValue = grid.value[r][c];
  if (event.button === 0)      drawingState.value = (currentValue === 1)  ? 0 : 1;
  else if (event.button === 2) drawingState.value = (currentValue === -1) ? 0 : -1;
};

const continueDrawing = (event, r, c) => {
  if (!isDrawing.value) { hoveredRow.value = r; hoveredCol.value = c; return; }

  let targetR = r, targetC = c;
  if (!event.shiftKey) {
    if (!lockedAxis.value) {
      if (r !== startRow.value || c !== startCol.value) {
        lockedAxis.value = Math.abs(r - startRow.value) >= Math.abs(c - startCol.value)
            ? 'vertical' : 'horizontal';
      }
    }
    if (lockedAxis.value === 'horizontal') targetR = startRow.value;
    else if (lockedAxis.value === 'vertical') targetC = startCol.value;
  } else {
    lockedAxis.value = null;
  }
  hoveredRow.value = targetR; hoveredCol.value = targetC;
};

const cancelDrawing = () => {
  isDrawing.value = false; drawingState.value = null; lockedAxis.value = null;
  startRow.value = null; startCol.value = null;
  hoveredRow.value = null; hoveredCol.value = null;
};

const stopDrawing = () => {
  if (isDrawing.value) {
    const rStart = startRow.value, rEnd = hoveredRow.value;
    const cStart = startCol.value, cEnd = hoveredCol.value;
    const sol = props.solution;
    const cellValue = (r, c) =>
      props.helpMode && sol ? (sol[r]?.[c] === 1 ? 1 : 0) : drawingState.value;
    if (lockedAxis.value === 'horizontal' || (lockedAxis.value === null && Math.abs(cEnd - cStart) >= Math.abs(rEnd - rStart))) {
      for (let c = Math.min(cStart, cEnd); c <= Math.max(cStart, cEnd); c++)
        grid.value[rStart][c] = cellValue(rStart, c);
    } else {
      for (let r = Math.min(rStart, rEnd); r <= Math.max(rStart, rEnd); r++)
        grid.value[r][cStart] = cellValue(r, cStart);
    }
    autoMarkClues(); check(false, false); saveHistory(); emit('change');
  }
  isDrawing.value = false; drawingState.value = null; lockedAxis.value = null;
};

const resetHover = () => {
  if (!isDrawing.value) { hoveredRow.value = null; hoveredCol.value = null; }
};

// ── Canvas dimensions ─────────────────────────────────────────────────────────
const legendColWidth  = computed(() => maxRowClues.value  * CELL_SIZE.value);
const legendRowHeight = computed(() => maxColClues.value  * CELL_SIZE.value);
const mainGridWidth   = computed(() => props.size.cols    * CELL_SIZE.value);
const mainGridHeight  = computed(() => props.size.rows    * CELL_SIZE.value);

const gridLayoutStyle = computed(() => ({
  gridTemplateColumns: `${legendColWidth.value}px ${mainGridWidth.value}px`,
  gridTemplateRows:    `${legendRowHeight.value}px ${mainGridHeight.value}px`,
}));

// ── RAF batching ──────────────────────────────────────────────────────────────
let rafId = null, bgRafId = null, cornerRafId = null, colHdrRafId = null, rowHdrRafId = null;

const requestDraw          = () => { if (rafId)      return; rafId      = requestAnimationFrame(() => { draw();          rafId      = null; }); };
const requestDrawBg        = () => { if (bgRafId)    return; bgRafId    = requestAnimationFrame(() => { drawBg();        bgRafId    = null; }); };
const requestDrawCorner    = () => { if (cornerRafId) return; cornerRafId = requestAnimationFrame(() => { drawCorner();   cornerRafId = null; }); };
const requestDrawColHeader = () => { if (colHdrRafId) return; colHdrRafId = requestAnimationFrame(() => { drawColHeader(); colHdrRafId = null; }); };
const requestDrawRowHeader = () => { if (rowHdrRafId) return; rowHdrRafId = requestAnimationFrame(() => { drawRowHeader(); rowHdrRafId = null; }); };

// ── Canvas sync ───────────────────────────────────────────────────────────────
const syncOne = (canvas, w, h, alpha) => {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = w * dpr;  canvas.height = h * dpr;
  canvas.style.width  = `${w}px`; canvas.style.height = `${h}px`;
  canvas.getContext('2d', { alpha }).setTransform(dpr, 0, 0, dpr, 0, 0);
};

const syncCanvasSize = () => {
  const lcw = legendColWidth.value, lrh = legendRowHeight.value;
  const mgw = mainGridWidth.value,  mgh = mainGridHeight.value;
  syncOne(cornerCanvasRef.value,    lcw, lrh, false);
  syncOne(colHeaderCanvasRef.value, mgw, lrh, false);
  syncOne(rowHeaderCanvasRef.value, lcw, mgh, false);
  syncOne(bgCanvasRef.value,        mgw, mgh, false);
  syncOne(canvasRef.value,          mgw, mgh, true);
  requestDrawCorner(); requestDrawColHeader(); requestDrawRowHeader();
  requestDrawBg(); requestDraw();
};

// ── Cross drawing helper ──────────────────────────────────────────────────────
const drawCrosses = (ctx, positions, color, lineWidth = 1) => {
  if (!positions.length) return;
  ctx.strokeStyle = color; ctx.lineWidth = lineWidth;
  ctx.beginPath();
  const cs = CELL_SIZE.value;
  const padding = 3, size = cs - padding * 2;
  for (const {x, y} of positions) {
    ctx.moveTo(x + padding,        y + padding);
    ctx.lineTo(x + padding + size, y + padding + size);
    ctx.moveTo(x + padding + size, y + padding);
    ctx.lineTo(x + padding,        y + padding + size);
  }
  ctx.stroke();
};

// ── drawCorner ────────────────────────────────────────────────────────────────
const drawCorner = () => {
  const canvas = cornerCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  const w = legendColWidth.value, h = legendRowHeight.value;
  ctx.fillStyle = '#eeeeee';
  ctx.fillRect(0, 0, w, h);
  // thick boundary on right + bottom edges
  ctx.strokeStyle = '#999'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w - 1, 0); ctx.lineTo(w - 1, h);
  ctx.moveTo(0, h - 1); ctx.lineTo(w, h - 1);
  ctx.stroke();
};

// ── drawColHeader ─────────────────────────────────────────────────────────────
const drawColHeader = () => {
  const canvas = colHeaderCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  const cs = CELL_SIZE.value;
  const mcc  = maxColClues.value;
  const cols = props.size.cols;
  const w = mainGridWidth.value, h = legendRowHeight.value;
  const hCol = hoveredCol.value;

  ctx.fillStyle = '#eeeeee';
  ctx.fillRect(0, 0, w, h);

  // Column hover highlight
  if (hCol !== null) {
    ctx.fillStyle = 'rgba(173,216,230,0.7)';
    ctx.fillRect(hCol * cs, 0, cs, h);
  }

  // Dark digit backgrounds
  ctx.fillStyle = '#555555';
  const colVals = props.colValues;
  for (let c = 0; c < cols; c++) {
    const clues = colVals[c], offset = clues.length - mcc, x = c * cs;
    for (let i = 0; i < mcc; i++) {
      if (clues[offset + i]) ctx.fillRect(x, i * cs, cs, cs);
    }
  }

  // Digits
  ctx.fillStyle = 'white';
  ctx.font = `${Math.round(10 * cs / 13)}px Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let c = 0; c < cols; c++) {
    const clues = colVals[c], offset = clues.length - mcc;
    const xCenter = c * cs + cs / 2;
    for (let i = 0; i < mcc; i++) {
      const digit = clues[offset + i];
      if (digit) ctx.fillText(digit.toString(), xCenter, i * cs + cs / 2 + 1);
    }
  }

  // Thin grid lines
  ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.beginPath();
  for (let c = 1; c < cols; c++) {
    if (c % 5 !== 0) { ctx.moveTo(c * cs, 0); ctx.lineTo(c * cs, h); }
  }
  for (let i = 1; i < mcc; i++) { ctx.moveTo(0, i * cs); ctx.lineTo(w, i * cs); }
  ctx.stroke();

  // Thick lines
  ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(0, h - 1); ctx.lineTo(w, h - 1); // bottom boundary
  for (let c = 5; c < cols; c += 5) { ctx.moveTo(c * cs, 0); ctx.lineTo(c * cs, h); }
  ctx.stroke();

  // Clue marks (crosses on marked clue numbers)
  const mccData = markedColClues.value;
  const cp = { '#5b5353': [], '#ccc': [] };
  for (let c = 0; c < cols; c++) {
    const clues = colVals[c], offset = clues.length - mcc;
    for (let i = 0; i < mcc; i++) {
      if (mccData[c][i]) {
        cp[clues[offset + i] ? '#ccc' : '#5b5353'].push({x: c * cs, y: i * cs});
      }
    }
  }
  drawCrosses(ctx, cp['#5b5353'], '#5b5353');
  drawCrosses(ctx, cp['#ccc'], '#ccc');
};

// ── drawRowHeader ─────────────────────────────────────────────────────────────
const drawRowHeader = () => {
  const canvas = rowHeaderCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  const cs = CELL_SIZE.value;
  const mrc  = maxRowClues.value;
  const rows = props.size.rows;
  const w = legendColWidth.value, h = mainGridHeight.value;
  const hRow = hoveredRow.value;

  ctx.fillStyle = '#eeeeee';
  ctx.fillRect(0, 0, w, h);

  // Row hover highlight
  if (hRow !== null) {
    ctx.fillStyle = 'rgba(173,216,230,0.7)';
    ctx.fillRect(0, hRow * cs, w, cs);
  }

  // Dark digit backgrounds
  ctx.fillStyle = '#555555';
  const rowVals = props.rowValues;
  for (let r = 0; r < rows; r++) {
    const clues = rowVals[r], offset = clues.length - mrc, y = r * cs;
    for (let i = 0; i < mrc; i++) {
      if (clues[offset + i]) ctx.fillRect(i * cs, y, cs, cs);
    }
  }

  // Digits
  ctx.fillStyle = 'white';
  ctx.font = `${Math.round(10 * cs / 13)}px Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let r = 0; r < rows; r++) {
    const clues = rowVals[r], offset = clues.length - mrc;
    const yCenter = r * cs + cs / 2 + 1;
    for (let i = 0; i < mrc; i++) {
      const digit = clues[offset + i];
      if (digit) ctx.fillText(digit.toString(), i * cs + cs / 2, yCenter);
    }
  }

  // Thin grid lines
  ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.beginPath();
  for (let r = 1; r < rows; r++) {
    if (r % 5 !== 0) { ctx.moveTo(0, r * cs); ctx.lineTo(w, r * cs); }
  }
  for (let i = 1; i < mrc; i++) { ctx.moveTo(i * cs, 0); ctx.lineTo(i * cs, h); }
  ctx.stroke();

  // Thick lines
  ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(w - 1, 0); ctx.lineTo(w - 1, h); // right boundary
  for (let r = 5; r < rows; r += 5) { ctx.moveTo(0, r * cs); ctx.lineTo(w, r * cs); }
  ctx.stroke();

  // Clue marks
  const mrcData = markedRowClues.value;
  const cp = { '#5b5353': [], '#ccc': [] };
  for (let r = 0; r < rows; r++) {
    const clues = rowVals[r], offset = clues.length - mrc;
    for (let i = 0; i < mrc; i++) {
      if (mrcData[r][i]) {
        cp[clues[offset + i] ? '#ccc' : '#5b5353'].push({x: i * cs, y: r * cs});
      }
    }
  }
  drawCrosses(ctx, cp['#5b5353'], '#5b5353');
  drawCrosses(ctx, cp['#ccc'], '#ccc');
};

// ── drawBg (main grid background) ────────────────────────────────────────────
const drawBg = () => {
  const canvas = bgCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  const cs = CELL_SIZE.value;
  const rows = props.size.rows, cols = props.size.cols;
  const w = mainGridWidth.value, h = mainGridHeight.value;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);

  // Thin grid lines
  ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.beginPath();
  for (let r = 1; r < rows; r++) {
    if (r % 5 !== 0) { ctx.moveTo(0, r * cs); ctx.lineTo(w, r * cs); }
  }
  for (let c = 1; c < cols; c++) {
    if (c % 5 !== 0) { ctx.moveTo(c * cs, 0); ctx.lineTo(c * cs, h); }
  }
  ctx.stroke();

  // Thick lines + outer border
  ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.beginPath();
  ctx.strokeRect(1, 1, w - 2, h - 2);
  for (let r = 5; r < rows; r += 5) { ctx.moveTo(0, r * cs); ctx.lineTo(w, r * cs); }
  for (let c = 5; c < cols; c += 5) { ctx.moveTo(c * cs, 0); ctx.lineTo(c * cs, h); }
  ctx.stroke();
};

// ── draw (main grid interactive) ─────────────────────────────────────────────
const draw = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cs = CELL_SIZE.value;
  const rows = props.size.rows, cols = props.size.cols;
  const w = mainGridWidth.value, h = mainGridHeight.value;

  ctx.clearRect(0, 0, w, h);

  const hRow    = hoveredRow.value;
  const hCol    = hoveredCol.value;
  const gridData = grid.value;
  const dState  = drawingState.value;
  const drawing = isDrawing.value;

  // Compute pending stroke region
  let pMinR = -1, pMaxR = -1, pMinC = -1, pMaxC = -1;
  if (drawing) {
    const rStart = startRow.value, rEnd = hRow;
    const cStart = startCol.value, cEnd = hCol;
    if (lockedAxis.value === 'horizontal' || (lockedAxis.value === null && Math.abs(cEnd - cStart) >= Math.abs(rEnd - rStart))) {
      pMinR = pMaxR = rStart; pMinC = Math.min(cStart, cEnd); pMaxC = Math.max(cStart, cEnd);
    } else {
      pMinC = pMaxC = cStart; pMinR = Math.min(rStart, rEnd); pMaxR = Math.max(rStart, rEnd);
    }
  }

  // Filled cells
  ctx.fillStyle = 'black';
  for (let r = 0; r < rows; r++) {
    const row = gridData[r];
    const isHovRow = r === hRow;
    for (let c = 0; c < cols; c++) {
      const pending = drawing && r >= pMinR && r <= pMaxR && c >= pMinC && c <= pMaxC;
      const val = pending ? dState : row[c];
      if (val === 1) {
        if (isHovRow && c === hCol) {
          ctx.fillStyle = '#555555';
          ctx.fillRect(c * cs, r * cs, cs, cs);
          ctx.fillStyle = 'black';
        } else {
          ctx.fillRect(c * cs, r * cs, cs, cs);
        }
      }
    }
  }

  // Crosses in main grid (empty markers + errors)
  const cp = { '#5b5353': [], 'red': [] };
  const errorData = errors.value;
  for (let r = 0; r < rows; r++) {
    const row = gridData[r], errRow = errorData[r];
    const isDrawRow = drawing && r >= pMinR && r <= pMaxR;
    for (let c = 0; c < cols; c++) {
      const pending = isDrawRow && c >= pMinC && c <= pMaxC;
      const val = pending ? dState : row[c];
      if (val === -1 && !props.helpMode) cp['#5b5353'].push({x: c * cs, y: r * cs});
      if (errRow[c])     cp['red'].push({x: c * cs, y: r * cs});
    }
  }
  drawCrosses(ctx, cp['#5b5353'], '#5b5353');
  drawCrosses(ctx, cp['red'], 'red', 2.5);

  // Row/col highlight in main area — drawn after cells so tint is visible on black cells too
  if (hRow !== null || hCol !== null) {
    ctx.fillStyle = 'rgba(173,216,230,0.35)';
    if (hRow !== null) ctx.fillRect(0,        hRow * cs, w, cs);
    if (hCol !== null) ctx.fillRect(hCol * cs, 0,        cs, h);
  }

  // Hover outline
  if (hRow !== null && hCol !== null) {
    const pending = drawing && hRow >= pMinR && hRow <= pMaxR && hCol >= pMinC && hCol <= pMaxC;
    const val = pending ? dState : gridData[hRow][hCol];
    ctx.strokeStyle = val === 1 ? '#fff' : '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(hCol * cs + 1, hRow * cs + 1, cs - 2, cs - 2);
  }
};

// ── Position helpers ──────────────────────────────────────────────────────────
const getMainPos = (clientX, clientY) => {
  const canvas = canvasRef.value;
  if (!canvas) return {row: -1, col: -1};
  const rect = canvas.getBoundingClientRect();
  const cs = CELL_SIZE.value;
  return { col: Math.floor((clientX - rect.left) / cs), row: Math.floor((clientY - rect.top) / cs) };
};

// ── Two-finger scroll ─────────────────────────────────────────────────────────
let twoFingerPrev = null;

// ── Main-canvas mouse events ──────────────────────────────────────────────────
const handleCanvasMouseDown = (event) => {
  const {row, col} = getMainPos(event.clientX, event.clientY);
  if (row >= 0 && row < props.size.rows && col >= 0 && col < props.size.cols)
    startDrawing(event, row, col);
};

const handleCanvasMouseMove = (event) => {
  cursorClientX.value = event.clientX;
  cursorClientY.value = event.clientY;
  const {row, col} = getMainPos(event.clientX, event.clientY);
  if (row >= 0 && row < props.size.rows && col >= 0 && col < props.size.cols) {
    continueDrawing(event, row, col);
  } else if (!isDrawing.value) {
    resetHover();
  }
};

// ── Header mouse events ───────────────────────────────────────────────────────
const handleColHeaderMouseDown = (event) => {
  const rect = colHeaderCanvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  const cs = CELL_SIZE.value;
  handleClueClick('col', Math.floor((event.clientX - rect.left) / cs), Math.floor((event.clientY - rect.top) / cs));
};

const handleColHeaderMouseMove = (event) => {
  const rect = colHeaderCanvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  hoveredCol.value = Math.floor((event.clientX - rect.left) / CELL_SIZE.value);
  hoveredRow.value = null;
};

const handleRowHeaderMouseDown = (event) => {
  const rect = rowHeaderCanvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  const cs = CELL_SIZE.value;
  handleClueClick('row', Math.floor((event.clientY - rect.top) / cs), Math.floor((event.clientX - rect.left) / cs));
};

const handleRowHeaderMouseMove = (event) => {
  const rect = rowHeaderCanvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  hoveredRow.value = Math.floor((event.clientY - rect.top) / CELL_SIZE.value);
  hoveredCol.value = null;
};

// ── Touch: main canvas ────────────────────────────────────────────────────────
const handleMainTouchStart = (event) => {
  if (event.touches.length >= 2) {
    if (isDrawing.value) cancelDrawing();
    twoFingerPrev = {
      x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
      y: (event.touches[0].clientY + event.touches[1].clientY) / 2,
    };
    return;
  }
  event.preventDefault();
  const touch = event.touches[0];
  const {row, col} = getMainPos(touch.clientX, touch.clientY);
  if (row >= 0 && row < props.size.rows && col >= 0 && col < props.size.cols)
    startDrawing({button: props.touchMarkMode ? 2 : 0}, row, col);
};

const handleMainTouchMove = (event) => {
  if (event.touches.length >= 2) {
    if (!twoFingerPrev) return;
    const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
    const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
    const dx = twoFingerPrev.x - midX, dy = twoFingerPrev.y - midY;
    const sc = scrollContainerRef.value;
    if (sc) { sc.scrollLeft += dx; sc.scrollTop += dy; }
    twoFingerPrev = {x: midX, y: midY};
    return;
  }
  if (!isDrawing.value) return;
  event.preventDefault();
  const touch = event.touches[0];
  const {row, col} = getMainPos(touch.clientX, touch.clientY);
  if (row >= 0 && row < props.size.rows && col >= 0 && col < props.size.cols)
    continueDrawing({shiftKey: false}, row, col);
};

const handleMainTouchEnd = (event) => {
  if (event.touches.length < 2) twoFingerPrev = null;
  if (isDrawing.value) event.preventDefault();
  stopDrawing();
};

// ── Touch: col header ─────────────────────────────────────────────────────────
const handleColHeaderTouchStart = (event) => {
  if (event.touches.length >= 2) {
    if (isDrawing.value) cancelDrawing();
    twoFingerPrev = {
      x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
      y: (event.touches[0].clientY + event.touches[1].clientY) / 2,
    };
    return;
  }
  const touch = event.touches[0];
  const rect = colHeaderCanvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  const cs = CELL_SIZE.value;
  handleClueClick('col', Math.floor((touch.clientX - rect.left) / cs), Math.floor((touch.clientY - rect.top) / cs));
};

// ── Touch: row header ─────────────────────────────────────────────────────────
const handleRowHeaderTouchStart = (event) => {
  if (event.touches.length >= 2) {
    if (isDrawing.value) cancelDrawing();
    twoFingerPrev = {
      x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
      y: (event.touches[0].clientY + event.touches[1].clientY) / 2,
    };
    return;
  }
  const touch = event.touches[0];
  const rect = rowHeaderCanvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  const cs = CELL_SIZE.value;
  handleClueClick('row', Math.floor((touch.clientY - rect.top) / cs), Math.floor((touch.clientX - rect.left) / cs));
};

// ── Watches ───────────────────────────────────────────────────────────────────
watch([grid, errors, hoveredRow, hoveredCol, isDrawing, isSolved, () => props.helpMode], () => {
  requestDraw();
  requestDrawRowHeader();
  requestDrawColHeader();
}, {deep: true});

watch(markedRowClues, () => { requestDrawRowHeader(); }, {deep: true});
watch(markedColClues, () => { requestDrawColHeader(); }, {deep: true});

watch([() => props.rowValues, () => props.colValues, () => props.size], () => {
  requestDrawCorner(); requestDrawColHeader(); requestDrawRowHeader();
  requestDrawBg(); requestDraw();
}, {deep: true});

watch([legendColWidth, legendRowHeight, mainGridWidth, mainGridHeight], () => {
  syncCanvasSize();
});

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  window.addEventListener('mouseup', stopDrawing);
  window.addEventListener('resize', handleResize);
  canvasRef.value?.addEventListener('touchmove', handleMainTouchMove, {passive: false});
  syncCanvasSize();
});

onUnmounted(() => {
  window.removeEventListener('mouseup', stopDrawing);
  window.removeEventListener('resize', handleResize);
  canvasRef.value?.removeEventListener('touchmove', handleMainTouchMove);
});

// ── Clue click ────────────────────────────────────────────────────────────────
const handleClueClick = (type, lineIdx, clueIdx) => {
  const line = type === 'row' ? props.rowValues[lineIdx] : props.colValues[lineIdx];
  if (!line) return;
  const maxClues = type === 'row' ? maxRowClues.value : maxColClues.value;
  const hasDigit = !!line[line.length - maxClues + clueIdx];
  if (hasDigit) {
    if (type === 'row') {
      markedRowClues.value[lineIdx][clueIdx] = !markedRowClues.value[lineIdx][clueIdx];
      if (markedRowClues.value[lineIdx][clueIdx]) checkAndFillCrosses('row', lineIdx);
    } else {
      markedColClues.value[lineIdx][clueIdx] = !markedColClues.value[lineIdx][clueIdx];
      if (markedColClues.value[lineIdx][clueIdx]) checkAndFillCrosses('col', lineIdx);
    }
    saveHistory();
  }
};

const checkAndFillCrosses = (type, index) => {
  const line = type === 'row' ? props.rowValues[index] : props.colValues[index];
  const maxClues = type === 'row' ? maxRowClues.value : maxColClues.value;
  const markedClues = type === 'row' ? markedRowClues.value[index] : markedColClues.value[index];
  const allMarked = line.every((clue, i) => {
    if (!clue) return true;
    return markedClues[maxClues - line.length + i];
  });
  if (allMarked) {
    if (type === 'row') {
      for (let c = 0; c < props.size.cols; c++) if (grid.value[index][c] === 0) grid.value[index][c] = -1;
    } else {
      for (let r = 0; r < props.size.rows; r++) if (grid.value[r][index] === 0) grid.value[r][index] = -1;
    }
  }
};

// ── Block helpers ─────────────────────────────────────────────────────────────
const getBlocks = (arr) => {
  const blocks = []; let cur = null;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === 1) { if (!cur) cur = {start: i, length: 1}; else cur.length++; }
    else { if (cur) { blocks.push(cur); cur = null; } }
  }
  if (cur) blocks.push(cur);
  return blocks;
};

const autoMarkClues = () => {
  if (!props.solution) return;
  for (let r = 0; r < props.size.rows; r++) {
    const gridBlocks = getBlocks(grid.value[r]);
    const solBlocks  = getBlocks(props.solution[r]);
    props.rowValues[r].forEach((clue, j) => {
      if (!clue) return;
      const idx = maxRowClues.value - props.rowValues[r].length + j;
      const sb = solBlocks[j];
      if (sb && gridBlocks.some(gb => gb.start === sb.start && gb.length === sb.length))
        markedRowClues.value[r][idx] = true;
    });
  }
  for (let c = 0; c < props.size.cols; c++) {
    const colArr = [], solCol = [];
    for (let r = 0; r < props.size.rows; r++) { colArr.push(grid.value[r][c]); solCol.push(props.solution[r][c]); }
    const gridBlocks = getBlocks(colArr), solBlocks = getBlocks(solCol);
    props.colValues[c].forEach((clue, j) => {
      if (!clue) return;
      const idx = maxColClues.value - props.colValues[c].length + j;
      const sb = solBlocks[j];
      if (sb && gridBlocks.some(gb => gb.start === sb.start && gb.length === sb.length))
        markedColClues.value[c][idx] = true;
    });
  }
};

autoMarkClues();

// ── History ───────────────────────────────────────────────────────────────────
const history = ref(props.initialHistory ?? [JSON.stringify({
  grid: grid.value, markedRowClues: markedRowClues.value, markedColClues: markedColClues.value
})]);
const historyIndex = ref(props.initialHistoryIndex ?? 0);

const saveHistory = () => {
  const cur = JSON.stringify({grid: grid.value, markedRowClues: markedRowClues.value, markedColClues: markedColClues.value});
  if (cur !== history.value[historyIndex.value]) {
    history.value = history.value.slice(0, historyIndex.value + 1);
    history.value.push(cur); historyIndex.value++;
    emit('change');
  }
};

const undo = () => {
  if (historyIndex.value > 0) {
    isSolved.value = false; historyIndex.value--;
    const s = JSON.parse(history.value[historyIndex.value]);
    grid.value = s.grid; markedRowClues.value = s.markedRowClues; markedColClues.value = s.markedColClues;
    check(false, false); emit('change');
  }
};

const redo = () => {
  if (historyIndex.value < history.value.length - 1) {
    isSolved.value = false; historyIndex.value++;
    const s = JSON.parse(history.value[historyIndex.value]);
    grid.value = s.grid; markedRowClues.value = s.markedRowClues; markedColClues.value = s.markedColClues;
    check(false, false); emit('change');
  }
};

const canUndo   = computed(() => historyIndex.value > 0);
const canRedo   = computed(() => historyIndex.value < history.value.length - 1);
const hasErrors = computed(() => errors.value.some(row => row.some(cell => cell)));

// ── Public actions ────────────────────────────────────────────────────────────
const clear = () => {
  isSolved.value = false;
  grid.value = Array.from({length: props.size.rows}, () => Array.from({length: props.size.cols}, () => 0));
  errors.value = Array.from({length: props.size.rows}, () => Array.from({length: props.size.cols}, () => false));
  markedRowClues.value = props.rowValues.map(() => Array(maxRowClues.value).fill(false));
  markedColClues.value = props.colValues.map(() => Array(maxColClues.value).fill(false));
  autoMarkClues(); saveHistory(); emit('change');
};

const check = (isManual = false, showCongratsManual = false) => {
  if (!props.solution) return;
  let allCorrect = true;
  for (let r = 0; r < props.size.rows; r++) {
    for (let c = 0; c < props.size.cols; c++) {
      const cv = grid.value[r][c], sv = props.solution[r][c];
      if ((cv === 1 && sv !== 1) || (cv === -1 && sv === 1)) { errors.value[r][c] = isManual; allCorrect = false; }
      else errors.value[r][c] = false;
      if (sv === 1 && cv !== 1) allCorrect = false;
    }
  }
  if (allCorrect) {
    const was = isSolved.value; isSolved.value = true;
    hoveredRow.value = null; hoveredCol.value = null;
    if (showCongratsManual) triggerCongratulations();
    if (!was) emit('solved');
  }
};

const drawResult = (resultGrid) => {
  isSolved.value = false;
  if (resultGrid && resultGrid.length === props.size.rows) {
    grid.value = resultGrid.map(row => [...row]);
    errors.value = errors.value.map(row => row.map(() => false));
    autoMarkClues(); check(false, false); saveHistory();
  }
};

defineExpose({undo, redo, canUndo, canRedo, clear, drawResult, check, grid, markedRowClues, markedColClues, history, historyIndex, hasErrors, isSolved});
</script>

<template>
  <div class="nonogram-outer">
  <div
    ref="scrollContainerRef"
    class="nonogram-scroll-container"
    @mouseleave="resetHover"
  >
    <div v-if="showCongrats" :style="congratsStyle" class="congrats-text">Браво!</div>

    <div class="nonogram-grid-layout" :style="gridLayoutStyle">

      <!-- Top-left corner (sticky both axes) -->
      <canvas ref="cornerCanvasRef" class="corner-canvas"></canvas>

      <!-- Column header (sticky top) -->
      <canvas
        ref="colHeaderCanvasRef"
        class="col-header-canvas"
        @mousedown="handleColHeaderMouseDown"
        @mousemove="handleColHeaderMouseMove"
        @touchstart="handleColHeaderTouchStart"
      ></canvas>

      <!-- Row header (sticky left) -->
      <canvas
        ref="rowHeaderCanvasRef"
        class="row-header-canvas"
        @mousedown="handleRowHeaderMouseDown"
        @mousemove="handleRowHeaderMouseMove"
        @touchstart="handleRowHeaderTouchStart"
      ></canvas>

      <!-- Main grid -->
      <div
        class="main-canvas-wrapper"
        :style="{ width: mainGridWidth + 'px', height: mainGridHeight + 'px' }"
      >
        <canvas ref="bgCanvasRef"  class="bg-canvas"></canvas>
        <canvas
          ref="canvasRef"
          class="main-canvas"
          @mousedown="handleCanvasMouseDown"
          @mousemove="handleCanvasMouseMove"
          @contextmenu.prevent
          @touchstart="handleMainTouchStart"
          @touchend="handleMainTouchEnd"
        ></canvas>
      </div>

    </div>
  </div>

  <!-- Floating cursor label -->
  <Teleport to="body">
    <div
      v-if="hoveredCol !== null && hoveredRow !== null"
      class="cursor-tooltip"
      :style="{ left: cursorClientX + 14 + 'px', top: cursorClientY - 28 + 'px' }"
    >{{ hoveredCol + 1 }},&thinsp;{{ hoveredRow + 1 }}</div>
  </Teleport>

  </div>
</template>

<style scoped>
.congrats-text {
  animation: fadeInOut 3s ease-in-out forwards;
}
@keyframes fadeInOut {
  0%   { opacity: 0; scale: 0.5; }
  10%  { opacity: 1; scale: 1.1; }
  90%  { opacity: 1; scale: 1;   }
  100% { opacity: 0; scale: 0.9; }
}

/* ── Outer wrapper ────────────────────────────────── */
.nonogram-outer {
  display: flex;
  flex-direction: column;
}


/* ── Scroll container ─────────────────────────────── */
.nonogram-scroll-container {
  position: relative;
  margin: 20px 0;
}

@media (max-width: 640px) {
  .nonogram-scroll-container {
    overflow: auto;
    /* leave room for the app header (~60px) */
    max-height: calc(100dvh - 60px);
    margin: 0;
  }
}

/* ── 4-region grid ────────────────────────────────── */
.nonogram-grid-layout {
  display: grid;
  /* column/row sizes set via inline :style */
}

/* ── Sticky legend regions (mobile only) ─────────── */
@media (max-width: 640px) {
  .corner-canvas {
    position: sticky;
    top: 0;
    left: 0;
    z-index: 3;
  }
  .col-header-canvas {
    position: sticky;
    top: 0;
    z-index: 2;
  }
  .row-header-canvas {
    position: sticky;
    left: 0;
    z-index: 2;
  }
  /* Main grid must paint below the sticky headers.
     CSS Grid respects z-index on grid items, so z-index: 1 here
     keeps the main content underneath the legends at z-index 2/3. */
  .main-canvas-wrapper {
    z-index: 1;
  }
}

/* ── Canvas base styles ───────────────────────────── */
canvas {
  display: block;
  cursor: pointer;
  user-select: none;
}

.main-canvas-wrapper {
  position: relative;
}

.main-canvas-wrapper canvas {
  position: absolute;
  top: 0;
  left: 0;
  touch-action: none;
}

.bg-canvas {
  background-color: #fff;
  z-index: 1;
}

.main-canvas {
  z-index: 2;
}

.corner-canvas,
.col-header-canvas,
.row-header-canvas {
  background-color: #eee;
}
</style>

<style>
.cursor-tooltip {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  font-family: monospace;
  font-size: 0.75rem;
  color: #333;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid #bbb;
  padding: 1px 5px;
  white-space: nowrap;
  user-select: none;
}
</style>
