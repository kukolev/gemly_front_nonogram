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

      <!-- Save button -->
      <div class="tb-save-wrapper">
        <button class="tb-btn"
                :disabled="!hasUnsavedChanges"
                @click="manualSave"
                title="Сохранить прогресс">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>Сохранить</span>
        </button>
        <transition name="save-tooltip-fade">
          <div v-if="showSaveTooltip" class="tb-save-tooltip">
            Спасибо, мы сохранили прогресс по кроссворду.<br>Прогресс регулярно сохраняется автоматически.
          </div>
        </transition>
      </div>

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

      <label class="tb-help-label" :class="{'tb-help-active': helpMode}">
        <input type="checkbox" v-model="helpMode" class="tb-help-checkbox" />
        <span>Подсказка</span>
      </label>

      <!-- Touch-mode toggle (mobile only) -->
      <button class="tb-btn tb-touch-mode-btn" :class="{'tb-touch-mode-active': touchMarkMode}"
              @click="emit('toggle-touch-mode')"
              :title="touchMarkMode ? 'Режим: пометить' : 'Режим: закрасить'">
        <svg v-if="!touchMarkMode" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="4" width="16" height="16" fill="currentColor" stroke="currentColor"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="4" width="16" height="16"/>
          <line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>
        </svg>
        <span>{{ touchMarkMode ? 'Пометить' : 'Закрасить' }}</span>
      </button>

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
        :help-mode="helpMode"
        @congrats-toggled="isCongratsShown = $event"
        @change="handleChange"
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
  background: #ffffff;
  border-bottom: 1px solid #d0d0d0;
  flex-wrap: nowrap;
  overflow: visible;
  position: fixed;
  top: 0;
  left: 250px; /* sidebar width */
  right: 0;
  z-index: 50;
}

@media (max-width: 640px) {
  .main-form {
    padding-top: 50px;
  }

  .nonogram-toolbar {
    left: 48px; /* hamburger button width */
  }

  /* Icon-only toolbar on mobile */
  .tb-btn span,
  .tb-help-label span:last-child {
    display: none;
  }
}

.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  background: transparent;
  border: 1px solid transparent;
  color: #2c3e50;
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
  background: #e8edf0;
  border-color: #b0bec5;
  color: #1a252f;
}

.tb-btn:active:not(:disabled) {
  background: #d0dbe2;
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

.tb-help-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  border: 1px solid #c8d4da;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.78rem;
  color: #2c3e50;
  user-select: none;
  white-space: nowrap;
  transition: background-color 0.15s, border-color 0.15s;
}

.tb-help-label:hover {
  background-color: #e8f4fb;
  border-color: #7fb3d3;
}

.tb-help-active {
  background-color: #e0f5ff;
  border-color: #00bfff;
  color: #007aa3;
}

.tb-help-checkbox {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #00bfff;
  flex-shrink: 0;
}

.toolbar-size {
  font-size: 0.75rem;
  color: #7a8a95;
  font-family: monospace;
  user-select: none;
  white-space: nowrap;
  padding: 0 0.3rem;
}

/* ── Save wrapper + tooltip ── */
.tb-save-wrapper {
  position: relative;
  display: inline-flex;
}

.tb-save-tooltip {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: #ffffff;
  color: #1a1a1a;
  font-size: 0.78rem;
  padding: 0.55rem 0.9rem;
  border-radius: 4px;
  white-space: nowrap;
  line-height: 1.5;
  box-shadow: 0 2px 10px rgba(0,0,0,0.18);
  border: 1px solid #d0d0d0;
  z-index: 200;
  pointer-events: none;
}

.tb-save-tooltip::before {
  content: '';
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 8px;
  height: 8px;
  background: #ffffff;
  border-left: 1px solid #d0d0d0;
  border-top: 1px solid #d0d0d0;
}

.save-tooltip-fade-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.save-tooltip-fade-leave-active { transition: opacity 0.35s ease, transform 0.35s ease; }
.save-tooltip-fade-enter-from   { opacity: 0; transform: translateX(-50%) translateY(-4px); }
.save-tooltip-fade-leave-to     { opacity: 0; transform: translateX(-50%) translateY(-4px); }

/* Touch-mode button: desktop pointer devices hide it, mobile shows it */
@media (hover: hover) and (pointer: fine) {
  .tb-touch-mode-btn { display: none; }
}

.tb-touch-mode-active {
  background: #e0f5ff !important;
  border-color: #00bfff !important;
  color: #007aa3 !important;
}

.nonogram-wrapper {
  margin: 0;
  padding: 0px 0 0 25px;
  display: flex;
  justify-content: flex-start;
  overflow-x: auto; /* horizontal scroll stays below the sticky toolbar */
}

@media (max-width: 640px) {
  .nonogram-wrapper {
    padding-left: 0;
  }
}
</style>

<script setup>

const emit = defineEmits(['show-finished', 'loaded', 'check', 'toggle-touch-mode'])

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
const helpMode = ref(false);
const hasUnsavedChanges = ref(false);
const showSaveTooltip = ref(false);
let saveTooltipTimer = null;
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

function handleChange() {
  performSave();
  hasUnsavedChanges.value = true;
}

const SAVE_TOOLTIP_KEY = 'nonogram_save_tooltip_shown';

function manualSave() {
  performSave();
  hasUnsavedChanges.value = false;
  if (!localStorage.getItem(SAVE_TOOLTIP_KEY)) {
    localStorage.setItem(SAVE_TOOLTIP_KEY, '1');
    clearTimeout(saveTooltipTimer);
    showSaveTooltip.value = true;
    saveTooltipTimer = setTimeout(() => { showSaveTooltip.value = false; }, 4000);
  }
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

