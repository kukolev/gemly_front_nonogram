<template>
  <div class="dialog-overlay" @click.self="$emit('no')">
    <div class="dialog-box">
      <p class="dialog-message">Loading will erase your progress. Are you sure?</p>
      <div class="dialog-actions">
        <button class="dialog-button yes" @click="$emit('yes')">Yes</button>
        <button class="dialog-button no" @click="$emit('no')">No</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['yes', 'no']);
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-box {
  background-color: white;
  padding: 20px 40px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.dialog-message {
  font-size: 1.2rem;
  margin-bottom: 20px;
  color: #333;
}

.dialog-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.dialog-button {
  padding: 10px 20px;
  font-size: 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dialog-button.yes {
  background-color: #4caf50;
  color: white;
}

.dialog-button.yes:hover {
  background-color: #45a049;
}

.dialog-button.no {
  background-color: #f44336;
  color: white;
}

.dialog-button.no:hover {
  background-color: #da190b;
}
</style>
