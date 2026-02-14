<script setup>
import { ref } from 'vue';

const nonogramId = ref('');
const drawingData = ref(null);
const logs = ref('');

function addLog(buttonName) {
  const now = new Date().toLocaleString();
  const id = nonogramId.value || 'N/A';
  let size = 'N/A';
  if (drawingData.value && drawingData.value.length > 0) {
    size = `${drawingData.value.length}x${drawingData.value[0].length}`;
  }
  logs.value = `${now} - Button: ${buttonName}, ID: ${id}, Size: ${size}\n` + logs.value;
}

async function loadRandom() {
  try {
    const response = await fetch('/api/v1/nonogram/admin.getRandomNonogram');
    const data = await response.json();
    nonogramId.value = data.id;
    drawingData.value = data.data;
    addLog('Load');
  } catch (error) {
    console.error('Error loading random nonogram:', error);
  }
}

async function markNonogram(mark) {
  if (!nonogramId.value) {
    alert('No nonogram loaded');
    return;
  }
  try {
    const response = await fetch('/api/v1/nonogram/admin.markNonogram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: nonogramId.value,
        mark: mark
      }),
    });
    if (response.ok) {
      console.log(`Nonogram ${nonogramId.value} marked as ${mark ? 'Good' : 'Bad'}`);
      addLog(mark ? 'Good' : 'Bad');
      loadRandom();
    } else {
      console.error('Failed to mark nonogram');
    }
  } catch (error) {
    console.error('Error marking nonogram:', error);
  }
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-controls">
      <button @click="loadRandom">Load</button>
      <input type="text" v-model="nonogramId" placeholder="ID for load" />
      <button @click="markNonogram(true)">Good</button>
      <button @click="markNonogram(false)">Bad</button>
    </div>
    <div class="admin-logs">
      <textarea v-model="logs" readonly placeholder="Logs will appear here..."></textarea>
    </div>
    <div class="drawing-area" v-if="drawingData">
      <div class="grid">
        <div v-for="(row, rIdx) in drawingData" :key="rIdx" class="row">
          <div 
            v-for="(cell, cIdx) in row" 
            :key="cIdx" 
            class="cell"
            :class="{ filled: cell === 1 }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  display: flex;
  flex-direction: column;
}

.admin-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ccc;
}

.admin-logs {
  padding: 10px;
  border-bottom: 1px solid #ccc;
}

.admin-logs textarea {
  width: 100%;
  height: 100px;
  font-family: monospace;
  resize: vertical;
}

.drawing-area {
  padding: 20px;
  flex-grow: 1;
}

.grid {
  display: flex;
  flex-direction: column;
  width: fit-content;
}

.row {
  display: flex;
}

.cell {
  width: 15px;
  height: 15px;
}

.cell.filled {
  background-color: #000;
}
</style>
