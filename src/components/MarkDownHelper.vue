<template>
  <div class="markdown-helper">
    <input
      id="markdown-filter-edit"
      v-model="filterValue"
      type="text"
      class="filter-input"
      placeholder="Filter"
    />
    <div class="memo-actions">
      <button type="button" class="action-button" @click="saveMemo">Save</button>
      <button
        type="button"
        class="action-button"
        :class="{ active: isPreview }"
        @click="togglePreview"
      >
        Preview
      </button>
    </div>
    <div class="memo-wrapper">
      <div v-if="isPreview" class="memo-preview" v-html="renderedMarkdown"></div>
      <template v-else>
        <pre ref="highlightRef" class="memo-highlight"><code class="hljs" v-html="highlightedMarkdown"></code></pre>
        <textarea
          id="markdown-memo"
          ref="memoRef"
          v-model="memoText"
          class="memo-input"
          spellcheck="false"
        ></textarea>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import hljs from 'highlight.js/lib/common';
import { filterMarkdownLines } from '@/utils/markdownFilter';
import { renderMarkdown } from '@/utils/markdownRenderer';

const filterValue = ref('');
const memoText = ref('');
const memoRef = ref(null);
const highlightRef = ref(null);
const isPreview = ref(false);
const memoStorageKey = 'markdown-memo';

const filteredMemoText = computed(() =>
  filterMarkdownLines(memoText.value, filterValue.value)
);

const highlightedMarkdown = computed(() => {
  if (!filteredMemoText.value) {
    return '';
  }
  return hljs.highlight(filteredMemoText.value, { language: 'markdown' }).value;
});

const renderedMarkdown = computed(() => renderMarkdown(filteredMemoText.value || ''));

const syncScroll = () => {
  if (!memoRef.value || !highlightRef.value) {
    return;
  }
  highlightRef.value.scrollTop = memoRef.value.scrollTop;
  highlightRef.value.scrollLeft = memoRef.value.scrollLeft;
};

onMounted(() => {
  memoRef.value?.addEventListener('scroll', syncScroll);
  const savedMemo = localStorage.getItem(memoStorageKey);
  if (savedMemo) {
    memoText.value = savedMemo;
  }
});

onUnmounted(() => {
  memoRef.value?.removeEventListener('scroll', syncScroll);
});

watch(memoText, async () => {
  await nextTick();
  syncScroll();
});

const saveMemo = () => {
  localStorage.setItem(memoStorageKey, memoText.value || '');
};

const togglePreview = () => {
  isPreview.value = !isPreview.value;
};
</script>

<style scoped>
.markdown-helper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  min-height: 100%;
  font-family: 'Inter', sans-serif;
  color: #1e293b;
  background: #f8fafc;
  box-sizing: border-box;
}

.filter-input {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  background: white;
  color: #1e293b;
}

.filter-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.memo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.action-button {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.55rem 1.25rem;
  background: white;
  color: #1e293b;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.action-button:hover {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
}

.action-button.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #f8fafc;
}

.memo-wrapper {
  position: relative;
  flex: 1 1 auto;
  min-height: 240px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  overflow: hidden;
}

.memo-highlight,
.memo-input {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 1rem;
  font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 0.95rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  box-sizing: border-box;
}

.memo-highlight {
  pointer-events: none;
  overflow: auto;
}

.memo-highlight code {
  font-family: inherit;
}

.memo-input {
  width: 100%;
  height: 100%;
  border: none;
  resize: none;
  background: white;
  color: #1e293b;
  caret-color: #1e293b;
  overflow: auto;
}

.memo-input:focus {
  outline: none;
}

.memo-preview {
  padding: 1rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.98rem;
  line-height: 1.6;
  color: #1e293b;
  overflow: auto;
  height: 100%;
  box-sizing: border-box;
}

.memo-preview :deep(pre) {
  background: #f1f5f9;
  padding: 0.75rem;
  border-radius: 8px;
  overflow-x: auto;
}

.memo-preview :deep(code) {
  font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
}

:deep(.hljs) {
  color: #0f172a;
}

:deep(.hljs-comment),
:deep(.hljs-quote) {
  color: #64748b;
  font-style: italic;
}

:deep(.hljs-keyword),
:deep(.hljs-section),
:deep(.hljs-selector-tag),
:deep(.hljs-literal),
:deep(.hljs-symbol) {
  color: #7c3aed;
  font-weight: 600;
}

:deep(.hljs-string),
:deep(.hljs-title),
:deep(.hljs-name),
:deep(.hljs-type) {
  color: #0f766e;
}

:deep(.hljs-strong) {
  font-weight: 700;
}

:deep(.hljs-emphasis) {
  font-style: italic;
  color: #2563eb;
}

:deep(.hljs-link) {
  color: #2563eb;
  text-decoration: underline;
}

@media (max-width: 640px) {
  .markdown-helper {
    padding: 1rem 0.75rem;
  }
}
</style>
