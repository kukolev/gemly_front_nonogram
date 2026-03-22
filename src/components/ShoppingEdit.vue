<template>
  <div class="edit-overlay" @click.self="$emit('cancel')">
    <div class="edit-dialog">
      <h3>{{ item.id ? 'Редактировать' : 'Добавить товар' }}</h3>
      <div class="edit-content">
        <input 
          v-model="localTopic" 
          type="text" 
          class="edit-input" 
          placeholder="Название товара"
          @keyup.enter="handleSave"
          ref="inputRef"
        />
      </div>
      <div class="edit-footer">
        <button class="edit-btn save" @click="handleSave">Принять</button>
        <button class="edit-btn cancel" @click="$emit('cancel')">Отмена</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['save', 'cancel']);

const localTopic = ref('');
const inputRef = ref(null);

onMounted(() => {
  localTopic.value = props.item.topic || '';
  nextTick(() => {
    inputRef.value?.focus();
  });
});

const handleSave = () => {
  if (localTopic.value.trim()) {
    emit('save', { ...props.item, topic: localTopic.value.trim() });
  }
};
</script>

<style scoped>
.edit-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.edit-dialog {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.edit-dialog h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #1e293b;
  font-size: 1.25rem;
}

.edit-content {
  margin-bottom: 24px;
}

.edit-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  box-sizing: border-box;
}

.edit-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.edit-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.edit-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.edit-btn.save {
  background-color: #3b82f6;
  color: white;
}

.edit-btn.save:hover {
  background-color: #2563eb;
}

.edit-btn.cancel {
  background-color: #f1f5f9;
  color: #475569;
}

.edit-btn.cancel:hover {
  background-color: #e2e8f0;
}
</style>
