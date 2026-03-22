<template>
  <div class="shopping-page">
    <div class="shopping-header">
      <h2>Список покупок</h2>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка списка...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchItems" class="retry-btn">Повторить</button>
    </div>

    <div v-else class="shopping-content">
      <div v-if="items.length === 0" class="empty-state">
        <p>Список пуст</p>
      </div>

      <div v-else class="items-list">
        <div 
          v-for="item in items" 
          :key="item.id" 
          class="item-card"
          :class="{ 
            'status-done': item.status === 'DONE',
            'status-deleted': item.status === 'DELETED'
          }"
        >
          <div class="item-main">
            <span class="item-number">#{{ item.number }}</span>
            <span class="item-topic">{{ item.topic }}</span>
          </div>
          <div class="item-badge" :class="'badge-' + item.status.toLowerCase()">
            {{ getStatusLabel(item.status) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const items = ref([]);
const loading = ref(true);
const error = ref(null);

const getStatusLabel = (status) => {
  switch (status) {
    case 'REGULAR': return 'Обычный';
    case 'DONE': return 'Готово';
    case 'DELETED': return 'Удалено';
    default: return status;
  }
};

const fetchItems = () => {
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

onMounted(() => {
  fetchItems();
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
}

.shopping-header h2 {
  color: #1e293b;
  margin: 0;
  font-size: 1.5rem;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: transform 0.1s;
}

.item-card:active {
  transform: scale(0.98);
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

.item-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 9999px;
  text-transform: uppercase;
}

.badge-regular {
  background-color: #dbeafe;
  color: #1e40af;
}

.badge-done {
  background-color: #dcfce7;
  color: #166534;
}

.badge-deleted {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-done {
  background-color: #f8fafc;
}

.status-done .item-topic {
  text-decoration: line-through;
  color: #94a3b8;
}

.status-deleted {
  opacity: 0.5;
  background-color: #f1f5f9;
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 40px 0;
  color: #64748b;
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 16px;
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
  .shopping-page {
    padding: 12px;
  }
  
  .item-card {
    padding: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .item-badge {
    align-self: flex-end;
  }

  .item-topic {
    font-size: 1rem;
  }
}
</style>
