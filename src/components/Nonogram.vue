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

const startDrawing = (event, r, c) => {
  if (event.button !== 0 && event.button !== 2) return;
  hoveredRow.value = r;
  hoveredCol.value = c;
  isDrawing.value = true;
  toggleCell(r, c, event.button);
  drawingState.value = grid.value[r][c];
};

const continueDrawing = (r, c) => {
  hoveredRow.value = r;
  hoveredCol.value = c;
  if (isDrawing.value) {
    grid.value[r][c] = drawingState.value;
  }
};

const stopDrawing = () => {
  isDrawing.value = false;
  drawingState.value = null;
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

</script>

<template>
  <div class="nonogram-container">
    <table class="nonogram-table" @mouseleave="resetHover">
      <thead>
      <tr v-for="i in maxColClues" :key="'col-clue-row-' + i">
        <th :colspan="maxRowClues"></th>
        <th v-for="(col, cIdx) in colValues" :key="'col-clue-' + cIdx" class="col-clue" :class="{ highlighted: cIdx === hoveredCol }">
          {{ col[col.length - maxColClues + i - 1] !== undefined ? col[col.length - maxColClues + i - 1] : '' }}
        </th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(row, rIdx) in rowValues" :key="'row-' + rIdx">
        <td v-for="i in maxRowClues" :key="'row-clue-' + rIdx + '-' + i" class="row-clue" :class="{ highlighted: rIdx === hoveredRow }">
          {{ row[row.length - maxRowClues + i - 1] !== undefined ? row[row.length - maxRowClues + i - 1] : '' }}
        </td>
        <td
            v-for="(cell, cIdx) in grid[rIdx]"
            :key="'cell-' + rIdx + '-' + cIdx"
            class="cell"
            :class="{ filled: cell === 1, marked: cell === -1, highlighted: rIdx === hoveredRow || cIdx === hoveredCol }"
            @mousedown="startDrawing($event, rIdx, cIdx)"
            @mouseenter="continueDrawing(rIdx, cIdx)"
            @contextmenu.prevent
        >
          <span v-if="cell === -1">x</span>
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
}

.cell {
  width: 24px;
  height: 24px;
  border: 1px solid #333;
  text-align: center;
  cursor: pointer;
  user-select: none;
  background-color: #fff;
}

.cell.filled {
  background-color: black;
}

.cell.marked {
  color: #5b5353;
  font-weight: bold;
}

.cell.highlighted,
.row-clue.highlighted,
.col-clue.highlighted {
  background-color: #dfdfdf;
}

.cell.filled.highlighted {
  background-color: #555555;
}

.col-clue {
  height: 25px;
  border: 1px solid #ccc;
  vertical-align: bottom;
  padding: 2px;
  font-size: 0.8rem;
}

.row-clue {
  width: 25px;
  border: 1px solid #ccc;
  text-align: right;
  padding: 2px 5px;
  font-size: 0.8rem;
}

th, td {
  min-width: 20px;
}
</style>
