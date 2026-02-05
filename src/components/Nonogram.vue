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
  }
});

const grid = ref(
    Array.from({length: props.size.rows}, () =>
        Array.from({length: props.size.cols}, () => 0)
    )
);

const toggleCell = (r, c, button) => {
  const currentValue = grid.value[r][c];
  if (button === 0) { // Left click
    if (currentValue === 1) {
      grid.value[r][c] = 0; // Black -> White
    } else {
      grid.value[r][c] = 1; // White or X -> Black
    }
  } else if (button === 2) { // Right click
    if (currentValue === -1) {
      grid.value[r][c] = 0; // X -> White
    } else {
      grid.value[r][c] = -1; // White or Black -> X
    }
  }
};

const isDrawing = ref(false);
const drawingState = ref(null);
const hoveredRow = ref(null);
const hoveredCol = ref(null);
const startRow = ref(null);
const startCol = ref(null);
const lockedAxis = ref(null);

const startDrawing = (event, r, c) => {
  if (event.button !== 0 && event.button !== 2) return;
  startRow.value = r;
  startCol.value = c;
  lockedAxis.value = null;
  hoveredRow.value = r;
  hoveredCol.value = c;
  isDrawing.value = true;
  toggleCell(r, c, event.button);
  drawingState.value = grid.value[r][c];
};

const continueDrawing = (event, r, c) => {
  if (!isDrawing.value) {
    hoveredRow.value = r;
    hoveredCol.value = c;
    return;
  }

  let targetR = r;
  let targetC = c;

  if (event.shiftKey) {
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
  grid.value[targetR][targetC] = drawingState.value;
};

const stopDrawing = () => {
  if (isDrawing.value) {
    saveHistory();
  }
  isDrawing.value = false;
  drawingState.value = null;
  lockedAxis.value = null;
};

const resetHover = () => {
  hoveredRow.value = null;
  hoveredCol.value = null;
};

onMounted(() => {
  window.addEventListener('mouseup', stopDrawing);
});

onUnmounted(() => {
  window.removeEventListener('mouseup', stopDrawing);
});

const maxRowClues = computed(() => Math.max(...props.rowValues.map(v => v.length), 0));
const maxColClues = computed(() => Math.max(...props.colValues.map(v => v.length), 0));

const lastClick = ref({ type: null, index: null, count: 0, time: 0 });

const markedRowClues = ref(
    props.rowValues.map(() => Array(maxRowClues.value).fill(false))
);

const markedColClues = ref(
    props.colValues.map(() => Array(maxColClues.value).fill(false))
);

const handleClueClick = (type, lineIdx, clueIdx) => {
  const line = type === 'row' ? props.rowValues[lineIdx] : props.colValues[lineIdx];
  const maxClues = type === 'row' ? maxRowClues.value : maxColClues.value;
  const hasDigit = !!line[line.length - maxClues + clueIdx];

  if (hasDigit) {
    if (type === 'row') {
      markedRowClues.value[lineIdx][clueIdx] = !markedRowClues.value[lineIdx][clueIdx];
    } else {
      markedColClues.value[lineIdx][clueIdx] = !markedColClues.value[lineIdx][clueIdx];
    }
    saveHistory();
  }

  handleLegendClick(type, lineIdx);
};

const handleLegendClick = (type, index) => {
  const now = Date.now();
  if (lastClick.value.type === type && lastClick.value.index === index && (now - lastClick.value.time) < 500) {
    lastClick.value.count++;
  } else {
    lastClick.value.count = 1;
  }
  lastClick.value.type = type;
  lastClick.value.index = index;
  lastClick.value.time = now;

  if (lastClick.value.count === 3) {
    fillSolidLine(type, index);
    lastClick.value.count = 0; // Reset after action
  }
};

const fillSolidLine = (type, index) => {
  if (type === 'row') {
    for (let c = 0; c < props.size.cols; c++) {
      grid.value[index][c] = 1;
    }
  } else if (type === 'col') {
    for (let r = 0; r < props.size.rows; r++) {
      grid.value[r][index] = 1;
    }
  }
  saveHistory();
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
    historyIndex.value--;
    const state = JSON.parse(history.value[historyIndex.value]);
    grid.value = state.grid;
    markedRowClues.value = state.markedRowClues;
    markedColClues.value = state.markedColClues;
  }
};

const redo = () => {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++;
    const state = JSON.parse(history.value[historyIndex.value]);
    grid.value = state.grid;
    markedRowClues.value = state.markedRowClues;
    markedColClues.value = state.markedColClues;
  }
};

const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < history.value.length - 1);

defineExpose({undo, redo, canUndo, canRedo});

</script>

<template>
  <div class="nonogram-container">
    <table class="nonogram-table" @mouseleave="resetHover">
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
              filled: cell === 1,
              marked: cell === -1,
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
.nonogram-container {
  margin: 20px 0;
  display: flex;
  justify-content: center;
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
</style>
