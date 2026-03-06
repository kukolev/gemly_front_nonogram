<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import ConfirmationDialog from './ConfirmationDialog.vue';

const nonogramId = ref('');
const loadedId = ref('');
const drawingData = ref(null);
const logs = ref('');
const logTextArea = ref(null);
const unverifiedCount = ref(0);

function fetchStatistics() {
  try {
    const request = new XMLHttpRequest();
    request.open("GET", "/api/v1/nonogram/admin.getVerificationStatistics", false);
    request.send(null);
    if (request.status === 200) {
      const data = JSON.parse(request.responseText);
      unverifiedCount.value = data.unverified;
    }
  } catch (error) {
    console.error('Error fetching statistics:', error);
  }
}

watch(logs, () => {
  nextTick(() => {
    if (logTextArea.value) {
      logTextArea.value.scrollTop = logTextArea.value.scrollHeight;
    }
  });
});

const isDrawing = ref(false);
const drawingState = ref(null);
const isDirty = ref(false);
const isFillMode = ref(false);
const undoStack = ref([]);
const redoStack = ref([]);

function saveToUndo() {
  if (!drawingData.value) return;
  if (undoStack.value.length >= 50) {
    undoStack.value.shift();
  }
  undoStack.value.push(JSON.parse(JSON.stringify(drawingData.value)));
  redoStack.value = [];
}

function undo() {
  if (!drawingData.value || undoStack.value.length === 0) return;
  redoStack.value.push(JSON.parse(JSON.stringify(drawingData.value)));
  drawingData.value = undoStack.value.pop();
  isDirty.value = true;
  addLog('Undo');
}

function redo() {
  if (!drawingData.value || redoStack.value.length === 0) return;
  undoStack.value.push(JSON.parse(JSON.stringify(drawingData.value)));
  drawingData.value = redoStack.value.pop();
  isDirty.value = true;
  addLog('Redo');
}

function fillArea(r, c, newColor) {
  const oldColor = drawingData.value[r][c];
  if (oldColor === newColor) return;
  
  const stack = [[r, c]];
  const rows = drawingData.value.length;
  const cols = drawingData.value[0].length;
  
  while (stack.length > 0) {
    const [currR, currC] = stack.pop();
    if (drawingData.value[currR][currC] === oldColor) {
      drawingData.value[currR][currC] = newColor;
      isDirty.value = true;
      
      if (currR > 0) stack.push([currR - 1, currC]);
      if (currR < rows - 1) stack.push([currR + 1, currC]);
      if (currC > 0) stack.push([currR, currC - 1]);
      if (currC < cols - 1) stack.push([currR, currC + 1]);
    }
  }
}

const showDialog = ref(false);
const dialogMessage = ref('');
const pendingAction = ref(null);

function startDrawing(r, c, event) {
  let color;
  if (event.button === 0) {
    color = 1; // black
  } else if (event.button === 2) {
    color = 0; // white
  } else {
    return;
  }
  
  if (isFillMode.value) {
    if (drawingData.value[r][c] !== color) {
      saveToUndo();
      fillArea(r, c, color);
      addLog('Fill area');
    }
  } else {
    saveToUndo();
    drawingState.value = color;
    isDrawing.value = true;
    if (drawingData.value[r][c] !== drawingState.value) {
      drawingData.value[r][c] = drawingState.value;
      isDirty.value = true;
    }
  }
  
  event.preventDefault();
}

function continueDrawing(r, c, event) {
  if (!isDrawing.value) return;
  
  if (drawingData.value[r][c] !== drawingState.value) {
    drawingData.value[r][c] = drawingState.value;
    isDirty.value = true;
  }
}

function stopDrawing() {
  isDrawing.value = false;
  drawingState.value = null;
}

function isCellFilled(r, c) {
  if (!drawingData.value) return false;
  return drawingData.value[r][c] === 1;
}

function handleKeydown(event) {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
  if (event.ctrlKey && event.key.toLowerCase() === 'z') {
    undo();
    event.preventDefault();
  } else if (event.ctrlKey && event.key.toLowerCase() === 'x') {
    redo();
    event.preventDefault();
  }
}

onMounted(() => {
  window.addEventListener('mouseup', stopDrawing);
  window.addEventListener('keydown', handleKeydown);
  fetchStatistics();
});

onUnmounted(() => {
  window.removeEventListener('mouseup', stopDrawing);
  window.removeEventListener('keydown', handleKeydown);
});

function addLog(buttonName) {
  const now = new Date().toLocaleString();
  const id = loadedId.value || 'N/A';
  let size = 'N/A';
  if (drawingData.value && drawingData.value.length > 0) {
    size = `${drawingData.value.length}x${drawingData.value[0].length}`;
  }
  logs.value = logs.value + `${now} - Button: ${buttonName}, ID: ${id}, Size: ${size}\n`;
}

function loadRandom() {
  try {
    const request = new XMLHttpRequest();
    request.open("GET", "/api/v1/nonogram/admin.getRandomNonogram", false);
    request.send(null);
    if (request.status === 200) {
      const data = JSON.parse(request.responseText);
      loadedId.value = data.id;
      drawingData.value = data.data;
      undoStack.value = [];
      redoStack.value = [];
      isDirty.value = false;
      addLog('Load');
    } else {
      throw new Error('Failed to load random nonogram');
    }
  } catch (error) {
    console.error('Error loading random nonogram:', error);
  }
}

function loadById(id) {
  try {
    const request = new XMLHttpRequest();
    request.open("GET", `/api/v1/nonogram/admin.getById?id=${id}`, false);
    request.send(null);
    if (request.status === 200) {
      const data = JSON.parse(request.responseText);
      loadedId.value = data.id;
      drawingData.value = data.data;
      undoStack.value = [];
      redoStack.value = [];
      isDirty.value = false;
      addLog('Load');
    } else {
      throw new Error('Failed to load nonogram by id');
    }
  } catch (error) {
    console.error('Error loading nonogram by id:', error);
  }
}

function performLoad() {
  if (nonogramId.value) {
    loadById(nonogramId.value);
  } else {
    loadRandom();
  }
  fetchStatistics();
}

function handleLoad() {
  if (isDirty.value) {
    dialogMessage.value = 'Image was changed. Unsaved changes will be lost. Continue loading?';
    pendingAction.value = { type: 'load' };
    showDialog.value = true;
    return;
  }
  performLoad();
}

function markNonogram(mark) {
  if (!loadedId.value) {
    alert('No nonogram loaded');
    return;
  }
  if (isDirty.value) {
    if (mark) {
      dialogMessage.value = 'Image was changed. Are you sure you want to save changes and mark it as Good?';
    } else {
      dialogMessage.value = 'Image was changed. Unsaved changes will be lost. Continue?';
    }
    pendingAction.value = { type: 'mark', mark: mark };
    showDialog.value = true;
    return;
  }
  if (mark) {
    performSaveNonogram();
  }
  performMarkNonogram(mark);
}

function performMarkNonogram(mark) {
  try {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/v1/nonogram/admin.markNonogram", false);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify({
      id: loadedId.value,
      mark: mark
    }));
    if (request.status === 200) {
      console.log(`Nonogram ${loadedId.value} marked as ${mark ? 'Good' : 'Bad'}`);
      addLog(mark ? 'Good' : 'Bad');
      loadRandom();
      fetchStatistics();
    } else {
      console.error('Failed to mark nonogram');
    }
  } catch (error) {
    console.error('Error marking nonogram:', error);
  }
}

function saveNonogram() {
  if (!loadedId.value) {
    alert('No nonogram loaded');
    return;
  }
  if (isDirty.value) {
    dialogMessage.value = 'Are you sure you want to save changes to the image?';
    pendingAction.value = { type: 'save' };
    showDialog.value = true;
    return;
  }
  performSaveNonogram();
}

function performSaveNonogram() {
  try {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/v1/nonogram/admin.saveNonogram", false);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(JSON.stringify({
      id: loadedId.value,
      data: drawingData.value
    }));
    if (request.status === 200) {
      console.log(`Nonogram ${loadedId.value} saved successfully`);
      isDirty.value = false;
      addLog('Save');
    } else {
      alert(`Error: ${request.status}`);
    }
  } catch (error) {
    console.error('Error saving nonogram:', error);
    alert('Error saving nonogram');
  }
}

function handleConfirm() {
  showDialog.value = false;
  const action = pendingAction.value;
  pendingAction.value = null;
  
  if (action.type === 'load') {
    performLoad();
  } else if (action.type === 'mark') {
    if (action.mark) {
      performSaveNonogram();
    }
    performMarkNonogram(action.mark);
  } else if (action.type === 'save') {
    performSaveNonogram();
  }
}

function handleCancel() {
  showDialog.value = false;
  pendingAction.value = null;
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-controls">
      <button @click="handleLoad">Load ({{ unverifiedCount }})</button>
      <input type="text" v-model="nonogramId" placeholder="ID for load" />
      <button @click="saveNonogram">Save</button>
      <button @click="undo" :disabled="undoStack.length === 0">Undo</button>
      <button @click="redo" :disabled="redoStack.length === 0">Redo</button>
      <button @click="isFillMode = !isFillMode" :class="{ toggled: isFillMode }">Fill area</button>
      <button @click="markNonogram(true)" style="margin-left: 100px">Good</button>
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
      <textarea ref="logTextArea" v-model="logs" readonly placeholder="Logs will appear here..."></textarea>
    </div>
  </div>
  <ConfirmationDialog
    v-if="showDialog"
    :message="dialogMessage"
    @yes="handleConfirm"
    @no="handleCancel"
  />
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

.admin-controls button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
  border-color: transparent;
}

.admin-controls button.toggled {
  background-color: #3498db;
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
