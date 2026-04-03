<template>
  <div class="dialog-overlay" @click.self="$emit('no')">
    <div class="dialog-box">
      <p class="dialog-message">{{ displayMessage }}</p>
      <div class="dialog-actions">
        <button class="dialog-button yes" @click="$emit('yes')">{{ displayYesText }}</button>
        <button v-if="showNo" class="dialog-button no" @click="$emit('no')">{{ displayNoText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const props = defineProps({
  message: {
    type: String,
    default: null
  },
  yesText: {
    type: String,
    default: null
  },
  noText: {
    type: String,
    default: null
  },
  showNo: {
    type: Boolean,
    default: true
  }
});
defineEmits(['yes', 'no']);

const displayMessage = computed(() => props.message || t('dialog.areYouSure'));
const displayYesText = computed(() => props.yesText || t('dialog.yes'));
const displayNoText = computed(() => props.noText || t('dialog.no'));
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
  border: 2px solid transparent;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s;
}

.dialog-button.yes {
  background-color: #2c3e50;
  color: white;
}

.dialog-button.yes:hover {
  background-color: #34495e;
  border-color: white;
}

.dialog-button.no {
  background-color: #2c3e50;
  color: white;
}

.dialog-button.no:hover {
  background-color: #34495e;
  border-color: white;
}
</style>
