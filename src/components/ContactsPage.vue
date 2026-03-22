<template>
  <div class="contacts-page">
    <main class="content">
      <article class="article">
        <h2>Обратная связь</h2>
        <p class="contacts-text">
          Есть предложения или замечания по работе сайта? Напишите нам на
          <a href="mailto:info.rubyrubygames@gmail.com" class="email-link">
            info.rubyrubygames@gmail.com</a>
          <button
            class="copy-btn"
            :disabled="copied"
            :title="copied ? 'Скопировано!' : 'Скопировать адрес'"
            @click="copyEmail"
          >
            <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
        </p>
      </article>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineEmits(['back']);

const EMAIL = 'info.rubyrubygames@gmail.com';
const copied = ref(false);

const copyEmail = async () => {
  await navigator.clipboard.writeText(EMAIL);
  copied.value = true;
};
</script>

<style scoped>
.contacts-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: 'Inter', sans-serif;
  color: #2c4550;
}

.content {
  line-height: 1.7;
}

.article {
  background: white;
  padding: 2rem;
}

.article h2 {
  font-size: 1.8rem;
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #1e293b;
  border-left: 4px solid #2563eb;
  padding-left: 1rem;
}

.contacts-text {
  font-size: 1.05rem;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.email-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
}

.email-link:hover {
  text-decoration: underline;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.copy-btn svg {
  width: 14px;
  height: 14px;
}

.copy-btn:hover:not(:disabled) {
  background: #e2e8f0;
  border-color: #94a3b8;
  color: #334155;
}

.copy-btn:disabled {
  background: #f0fdf4;
  border-color: #86efac;
  color: #16a34a;
  cursor: default;
  opacity: 1;
}
</style>
