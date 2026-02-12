<template>
  <AppHeader
    :title="message"
    :can-undo="canUndo"
    :can-redo="canRedo"
    @reload="requestReload"
    @clear="requestClear"
    @check="check"
    @undo="undo"
    @redo="redo"
    @draw-result="drawResult"
    @save="save"
  />
  <div class="main-form">
    <div class="nonogram-wrapper">
      <Nonogram 
        ref="nonogramComponent" 
        :key="componentKey" 
        :size="nonogramSize" 
        :row-values="rowValues" 
        :col-values="colValues" 
        :solution="resultData" 
        :initial-grid="initialGrid"
        :initial-marked-row-clues="initialMarkedRowClues"
        :initial-marked-col-clues="initialMarkedColClues"
        @clue-click="save(false)"
      />
    </div>
  </div>
  <ConfirmationDialog 
    v-if="showDialog" 
    :message="dialogMessage" 
    :show-no="pendingAction !== 'save'"
    :yes-text="pendingAction === 'save' ? 'OK' : 'Yes'"
    @yes="handleConfirm" 
    @no="handleCancel" 
  />
  <AppFooter />
</template>
<style scoped>
.main-form {
  padding: 0 1rem;
  overflow-x: auto;
}

.nonogram-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: flex-start;
}
</style>

<script setup>

defineProps({
  message: {
    type: String,
    required: true,
  },
})

import Nonogram from './Nonogram.vue';
import ConfirmationDialog from './ConfirmationDialog.vue';
import AppHeader from './AppHeader.vue';
import AppFooter from './AppFooter.vue';
import {ref, computed} from 'vue';
import {loadData, loadRandomNonogram} from '../funcs.js';

const componentKey = ref(0);
const nonogramComponent = ref(null);

const canUndo = computed(() => nonogramComponent.value?.canUndo);
const canRedo = computed(() => nonogramComponent.value?.canRedo);
const showDialog = ref(false);
const dialogMessage = ref('');
const pendingAction = ref(null);

const rowValues = ref([]);
const colValues = ref([]);
const resultData = ref(null);
const nonogramId = ref(null);
const nonogramSize = ref({rows: 0, cols: 0});
const initialGrid = ref(null);
const initialMarkedRowClues = ref(null);
const initialMarkedColClues = ref(null);

function setNonogramData(rows, cols, data, id, grid = null, markedRowClues = null, markedColClues = null) {
  rowValues.value = rows;
  colValues.value = cols;
  resultData.value = data;
  nonogramId.value = id;
  nonogramSize.value = {rows: rows.length, cols: cols.length};
  initialGrid.value = grid;
  initialMarkedRowClues.value = markedRowClues;
  initialMarkedColClues.value = markedColClues;
}

const saved = localStorage.getItem('nonogram_save');
if (saved) {
  try {
    const data = JSON.parse(saved);
    setNonogramData(data.rowValues, data.colValues, data.resultData, data.id, data.grid, data.markedRowClues, data.markedColClues);
  } catch (e) {
    console.error('Failed to load saved nonogram', e);
    const [rows, cols, data, id] = loadRandomNonogram();
    setNonogramData(rows, cols, data, id);
  }
} else {
  const [rows, cols, data, id] = loadRandomNonogram();
  setNonogramData(rows, cols, data, id);
}

async function reload() {
  componentKey.value += 1;
  const [rows, cols, data, id] = loadRandomNonogram();
  setNonogramData(rows, cols, data, id);
}

function save(showAlert = true) {
  if (!nonogramComponent.value) return;
  const data = {
    id: nonogramId.value,
    grid: nonogramComponent.value.grid,
    markedRowClues: nonogramComponent.value.markedRowClues,
    markedColClues: nonogramComponent.value.markedColClues,
    rowValues: rowValues.value,
    colValues: colValues.value,
    resultData: resultData.value
  };
  localStorage.setItem('nonogram_save', JSON.stringify(data));
  if (showAlert) {
    dialogMessage.value = 'Прогресс сохранен!';
    pendingAction.value = 'save';
    showDialog.value = true;
  }
}

function check() {
  nonogramComponent.value?.check(true, true);
}

function requestReload() {
  dialogMessage.value = 'Loading will erase your progress. Are you sure?';
  pendingAction.value = 'reload';
  showDialog.value = true;
}

function requestClear() {
  dialogMessage.value = 'Ваш прогресс по данному кроссворду будет потерян, вы точно уверены?';
  pendingAction.value = 'clear';
  showDialog.value = true;
}

function handleConfirm() {
  showDialog.value = false;
  if (pendingAction.value === 'reload') {
    reload();
  } else if (pendingAction.value === 'clear') {
    clear();
  }
  pendingAction.value = null;
}

function handleCancel() {
  showDialog.value = false;
  pendingAction.value = null;
}

function undo() {
  nonogramComponent.value?.undo();
}

function redo() {
  nonogramComponent.value?.redo();
}

function drawResult() {
  nonogramComponent.value?.drawResult(resultData.value);
}

function clear() {
  nonogramComponent.value?.clear();
}
</script>

