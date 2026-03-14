<script setup>
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
  showButtons: {
    type: Boolean,
    default: false
  },
  finishedCount: {
    type: Number,
    default: 0
  }
})

defineEmits(['reload', 'clear', 'check', 'undo', 'redo', 'draw-result', 'show-finished', 'go-landing', 'show-about'])
</script>

<template>
  <header class="app-header">
    <div class="header-container">
      <div class="header-brand">
        <div class="header-title-group">
          <h1 class="header-title" @click="$emit('go-landing')">{{ title }}</h1>
          <nav class="header-nav" v-if="showButtons">
            <div class="nav-group">
              <button name="nonogram-undo-button" class="nav-btn" @click="$emit('undo')" :disabled="!canUndo" title="Отменить последнее действие">←</button>
              <button name="nonogram-redo-button" class="nav-btn" @click="$emit('redo')" :disabled="!canRedo" title="Вернуть отмененное действие">→</button>
            </div>

            <div class="nav-group">
              <button name="nonogram-reload-button" class="nav-btn" @click="$emit('reload')" title="Загрузить новый кроссворд">Новый кроссворд</button>
              <button name="nonogram-clear-button" class="nav-btn" @click="$emit('clear')" title="Очистить поле">Очистить</button>
            </div>
            
            <div class="nav-group">
              <button name="nonogram-check-button" class="nav-btn btn-check" :class="{'btn-check-error': checkError}" @click="$emit('check')" title="Проверить решение">{{ checkError ? 'Есть ошибки...' : 'Проверить' }}</button>
            </div>


            <div class="nav-group">
              <button name="nonogram-finished-button" class="nav-btn" @click="$emit('show-finished')" title="Список завершенных кроссвордов">Завершенные кроссворды ({{ finishedCount }})</button>
            </div>

            <div class="nav-group">
              <button name="nonogram-about-button" class="nav-btn" @click="$emit('show-about')" title="О проекте">О проекте</button>
            </div>

            <div class="nav-group" v-if="isAdmin">
              <button name="nonogram-draw-result-button" class="nav-btn btn-secondary" @click="$emit('draw-result')" title="Показать решение">Draw result</button>
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
  gap: 0.65rem;
  justify-content: flex-start;
}

.nav-group {
  display: flex;
  gap: 0.35rem;
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

@media (max-width: 640px) {
  .header-nav {
    flex-direction: column;
    width: 100%;
  }
  
  .nav-group {
    width: 100%;
  }
  
  .nav-btn {
    flex: 1;
    text-align: center;
  }
}
</style>
