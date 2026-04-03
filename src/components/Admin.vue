<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ConfirmationDialog from './ConfirmationDialog.vue';

const { t } = useI18n();
const nonogramId = ref('');
const loadedId = ref('');
const verificationStatus = ref('UNVERIFIED');
const drawingData = ref(null);
const logs = ref('');
const logTextArea = ref(null);
const unverifiedCount = ref(0);

const statusBackgroundColor = computed(() => {
  if (verificationStatus.value === 'GOOD') return 'green';
  if (verificationStatus.value === 'BAD') return 'red';
  if (verificationStatus.value === 'BAD_MULTIPLE_SOLUTIONS') return 'yellow';
  if (verificationStatus.value === 'BAD_NO_LOGICAL_SOLUTION') return 'orange';
  if (verificationStatus.value === 'BAD_TOO_COMPLEX') return 'darkgrey';
  if (verificationStatus.value === 'UNVERIFIED') return 'white';
  return 'white';
});

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

const isSaving = ref(false);

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
      verificationStatus.value = data.verificationStatus || 'UNVERIFIED';
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
      verificationStatus.value = data.verificationStatus || 'UNVERIFIED';
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
    dialogMessage.value = t('dialog.admin.unsavedChangesOnLoad');
    pendingAction.value = { type: 'load' };
    showDialog.value = true;
    return;
  }
  performLoad();
}

function markNonogram(mark) {
  if (!loadedId.value) {
    alert(t('dialog.admin.noNonogramLoaded'));
    return;
  }
  if (isDirty.value) {
    if (mark === 'GOOD') {
      dialogMessage.value = t('dialog.admin.saveChangesAndMarkGood');
    } else {
      dialogMessage.value = t('dialog.admin.unsavedChangesContinue');
    }
    pendingAction.value = { type: 'mark', mark: mark };
    showDialog.value = true;
    return;
  }
  if (mark === 'GOOD') {
    performSaveNonogram('GOOD');
    return;
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
      mark: mark,
      verificationStatus: mark
    }));
    if (request.status === 200) {
      console.log(`Nonogram ${loadedId.value} marked as ${mark}`);
      addLog(mark);
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
    alert(t('dialog.admin.noNonogramLoaded'));
    return;
  }
  if (isDirty.value) {
    dialogMessage.value = t('dialog.admin.confirmSaveImage');
    pendingAction.value = { type: 'save' };
    showDialog.value = true;
    return;
  }
  performSaveNonogram();
}

async function performSaveNonogram(markAs = null) {
  isSaving.value = true;
  try {
    const response = await fetch('/api/v1/nonogram/admin.saveNonogram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: loadedId.value,
        data: drawingData.value,
        ...(markAs && { verificationStatus: markAs })
      })
    });
    if (response.ok) {
      console.log(`Nonogram ${loadedId.value} saved successfully`);
      isDirty.value = false;
      addLog('Save');
      const data = await response.json();
      if (data.verificationStatus) {
        verificationStatus.value = data.verificationStatus;
      }
    } else {
      alert(`${t('dialog.admin.errorSaving')}: ${response.status}`);
    }
  } catch (error) {
    console.error('Error saving nonogram:', error);
    alert(t('dialog.admin.errorSaving'));
  } finally {
    isSaving.value = false;
  }
}

function handleConfirm() {
  showDialog.value = false;
  const action = pendingAction.value;
  pendingAction.value = null;
  
  if (action.type === 'load') {
    performLoad();
  } else if (action.type === 'mark') {
    if (action.mark === 'GOOD') {
      performSaveNonogram('GOOD');
      return;
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
    <div v-if="isSaving" class="saving-overlay">
      <div class="saving-spinner"></div>
      <span>Saving…</span>
    </div>
    <div class="admin-controls" :style="{ backgroundColor: statusBackgroundColor }">
      <button @click="handleLoad" :disabled="isSaving">Load ({{ unverifiedCount }})</button>
      <input type="text" v-model="nonogramId" placeholder="ID for load" />
      <button @click="undo" :disabled="undoStack.length === 0 || isSaving">Undo</button>
      <button @click="redo" :disabled="redoStack.length === 0 || isSaving">Redo</button>
      <button @click="isFillMode = !isFillMode" :class="{ toggled: isFillMode }" :disabled="isSaving">Fill area</button>
      <button @click="markNonogram('GOOD')" style="margin-left: 100px" :disabled="isSaving">Good</button>
      <button @click="markNonogram('BAD')" :disabled="isSaving">Bad</button>
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
  position: relative;
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

.saving-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 100;
  color: #fff;
  font-size: 16px;
  pointer-events: all;
}

.saving-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
