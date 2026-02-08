<script setup>
import {computed, ref, onMounted, onUnmounted} from 'vue';
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
  }
});

const grid = ref(
    Array.from({length: props.size.rows}, () =>
        Array.from({length: props.size.cols}, () => 0)
    )
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
  await new Promise(resolve => setTimeout(resolve, 3000));
  showCongrats.value = false;
};

const isInPendingLine = (r, c) => {
  if (!isDrawing.value) return false;
  const rStart = startRow.value;
  const rEnd = hoveredRow.value;
  const cStart = startCol.value;
  const cEnd = hoveredCol.value;

  if (lockedAxis.value === 'horizontal' || (lockedAxis.value === null && Math.abs(cEnd - cStart) >= Math.abs(rEnd - rStart))) {
    return r === rStart && ((c >= cStart && c <= cEnd) || (c <= cStart && c >= cEnd));
  } else {
    return c === cStart && ((r >= rStart && r <= rEnd) || (r <= rStart && r >= rEnd));
  }
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
    saveHistory();
    check();
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

onMounted(() => {
  window.addEventListener('mouseup', stopDrawing);
  autoMarkClues();
});

onUnmounted(() => {
  window.removeEventListener('mouseup', stopDrawing);
});

const maxRowClues = computed(() => Math.max(...props.rowValues.map(v => v.length), 0));
const maxColClues = computed(() => Math.max(...props.colValues.map(v => v.length), 0));

const markedRowClues = ref(
    props.rowValues.map(() => Array(maxRowClues.value).fill(false))
);

const markedColClues = ref(
    props.colValues.map(() => Array(maxColClues.value).fill(false))
);

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
    check();
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
      markedRowClues.value[r][clueIdx] = isCorrect;
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
      markedColClues.value[c][clueIdx] = isCorrect;
    }
  }
};

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
    check();
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
    check();
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
    isSolved.value = true;
    hoveredRow.value = null;
    hoveredCol.value = null;
    if (showCongratsManual) {
      triggerCongratulations();
    }
  }
};

const drawResult = (resultGrid) => {
  isSolved.value = false;
  if (resultGrid && resultGrid.length === props.size.rows) {
    grid.value = resultGrid.map(row => [...row]);
    errors.value = errors.value.map(row => row.map(() => false));
    autoMarkClues();
    saveHistory();
  }
};

defineExpose({undo, redo, canUndo, canRedo, clear, drawResult, check});

</script>

<template>
  <div class="nonogram-container">
    <div v-if="showCongrats" :style="congratsStyle" class="congrats-text">
      Разгадано!
    </div>
    <table class="nonogram-table" :class="{ solved: isSolved }" @mouseleave="resetHover">
      <colgroup>
        <col v-for="i in maxRowClues" :key="'col-group-row-clue-' + i" style="width: 15px;">
        <col v-for="i in size.cols" :key="'col-group-cell-' + i" style="width: 15px;">
      </colgroup>
      <thead>
      <tr v-for="i in maxColClues" :key="'col-clue-row-' + i">
        <th :colspan="maxRowClues" class="top-left-empty" :class="{'thick-top': i === 1, 'thick-left': true, 'thick-bottom': i === maxColClues}" @mouseenter="resetHover"></th>
        <th v-for="(col, cIdx) in colValues" :key="'col-clue-' + cIdx" class="col-clue" :class="{ highlighted: cIdx === hoveredCol, 'has-digit': col[col.length - maxColClues + i - 1], marked: markedColClues[cIdx][i-1], 'thick-right': (cIdx + 1) % 5 === 0 || cIdx === size.cols - 1, 'thick-left': cIdx === 0, 'thick-top': i === 1, 'thick-bottom': i === maxColClues }" @mouseenter="hoveredCol = cIdx; hoveredRow = null" @click="handleClueClick('col', cIdx, i - 1)">
          {{ col[col.length - maxColClues + i - 1] || '' }}
        </th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(row, rIdx) in rowValues" :key="'row-' + rIdx">
        <td v-for="i in maxRowClues" :key="'row-clue-' + rIdx + '-' + i" class="row-clue" :class="{ highlighted: rIdx === hoveredRow, 'has-digit': row[row.length - maxRowClues + i - 1], marked: markedRowClues[rIdx][i-1], 'thick-bottom': (rIdx + 1) % 5 === 0 || rIdx === size.rows - 1, 'thick-left': i === 1, 'thick-top': rIdx === 0, 'thick-right': i === maxRowClues }" @mouseenter="hoveredRow = rIdx; hoveredCol = null" @click="handleClueClick('row', rIdx, i - 1)">
          {{ row[row.length - maxRowClues + i - 1] || '' }}
        </td>
        <td
            v-for="(cell, cIdx) in grid[rIdx]"
            :key="'cell-' + rIdx + '-' + cIdx"
            class="cell"
            :class="{
              filled: isInPendingLine(rIdx, cIdx) ? drawingState === 1 : cell === 1,
              marked: isInPendingLine(rIdx, cIdx) ? drawingState === -1 : cell === -1,
              error: errors[rIdx][cIdx],
              highlighted: rIdx === hoveredRow || cIdx === hoveredCol,
              'cursor-cell': rIdx === hoveredRow && cIdx === hoveredCol,
              'thick-right': (cIdx + 1) % 5 === 0 || cIdx === size.cols - 1,
              'thick-bottom': (rIdx + 1) % 5 === 0 || rIdx === size.rows - 1,
              'thick-left': cIdx === 0,
              'thick-top': rIdx === 0
            }"
            @mousedown="startDrawing($event, rIdx, cIdx)"
            @mouseenter="continueDrawing($event, rIdx, cIdx)"
            @contextmenu.prevent
        >
        </td>
      </tr>
      </tbody>
    </table>
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

.nonogram-table {
  border-collapse: collapse;
  background-color: #000;
  table-layout: fixed;
}

.nonogram-table th, .nonogram-table td {
  background-color: #fff;
  padding: 0;
}

.top-left-empty {
  box-sizing: border-box;
  height: 15px;
}

.cell {
  width: 15px;
  height: 15px;
  border: 1px solid #999;
  text-align: center;
  cursor: pointer;
  user-select: none;
  line-height: 15px;
  font-size: 10px;
  padding: 0;
  box-sizing: border-box;
}

.cell.filled {
  background-color: black;
}

.cell.marked, .row-clue.marked, .col-clue.marked {
  position: relative;
  background-image:
      linear-gradient(to top right, transparent calc(50% - 1px), #5b5353 50%, transparent calc(50% + 1px)),
      linear-gradient(to bottom right, transparent calc(50% - 1px), #5b5353 50%, transparent calc(50% + 1px));
}

.cell.error {
  background-image:
      linear-gradient(to top right, transparent calc(50% - 1px), red 50%, transparent calc(50% + 1px)),
      linear-gradient(to bottom right, transparent calc(50% - 1px), red 50%, transparent calc(50% + 1px)) !important;
}

.row-clue.has-digit.marked, .col-clue.has-digit.marked {
  background-image:
      linear-gradient(to top right, transparent calc(50% - 1px), #ccc 50%, transparent calc(50% + 1px)),
      linear-gradient(to bottom right, transparent calc(50% - 1px), #ccc 50%, transparent calc(50% + 1px));
}

.cell.marked.highlighted {
  background-color: #dfdfdf;
}

.nonogram-table .top-left-empty,
.row-clue:not(.has-digit),
.col-clue:not(.has-digit) {
  background-color: #eeeeee;
}

.cell.highlighted,
.row-clue.highlighted,
.col-clue.highlighted,
.top-left-empty.highlighted {
  background-color: #dfdfdf;
}

.cell.filled.highlighted {
  background-color: #555555;
}

.row-clue.has-digit,
.col-clue.has-digit {
  background-color: #555555;
  color: white;
}

.row-clue.has-digit.highlighted,
.col-clue.has-digit.highlighted {
  background-color: #555555;
}

.cell.cursor-cell {
  box-shadow: inset 0 0 0 2px #000;
}

.cell.filled.cursor-cell {
  box-shadow: inset 0 0 0 2px #fff;
}

.thick-right {
  border-right: 2px solid #999 !important;
}

.thick-bottom {
  border-bottom: 2px solid #999 !important;
}

.thick-left {
  border-left: 2px solid #999 !important;
}

.thick-top {
  border-top: 2px solid #999 !important;
}

.col-clue {
  width: 15px;
  height: 15px;
  border: 1px solid #999;
  vertical-align: middle;
  text-align: center;
  padding: 0;
  font-size: 10px;
  user-select: none;
  line-height: 15px;
  font-weight: normal;
  box-sizing: border-box;
  cursor: pointer;
}

.row-clue {
  width: 15px;
  height: 15px;
  border: 1px solid #999;
  text-align: center;
  padding: 0;
  font-size: 10px;
  user-select: none;
  line-height: 15px;
  font-weight: normal;
  box-sizing: border-box;
  cursor: pointer;
}

th, td {
  min-width: 15px;
  box-sizing: border-box;
}

.solved .cell {
  border: none !important;
  cursor: default;
}

.solved .cell.marked,
.solved .cell.error {
  background-image: none !important;
}

.solved .cell.highlighted {
  background-color: #fff !important;
}

.solved .cell.filled.highlighted {
  background-color: black !important;
}

.solved .cell.cursor-cell {
  box-shadow: none !important;
}
</style>
