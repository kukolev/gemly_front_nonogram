<script setup>
import { ref } from 'vue';
import MainForm from "@/components/MainForm.vue";
import LandingPage from "@/components/LandingPage.vue";

const currentPage = ref('landing');

function showMainForm() {
  currentPage.value = 'main';
}
</script>

<template>
  <MainForm v-if="currentPage === 'main'" message="Японский кроссворд" />
  <LandingPage v-else @start="showMainForm" />
</template>

<style scoped>
</style>
