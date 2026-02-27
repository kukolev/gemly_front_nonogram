<script setup>
import {computed, ref, onMounted, onUnmounted, watch} from 'vue';
// Note: library 'nonogram' is installed and can be used for solving if needed
// e.g. import nonogram from 'nonogram'

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
  }
});

const canvasRef = ref(null);
const bgCanvasRef = ref(null);
const CELL_SIZE = 13;

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

const isDrawing = ref(false);
const isSolved = ref(false);
const drawingState = ref(null);
const hoveredRow = ref(null);
const hoveredCol = ref(null);
const startRow = ref(null);
const startCol = ref(null);
const lockedAxis = ref(null);

const showCongrats = ref(false);
const congratsStyle = ref({});

const emit = defineEmits(['clue-click', 'change', 'solved', 'congrats-toggled']);

const triggerCongratulations = async () => {
  if (showCongrats.value) return;

  congratsStyle.value = {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    position: 'fixed',
    fontSize: '6rem',
    fontWeight: 'bold',
    color: '#ff4081',
    textShadow: '4px 4px 8px rgba(0,0,0,0.5)',
    pointerEvents: 'none',
    zIndex: 10000,
    whiteSpace: 'nowrap'
  };

  showCongrats.value = true;
  emit('congrats-toggled', true);
  await new Promise(resolve => setTimeout(resolve, 3000));
  showCongrats.value = false;
  emit('congrats-toggled', false);
};

const startDrawing = (event, r, c) => {
  if (isSolved.value) return;
  if (event.button !== 0 && event.button !== 2) return;
  
  startRow.value = r;
  startCol.value = c;
  lockedAxis.value = null;
  hoveredRow.value = r;
  hoveredCol.value = c;
  isDrawing.value = true;
  
  const currentValue = grid.value[r][c];
  if (event.button === 0) { // Left click
    drawingState.value = (currentValue === 1) ? 0 : 1;
  } else if (event.button === 2) { // Right click
    drawingState.value = (currentValue === -1) ? 0 : -1;
  }
};

const continueDrawing = (event, r, c) => {
  if (isSolved.value) return;
  if (!isDrawing.value) {
    hoveredRow.value = r;
    hoveredCol.value = c;
    return;
  }

  let targetR = r;
  let targetC = c;

  if (!event.shiftKey) {
    if (!lockedAxis.value) {
      if (r !== startRow.value || c !== startCol.value) {
        if (Math.abs(r - startRow.value) >= Math.abs(c - startCol.value)) {
          lockedAxis.value = 'vertical';
        } else {
          lockedAxis.value = 'horizontal';
        }
      }
    }

    if (lockedAxis.value === 'horizontal') {
      targetR = startRow.value;
    } else if (lockedAxis.value === 'vertical') {
      targetC = startCol.value;
    }
  } else {
    lockedAxis.value = null;
  }

  hoveredRow.value = targetR;
  hoveredCol.value = targetC;
};

const stopDrawing = () => {
  if (isDrawing.value) {
    if (isSolved.value) {
      isDrawing.value = false;
      drawingState.value = null;
      lockedAxis.value = null;
      return;
    }
    const rStart = startRow.value;
    const rEnd = hoveredRow.value;
    const cStart = startCol.value;
    const cEnd = hoveredCol.value;

    if (lockedAxis.value === 'horizontal' || (lockedAxis.value === null && Math.abs(cEnd - cStart) >= Math.abs(rEnd - rStart))) {
      const min = Math.min(cStart, cEnd);
      const max = Math.max(cStart, cEnd);
      for (let c = min; c <= max; c++) {
        grid.value[rStart][c] = drawingState.value;
      }
    } else {
      const min = Math.min(rStart, rEnd);
      const max = Math.max(rStart, rEnd);
      for (let r = min; r <= max; r++) {
        grid.value[r][cStart] = drawingState.value;
      }
    }
    autoMarkClues();
    check(false, false);
    saveHistory();
  }
  isDrawing.value = false;
  drawingState.value = null;
  lockedAxis.value = null;
};

const resetHover = () => {
  if (!isDrawing.value) {
    hoveredRow.value = null;
    hoveredCol.value = null;
  }
};

const totalCols = computed(() => maxRowClues.value + props.size.cols);
const totalRows = computed(() => maxColClues.value + props.size.rows);
const canvasWidth = computed(() => totalCols.value * CELL_SIZE);
const canvasHeight = computed(() => totalRows.value * CELL_SIZE);

let rafId = null;
let bgRafId = null;

const requestDraw = () => {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    draw();
    rafId = null;
  });
};

const requestDrawBg = () => {
  if (bgRafId) return;
  bgRafId = requestAnimationFrame(() => {
    drawBg();
    bgRafId = null;
  });
};

const syncCanvasSize = () => {
  const canvas = canvasRef.value;
  const bgCanvas = bgCanvasRef.value;
  if (!canvas || !bgCanvas) return;
  
  const dpr = window.devicePixelRatio || 1;
  const w = canvasWidth.value;
  const h = canvasHeight.value;

  [canvas, bgCanvas].forEach(canv => {
    canv.width = w * dpr;
    canv.height = h * dpr;
    canv.style.width = `${w}px`;
    canv.style.height = `${h}px`;
    const ctx = canv.getContext('2d', { alpha: canv === canvas });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  });

  requestDrawBg();
  requestDraw();
};

const drawBg = () => {
  const canvas = bgCanvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });

  const mrc = maxRowClues.value;
  const mcc = maxColClues.value;
  const cw = canvasWidth.value;
  const ch = canvasHeight.value;
  const rows = props.size.rows;
  const cols = props.size.cols;

  // 1. Draw Background (White)
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, cw, ch);

  // 2. Clue Areas Backgrounds
  ctx.fillStyle = '#eeeeee';
  ctx.fillRect(0, 0, mrc * CELL_SIZE, mcc * CELL_SIZE); // Top-left
  ctx.fillRect(0, mcc * CELL_SIZE, mrc * CELL_SIZE, rows * CELL_SIZE); // Row clues
  ctx.fillRect(mrc * CELL_SIZE, 0, cols * CELL_SIZE, mcc * CELL_SIZE); // Col clues

  // 4. Clue Content Backgrounds (Dark backgrounds for digits)
  ctx.fillStyle = '#555555';
  const rowVals = props.rowValues;
  const colVals = props.colValues;

  for (let r = 0; r < rows; r++) {
    const clues = rowVals[r];
    const offset = clues.length - mrc;
    const y = (mcc + r) * CELL_SIZE;
    for (let i = 0; i < mrc; i++) {
      if (clues[offset + i]) {
        ctx.fillRect(i * CELL_SIZE, y, CELL_SIZE, CELL_SIZE);
      }
    }
  }
  for (let c = 0; c < cols; c++) {
    const clues = colVals[c];
    const offset = clues.length - mcc;
    const x = (mrc + c) * CELL_SIZE;
    for (let i = 0; i < mcc; i++) {
      if (clues[offset + i]) {
        ctx.fillRect(x, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  // 5. Digits
  ctx.fillStyle = 'white';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let r = 0; r < rows; r++) {
    const clues = rowVals[r];
    const yCenter = (mcc + r) * CELL_SIZE + CELL_SIZE / 2 + 1;
    const offset = clues.length - mrc;
    for (let i = 0; i < mrc; i++) {
      const digit = clues[offset + i];
      if (digit) {
        ctx.fillText(digit.toString(), i * CELL_SIZE + CELL_SIZE / 2, yCenter);
      }
    }
  }
  for (let c = 0; c < cols; c++) {
    const clues = colVals[c];
    const xCenter = (mrc + c) * CELL_SIZE + CELL_SIZE / 2;
    const offset = clues.length - mcc;
    for (let i = 0; i < mcc; i++) {
      const digit = clues[offset + i];
      if (digit) {
        ctx.fillText(digit.toString(), xCenter, i * CELL_SIZE + CELL_SIZE / 2 + 1);
      }
    }
  }

  // 9. Grid Lines (static part)
  ctx.strokeStyle = '#999';
  const totalR = totalRows.value;
  const totalC = totalCols.value;

  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let r = 1; r < totalR; r++) {
    if (!(r === mcc || (r > mcc && (r - mcc) % 5 === 0))) {
      ctx.moveTo(0, r * CELL_SIZE);
      ctx.lineTo(cw, r * CELL_SIZE);
    }
  }
  for (let c = 1; c < totalC; c++) {
    if (!(c === mrc || (c > mrc && (c - mrc) % 5 === 0))) {
      ctx.moveTo(c * CELL_SIZE, 0);
      ctx.lineTo(c * CELL_SIZE, ch);
    }
  }
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.beginPath();
  // Outer border
  ctx.strokeRect(1, 1, cw - 2, ch - 2);
  // Major lines
  ctx.moveTo(0, mcc * CELL_SIZE); ctx.lineTo(cw, mcc * CELL_SIZE);
  ctx.moveTo(mrc * CELL_SIZE, 0); ctx.lineTo(mrc * CELL_SIZE, ch);
  for (let r = mcc + 5; r < totalR; r += 5) {
    ctx.moveTo(0, r * CELL_SIZE); ctx.lineTo(cw, r * CELL_SIZE);
  }
  for (let c = mrc + 5; c < totalC; c += 5) {
    ctx.moveTo(c * CELL_SIZE, 0); ctx.lineTo(c * CELL_SIZE, ch);
  }
  ctx.stroke();
};

const draw = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const mrc = maxRowClues.value;
  const mcc = maxColClues.value;
  const cw = canvasWidth.value;
  const ch = canvasHeight.value;
  const rows = props.size.rows;
  const cols = props.size.cols;

  // Clear main canvas (it's transparent)
  ctx.clearRect(0, 0, cw, ch);

  const solved = isSolved.value;
  const hRow = hoveredRow.value;
  const hCol = hoveredCol.value;

  // 3. Highlights
  if (!solved && (hRow !== null || hCol !== null)) {
    ctx.fillStyle = 'rgba(223, 223, 223, 0.5)'; // Use alpha for highlights over bg
    
    if (hRow !== null) {
      ctx.fillRect(0, (mcc + hRow) * CELL_SIZE, mrc * CELL_SIZE, CELL_SIZE);
      ctx.fillRect(mrc * CELL_SIZE, (mcc + hRow) * CELL_SIZE, cols * CELL_SIZE, CELL_SIZE);
    }
    if (hCol !== null) {
      ctx.fillRect((mrc + hCol) * CELL_SIZE, 0, CELL_SIZE, mcc * CELL_SIZE);
      ctx.fillRect((mrc + hCol) * CELL_SIZE, mcc * CELL_SIZE, CELL_SIZE, rows * CELL_SIZE);
    }
  }

  // 6. Grid Cells (Black)
  ctx.fillStyle = 'black';
  const gridData = grid.value;
  const dState = drawingState.value;
  const drawing = isDrawing.value;

  let pMinR = -1, pMaxR = -1, pMinC = -1, pMaxC = -1;
  if (drawing) {
    const rStart = startRow.value;
    const rEnd = hRow;
    const cStart = startCol.value;
    const cEnd = hCol;
    if (lockedAxis.value === 'horizontal' || (lockedAxis.value === null && Math.abs(cEnd - cStart) >= Math.abs(rEnd - rStart))) {
      pMinR = pMaxR = rStart;
      pMinC = Math.min(cStart, cEnd);
      pMaxC = Math.max(cStart, cEnd);
    } else {
      pMinC = pMaxC = cStart;
      pMinR = Math.min(rStart, rEnd);
      pMaxR = Math.max(rStart, rEnd);
    }
  }

  for (let r = 0; r < rows; r++) {
    const row = gridData[r];
    const isHoveredRow = !solved && r === hRow;
    for (let c = 0; c < cols; c++) {
      const cellValue = row[c];
      const pending = drawing && (r >= pMinR && r <= pMaxR && c >= pMinC && c <= pMaxC);
      const effectiveValue = pending ? dState : cellValue;
      if (effectiveValue === 1) {
        if (isHoveredRow && c === hCol) {
          ctx.fillStyle = '#555555';
          ctx.fillRect((mrc + c) * CELL_SIZE, (mcc + r) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          ctx.fillStyle = 'black';
        } else {
          ctx.fillRect((mrc + c) * CELL_SIZE, (mcc + r) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }
  }

  // 7. Crosses and Marks (Batched by color)
  const crossPositions = {
    '#5b5353': [],
    '#ccc': [],
    'red': []
  };

  const mrcData = markedRowClues.value;
  const mccData = markedColClues.value;
  const errorData = errors.value;
  const rowVals = props.rowValues;
  const colVals = props.colValues;

  for (let r = 0; r < rows; r++) {
    const clues = rowVals[r];
    const offset = clues.length - mrc;
    for (let i = 0; i < mrc; i++) {
      if (mrcData[r][i]) {
        const digit = clues[offset + i];
        crossPositions[digit ? '#ccc' : '#5b5353'].push({x: i * CELL_SIZE, y: (mcc + r) * CELL_SIZE});
      }
    }
  }
  for (let c = 0; c < cols; c++) {
    const clues = colVals[c];
    const offset = clues.length - mcc;
    for (let i = 0; i < mcc; i++) {
      if (mccData[c][i]) {
        const digit = clues[offset + i];
        crossPositions[digit ? '#ccc' : '#5b5353'].push({x: (mrc + c) * CELL_SIZE, y: i * CELL_SIZE});
      }
    }
  }
  if (!solved) {
    for (let r = 0; r < rows; r++) {
      const row = gridData[r];
      const errRow = errorData[r];
      const isDrawingRow = drawing && r >= pMinR && r <= pMaxR;
      for (let c = 0; c < cols; c++) {
        const cellValue = row[c];
        const pending = isDrawingRow && c >= pMinC && c <= pMaxC;
        const effectiveValue = pending ? dState : cellValue;
        if (effectiveValue === -1) {
          crossPositions['#5b5353'].push({x: (mrc + c) * CELL_SIZE, y: (mcc + r) * CELL_SIZE});
        }
        if (errRow[c]) {
          crossPositions['red'].push({x: (mrc + c) * CELL_SIZE, y: (mcc + r) * CELL_SIZE});
        }
      }
    }
  }

  drawCrosses(ctx, crossPositions['#5b5353'], '#5b5353');
  drawCrosses(ctx, crossPositions['#ccc'], '#ccc');
  drawCrosses(ctx, crossPositions['red'], 'red');

  // 8. Hover Highlight Outline
  if (!solved && hRow !== null && hCol !== null) {
    const cellValue = gridData[hRow][hCol];
    const pending = drawing && (hRow >= pMinR && hRow <= pMaxR && hCol >= pMinC && hCol <= pMaxC);
    const effectiveValue = pending ? dState : cellValue;
    ctx.strokeStyle = effectiveValue === 1 ? '#fff' : '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect((mrc + hCol) * CELL_SIZE + 1, (mcc + hRow) * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  }
};

const drawCrosses = (ctx, positions, color) => {
  if (positions.length === 0) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const padding = 3;
  const size = CELL_SIZE - padding * 2;
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    const x = pos.x + padding;
    const y = pos.y + padding;
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y);
    ctx.lineTo(x, y + size);
  }
  ctx.stroke();
};

const getMousePos = (event) => {
  const canvas = canvasRef.value;
  if (!canvas) return { row: -1, col: -1 };
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return {
    col: Math.floor(x / CELL_SIZE),
    row: Math.floor(y / CELL_SIZE)
  };
};

const handleCanvasMouseDown = (event) => {
  if (isSolved.value) return;
  const { row, col } = getMousePos(event);
  const mrc = maxRowClues.value;
  const mcc = maxColClues.value;

  if (row >= mcc && col >= mrc) {
    startDrawing(event, row - mcc, col - mrc);
  } else if (row < mcc && col >= mrc) {
    handleClueClick('col', col - mrc, row);
  } else if (col < mrc && row >= mcc) {
    handleClueClick('row', row - mcc, col);
  }
};

const handleCanvasMouseMove = (event) => {
  const { row, col } = getMousePos(event);
  const mrc = maxRowClues.value;
  const mcc = maxColClues.value;

  if (row >= mcc && col >= mrc) {
    continueDrawing(event, row - mcc, col - mrc);
  } else {
    if (isDrawing.value) {
       // Optional: allow continuing drawing even if mouse leaves grid area?
       // The original table used mouseenter on cells.
       // Here we can just do nothing if outside grid while drawing, or clamp.
    }
    if (row < mcc && col >= mrc) {
      hoveredCol.value = col - mrc;
      hoveredRow.value = null;
    } else if (col < mrc && row >= mcc) {
      hoveredRow.value = row - mcc;
      hoveredCol.value = null;
    } else {
      resetHover();
    }
  }
};

watch([grid, errors, hoveredRow, hoveredCol, isDrawing, isSolved], () => {
  requestDraw();
}, { deep: true });

watch([markedRowClues, markedColClues], () => {
  requestDraw();
}, { deep: true });

watch([() => props.rowValues, () => props.colValues, () => props.size], () => {
  requestDrawBg();
  requestDraw();
}, { deep: true });

watch([canvasWidth, canvasHeight], () => {
  syncCanvasSize();
});

onMounted(() => {
  window.addEventListener('mouseup', stopDrawing);
  syncCanvasSize();
});

onUnmounted(() => {
  window.removeEventListener('mouseup', stopDrawing);
});

const handleClueClick = (type, lineIdx, clueIdx) => {
  if (isSolved.value) return;
  const line = type === 'row' ? props.rowValues[lineIdx] : props.colValues[lineIdx];
  const maxClues = type === 'row' ? maxRowClues.value : maxColClues.value;
  const hasDigit = !!line[line.length - maxClues + clueIdx];

  if (hasDigit) {
    if (type === 'row') {
      markedRowClues.value[lineIdx][clueIdx] = !markedRowClues.value[lineIdx][clueIdx];
      if (markedRowClues.value[lineIdx][clueIdx]) {
        checkAndFillCrosses('row', lineIdx);
      }
    } else {
      markedColClues.value[lineIdx][clueIdx] = !markedColClues.value[lineIdx][clueIdx];
      if (markedColClues.value[lineIdx][clueIdx]) {
        checkAndFillCrosses('col', lineIdx);
      }
    }
    saveHistory();
  }
};

const checkAndFillCrosses = (type, index) => {
  const line = type === 'row' ? props.rowValues[index] : props.colValues[index];
  const maxClues = type === 'row' ? maxRowClues.value : maxColClues.value;
  const markedClues = type === 'row' ? markedRowClues.value[index] : markedColClues.value[index];

  // Check if all digits are marked
  const allMarked = line.every((clue, i) => {
    if (!clue) return true; // Skip empty clue slots
    const clueIdx = maxClues - line.length + i;
    return markedClues[clueIdx];
  });

  if (allMarked) {
    if (type === 'row') {
      for (let c = 0; c < props.size.cols; c++) {
        if (grid.value[index][c] === 0) {
          grid.value[index][c] = -1;
        }
      }
    } else {
      for (let r = 0; r < props.size.rows; r++) {
        if (grid.value[r][index] === 0) {
          grid.value[r][index] = -1;
        }
      }
    }
  }
};

const getBlocks = (arr) => {
  const blocks = [];
  let currentBlock = null;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === 1) {
      if (currentBlock === null) {
        currentBlock = {start: i, length: 1};
      } else {
        currentBlock.length++;
      }
    } else {
      if (currentBlock !== null) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
    }
  }
  if (currentBlock !== null) {
    blocks.push(currentBlock);
  }
  return blocks;
};

const autoMarkClues = () => {
  if (!props.solution) return;

  // Auto mark rows
  for (let r = 0; r < props.size.rows; r++) {
    const gridRowBlocks = getBlocks(grid.value[r]);
    const solutionRowBlocks = getBlocks(props.solution[r]);
    const rowClues = props.rowValues[r];

    for (let j = 0; j < rowClues.length; j++) {
      const clueIdx = maxRowClues.value - rowClues.length + j;
      const solBlock = solutionRowBlocks[j];
      let isCorrect = false;

      if (solBlock) {
        // Check if there is a block in grid that matches this solution block
        isCorrect = gridRowBlocks.some(gb => gb.start === solBlock.start && gb.length === solBlock.length);
      }
      if (isCorrect) {
        markedRowClues.value[r][clueIdx] = true;
      }
    }
  }

  // Auto mark columns
  for (let c = 0; c < props.size.cols; c++) {
    const colArr = [];
    const solColArr = [];
    for (let r = 0; r < props.size.rows; r++) {
      colArr.push(grid.value[r][c]);
      solColArr.push(props.solution[r][c]);
    }

    const gridColBlocks = getBlocks(colArr);
    const solutionColBlocks = getBlocks(solColArr);
    const colClues = props.colValues[c];

    for (let j = 0; j < colClues.length; j++) {
      const clueIdx = maxColClues.value - colClues.length + j;
      const solBlock = solutionColBlocks[j];
      let isCorrect = false;

      if (solBlock) {
        isCorrect = gridColBlocks.some(gb => gb.start === solBlock.start && gb.length === solBlock.length);
      }
      if (isCorrect) {
        markedColClues.value[c][clueIdx] = true;
      }
    }
  }
};

autoMarkClues();

const history = ref([JSON.stringify({
  grid: grid.value,
  markedRowClues: markedRowClues.value,
  markedColClues: markedColClues.value
})]);
const historyIndex = ref(0);

const saveHistory = () => {
  const currentState = JSON.stringify({
    grid: grid.value,
    markedRowClues: markedRowClues.value,
    markedColClues: markedColClues.value
  });
  if (currentState !== history.value[historyIndex.value]) {
    history.value = history.value.slice(0, historyIndex.value + 1);
    history.value.push(currentState);
    historyIndex.value++;
    emit('change');
  }
};

const undo = () => {
  if (historyIndex.value > 0) {
    isSolved.value = false;
    historyIndex.value--;
    const state = JSON.parse(history.value[historyIndex.value]);
    grid.value = state.grid;
    markedRowClues.value = state.markedRowClues;
    markedColClues.value = state.markedColClues;
    check(false, false);
    emit('change');
  }
};

const redo = () => {
  if (historyIndex.value < history.value.length - 1) {
    isSolved.value = false;
    historyIndex.value++;
    const state = JSON.parse(history.value[historyIndex.value]);
    grid.value = state.grid;
    markedRowClues.value = state.markedRowClues;
    markedColClues.value = state.markedColClues;
    check(false, false);
    emit('change');
  }
};

const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < history.value.length - 1);

const clear = () => {
  isSolved.value = false;
  grid.value = Array.from({length: props.size.rows}, () =>
      Array.from({length: props.size.cols}, () => 0)
  );
  errors.value = Array.from({length: props.size.rows}, () =>
      Array.from({length: props.size.cols}, () => false)
  );
  markedRowClues.value = props.rowValues.map(() => Array(maxRowClues.value).fill(false));
  markedColClues.value = props.colValues.map(() => Array(maxColClues.value).fill(false));
  autoMarkClues();
  saveHistory();
};

const check = (isManual = false, showCongratsManual = false) => {
  if (!props.solution) return;

  let allCorrect = true;
  for (let r = 0; r < props.size.rows; r++) {
    for (let c = 0; c < props.size.cols; c++) {
      const cellValue = grid.value[r][c];
      const solutionValue = props.solution[r][c];

      // 2. mark all incorrect black cells with red cross
      // 3. mark all incorrect grey crocced cells in main part of nonogram with red cross
      if ((cellValue === 1 && solutionValue !== 1) || (cellValue === -1 && solutionValue === 1)) {
        errors.value[r][c] = isManual;
        allCorrect = false;
      } else {
        errors.value[r][c] = false;
      }

      if (solutionValue === 1 && cellValue !== 1) {
        allCorrect = false;
      }
    }
  }
  if (allCorrect) {
    const wasAlreadySolved = isSolved.value;
    isSolved.value = true;
    hoveredRow.value = null;
    hoveredCol.value = null;
    if (showCongratsManual) {
      triggerCongratulations();
    }
    if (!wasAlreadySolved) {
      emit('solved');
    }
  }
};

const drawResult = (resultGrid) => {
  isSolved.value = false;
  if (resultGrid && resultGrid.length === props.size.rows) {
    grid.value = resultGrid.map(row => [...row]);
    errors.value = errors.value.map(row => row.map(() => false));
    autoMarkClues();
    check(false, false);
    saveHistory();
  }
};

defineExpose({undo, redo, canUndo, canRedo, clear, drawResult, check, grid, markedRowClues, markedColClues});

</script>

<template>
  <div class="nonogram-container" @mouseleave="resetHover">
    <div v-if="showCongrats" :style="congratsStyle" class="congrats-text">
      Браво!
    </div>
    <div class="canvas-wrapper" :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">
      <canvas
          ref="bgCanvasRef"
          class="bg-canvas"
      ></canvas>
      <canvas
          ref="canvasRef"
          class="main-canvas"
          @mousedown="handleCanvasMouseDown"
          @mousemove="handleCanvasMouseMove"
          @contextmenu.prevent
      ></canvas>
    </div>
  </div>
</template>

<style scoped>
.congrats-text {
  animation: fadeInOut 3s ease-in-out forwards;
}

@keyframes fadeInOut {
  0% { opacity: 0; scale: 0.5; }
  10% { opacity: 1; scale: 1.1; }
  90% { opacity: 1; scale: 1; }
  100% { opacity: 0; scale: 0.9; }
}

.nonogram-container {
  margin: 20px 0;
  display: flex;
  justify-content: flex-start;
  position: relative;
}

.canvas-wrapper {
  position: relative;
}

canvas {
  cursor: pointer;
  user-select: none;
  background-color: transparent;
  position: absolute;
  top: 0;
  left: 0;
}

.bg-canvas {
  background-color: #fff;
  z-index: 1;
}

.main-canvas {
  z-index: 2;
}
</style>
