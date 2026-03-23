<template>
  <div class="contacts-page">
    <main class="content">
      <article class="article">
        <h2>Обратная связь</h2>

<!--        <p class="contacts-text">-->
<!--          Есть предложения или замечания по работе сайта? Напишите нам на-->
<!--          <a href="mailto:info.rubyrubygames@gmail.com" class="email-link">-->
<!--            info.rubyrubygames@gmail.com</a>-->
<!--          <button-->
<!--            class="copy-btn"-->
<!--            :disabled="copied"-->
<!--            :title="copied ? 'Скопировано!' : 'Скопировать адрес'"-->
<!--            @click="copyEmail"-->
<!--          >-->
<!--            <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor"-->
<!--                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">-->
<!--              <rect x="9" y="9" width="13" height="13" rx="2"/>-->
<!--              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>-->
<!--            </svg>-->
<!--            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor"-->
<!--                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">-->
<!--              <polyline points="20 6 9 17 4 12"/>-->
<!--            </svg>-->
<!--          </button>-->
<!--        </p>-->

        <!-- Feedback form -->
        <form class="feedback-form" @submit.prevent="submitForm" novalidate>
          <p class="contacts-text">Есть предложения или замечания по работе сайта? Напишите нам: </p>
<!--          <h3 class="form-title">Написать нам</h3>-->

          <div class="form-field">
            <label class="field-label" for="fb-name">Имя <span class="optional">(необязательно)</span></label>
            <input
              id="fb-name"
              v-model="form.name"
              type="text"
              class="field-input"
              placeholder="Ваше имя"
              :disabled="status === 'sending' || status === 'success'"
              autocomplete="name"
            />
          </div>

          <div class="form-field">
            <label class="field-label" for="fb-email">Email <span class="optional">(необязательно)</span></label>
            <input
              id="fb-email"
              v-model="form.email"
              type="email"
              class="field-input"
              :class="{'field-error': emailInvalid}"
              placeholder="example@mail.com"
              :disabled="status === 'sending' || status === 'success'"
              autocomplete="email"
              @blur="validateEmail"
            />
            <span v-if="emailInvalid" class="error-msg">Введите корректный email</span>
          </div>

          <div class="form-field">
            <label class="field-label" for="fb-text">
              Сообщение <span class="required">*</span>
            </label>
            <textarea
              id="fb-text"
              v-model="form.text"
              class="field-textarea"
              :class="{'field-error': textInvalid}"
              placeholder="Ваш вопрос, предложение или замечание..."
              rows="5"
              :disabled="status === 'sending' || status === 'success'"
              @blur="textTouched = true"
            ></textarea>
            <span v-if="textInvalid" class="error-msg">Заполните это поле</span>
          </div>

          <!-- Status messages -->
          <div v-if="status === 'success'" class="status-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Спасибо! Ваше сообщение отправлено.
          </div>

          <div v-if="status === 'error'" class="status-error">
            Не удалось отправить сообщение. Попробуйте позже или напишите нам на email.
          </div>

          <button
            v-if="status !== 'success'"
            type="submit"
            class="submit-btn"
            :disabled="status === 'sending'"
          >
            <svg v-if="status !== 'sending'" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <span>{{ status === 'sending' ? 'Отправка...' : 'Отправить' }}</span>
          </button>
        </form>

      </article>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

defineEmits(['back']);

// ── Copy email ────────────────────────────────────────────────────────────────
const EMAIL = 'info.rubyrubygames@gmail.com';
const copied = ref(false);
const copyEmail = async () => {
  await navigator.clipboard.writeText(EMAIL);
  copied.value = true;
};

// ── Form state ────────────────────────────────────────────────────────────────
const form = ref({ name: '', email: '', text: '' });
const status = ref('idle');  // idle | sending | success | error
const textTouched  = ref(false);
const emailTouched = ref(false);

const emailInvalid = computed(() => {
  if (!emailTouched.value || !form.value.email) return false;
  return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email);
});

const textInvalid = computed(() => textTouched.value && !form.value.text.trim());

function validateEmail() {
  emailTouched.value = true;
}

async function submitForm() {
  textTouched.value  = true;
  emailTouched.value = true;

  if (!form.value.text.trim() || emailInvalid.value) return;

  status.value = 'sending';
  try {
    const res = await fetch('/api/v1/nonogram.sendFeedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:  form.value.name.trim()  || null,
        email: form.value.email.trim() || null,
        text:  form.value.text.trim(),
      }),
    });
    status.value = res.ok ? 'success' : 'error';
  } catch {
    status.value = 'error';
  }
}
</script>

<style scoped>
.contacts-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: 'Inter', sans-serif;
  color: #2c4550;
}

.content { line-height: 1.7; }

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

/* ── Email line ── */
.contacts-text {
  font-size: 1.05rem;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.email-link { color: #2563eb; text-decoration: none; font-weight: 600; }
.email-link:hover { text-decoration: underline; }

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
.copy-btn svg { width: 14px; height: 14px; }
.copy-btn:hover:not(:disabled) { background: #e2e8f0; border-color: #94a3b8; color: #334155; }
.copy-btn:disabled { background: #f0fdf4; border-color: #86efac; color: #16a34a; cursor: default; opacity: 1; }

/* ── Feedback form ── */
.form-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1.25rem;
}

.feedback-form {
  border-top: 1px solid #e2e8f0;
  padding-top: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 1.1rem;
}

.field-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #374151;
}

.optional {
  font-weight: 400;
  color: #94a3b8;
  font-size: 0.82rem;
}

.required {
  color: #dc2626;
}

.field-input,
.field-textarea {
  padding: 0.55rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  font-size: 0.9rem;
  font-family: inherit;
  color: #1e293b;
  background: #f8fafc;
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;
  resize: vertical;
}

.field-input:focus,
.field-textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  background: #fff;
}

.field-input:disabled,
.field-textarea:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.field-error {
  border-color: #dc2626 !important;
  box-shadow: 0 0 0 3px rgba(220,38,38,0.1) !important;
}

.error-msg {
  font-size: 0.8rem;
  color: #dc2626;
}

/* ── Status ── */
.status-success,
.status-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  border-radius: 5px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.status-success {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #86efac;
}

.status-success svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.status-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

/* ── Submit button ── */
.submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.4rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}

.submit-btn svg {
  width: 15px;
  height: 15px;
}

.submit-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
