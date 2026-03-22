<script setup>
import { ref } from 'vue';

defineProps({
  showPlusOne:   { type: Boolean, default: false },
  showButtons:   { type: Boolean, default: false },
  finishedCount: { type: Number,  default: 0 },
  touchMarkMode: { type: Boolean, default: false },
  showBackButton:{ type: Boolean, default: false },
})

defineEmits(['reload', 'show-finished', 'go-landing', 'show-about', 'show-contacts', 'toggle-touch-mode', 'back'])

const mobileOpen = ref(false);
const toggleMobile = () => { mobileOpen.value = !mobileOpen.value; };
const closeMobile  = () => { mobileOpen.value = false; };
</script>

<template>
  <!-- Hamburger (mobile only) -->
  <button class="hamburger-btn" @click="toggleMobile" aria-label="Меню">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round">
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  </button>

  <!-- Backdrop (mobile only) -->
  <transition name="backdrop-fade">
    <div v-if="mobileOpen" class="sidebar-backdrop" @click="closeMobile"></div>
  </transition>

  <aside class="app-sidebar" :class="{'sidebar-open': mobileOpen}" @click.stop>

    <!-- Title -->
    <div class="sidebar-title" @click="$emit('go-landing')">
      <img src="/logo.png" alt="logo" class="sidebar-logo" />
      Японские кроссворды
    </div>

    <!-- Back button (finished / about pages) -->
    <button v-if="showBackButton" class="side-btn back-btn" @click="$emit('back')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
           stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      <span class="btn-label">Назад к кроссворду</span>
    </button>

    <!-- Main nav (only on the puzzle page) -->
    <nav v-if="showButtons" class="sidebar-nav">

      <!-- New crossword -->
      <button name="nonogram-reload-button" class="side-btn" @click="$emit('reload')"
              title="Загрузить новый кроссворд">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span class="btn-label">Новый кроссворд</span>
      </button>

      <!-- Touch mode (touch devices only) -->
      <button name="nonogram-touch-mode-button" class="side-btn touch-mode-btn"
              :class="{'btn-active': touchMarkMode}"
              @click="$emit('toggle-touch-mode')"
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
        <span class="btn-label">{{ touchMarkMode ? 'Пометить' : 'Закрасить' }}</span>
      </button>

      <!-- Separator -->
      <div class="sidebar-sep"></div>

      <!-- Finished -->
      <button name="nonogram-finished-button" class="side-btn finished-btn"
              @click="$emit('show-finished')" title="Список завершенных кроссвордов">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <span class="btn-label">
          Завершённые
          <span class="finished-count">({{ finishedCount }})</span>
        </span>
        <span v-if="showPlusOne" class="plus-one">+1</span>
      </button>

      <!-- About -->
      <button name="nonogram-about-button" class="side-btn" @click="$emit('show-about')"
              title="О проекте">
        <span class="about-icon">?</span>
        <span class="btn-label">О проекте</span>
      </button>

      <!-- Contacts -->
      <button name="nonogram-contacts-button" class="side-btn" @click="$emit('show-contacts')"
              title="Обратная связь">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        <span class="btn-label">Обратная связь</span>
      </button>

      <!-- Draw result (admin only) - placeholder kept for potential future use -->
      <button v-if="false" name="nonogram-draw-result-button" class="side-btn"
              title="Показать решение">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span class="btn-label">Решение</span>
      </button>

    </nav>
  </aside>
</template>

<style scoped>
/* ── Sidebar shell ── */
.app-sidebar {
  width: 250px;
  background-color: #f0f0f0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border-right: 1px solid #d0d0d0;
  position: fixed;
  top: 0;
  left: 0;
  height: 100dvh;
  overflow-y: auto;
  box-shadow: 2px 0 6px rgba(0,0,0,0.10);
  z-index: 100;
}

/* ── Title ── */
.sidebar-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #222;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
  height: 50px;
  padding: 0 1rem;
  cursor: pointer;
  background-color: #f0f0f0;
  border-bottom: 1px solid #d0d0d0;
  user-select: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.sidebar-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}

.sidebar-title:hover {
  color: #4e83a6;
}

/* ── Nav ── */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0;
  flex: 1;
}

/* ── Buttons ── */
.side-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.65rem 1rem;
  border: none;
  border-left: 3px solid transparent;
  background: none;
  color: #000;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
}

.side-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.about-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
}

.side-btn:hover:not(:disabled) {
  background-color: #dce3e8;
  border-left-color: #4e83a6;
  color: #3a6a8a;
}

.side-btn:active:not(:disabled) {
  background-color: #c8d3da;
}

.side-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-active {
  background-color: #dce3e8;
  border-left-color: #4e83a6;
  color: #3a6a8a;
}

/* ── Check error state ── */
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
  border-left-color: #c0392b !important;
  color: white !important;
  animation: shake 0.45s ease-in-out;
}

/* ── Separator ── */
.sidebar-sep {
  height: 1px;
  background: #c8c8c8;
  margin: 0.4rem 0;
}

/* ── Finished badge ── */
.finished-btn {
  position: relative;
}

.finished-count {
  font-weight: 700;
}

.plus-one {
  margin-left: auto;
  background-color: #ff4081;
  color: white;
  padding: 0.05rem 0.35rem;
  border-radius: 0.2rem;
  font-size: 0.7rem;
  font-weight: 700;
  animation: fadeInDown 0.3s ease-out;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Back button accent ── */
.back-btn {
  border-bottom: 1px solid #c8c8c8;
  margin-bottom: 0.25rem;
  color: #4e83a6;
}

/* ── Touch-mode: hide on pointer devices ── */
@media (hover: hover) and (pointer: fine) {
  .touch-mode-btn {
    display: none;
  }
}

/* ── Hamburger button (mobile only) ── */
.hamburger-btn {
  display: none;
}

@media (max-width: 640px) {
  /* Hamburger */
  .hamburger-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    width: 48px;
    height: 50px;
    background: #f0f0f0;
    border: none;
    border-right: 1px solid #d0d0d0;
    border-bottom: 1px solid #d0d0d0;
    color: #2c3e50;
    cursor: pointer;
    z-index: 201;
    padding: 0;
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
  }

  .hamburger-btn svg {
    width: 20px;
    height: 20px;
  }

  /* Backdrop */
  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 199;
  }

  .backdrop-fade-enter-active,
  .backdrop-fade-leave-active { transition: opacity 0.22s ease; }
  .backdrop-fade-enter-from,
  .backdrop-fade-leave-to     { opacity: 0; }

  /* Sidebar: hidden off-screen, slides in */
  .app-sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    z-index: 200;
    width: 250px;
  }

  .app-sidebar.sidebar-open {
    transform: translateX(0);
  }
}
</style>
