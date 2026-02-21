<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import MainForm from "@/components/MainForm.vue";
import LandingPage from "@/components/LandingPage.vue";
import Admin from "@/components/Admin.vue";
import FinishedNonograms from "@/components/FinishedNonograms.vue";

const currentPage = ref('landing');
const isAdmin = ref(false);
const isLoading = ref(true);
const accessDenied = ref(false);

const updateRoute = async () => {
  const path = window.location.pathname;
  if (path.includes('/admin')) {
    if (isAdmin.value) {
      isLoading.value = false;
      return;
    }
    isLoading.value = true;
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
    isAdmin.value = false;
    if (path.includes('/finished_nonograms')) {
      currentPage.value = 'finished';
    } else if (path.includes('/nonogram')) {
      currentPage.value = 'main';
    } else {
      currentPage.value = 'landing';
    }
    isLoading.value = false;
  }
};

onMounted(() => {
  updateRoute();
  window.addEventListener('popstate', updateRoute);
});

onUnmounted(() => {
  window.removeEventListener('popstate', updateRoute);
});

function showMainForm() {
  window.history.pushState({}, '', '/nonogram');
  currentPage.value = 'main';
}

function showFinished() {
  window.history.pushState({}, '', '/finished_nonograms');
  currentPage.value = 'finished';
}

function showLanding() {
  window.history.pushState({}, '', '/');
  currentPage.value = 'landing';
}
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="accessDenied">Access denied</div>
  <template v-else>
    <Admin v-if="isAdmin" />
    <template v-else>
      <MainForm v-if="currentPage === 'main'" message="Японский кроссворд" @show-finished="showFinished" />
      <FinishedNonograms v-else-if="currentPage === 'finished'" @back="showLanding" />
      <LandingPage v-else @start="showMainForm" @showFinished="showFinished" />
    </template>
  </template>
</template>

<style scoped>
</style>
