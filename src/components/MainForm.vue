<template>
  <AppHeader
    :title="message"
    :can-undo="canUndo"
    :can-redo="canRedo"
    @reload="requestReload"
    @clear="requestClear"
    @check="check"
    @undo="undo"
    @redo="redo"
    @draw-result="drawResult"
  />
  <div class="main-form">
    <Nonogram ref="nonogramComponent" :key="componentKey" :size="nonogramSize" :row-values="rowValues" :col-values="colValues" :solution="resultData"/>
  </div>
  <ConfirmationDialog v-if="showDialog" :message="dialogMessage" @yes="handleConfirm" @no="handleCancel" />
</template>
<style scoped>
.main-form {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 1rem;
  overflow-x: auto;
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
import AppHeader from './AppHeader.vue';
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

function check() {
  nonogramComponent.value?.check(true, true);
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

