<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

defineProps({
  title: {
    type: String,
    required: true
  },
  canUndo: {
    type: Boolean,
    default: false
  },
  canRedo: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  checkError: {
    type: Boolean,
    default: false
  },
  showPlusOne: {
    type: Boolean,
    default: false
  },
  showButtons: {
    type: Boolean,
    default: false
  },
  finishedCount: {
    type: Number,
    default: 0
  },
  touchMarkMode: {
    type: Boolean,
    default: false
  },
  showBackButton: {
    type: Boolean,
    default: false
  }
})

defineEmits(['reload', 'clear', 'check', 'undo', 'redo', 'draw-result', 'show-finished', 'go-landing', 'show-about', 'toggle-touch-mode', 'show-answer', 'back'])

const moreMenuOpen = ref(false);
const moreMenuRef = ref(null);

const closeMoreMenu = (e) => {
  if (moreMenuRef.value && !moreMenuRef.value.contains(e.target)) {
    moreMenuOpen.value = false;
  }
};

onMounted(() => document.addEventListener('click', closeMoreMenu));
onUnmounted(() => document.removeEventListener('click', closeMoreMenu));
</script>

<template>
  <header class="app-header">
    <div class="header-container">
      <div class="header-brand">
        <div class="header-title-group">
          <h1 class="header-title" @click="$emit('go-landing')">{{ title }}</h1>
          <button v-if="showBackButton" class="nav-btn back-nav-btn" @click="$emit('back')" title="Назад к кроссворду">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span>Назад к кроссворду</span>
          </button>
          <nav class="header-nav" v-if="showButtons">

            <!-- Undo / Redo -->
            <div class="nav-group">
              <button name="nonogram-undo-button" class="nav-btn" @click="$emit('undo')" :disabled="!canUndo" title="Отменить последнее действие">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
                </svg>
              </button>
              <button name="nonogram-redo-button" class="nav-btn" @click="$emit('redo')" :disabled="!canRedo" title="Вернуть отмененное действие">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>
                </svg>
              </button>
            </div>

            <!-- New crossword + Clear (Clear hidden on mobile → moves to dropdown) -->
            <div class="nav-group">
              <button name="nonogram-reload-button" class="nav-btn" @click="$emit('reload')" title="Загрузить новый кроссворд">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span class="btn-label">Новый кроссворд</span>
              </button>
              <button name="nonogram-clear-button" class="nav-btn mobile-hide" @click="$emit('clear')" title="Очистить поле">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                </svg>
                <span class="btn-label">Очистить</span>
              </button>
            </div>

            <!-- Check -->
            <div class="nav-group">
              <button name="nonogram-check-button" class="nav-btn btn-check" :class="{'btn-check-error': checkError}" @click="$emit('check')" title="Проверить решение">
                <svg v-if="!checkError" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                <span class="btn-label">{{ checkError ? 'Есть ошибки...' : 'Проверить' }}</span>
              </button>
            </div>

            <!-- Touch mode (hidden on pointer devices) -->
            <div class="nav-group touch-mode-group">
              <button name="nonogram-touch-mode-button" class="nav-btn" :class="{'btn-active': touchMarkMode}" @click="$emit('toggle-touch-mode')" :title="touchMarkMode ? 'Режим касания: пометить (нажать для переключения)' : 'Режим касания: закрасить (нажать для переключения)'">
                <svg v-if="!touchMarkMode" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="4" y="4" width="16" height="16" fill="currentColor" stroke="currentColor"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="4" y="4" width="16" height="16"/>
                  <line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>
                </svg>
                <span class="btn-label">{{ touchMarkMode ? 'Пометить' : 'Закрасить' }}</span>
              </button>
            </div>

            <!-- "..." dropdown (mobile-only) -->
            <div class="nav-group more-menu-group mobile-only" ref="moreMenuRef">
              <button class="nav-btn" :class="{'btn-active': moreMenuOpen}" @click.stop="moreMenuOpen = !moreMenuOpen" title="Ещё">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                </svg>
              </button>
              <div v-if="moreMenuOpen" class="more-dropdown">
                <button class="dropdown-item" @click="moreMenuOpen = false; $emit('clear')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                  </svg>
                  Очистить
                </button>
                <button class="dropdown-item" @click="moreMenuOpen = false; $emit('show-answer')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M2 12C4.4 7 8 4 12 4s7.6 3 10 8c-2.4 5-6 8-10 8S4.4 17 2 12z"/>
                  </svg>
                  Ответ
                </button>
                <button class="dropdown-item" @click="moreMenuOpen = false; $emit('show-finished')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                  Завершённые
                  <span class="dropdown-count">({{ finishedCount }})</span>
                  <span v-if="showPlusOne" class="dropdown-plus-one">+1</span>
                </button>
                <button class="dropdown-item" @click="moreMenuOpen = false; $emit('show-about')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  О проекте
                </button>
                <button v-if="isAdmin" class="dropdown-item" @click="moreMenuOpen = false; $emit('draw-result')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Решение
                </button>
              </div>
            </div>

            <!-- Answer (desktop) -->
            <div class="nav-group mobile-hide">
              <button name="nonogram-answer-button" class="nav-btn" @click="$emit('show-answer')" title="Показать ответ">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M2 12C4.4 7 8 4 12 4s7.6 3 10 8c-2.4 5-6 8-10 8S4.4 17 2 12z"/>
                </svg>
                <span class="btn-label">Ответ</span>
              </button>
            </div>

            <!-- Finished (desktop) -->
            <div class="nav-group finished-nav-group mobile-hide">
              <button name="nonogram-finished-button" class="nav-btn" @click="$emit('show-finished')" title="Список завершенных кроссвордов">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                <span class="btn-label">Завершённые</span>
                <span class="finished-count">({{ finishedCount }})</span>
              </button>
              <div v-if="showPlusOne" class="plus-one-tooltip">+1</div>
            </div>

            <!-- About (desktop) -->
            <div class="nav-group mobile-hide">
              <button name="nonogram-about-button" class="nav-btn" @click="$emit('show-about')" title="О проекте">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span class="btn-label">О проекте</span>
              </button>
            </div>

            <!-- Draw result - admin (desktop) -->
            <div class="nav-group mobile-hide" v-if="isAdmin">
              <button name="nonogram-draw-result-button" class="nav-btn btn-secondary" @click="$emit('draw-result')" title="Показать решение">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span class="btn-label">Решение</span>
              </button>
            </div>

          </nav>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background-color: #2c3e50;
  border-bottom: 1px solid #1a252f;
  padding: 0.65rem 1rem;
  width: 100%;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  margin-bottom: 1.35rem;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
}

.header-brand {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem 1.25rem;
}

.header-title-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
}

@media (min-width: 992px) {
  .header-brand {
    align-items: center;
  }

  .header-title-group {
    flex-direction: row;
    align-items: center;
    gap: 2rem;
  }
}

.header-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  line-height: 1.2;
  cursor: pointer;
}

.header-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-start;
}

.nav-group {
  display: flex;
  gap: 0.25rem;
}

.finished-nav-group {
  position: relative;
}

.plus-one-tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ff4081;
  color: white;
  padding: 0.1rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  margin-top: 0.25rem;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  pointer-events: none;
  animation: fadeInDown 0.3s ease-out;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translate(-50%, -5px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  15%       { transform: translateX(-5px); }
  35%       { transform: translateX(5px); }
  55%       { transform: translateX(-4px); }
  75%       { transform: translateX(4px); }
  90%       { transform: translateX(-2px); }
}

.btn-check-error {
  background-color: #922b21 !important;
  border-color: #c0392b !important;
  color: white !important;
  animation: shake 0.45s ease-in-out;
}

/* ── Base button ── */
.nav-btn {
  padding: 0.35rem 0.85rem;
  border: 1px solid transparent;
  background-color: #2c3e50;
  border-radius: 0;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #ffffff;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  white-space: nowrap;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.nav-btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.nav-btn:hover:not(:disabled) {
  background-color: #34495e;
  border-color: #ffffff;
  color: #ffffff;
}

.nav-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: #2c3e50;
}

.btn-active {
  background-color: #34495e;
  border-color: #ffffff;
}

.btn-check {
  background-color: #2c3e50;
  color: white;
  border-color: transparent;
}

.btn-check:hover:not(:disabled) {
  background-color: #34495e;
  border-color: white;
  color: white;
}

.finished-count {
  font-size: 0.75rem;
  font-weight: 700;
}

.btn-secondary {
  background-color: #2c3e50;
  color: white;
  border-color: transparent;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #34495e;
  border-color: white;
  color: white;
}

/* ── Back button (always shows label, never icon-only) ── */
.back-nav-btn span {
  display: inline;
}

/* ── Hide touch-mode toggle on pointer devices (mouse/trackpad) ── */
@media (hover: hover) and (pointer: fine) {
  .touch-mode-group {
    display: none;
  }
}

/* ── Desktop: hide mobile-only elements ── */
@media (min-width: 641px) {
  .mobile-only {
    display: none;
  }
}

/* ── Mobile: icon-only, hide desktop-only elements ── */
@media (max-width: 640px) {
  .mobile-hide {
    display: none !important;
  }

  .btn-label {
    display: none;
  }

  .nav-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0.6rem;
  }

  .nav-btn svg {
    width: 18px;
    height: 18px;
  }
}

/* ── "..." dropdown ── */
.more-menu-group {
  position: relative;
}

.more-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 300;
  background-color: #2c3e50;
  border: 1px solid #4a6278;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  min-width: 210px;
  display: flex;
  flex-direction: column;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.85rem 1rem;
  background: none;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 0.15s ease;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.85;
}

.dropdown-item:active {
  background-color: #3d5a73;
}

.dropdown-count {
  font-weight: 700;
  margin-left: 0.15rem;
}

.dropdown-plus-one {
  margin-left: auto;
  background-color: #ff4081;
  color: white;
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  animation: fadeInDown 0.3s ease-out;
}
</style>
