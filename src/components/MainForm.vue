<template>
  <div class="main-form">
    <div class="nonogram-toolbar">
      <!-- Action buttons -->
      <button class="tb-btn" @click="undo" :disabled="!canUndo" :title="t('toolbar.undo')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
        </svg>
        <span>{{ t('toolbar.undo') }}</span>
      </button>

      <button class="tb-btn" @click="redo" :disabled="!canRedo" :title="t('toolbar.redo')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>
        </svg>
        <span>{{ t('toolbar.redo') }}</span>
      </button>


      <button class="tb-btn" :class="{'tb-btn-error': props.checkError}"
              @click="emit('check')" :title="t('toolbar.check')">
        <svg v-if="!props.checkError" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        <span>{{ props.checkError ? t('toolbar.errors') : t('toolbar.check') }}</span>
      </button>

      <!-- Save button -->
      <div class="tb-save-wrapper">
        <button class="tb-btn"
                :disabled="!hasUnsavedChanges"
                @click="manualSave"
                :title="t('toolbar.save')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>{{ t('toolbar.save') }}</span>
        </button>
        <transition name="save-tooltip-fade">
          <div v-if="showSaveTooltip" class="tb-save-tooltip" v-html="t('toolbar.saveTooltip')">
          </div>
        </transition>
      </div>

      <button class="tb-btn" @click="showAnswer" :title="t('toolbar.answer')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M2 12C4.4 7 8 4 12 4s7.6 3 10 8c-2.4 5-6 8-10 8S4.4 17 2 12z"/>
        </svg>
        <span>{{ t('toolbar.answer') }}</span>
      </button>

      <button v-if="props.isAdmin" class="tb-btn" @click="drawResult" :title="t('toolbar.solution')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span>{{ t('toolbar.solution') }}</span>
      </button>

      <label class="tb-help-label" :class="{'tb-help-active': helpMode}">
        <input type="checkbox" v-model="helpMode" class="tb-help-checkbox" />
        <span>{{ t('toolbar.hint') }}</span>
      </label>

      <!-- Zoom controls -->
      <div class="tb-zoom">
        <button class="tb-btn tb-zoom-btn" @click="zoomOut" :disabled="zoomLevel <= ZOOM_MIN" :title="t('toolbar.zoomOut')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
        <span class="tb-zoom-indicator">{{ zoomLevel }}%</span>
        <button class="tb-btn tb-zoom-btn" @click="zoomIn" :disabled="zoomLevel >= ZOOM_MAX" :title="t('toolbar.zoomIn')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
      </div>

      <!-- Touch-mode toggle (mobile only) -->
      <button class="tb-btn tb-touch-mode-btn" :class="{'tb-touch-mode-active': touchMarkMode}"
              @click="emit('toggle-touch-mode')"
              :title="touchMarkMode ? t('toolbar.mark') : t('toolbar.fill')">
        <svg v-if="!touchMarkMode" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="4" width="16" height="16" fill="currentColor" stroke="currentColor"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="4" width="16" height="16"/>
          <line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>
        </svg>
        <span>{{ touchMarkMode ? t('toolbar.mark') : t('toolbar.fill') }}</span>
      </button>

      <!-- Language switcher -->
      <div class="tb-lang-container" :title="t('toolbar.language')">
        <div class="tb-lang-selected" @click="toggleLangDropdown">
          <svg v-if="locale === 'en'" viewBox="0 0 640 480">
            <path fill="#012169" d="M0 0h640v480H0z"/>
            <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
            <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zM226 199l-226-167V0l282 209h-56zm356 281 58-45v45h-58zM0 480l51-39 122 91h-52L0 480zm320-281-282-209h71l211 156V199zM0 0l217 161h-56L0 40V0zm640 0L423 161h56L640 40V0zM161 281 0 401v79l212-157h-51zm253-82 226 167v40L358 209h56z"/>
            <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
            <path fill="#C8102E" d="M281 0v480h80V0h-80zM0 200v80h640v-80H0z"/>
          </svg>
          <svg v-else-if="locale === 'ru'" viewBox="0 0 900 600">
            <rect width="900" height="600" fill="#fff"/>
            <rect width="900" height="400" y="200" fill="#0039a6"/>
            <rect width="900" height="200" y="400" fill="#d52b1e"/>
          </svg>
          <span class="tb-lang-label">{{ locale.toUpperCase() }}</span>
          <svg class="tb-lang-arrow" :class="{'tb-lang-arrow-up': langDropdownOpen}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <div v-if="langDropdownOpen" class="tb-lang-dropdown">
          <div class="tb-lang-option" @click="selectLanguage('en')">
            <svg viewBox="0 0 640 480">
              <path fill="#012169" d="M0 0h640v480H0z"/>
              <path fill="#FFF" d="m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z"/>
              <path fill="#C8102E" d="m424 281 216 159v40L369 281h55zM226 199l-226-167V0l282 209h-56zm356 281 58-45v45h-58zM0 480l51-39 122 91h-52L0 480zm320-281-282-209h71l211 156V199zM0 0l217 161h-56L0 40V0zm640 0L423 161h56L640 40V0zM161 281 0 401v79l212-157h-51zm253-82 226 167v40L358 209h56z"/>
              <path fill="#FFF" d="M241 0v480h160V0H241zM0 160v160h640V160H0z"/>
              <path fill="#C8102E" d="M281 0v480h80V0h-80zM0 200v80h640v-80H0z"/>
            </svg>
            <span>EN</span>
          </div>
          <div class="tb-lang-option" @click="selectLanguage('ru')">
            <svg viewBox="0 0 900 600">
              <rect width="900" height="600" fill="#fff"/>
              <rect width="900" height="400" y="200" fill="#0039a6"/>
              <rect width="900" height="200" y="400" fill="#d52b1e"/>
            </svg>
            <span>RU</span>
          </div>
        </div>
      </div>

    </div>
    
    <div class="nonogram-info" v-if="nonogramId">
      <div class="info-item">{{ t('sidebar.size') }}: {{ nonogramSize.cols }} x {{ nonogramSize.rows }}</div>
      <div class="info-item" v-if="nonogramDate">{{ t('sidebar.added') }} {{ formatDate(nonogramDate) }}</div>
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
        :zoom="zoomLevel"
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

/* ── Info Bar ───────────────────────────────── */
.nonogram-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.5rem 25px;
  background: #fdfdfd;
  border-bottom: 1px solid #eee;
  font-size: 0.82rem;
  color: #555;
  margin-left: 0;
  line-height: 1.4;
}

.info-item {
  display: inline-flex;
  align-items: center;
}

@media (max-width: 640px) {
  .main-form {
    padding-top: 50px;
  }

  .nonogram-toolbar {
    left: 48px; /* hamburger button width */
  }

  .nonogram-info {
    margin-left: 0;
    padding-left: 0;
    font-size: 0.75rem;
    gap: 1rem;
  }

  /* Icon-only toolbar on mobile */
  .tb-btn span,
  .tb-help-label span:last-child {
    display: none;
  }
}

.tb-lang-container {
  display: inline-flex;
  align-items: center;
  position: relative;
  padding: 0 0.4rem;
  user-select: none;
}

.tb-lang-selected {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.4rem;
  font-size: 0.78rem;
  font-weight: 700;
  border: 1px solid #d0d0d0;
  border-radius: 3px;
  background-color: #f8f9fa;
  color: #2c3e50;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
}

.tb-lang-selected:hover {
  border-color: #b0bec5;
  background-color: #ffffff;
}

.tb-lang-selected svg {
  width: 18px;
  height: auto;
  border-radius: 1px;
}

.tb-lang-arrow {
  width: 10px !important;
  height: 10px !important;
  transition: transform 0.2s;
  opacity: 0.6;
}

.tb-lang-arrow-up {
  transform: rotate(180deg);
}

.tb-lang-dropdown {
  position: absolute;
  top: 100%;
  left: 0.4rem;
  right: 0.4rem;
  margin-top: 4px;
  background: #ffffff;
  border: 1px solid #d0d0d0;
  border-radius: 3px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 100;
  overflow: hidden;
}

.tb-lang-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 700;
  color: #2c3e50;
  transition: background-color 0.1s;
}

.tb-lang-option:hover {
  background-color: #f0f4f7;
}

.tb-lang-option svg {
  width: 18px;
  height: auto;
  border-radius: 1px;
}

@media (max-width: 640px) {
  .tb-lang-label, .tb-lang-arrow {
    display: none;
  }
  .tb-lang-selected {
    padding: 0.2rem;
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
  font-weight: 700;
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
  font-weight: 700;
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

/* ── Zoom controls ── */
.tb-zoom {
  display: inline-flex;
  align-items: center;
  gap: 0;
  border: 1px solid #c8d4da;
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}

.tb-zoom-btn {
  border: none;
  border-radius: 0;
  padding: 0.3rem 0.45rem;
}

.tb-zoom-btn:hover:not(:disabled) {
  border: none;
}

.tb-zoom-indicator {
  font-size: 0.72rem;
  font-family: monospace;
  color: #2c3e50;
  padding: 0 0.4rem;
  min-width: 3.2em;
  text-align: center;
  user-select: none;
  border-left: 1px solid #c8d4da;
  border-right: 1px solid #c8d4da;
  white-space: nowrap;
}

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
import {ref, computed, nextTick, onMounted, onUnmounted} from 'vue';
import { useI18n } from 'vue-i18n';
import i18n from '../i18n';
import {loadRandomNonogram, checkSolution} from '../funcs.js';

const { t, locale } = useI18n();

const langDropdownOpen = ref(false);
const toggleLangDropdown = () => {
  langDropdownOpen.value = !langDropdownOpen.value;
};
const selectLanguage = (val) => {
  locale.value = val;
  saveLanguage();
  langDropdownOpen.value = false;
};
const closeLangDropdown = (e) => {
  if (!e.target.closest('.tb-lang-container')) {
    langDropdownOpen.value = false;
  }
};
onMounted(() => {
  window.addEventListener('click', closeLangDropdown);
});
onUnmounted(() => {
  window.removeEventListener('click', closeLangDropdown);
});

const saveLanguage = () => {
  localStorage.setItem('lang', locale.value);
};

const componentKey = ref(0);
const nonogramComponent = ref(null);

// ── Zoom ─────────────────────────────────────────────────────────────────────
const ZOOM_KEY  = 'nonogram_zoom';
const ZOOM_STEP = 25;
const ZOOM_MIN  = 50;
const ZOOM_MAX  = 200;
const zoomLevel = ref(parseInt(localStorage.getItem(ZOOM_KEY) || '100', 10));

function zoomIn()  {
  if (zoomLevel.value < ZOOM_MAX) {
    zoomLevel.value = Math.min(ZOOM_MAX, zoomLevel.value + ZOOM_STEP);
    localStorage.setItem(ZOOM_KEY, String(zoomLevel.value));
  }
}
function zoomOut() {
  if (zoomLevel.value > ZOOM_MIN) {
    zoomLevel.value = Math.max(ZOOM_MIN, zoomLevel.value - ZOOM_STEP);
    localStorage.setItem(ZOOM_KEY, String(zoomLevel.value));
  }
}

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
const nonogramDate = ref(null);
const autoSolveReported = ref(false); // prevent double-reporting for same puzzle
const nonogramSize = ref({rows: 0, cols: 0});
const initialGrid = ref(null);
const initialMarkedRowClues = ref(null);
const initialMarkedColClues = ref(null);
const initialHistory = ref(null);
const initialHistoryIndex = ref(null);

function formatDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}.${month}.${year}`;
  }
  return dateStr;
}

function setNonogramData(rows, cols, data, id, date = null, grid = null, markedRowClues = null, markedColClues = null, history = null, historyIndex = null) {
  rowValues.value = rows;
  colValues.value = cols;
  resultData.value = data;
  nonogramId.value = id;
  nonogramDate.value = date;
  nonogramSize.value = {rows: rows.length, cols: cols.length};
  autoSolveReported.value = false;
  
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
      setNonogramData(data.rowValues, data.colValues, data.resultData, data.id, data.date ?? null, data.grid, data.markedRowClues, data.markedColClues, data.history ?? null, data.historyIndex ?? null);
      return true;
    } catch (e) {
      console.error('Failed to load saved nonogram', e);
    }
  }
  return false;
}

if (!loadSavedState()) {
  const [rows, cols, data, id, date] = loadRandomNonogram();
  setNonogramData(rows, cols, data, id, date);
}

function reload() {
  const [rows, cols, data, id, date] = loadRandomNonogram();
  setNonogramData(rows, cols, data, id, date);
}

function performSave() {
  const data = {
    id: nonogramId.value,
    date: nonogramDate.value,
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

  // Auto-detect solve: fires on the first change that leaves the puzzle solved
  if (!autoSolveReported.value && nonogramComponent.value?.isSolved) {
    autoSolveReported.value = true;
    // Show Браво + mark correct cells (same as clicking "Проверить")
    nonogramComponent.value.check(true, true);
    // Record on backend; if accepted, refresh the finished-count badge
    const result = checkSolution(nonogramId.value, nonogramComponent.value.grid);
    if (result) emit('loaded');
  }
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
  const g = nonogramComponent.value?.grid;
  const hasProgress = g?.some(row => row.some(cell => cell !== 0)) ?? false;
  if (!hasProgress) {
    reload();
    return;
  }
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

