<template>
  <div class="shopping-page">
    <div class="shopping-header">
      <div class="header-left">
        <h2>Список покупок</h2>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка списка...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="getList" class="retry-btn">Повторить</button>
    </div>

    <div v-else class="shopping-content">
      <div v-if="items.length === 0" class="empty-state">
        <p>Список пуст</p>
      </div>

      <div v-else class="items-list">
        <div 
          v-for="item in items" 
          :key="item.id" 
          class="item-row"
        >
          <div class="item-left">
            <input 
              type="checkbox" 
              class="item-checkbox" 
              :checked="item.status === 'DONE'"
              @change="handleCheckboxChange($event, item)"
            />
            <div class="item-main">
              <span class="item-number">#{{ item.number }}</span>
              <span class="item-topic" :class="{ 'done': item.status === 'DONE' }">{{ item.topic }}</span>
            </div>
          </div>
          <div class="item-actions">
            <button class="action-btn edit-btn" title="Edit" @click="handleEdit(item)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="action-icon">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button 
              class="action-btn delete-btn" 
              title="Delete (hold 2s)"
              @mousedown="startDeletePress(item)"
              @mouseup="cancelDeletePress(item)"
              @mouseleave="cancelDeletePress(item)"
              @touchstart.passive="startDeletePress(item)"
              @touchend="cancelDeletePress(item)"
              @touchcancel="cancelDeletePress(item)"
              :style="getDeleteButtonStyle(item.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="action-icon">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div class="add-btn-wrapper">
        <button class="add-btn" @click="handleAdd">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="add-icon">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Добавить</span>
        </button>
      </div>
    </div>

    <ShoppingEdit 
      v-if="isEditDialogOpen" 
      :item="editingItem" 
      @save="handleSaveEdit" 
      @cancel="isEditDialogOpen = false" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ShoppingEdit from './ShoppingEdit.vue';

const emit = defineEmits(['back']);

const items = ref([]);
const loading = ref(true);
const error = ref(null);
const editingItem = ref(null);
const isEditDialogOpen = ref(false);

const pressTimers = ref({});
const pressProgress = ref({});

const startDeletePress = (item) => {
  if (pressTimers.value[item.id]) return;
  
  const startTime = Date.now();
  const duration = 500;
  
  pressProgress.value[item.id] = 0;
  
  const interval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    pressProgress.value[item.id] = Math.min((elapsed / duration) * 100, 100);
    
    if (elapsed >= duration) {
      clearInterval(interval);
      saveItem(item, 'DELETED');
      delete pressTimers.value[item.id];
      delete pressProgress.value[item.id];
    }
  }, 50);
  
  pressTimers.value[item.id] = interval;
};

const cancelDeletePress = (item) => {
  if (pressTimers.value[item.id]) {
    clearInterval(pressTimers.value[item.id]);
    delete pressTimers.value[item.id];
    delete pressProgress.value[item.id];
  }
};

const getDeleteButtonStyle = (id) => {
  const progress = pressProgress.value[id];
  if (progress === undefined) return {};
  
  return {
    background: `linear-gradient(to top, rgba(220, 38, 38, 0.2) ${progress}%, transparent ${progress}%)`,
    color: progress > 50 ? '#dc2626' : '#64748b',
    border: '1px solid rgba(220, 38, 38, 0.3)',
    transition: 'none'
  };
};

const getList = () => {
  loading.value = true;
  error.value = null;
  try {
    const protocol = import.meta.env.ENV_SERVER_PROTOCOL || window.location.protocol.replace(':', '');
    const address = import.meta.env.ENV_SERVER_ADDRESS || window.location.host;
    
    const request = new XMLHttpRequest();
    // Use the provided GET api/v1/shopping.getList
    request.open("GET", `${protocol}://${address}/api/v1/shopping.getList`, false);
    request.withCredentials = true;
    request.send(null);

    if (request.status === 200) {
      const data = JSON.parse(request.responseText);
      // ItemsList has 'items' field
      items.value = data.items || [];
    } else if (request.status === 403) {
      error.value = 'Доступ запрещен (только для администраторов)';
    } else {
      error.value = 'Не удалось загрузить список (ошибка ' + request.status + ')';
    }
  } catch (err) {
    error.value = 'Ошибка при подключении к серверу';
    console.error('Fetch error:', err);
  } finally {
    loading.value = false;
  }
};

const saveItem = (item, status = null) => {
  try {
    const protocol = import.meta.env.ENV_SERVER_PROTOCOL || window.location.protocol.replace(':', '');
    const address = import.meta.env.ENV_SERVER_ADDRESS || window.location.host;
    
    const request = new XMLHttpRequest();
    // Use the provided POST api/v1/shopping.saveItem
    request.open("POST", `${protocol}://${address}/api/v1/shopping.saveItem`, false);
    request.withCredentials = true;
    request.setRequestHeader('Content-Type', 'application/json');
    
    const payload = {
      ...item,
      status: status !== null ? status : item.status
    };
    
    request.send(JSON.stringify(payload));

    if (request.status === 200) {
      getList();
    } else {
      console.error('Save failed:', request.status);
    }
  } catch (err) {
    console.error('Save error:', err);
  }
};

const handleCheckboxChange = (event, item) => {
  const newStatus = event.target.checked ? 'DONE' : 'REGULAR';
  saveItem(item, newStatus);
};

const handleEdit = (item) => {
  editingItem.value = { ...item };
  isEditDialogOpen.value = true;
};

const handleAdd = () => {
  editingItem.value = { topic: '', status: 'REGULAR', number: items.value.length + 1 };
  isEditDialogOpen.value = true;
};

const handleSaveEdit = (updatedItem) => {
  saveItem(updatedItem);
  isEditDialogOpen.value = false;
  editingItem.value = null;
};

onMounted(() => {
  getList();
});
</script>

<style scoped>
.shopping-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
}

.shopping-header {
  margin-bottom: 24px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 5px 12px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background-color: #e2e8f0;
  color: #1e293b;
}

.back-icon {
  width: 18px;
  height: 18px;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 5px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-btn:hover {
  background-color: #2563eb;
}

.add-icon {
  width: 18px;
  height: 18px;
}

.add-btn-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.shopping-header h2 {
  color: #1e293b;
  margin: 0;
  font-size: 1.1rem;
  font-weight: bold;
}

.items-list {
  display: flex;
  flex-direction: column;
}

.item-row {
  background: transparent;
  border-bottom: 1px solid #e2e8f0;
  padding: 7px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.item-row:last-child {
  border-bottom: none;
}

.item-row:hover {
  background-color: #f8fafc;
}

.item-row:active {
  background-color: #f1f5f9;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.item-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-number {
  color: #64748b;
  font-weight: 600;
  font-size: 0.9rem;
  min-width: 40px;
}

.item-topic {
  color: #1e293b;
  font-weight: 500;
  font-size: 1.1rem;
}

.item-topic.done {
  text-decoration: line-through;
  color: #94a3b8;
}

.item-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  background: none;
  border: none;
  padding: 5px;
  cursor: pointer;
  border-radius: 6px;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
}

.action-btn:hover {
  background-color: #f1f5f9;
}

.edit-btn:hover {
  color: #2563eb;
}

.delete-btn:hover {
  color: #dc2626;
}

.delete-btn:active {
  transform: scale(0.95);
}

.action-icon {
  width: 20px;
  height: 20px;
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 40px 0;
  color: #64748b;
}

.retry-btn {
  margin-top: 16px;
  padding: 5px 16px;
  background-color: #1e293b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1e293b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .shopping-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .add-btn {
    width: 100%;
    justify-content: center;
  }

  .shopping-page {
    padding: 12px;
  }
  
  .item-row {
    padding: 4px 4px;
    gap: 8px;
  }

  .item-left {
    gap: 12px;
  }

  .item-topic {
    font-size: 1rem;
  }
  
  .item-number {
    min-width: 30px;
  }
}
</style>
