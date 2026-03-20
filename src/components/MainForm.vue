<template>
  <div class="main-form">
    <div class="nonogram-toolbar">
      <!-- Action buttons -->
      <button class="tb-btn" @click="undo" :disabled="!canUndo" title="Отменить">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
        </svg>
        <span>Отменить</span>
      </button>

      <button class="tb-btn" @click="redo" :disabled="!canRedo" title="Вернуть">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>
        </svg>
        <span>Вернуть</span>
      </button>

      <button class="tb-btn" @click="requestClear" title="Очистить поле">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
        </svg>
        <span>Очистить</span>
      </button>

      <button class="tb-btn" :class="{'tb-btn-error': props.checkError}"
              @click="emit('check')" title="Проверить решение">
        <svg v-if="!props.checkError" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        <span>{{ props.checkError ? 'Ошибки!' : 'Проверить' }}</span>
      </button>

      <button class="tb-btn" @click="showAnswer" title="Показать ответ">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M2 12C4.4 7 8 4 12 4s7.6 3 10 8c-2.4 5-6 8-10 8S4.4 17 2 12z"/>
        </svg>
        <span>Ответ</span>
      </button>

      <button v-if="props.isAdmin" class="tb-btn" @click="drawResult" title="Показать решение">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span>Решение</span>
      </button>

      <!-- Separator -->
      <div class="tb-sep"></div>

      <!-- Size label -->
      <span class="toolbar-size">Размер: {{ nonogramSize.cols }}&thinsp;×&thinsp;{{ nonogramSize.rows }}</span>
    </div>
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
  padding-top: 50px; /* space for the fixed toolbar */
}

/* ── Toolbar ─────────────────────────────────── */
.nonogram-toolbar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0 0.5rem;
  height: 50px;
  background: #2c3e50;
  border-bottom: 1px solid #1a252f;
  flex-wrap: nowrap;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 300px; /* sidebar width */
  right: 0;
  z-index: 50;
}

@media (max-width: 640px) {
  .main-form {
    padding-top: 50px;
  }

  .nonogram-toolbar {
    left: 48px; /* mobile sidebar width */
  }
}

.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  background: transparent;
  border: 1px solid transparent;
  color: #d0d8e0;
  font-size: 0.78rem;
  cursor: pointer;
  white-space: nowrap;
  border-radius: 3px;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.tb-btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.tb-btn:hover:not(:disabled) {
  background: #34495e;
  border-color: #4a6278;
  color: #fff;
}

.tb-btn:active:not(:disabled) {
  background: #3d5a73;
}

.tb-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

@keyframes tbShake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-4px); }
  40%       { transform: translateX(4px); }
  60%       { transform: translateX(-3px); }
  80%       { transform: translateX(3px); }
}

.tb-btn-error {
  background: #922b21 !important;
  border-color: #c0392b !important;
  color: #fff !important;
  animation: tbShake 0.4s ease-in-out;
}

.tb-sep {
  flex: 1;
}

.toolbar-size {
  font-size: 0.75rem;
  color: #8ca0b0;
  font-family: monospace;
  user-select: none;
  white-space: nowrap;
  padding: 0 0.3rem;
}

.nonogram-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1rem 0;
  display: flex;
  justify-content: flex-start;
  overflow-x: auto; /* horizontal scroll stays below the sticky toolbar */
}
</style>

<script setup>

const emit = defineEmits(['show-finished', 'loaded', 'check'])

const props = defineProps({
  touchMarkMode: { type: Boolean, default: false },
  checkError:    { type: Boolean, default: false },
  isAdmin:       { type: Boolean, default: false },
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

