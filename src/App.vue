<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import AppHeader from "@/components/AppHeader.vue";
import MainForm from "@/components/MainForm.vue";
import LandingPage from "@/components/LandingPage.vue";
import Admin from "@/components/Admin.vue";
import FinishedNonograms from "@/components/FinishedNonograms.vue";
import AppFooter from "@/components/AppFooter.vue";

import {loadData, loadRandomNonogram, checkSolution, checkAdmin} from './funcs.js';

const currentPage = ref('landing');
const isAdmin = ref(false);
const isLoading = ref(true);
const accessDenied = ref(false);
const mainFormRef = ref(null);

const pageTitle = computed(() => {
  if (isAdmin.value) return 'Панель администратора';
  switch (currentPage.value) {
    case 'main': return 'Японский кроссворд';
    case 'finished': return 'Завершенные кроссворды';
    default: return 'Японские кроссворды';
  }
});

const canUndo = computed(() => mainFormRef.value?.canUndo || false);
const canRedo = computed(() => mainFormRef.value?.canRedo || false);
const showPlusOne = computed(() => mainFormRef.value?.isCongratsShown || false);
const headerIsAdmin = ref(false);

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
    if (path.includes('/nonogram/finished_nonograms')) {
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
  headerIsAdmin.value = checkAdmin();
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
  window.history.pushState({}, '', '/nonogram/finished_nonograms');
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
    <AppHeader
      :title="pageTitle"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :is-admin="headerIsAdmin"
      :show-plus-one="showPlusOne"
      :show-buttons="currentPage === 'main'"
      @reload="mainFormRef?.requestReload()"
      @clear="mainFormRef?.requestClear()"
      @check="mainFormRef?.check()"
      @undo="mainFormRef?.undo()"
      @redo="mainFormRef?.redo()"
      @draw-result="mainFormRef?.drawResult()"
      @show-finished="showFinished"
      @go-landing="showLanding"
    />
    <main class="app-content">
      <Admin v-if="isAdmin" />
      <template v-else>
        <MainForm v-if="currentPage === 'main'" ref="mainFormRef" @show-finished="showFinished" />
        <FinishedNonograms v-else-if="currentPage === 'finished'" @back="showLanding" />
        <LandingPage v-else @start="showMainForm" />
      </template>
    </main>
    <AppFooter />
  </template>
</template>

<style scoped>
</style>
