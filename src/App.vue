<script setup>
import { ref } from 'vue';
import MainForm from "@/components/MainForm.vue";
import LandingPage from "@/components/LandingPage.vue";
import Admin from "@/components/Admin.vue";

const currentPage = ref('landing');
const isAdmin = window.location.pathname.includes('/admin');

function showMainForm() {
  currentPage.value = 'main';
}
</script>

<template>
  <Admin v-if="isAdmin" />
  <template v-else>
    <MainForm v-if="currentPage === 'main'" message="Японский кроссворд" />
    <LandingPage v-else @start="showMainForm" />
  </template>
</template>

<style scoped>
</style>
