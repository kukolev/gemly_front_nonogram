<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const nonogramId = ref('');
const loadedId = ref('');
const drawingData = ref(null);
const logs = ref('');

const isDrawing = ref(false);
const startRow = ref(null);
const startCol = ref(null);
const hoveredRow = ref(null);
const hoveredCol = ref(null);
const drawingState = ref(null);
const lockedAxis = ref(null);

function startDrawing(r, c, event) {
  if (event.button !== 0) return;
  
  startRow.value = r;
  startCol.value = c;
  hoveredRow.value = r;
  hoveredCol.value = c;
  isDrawing.value = true;
  lockedAxis.value = null;
  
  const currentValue = drawingData.value[r][c];
  drawingState.value = (currentValue === 1) ? 0 : 1;
  
  event.preventDefault();
}

function continueDrawing(r, c, event) {
  if (!isDrawing.value) return;
  
  hoveredRow.value = r;
  hoveredCol.value = c;
  
  if (event && event.shiftKey) {
    lockedAxis.value = null;
  } else if (!lockedAxis.value) {
    if (r !== startRow.value || c !== startCol.value) {
      if (Math.abs(r - startRow.value) >= Math.abs(c - startCol.value)) {
        lockedAxis.value = 'vertical';
      } else {
        lockedAxis.value = 'horizontal';
      }
    }
  }
}

function stopDrawing() {
  if (isDrawing.value) {
    const rStart = startRow.value;
    const rEnd = hoveredRow.value;
    const cStart = startCol.value;
    const cEnd = hoveredCol.value;
    
    let pMinR, pMaxR, pMinC, pMaxC;
    
    if (lockedAxis.value === 'horizontal' || (lockedAxis.value === null && Math.abs(cEnd - cStart) >= Math.abs(rEnd - rStart))) {
      pMinR = pMaxR = rStart;
      pMinC = Math.min(cStart, cEnd);
      pMaxC = Math.max(cStart, cEnd);
    } else {
      pMinC = pMaxC = cStart;
      pMinR = Math.min(rStart, rEnd);
      pMaxR = Math.max(rStart, rEnd);
    }
    
    for (let r = pMinR; r <= pMaxR; r++) {
      for (let c = pMinC; c <= pMaxC; c++) {
        drawingData.value[r][c] = drawingState.value;
      }
    }
  }
  isDrawing.value = false;
  drawingState.value = null;
  lockedAxis.value = null;
  startRow.value = null;
  startCol.value = null;
  hoveredRow.value = null;
  hoveredCol.value = null;
}

function isCellFilled(r, c) {
  if (!drawingData.value) return false;
  
  let cellValue = drawingData.value[r][c];
  
  if (isDrawing.value) {
    let pMinR = -1, pMaxR = -1, pMinC = -1, pMaxC = -1;
    const rStart = startRow.value;
    const rEnd = hoveredRow.value;
    const cStart = startCol.value;
    const cEnd = hoveredCol.value;
    
    if (lockedAxis.value === 'horizontal' || (lockedAxis.value === null && Math.abs(cEnd - cStart) >= Math.abs(rEnd - rStart))) {
      pMinR = pMaxR = rStart;
      pMinC = Math.min(cStart, cEnd);
      pMaxC = Math.max(cStart, cEnd);
    } else {
      pMinC = pMaxC = cStart;
      pMinR = Math.min(rStart, rEnd);
      pMaxR = Math.max(rStart, rEnd);
    }
    
    if (r >= pMinR && r <= pMaxR && c >= pMinC && c <= pMaxC) {
      cellValue = drawingState.value;
    }
  }
  
  return cellValue === 1;
}

onMounted(() => {
  window.addEventListener('mouseup', stopDrawing);
});

onUnmounted(() => {
  window.removeEventListener('mouseup', stopDrawing);
});

function addLog(buttonName) {
  const now = new Date().toLocaleString();
  const id = loadedId.value || 'N/A';
  let size = 'N/A';
  if (drawingData.value && drawingData.value.length > 0) {
    size = `${drawingData.value.length}x${drawingData.value[0].length}`;
  }
  logs.value = `${now} - Button: ${buttonName}, ID: ${id}, Size: ${size}\n` + logs.value;
}

async function loadRandom() {
  try {
    const response = await fetch('/api/v1/nonogram/admin.getRandomNonogram');
    const data = await response.json();
    loadedId.value = data.id;
    drawingData.value = data.data;
    addLog('Load');
  } catch (error) {
    console.error('Error loading random nonogram:', error);
  }
}

async function loadById(id) {
  try {
    const response = await fetch(`/api/v1/nonogram/admin.getById?id=${id}`);
    const data = await response.json();
    loadedId.value = data.id;
    drawingData.value = data.data;
    addLog('Load');
  } catch (error) {
    console.error('Error loading nonogram by id:', error);
  }
}

function handleLoad() {
  if (nonogramId.value) {
    loadById(nonogramId.value);
  } else {
    loadRandom();
  }
}

async function markNonogram(mark) {
  if (!loadedId.value) {
    alert('No nonogram loaded');
    return;
  }
  try {
    const response = await fetch('/api/v1/nonogram/admin.markNonogram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: loadedId.value,
        mark: mark
      }),
    });
    if (response.ok) {
      console.log(`Nonogram ${loadedId.value} marked as ${mark ? 'Good' : 'Bad'}`);
      addLog(mark ? 'Good' : 'Bad');
      loadRandom();
    } else {
      console.error('Failed to mark nonogram');
    }
  } catch (error) {
    console.error('Error marking nonogram:', error);
  }
}

async function saveNonogram() {
  if (!loadedId.value) {
    alert('No nonogram loaded');
    return;
  }
  try {
    const response = await fetch('/api/v1/nonogram/admin.saveNonogram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: loadedId.value,
        data: drawingData.value
      }),
    });
    if (response.status === 200) {
      console.log(`Nonogram ${loadedId.value} saved successfully`);
      addLog('Save');
    } else {
      alert(`Error: ${response.status}`);
    }
  } catch (error) {
    console.error('Error saving nonogram:', error);
    alert('Error saving nonogram');
  }
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-controls">
      <button @click="handleLoad">Load</button>
      <input type="text" v-model="nonogramId" placeholder="ID for load" />
      <button @click="saveNonogram">Save</button>
      <button @click="markNonogram(true)">Good</button>
      <button @click="markNonogram(false)">Bad</button>
    </div>
    <div class="drawing-area" v-if="drawingData">
      <div class="grid" @contextmenu.prevent>
        <div v-for="(row, rIdx) in drawingData" :key="rIdx" class="row">
          <div 
            v-for="(cell, cIdx) in row" 
            :key="cIdx" 
            class="cell"
            :class="{ filled: isCellFilled(rIdx, cIdx) }"
            @mousedown="startDrawing(rIdx, cIdx, $event)"
            @mouseenter="continueDrawing(rIdx, cIdx, $event)"
          ></div>
        </div>
      </div>
    </div>
    <div class="admin-logs">
      <textarea v-model="logs" readonly placeholder="Logs will appear here..."></textarea>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 100px); /* Adjust based on header height if known, or just use 100vh minus some buffer */
}

.admin-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ccc;
}

.admin-controls button {
  padding: 5px 15px;
  border: 1px solid transparent;
  background-color: #2c3e50;
  color: white;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s;
}

.admin-controls button:hover {
  background-color: #34495e;
  border-color: white;
}

.admin-logs {
  padding: 10px;
  border-top: 1px solid #ccc;
  margin-top: auto;
}

.admin-logs textarea {
  width: 100%;
  height: 100px;
  font-family: monospace;
  resize: vertical;
}

.drawing-area {
  padding: 20px;
  flex-grow: 1;
}

.grid {
  display: flex;
  flex-direction: column;
  width: fit-content;
  user-select: none;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
}

.row {
  display: flex;
}

.cell {
  width: 7.5px;
  height: 7.5px;
  background-color: #fff;
  border: 0.1px solid #eee;
  box-sizing: border-box;
}

.cell.filled {
  background-color: #000;
  border-color: #000;
}
</style>
