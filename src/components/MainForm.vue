<template>
  <div class="header">
    <h1 class="main-form-title">{{ message }}</h1>
    <button name="nonogram-reload-button" @click="requestReload()">Загрузить новый</button>
    <button name="nonogram-clear-button" @click="requestClear()">Очистить</button>
    <button name="nonogram-check-button" @click="reload()">Проверить</button>
    <button name="nonogram-undo-button" @click="undo()" :disabled="!canUndo">Undo</button>
    <button name="nonogram-redo-button" @click="redo()" :disabled="!canRedo">Redo</button>
    <button name="nonogram-draw-result-button" @click="drawResult()">Draw result</button>
  </div>
  <div class="main-form">
    <Nonogram ref="nonogramComponent" :key="componentKey" :size="nonogramSize" :row-values="rowValues" :col-values="colValues"/>
  </div>
  <ConfirmationDialog v-if="showDialog" :message="dialogMessage" @yes="handleConfirm" @no="handleCancel" />
</template>
<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
}
</style>

<script setup>

defineProps({
  message: {
    type: String,
    required: true,
  },
})

import Nonogram from './Nonogram.vue';
import ConfirmationDialog from './ConfirmationDialog.vue';
import {ref, computed} from 'vue';
import {loadData, loadRandomNonogram} from '../funcs.js';

const componentKey = ref(0);
const nonogramComponent = ref(null);

const canUndo = computed(() => nonogramComponent.value?.canUndo);
const canRedo = computed(() => nonogramComponent.value?.canRedo);
const showDialog = ref(false);
const dialogMessage = ref('');
const pendingAction = ref(null);

let [rowValues, colValues, resultData] = loadRandomNonogram();
let nonogramSize = {rows: rowValues.length, cols: colValues.length};

async function reload() {
  componentKey.value += 1;
  [rowValues, colValues, resultData] = loadRandomNonogram();
  nonogramSize = {rows: rowValues.length, cols: colValues.length};
}

function requestReload() {
  dialogMessage.value = 'Loading will erase your progress. Are you sure?';
  pendingAction.value = 'reload';
  showDialog.value = true;
}

function requestClear() {
  dialogMessage.value = 'Ваш прогресс по данному кроссворду будет потерян, вы точно уверены?';
  pendingAction.value = 'clear';
  showDialog.value = true;
}

function handleConfirm() {
  showDialog.value = false;
  if (pendingAction.value === 'reload') {
    reload();
  } else if (pendingAction.value === 'clear') {
    clear();
  }
}

function handleCancel() {
  showDialog.value = false;
  pendingAction.value = null;
}

function undo() {
  nonogramComponent.value?.undo();
}

function redo() {
  nonogramComponent.value?.redo();
}

function drawResult() {
  nonogramComponent.value?.drawResult(resultData);
}

function clear() {
  nonogramComponent.value?.clear();
}
</script>

