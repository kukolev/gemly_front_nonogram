<template>
  <div class="header">
    <h1 class="main-form-title">{{ message }}</h1>
    <button @click="reload()">Загрузить новый</button>
    <button @click="reload()">Проверить</button>
  </div>
  <div class="main-form">
    <Nonogram :key="componentKey" :size="nonogramSize" :row-values="rowValues" :col-values="colValues"/>
  </div>
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
import {ref} from 'vue';
import {loadData, loadRandomNonogram} from '../funcs.js';

const componentKey = ref(0);


let [rowValues, colValues] = loadRandomNonogram();
let nonogramSize = {rows: rowValues.length, cols: colValues.length};

async function reload() {
  componentKey.value += 1;
  [rowValues, colValues] = loadRandomNonogram();
  nonogramSize = {rows: rowValues.length, cols: colValues.length};
}
</script>

