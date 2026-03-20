<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import AppSidebar from "@/components/AppSidebar.vue";
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
const touchMarkMode = ref(false);

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
  <div v-else class="app-layout">
    <AppSidebar
      :finished-count="finishedCount"
      :show-plus-one="showPlusOne"
      :show-buttons="currentPage === 'main'"
      :show-back-button="currentPage === 'finished' || currentPage === 'about'"
      :touch-mark-mode="touchMarkMode"
      @show-finished="showFinished"
      @show-about="showAbout"
      @go-landing="showLanding"
      @toggle-touch-mode="touchMarkMode = !touchMarkMode"
      @back="showMainForm"
    />
    <div class="app-body">
      <main class="app-content">
        <Admin v-if="isAdmin" />
        <template v-else>
          <MainForm v-if="currentPage === 'main'" ref="mainFormRef"
            :touch-mark-mode="touchMarkMode"
            :check-error="checkErrorVisible"
            :is-admin="headerIsAdmin"
            @show-finished="showFinished"
            @loaded="updateFinishedCount"
            @check="handleCheck"
          />
          <FinishedNonograms v-else-if="currentPage === 'finished'" @back="showMainForm" />
          <AboutPage v-else-if="currentPage === 'about'" @back="showMainForm" />
          <LandingPage v-else @start="showMainForm" />
        </template>
      </main>
      <AppFooter />
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.app-body {
  margin-left: 180px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-content {
  flex: 1;
}

@media (max-width: 640px) {
  .app-body {
    margin-left: 48px;
  }
}
</style>
