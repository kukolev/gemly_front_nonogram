<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import AppHeader from "@/components/AppHeader.vue";
import MainForm from "@/components/MainForm.vue";
import LandingPage from "@/components/LandingPage.vue";
import AboutPage from "@/components/AboutPage.vue";
import Admin from "@/components/Admin.vue";
import FinishedNonograms from "@/components/FinishedNonograms.vue";
import AppFooter from "@/components/AppFooter.vue";

import {loadData, loadRandomNonogram, checkSolution, checkAdmin, getFinishedCount} from './funcs.js';

const currentPage = ref('landing');
const isAdmin = ref(false);
const isLoading = ref(true);
const accessDenied = ref(false);
const mainFormRef = ref(null);
const finishedCount = ref(0);

const updateFinishedCount = () => {
  finishedCount.value = getFinishedCount();
};

const pageTitle = computed(() => {
  if (isAdmin.value) return 'Панель администратора';
  switch (currentPage.value) {
    case 'main': return 'Японские кроссворды';
    case 'finished': return 'Завершенные кроссворды';
    case 'about': return 'О проекте';
    default: return 'Добро пожаловать!';
  }
});

const canUndo = computed(() => mainFormRef.value?.canUndo || false);
const canRedo = computed(() => mainFormRef.value?.canRedo || false);
const showPlusOne = computed(() => mainFormRef.value?.isCongratsShown || false);
const checkErrorVisible = ref(false);
const headerIsAdmin = ref(false);

const updateRoute = () => {
  const path = window.location.pathname;
  if (path.includes('/admin')) {
    if (isAdmin.value) {
      isLoading.value = false;
      return;
    }
    isLoading.value = true;
    try {
      const request = new XMLHttpRequest();
      request.open("GET", "/api/v1/nonogram/admin.check", false);
      request.send(null);
      if (request.status === 200) {
        const data = JSON.parse(request.responseText);
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
      } else {
        throw new Error('Failed to check admin status');
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
    } else if (path.includes('/nonogram/about')) {
      currentPage.value = 'about';
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
  updateFinishedCount();
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
  mainFormRef.value?.performSave();
  window.history.pushState({}, '', '/nonogram/finished_nonograms');
  currentPage.value = 'finished';
}

function showAbout() {
  mainFormRef.value?.performSave();
  window.history.pushState({}, '', '/nonogram/about');
  currentPage.value = 'about';
}

function showLanding() {
  window.history.pushState({}, '', '/');
  currentPage.value = 'landing';
}

// --- SEO: per-page meta ---
const PAGE_META = {
  landing: {
    title: 'Японские кроссворды онлайн — нонограммы бесплатно',
    description: 'Решайте японские кроссворды (нонограммы) онлайн бесплатно. Тренируйте логику, память и концентрацию внимания.',
  },
  main: {
    title: 'Решить кроссворд — Японские кроссворды онлайн',
    description: 'Откройте новую головоломку и решайте японские кроссворды онлайн. Проверьте свои логические способности.',
  },
  finished: {
    title: 'Завершённые кроссворды — Японские кроссворды',
    description: 'Ваши решённые японские кроссворды. Просматривайте историю завершённых головоломок.',
  },
  about: {
    title: 'О нонограммах и методах решения — Японские кроссворды',
    description: 'Узнайте, что такое японские кроссворды и как их решать. Методы решения нонограмм с иллюстрациями.',
  },
};

function setMeta(title, description) {
  document.title = title;
  const setContent = (selector, value) =>
    document.querySelector(selector)?.setAttribute('content', value);
  setContent('meta[name="description"]', description);
  setContent('meta[property="og:title"]', title);
  setContent('meta[property="og:description"]', description);
  setContent('meta[name="twitter:title"]', title);
  setContent('meta[name="twitter:description"]', description);
}

watch([currentPage, isAdmin], ([page, admin]) => {
  if (admin) {
    setMeta('Панель администратора', '');
  } else {
    const meta = PAGE_META[page] ?? PAGE_META.landing;
    setMeta(meta.title, meta.description);
  }
}, { immediate: true });
// --- end SEO ---

let checkErrorTimer = null;
function handleCheck() {
  mainFormRef.value?.check();
  updateFinishedCount();
  if (!mainFormRef.value?.isSolved) {
    checkErrorVisible.value = false;
    clearTimeout(checkErrorTimer);
    // re-trigger on next tick so the animation replays even on repeated clicks
    setTimeout(() => {
      checkErrorVisible.value = true;
      checkErrorTimer = setTimeout(() => { checkErrorVisible.value = false; }, 2000);
    }, 0);
  }
}
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="accessDenied">Access denied</div>
  <template v-else>
    <AppHeader
      :title="pageTitle"
      :finished-count="finishedCount"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :is-admin="headerIsAdmin"
      :show-plus-one="showPlusOne"
      :check-error="checkErrorVisible"
      :show-buttons="currentPage === 'main'"
      @reload="mainFormRef?.requestReload()"
      @clear="mainFormRef?.requestClear()"
      @check="handleCheck"
      @undo="mainFormRef?.undo()"
      @redo="mainFormRef?.redo()"
      @draw-result="mainFormRef?.drawResult()"
      @show-finished="showFinished"
      @show-about="showAbout"
      @go-landing="showLanding"
    />
    <main class="app-content">
      <Admin v-if="isAdmin" />
      <template v-else>
        <MainForm v-if="currentPage === 'main'" ref="mainFormRef" @show-finished="showFinished" @loaded="updateFinishedCount" />
        <FinishedNonograms v-else-if="currentPage === 'finished'" @back="showMainForm" />
        <AboutPage v-else-if="currentPage === 'about'" />
        <LandingPage v-else @start="showMainForm" />
      </template>
    </main>
    <AppFooter />
  </template>
</template>

<style scoped>
</style>
