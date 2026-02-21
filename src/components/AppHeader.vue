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
  }
})

defineEmits(['reload', 'clear', 'check', 'undo', 'redo', 'draw-result', 'show-finished'])
</script>

<template>
  <header class="app-header">
    <div class="header-container">
      <h1 class="header-title">{{ title }}</h1>
      <nav class="header-nav">
        <div class="nav-group">
          <button name="nonogram-reload-button" class="nav-btn" @click="$emit('reload')" title="Загрузить новый кроссворд">Загрузить новый</button>
          <button name="nonogram-clear-button" class="nav-btn" @click="$emit('clear')" title="Очистить поле">Очистить</button>
        </div>
        
        <div class="nav-group">
          <button name="nonogram-check-button" class="nav-btn btn-check" @click="$emit('check')" title="Проверить решение">Проверить</button>
        </div>

        <div class="nav-group">
          <button name="nonogram-undo-button" class="nav-btn" @click="$emit('undo')" :disabled="!canUndo" title="Отменить последнее действие">Undo</button>
          <button name="nonogram-redo-button" class="nav-btn" @click="$emit('redo')" :disabled="!canRedo" title="Вернуть отмененное действие">Redo</button>
        </div>

        <div class="nav-group">
          <button name="nonogram-finished-button" class="nav-btn" @click="$emit('show-finished')" title="Список завершенных кроссвордов">Finished nonograms</button>
        </div>

        <div class="nav-group" v-if="isAdmin">
          <button name="nonogram-draw-result-button" class="nav-btn btn-secondary" @click="$emit('draw-result')" title="Показать решение">Draw result</button>
        </div>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.65rem 1rem;
  width: 100%;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  margin-bottom: 1.35rem;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

@media (min-width: 992px) {
  .header-container {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 1.35rem;
  }
}

.header-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #2c4550;
  white-space: nowrap;
}

.header-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  justify-content: center;
}

.nav-group {
  display: flex;
  gap: 0.35rem;
}

.nav-btn {
  padding: 0.35rem 0.85rem;
  border: 1px solid #cbd5e1;
  background-color: #fff;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #334155;
  outline: none;
}

.nav-btn:hover:not(:disabled) {
  background-color: #f8fafc;
  border-color: #94a3b8;
  color: #1e293b;
}

.nav-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: #f1f5f9;
}

.btn-check {
  background-color: #2563eb;
  color: white;
  border-color: #2563eb;
}

.btn-check:hover:not(:disabled) {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
  color: white;
}

.btn-secondary {
  background-color: #64748b;
  color: white;
  border-color: #64748b;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #475569;
  border-color: #475569;
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
