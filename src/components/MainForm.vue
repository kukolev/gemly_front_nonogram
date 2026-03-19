<template>
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
        :initial-history="initialHistory"
        :initial-history-index="initialHistoryIndex"
        :touch-mark-mode="touchMarkMode"
        @congrats-toggled="isCongratsShown = $event"
        @change="performSave"
      />
    </div>
  </div>
  <ConfirmationDialog
    v-if="showDialog"
    :message="dialogMessage"
    @yes="handleConfirm"
    @no="handleCancel"
  />
  <ConfirmationDialog
    v-if="showAnswerConfirm"
    message="Очень хочется посмотреть ответ, да?"
    yes-text="Да!"
    no-text="Нет, я отгадаю самостоятельно!"
    @yes="showAnswerConfirm = false; showAnswerDialog = true"
    @no="showAnswerConfirm = false"
  />
  <AnswerDialog
    v-if="showAnswerDialog && resultData"
    :solution="resultData"
    @ok="showAnswerDialog = false"
  />
</template>
<style scoped>
.main-form {
  padding: 0 1rem;
  overflow-x: auto; /* desktop horizontal scroll */
}

@media (max-width: 640px) {
  .main-form {
    padding: 0;
    overflow-x: visible; /* Nonogram's own container handles scroll on mobile */
  }
}

.nonogram-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: flex-start;
}
</style>

<script setup>

const emit = defineEmits(['show-finished', 'loaded'])

const props = defineProps({
  touchMarkMode: {
    type: Boolean,
    default: false
  }
});

import Nonogram from './Nonogram.vue';
import ConfirmationDialog from './ConfirmationDialog.vue';
import AnswerDialog from './AnswerDialog.vue';
import {ref, computed, nextTick} from 'vue';
import {loadRandomNonogram, checkSolution} from '../funcs.js';

const componentKey = ref(0);
const nonogramComponent = ref(null);

const canUndo = computed(() => nonogramComponent.value?.canUndo);
const canRedo = computed(() => nonogramComponent.value?.canRedo);
const hasErrors = computed(() => nonogramComponent.value?.hasErrors || false);
const isSolved = computed(() => nonogramComponent.value?.isSolved || false);
const isCongratsShown = ref(false);
const showDialog = ref(false);
const dialogMessage = ref('');
const pendingAction = ref(null);
const showAnswerDialog = ref(false);
const showAnswerConfirm = ref(false);

function showAnswer() {
  showAnswerConfirm.value = true;
}

defineExpose({
  canUndo,
  canRedo,
  hasErrors,
  isSolved,
  isCongratsShown,
  requestReload,
  requestClear,
  check,
  undo,
  redo,
  drawResult,
  showAnswer,
  performSave
});

const rowValues = ref([]);
const colValues = ref([]);
const resultData = ref(null);
const nonogramId = ref(null);
const nonogramSize = ref({rows: 0, cols: 0});
const initialGrid = ref(null);
const initialMarkedRowClues = ref(null);
const initialMarkedColClues = ref(null);
const initialHistory = ref(null);
const initialHistoryIndex = ref(null);

function setNonogramData(rows, cols, data, id, grid = null, markedRowClues = null, markedColClues = null, history = null, historyIndex = null) {
  rowValues.value = rows;
  colValues.value = cols;
  resultData.value = data;
  nonogramId.value = id;
  nonogramSize.value = {rows: rows.length, cols: cols.length};
  
  if (!grid) {
    grid = Array.from({length: rows.length}, () => Array.from({length: cols.length}, () => 0));
  }
  if (!markedRowClues) {
    const maxRowClues = Math.max(...rows.map(v => v.length), 0);
    markedRowClues = rows.map(() => Array(maxRowClues).fill(false));
  }
  if (!markedColClues) {
    const maxColClues = Math.max(...cols.map(v => v.length), 0);
    markedColClues = cols.map(() => Array(maxColClues).fill(false));
  }

  initialGrid.value = grid;
  initialMarkedRowClues.value = markedRowClues;
  initialMarkedColClues.value = markedColClues;
  initialHistory.value = history;
  initialHistoryIndex.value = historyIndex;
  componentKey.value += 1;
  nextTick(() => {
    performSave();
    emit('loaded');
  });
}

function loadSavedState() {
  const saved = localStorage.getItem('nonogram_save');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      setNonogramData(data.rowValues, data.colValues, data.resultData, data.id, data.grid, data.markedRowClues, data.markedColClues, data.history ?? null, data.historyIndex ?? null);
      return true;
    } catch (e) {
      console.error('Failed to load saved nonogram', e);
    }
  }
  return false;
}

if (!loadSavedState()) {
  const [rows, cols, data, id] = loadRandomNonogram();
  setNonogramData(rows, cols, data, id);
}

function reload() {
  const [rows, cols, data, id] = loadRandomNonogram();
  setNonogramData(rows, cols, data, id);
}

function performSave() {
  const data = {
    id: nonogramId.value,
    grid: nonogramComponent.value?.grid || initialGrid.value,
    markedRowClues: nonogramComponent.value?.markedRowClues || initialMarkedRowClues.value,
    markedColClues: nonogramComponent.value?.markedColClues || initialMarkedColClues.value,
    history: nonogramComponent.value?.history || null,
    historyIndex: nonogramComponent.value?.historyIndex ?? null,
    rowValues: rowValues.value,
    colValues: colValues.value,
    resultData: resultData.value
  };
  localStorage.setItem('nonogram_save', JSON.stringify(data));
}

function check() {
  nonogramComponent.value?.check(true, true);
  checkSolution(nonogramId.value, nonogramComponent.value.grid);
}

function requestReload() {
  dialogMessage.value = 'Будет загружен новый кроссворд, вы точно уверены?';
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
  const action = pendingAction.value;
  pendingAction.value = null;
  if (action === 'reload') {
    reload();
  } else if (action === 'clear') {
    clear();
    performSave();
  }
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

