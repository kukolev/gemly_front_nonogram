<script setup>
import { ref, onMounted } from 'vue';
import MainForm from "@/components/MainForm.vue";
import LandingPage from "@/components/LandingPage.vue";
import Admin from "@/components/Admin.vue";

const currentPage = ref('landing');
const isAdmin = ref(false);
const isLoading = ref(true);
const accessDenied = ref(false);

onMounted(async () => {
  if (window.location.pathname.includes('/admin')) {
    try {
      const response = await fetch('/api/v1/nonogram/admin.check');
      const data = await response.json();
      if (data.isAdmin) {
        isAdmin.value = true;
      } else {
        accessDenied.value = true;
        setTimeout(() => {
          accessDenied.value = false;
          window.history.pushState({}, '', '/');
          currentPage.value = 'landing';
        }, 3000);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      accessDenied.value = true;
      setTimeout(() => {
        accessDenied.value = false;
        window.history.pushState({}, '', '/');
        currentPage.value = 'landing';
      }, 3000);
    } finally {
      isLoading.value = false;
    }
  } else {
    isLoading.value = false;
  }
});

function showMainForm() {
  currentPage.value = 'main';
}
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="accessDenied">Access denied</div>
  <template v-else>
    <Admin v-if="isAdmin" />
    <template v-else>
      <MainForm v-if="currentPage === 'main'" message="Японский кроссворд" />
      <LandingPage v-else @start="showMainForm" />
    </template>
  </template>
</template>

<style scoped>
</style>
