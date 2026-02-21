<template>
  <div class="finished-nonograms">
    <header class="page-header">
      <div class="header-container">
        <button @click="$emit('back')" class="back-btn" title="Вернуться на главную">
          <span class="back-icon">←</span> Назад
        </button>
        <h1 class="page-title">Завершенные кроссворды</h1>
      </div>
    </header>

    <main class="content">
      <div v-if="loading" class="status-message">
        <div class="loader"></div>
        <p>Загрузка...</p>
      </div>
      
      <div v-else-if="error" class="status-message error">
        <p>{{ error }}</p>
        <button @click="fetchList" class="retry-btn">Попробовать снова</button>
      </div>
      
      <div v-else-if="list.length === 0" class="status-message empty">
        <p>У вас пока нет завершенных кроссвордов.</p>
        <button @click="$emit('back')" class="start-btn">Начать игру</button>
      </div>
      
      <div v-else class="nonograms-grid">
        <div v-for="item in list" :key="item.nonogram.id" class="nonogram-card">
          <div class="nonogram-preview">
            <canvas 
              :ref="el => setCanvasRef(el, item.nonogram.id)"
              :width="calculateCanvasSize(item.nonogram.data).width"
              :height="calculateCanvasSize(item.nonogram.data).height"
            ></canvas>
          </div>
          <div class="nonogram-info">
            <p class="finish-date">{{ formatDate(item.updatedAt) }}</p>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <p>Copyright &copy; 2026 rubyruby.games</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';

const emit = defineEmits(['back']);

const list = ref([]);
const loading = ref(true);
const error = ref(null);
const canvasRefs = {};

const setCanvasRef = (el, id) => {
  if (el) {
    canvasRefs[id] = el;
  } else {
    delete canvasRefs[id];
  }
};

const CELL_SIZE = 6;

const calculateCanvasSize = (data) => {
  const rows = data.length || 0;
  const cols = data[0]?.length || 0;
  return { 
    width: cols * CELL_SIZE, 
    height: rows * CELL_SIZE 
  };
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const drawNonogram = (canvas, data) => {
  if (!canvas || !data || !data.length) return;
  const ctx = canvas.getContext('2d');
  const rows = data.length;
  const cols = data[0]?.length || 0;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1e293b';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (data[r][c] === 1) {
        ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }
};

const fetchList = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch('/api/v1/nonogram.getFinishedList');
    if (!response.ok) {
      throw new Error('Не удалось загрузить список завершенных кроссвордов');
    }
    const data = await response.json();
    list.value = data.list || [];
    loading.value = false;
    
    await nextTick();
    list.value.forEach(item => {
      const canvas = canvasRefs[item.nonogram.id];
      if (canvas) {
        drawNonogram(canvas, item.nonogram.data);
      }
    });
  } catch (e) {
    console.error('Error fetching finished nonograms:', e);
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchList();
});
</script>

<style scoped>
.finished-nonograms {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  font-family: 'Inter', sans-serif;
  color: #2c4550;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1rem;
}

.header-container {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 600;
  color: #475569;
  transition: all 0.2s;
}

.back-btn:hover {
  background-color: #f8fafc;
  border-color: #94a3b8;
  color: #1e293b;
}

.content {
  flex: 1;
}

.status-message {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.status-message p {
  font-size: 1.125rem;
  color: #64748b;
  margin-bottom: 1.5rem;
}

.nonograms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
}

.nonogram-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.nonogram-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.nonogram-preview {
  background-color: #f8fafc;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  width: 100%;
  border: 1px solid #f1f5f9;
}

canvas {
  max-width: 100%;
  image-rendering: pixelated;
}

.nonogram-info {
  text-align: center;
}

.finish-date {
  font-size: 0.815rem;
  color: #94a3b8;
  margin: 0;
  font-weight: 500;
}

.retry-btn, .start-btn {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover, .start-btn:hover {
  background-color: #1d4ed8;
}

.loader {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2563eb;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.footer {
  margin-top: 4rem;
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
  color: #94a3b8;
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .page-title {
    font-size: 1.5rem;
  }
  
  .nonograms-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
  }
  
  .header-container {
    gap: 1rem;
  }
}
</style>
