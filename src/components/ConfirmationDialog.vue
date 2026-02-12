<template>
  <div class="dialog-overlay" @click.self="$emit('no')">
    <div class="dialog-box">
      <p class="dialog-message">{{ message }}</p>
      <div class="dialog-actions">
        <button class="dialog-button yes" @click="$emit('yes')">{{ yesText }}</button>
        <button v-if="showNo" class="dialog-button no" @click="$emit('no')">{{ noText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: 'Are you sure?'
  },
  yesText: {
    type: String,
    default: 'Yes'
  },
  noText: {
    type: String,
    default: 'No'
  },
  showNo: {
    type: Boolean,
    default: true
  }
});
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
