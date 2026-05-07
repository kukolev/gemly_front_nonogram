<template>
  <div class="markdown-helper">
    <!-- Left panel: document list -->
    <div class="left-panel">
      <div class="left-panel-header">Documents</div>
      <div class="docs-scroll">
        <div v-if="docsLoading" class="docs-status">Loading...</div>
        <div v-else-if="docsError" class="docs-status docs-error">{{ docsError }}</div>
        <template v-else>
          <div v-if="documentList.length === 0" class="docs-status">No documents</div>
          <button
            v-for="doc in documentList"
            :key="doc.id"
            class="doc-link"
            :class="{ active: currentDocId === doc.id }"
            @click="loadDocument(doc)"
          >
            {{ doc.title || doc.id }}
          </button>
        </template>
      </div>
      <div class="left-panel-footer">
        <input
          v-model="userId"
          type="text"
          class="user-id-input"
          placeholder="User ID"
          @change="onUserIdChange"
        />
      </div>
    </div>

    <!-- Editor panel -->
    <div class="editor-panel">
      <input
        id="markdown-filter-edit"
        v-model="filterValue"
        type="text"
        class="filter-input"
        placeholder="Filter"
      />
      <div class="memo-actions">
        <input
          v-model="documentTitle"
          type="text"
          class="doc-title-input"
          placeholder="Document name"
        />
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
const documentTitle = ref('');
const currentDocId = ref(null);
const userId = ref(localStorage.getItem('markdownUserId') || '');

const documentList = ref([]);
const docsLoading = ref(false);
const docsError = ref(null);

const filteredMemoText = computed(() =>
  filterMarkdownLines(memoText.value, filterValue.value)
);

const highlightedMarkdown = computed(() => {
  if (!filteredMemoText.value) return '';
  return hljs.highlight(filteredMemoText.value, { language: 'markdown' }).value;
});

const renderedMarkdown = computed(() => renderMarkdown(filteredMemoText.value || ''));

const getBaseUrl = () => {
  const protocol = import.meta.env.ENV_SERVER_PROTOCOL || window.location.protocol.replace(':', '');
  const address = import.meta.env.ENV_SERVER_ADDRESS || window.location.host;
  return `${protocol}://${address}`;
};

const userIdParam = () =>
  userId.value ? `userId=${encodeURIComponent(userId.value)}` : '';

const syncScroll = () => {
  if (!memoRef.value || !highlightRef.value) return;
  highlightRef.value.scrollTop = memoRef.value.scrollTop;
  highlightRef.value.scrollLeft = memoRef.value.scrollLeft;
};

const loadDocumentList = () => {
  docsLoading.value = true;
  docsError.value = null;
  const uid = userIdParam();
  const request = new XMLHttpRequest();
  request.open('GET', `${getBaseUrl()}/api/v1/markdown.getDocumentList${uid ? '?' + uid : ''}`, true);
  request.withCredentials = true;
  request.onload = () => {
    docsLoading.value = false;
    if (request.status === 200) {
      try {
        documentList.value = JSON.parse(request.responseText).list || [];
      } catch {
        docsError.value = 'Parse error';
      }
    } else if (request.status === 403) {
      docsError.value = 'Access denied';
    } else {
      docsError.value = `Error ${request.status}`;
    }
  };
  request.onerror = () => {
    docsLoading.value = false;
    docsError.value = 'Connection error';
  };
  request.send(null);
};

const loadDocument = (doc) => {
  currentDocId.value = doc.id;
  documentTitle.value = doc.title || '';
  const uid = userIdParam();
  const url = `${getBaseUrl()}/api/v1/markdown.getDocument?documentId=${encodeURIComponent(doc.id)}${uid ? '&' + uid : ''}`;
  const request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.withCredentials = true;
  request.onload = () => {
    if (request.status === 200) {
      try {
        memoText.value = JSON.parse(request.responseText).text || '';
      } catch {
        console.error('Parse error loading document');
      }
    } else {
      console.error('Error loading document:', request.status);
    }
  };
  request.onerror = () => console.error('Connection error loading document');
  request.send(null);
};

const saveMemo = () => {
  const uid = userIdParam();
  const url = `${getBaseUrl()}/api/v1/markdown.saveDocument${uid ? '?' + uid : ''}`;
  const payload = JSON.stringify({
    info: { id: currentDocId.value || null, title: documentTitle.value || '' },
    document: { text: memoText.value || '' },
  });
  const request = new XMLHttpRequest();
  request.open('POST', url, true);
  request.withCredentials = true;
  request.setRequestHeader('Content-Type', 'application/json');
  request.onload = () => {
    if (request.status === 200) {
      try {
        const data = JSON.parse(request.responseText);
        currentDocId.value = data.id;
        loadDocumentList();
      } catch {
        console.error('Parse error saving document');
      }
    } else {
      console.error('Error saving document:', request.status);
    }
  };
  request.onerror = () => console.error('Connection error saving document');
  request.send(payload);
};

const onUserIdChange = () => {
  localStorage.setItem('markdownUserId', userId.value || '');
  loadDocumentList();
};

const togglePreview = () => {
  isPreview.value = !isPreview.value;
};

onMounted(() => {
  memoRef.value?.addEventListener('scroll', syncScroll);
  loadDocumentList();
});

onUnmounted(() => {
  memoRef.value?.removeEventListener('scroll', syncScroll);
});

watch(memoText, async () => {
  await nextTick();
  syncScroll();
});
</script>

<style scoped>
.markdown-helper {
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  font-family: 'Inter', sans-serif;
  color: #1e293b;
  background: #f8fafc;
  box-sizing: border-box;
}

/* ── Left panel ── */
.left-panel {
  width: 240px;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e2e8f0;
  background: #f1f5f9;
  overflow: hidden;
}

.left-panel-header {
  padding: 1rem 1rem 0.75rem;
  font-weight: 700;
  font-size: 0.8rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid #e2e8f0;
}

.docs-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0.4rem 0;
}

.docs-status {
  padding: 0.75rem 1rem;
  font-size: 0.88rem;
  color: #94a3b8;
}

.docs-error {
  color: #ef4444;
}

.doc-link {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.55rem 1rem;
  font-size: 0.9rem;
  color: #334155;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-link:hover {
  background: #e2e8f0;
}

.doc-link.active {
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 600;
}

.left-panel-footer {
  padding: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.user-id-input {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
  background: white;
  color: #1e293b;
  box-sizing: border-box;
}

.user-id-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

/* ── Editor panel ── */
.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  min-width: 0;
  min-height: 0;
}

.filter-input {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  background: white;
  color: #1e293b;
  box-sizing: border-box;
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
  align-items: center;
}

.doc-title-input {
  flex: 1;
  min-width: 160px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.55rem 1rem;
  font-size: 0.95rem;
  background: white;
  color: #1e293b;
}

.doc-title-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
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
  .left-panel {
    width: 160px;
    min-width: 120px;
  }

  .editor-panel {
    padding: 1rem 0.75rem;
  }
}
</style>
