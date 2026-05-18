<template>
  <div class="markdown-helper">
    <!-- Left panel: document list -->
    <div class="left-panel">
      <div class="left-panel-header">
        <span>Documents</span>
        <button class="new-doc-button" @click="newDocument" title="New document">+</button>
      </div>
      <div class="docs-scroll">
        <div v-if="docsLoading" class="docs-status">Loading...</div>
        <div v-else-if="docsError" class="docs-status docs-error">{{ docsError }}</div>
        <template v-else>
          <div v-if="documentList.length === 0" class="docs-status">No documents</div>
          <div
            v-for="(doc, index) in documentList"
            :key="index"
            class="doc-row"
            :class="{ active: isActiveDoc(doc, index) }"
          >
            <button
              class="doc-link"
              @click="selectDoc(doc)"
            >
              {{ doc.title || (doc.id ? doc.id : 'New document') }}
            </button>
            <button
              v-if="doc.id !== null"
              class="doc-delete"
              title="Delete document"
              @click.stop="deleteDocument(doc)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
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
        @keyup.enter="updateUrlParam('filter', filterValue)"
      />
      <div class="memo-actions">
        <input
          v-model="documentTitle"
          type="text"
          class="doc-title-input"
          placeholder="Document name"
        />
        <button type="button" class="action-button" @click="saveMemo">Save</button>
      </div>
      <div class="memo-wrapper">
        <div ref="editorContainer" class="monaco-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { getFilterTokens } from '@/utils/markdownFilter';
import * as monaco from 'monaco-editor';

const filterValue = ref('');
const memoText = ref('');
const documentTitle = ref('');
const currentDocId = ref(null);
const userId = ref(localStorage.getItem('markdownUserId') || '');

// Monaco editor
const editorContainer = ref(null);
let editor = null;
let editorActivateFilter = null; // set in onMounted once editor is ready

const documentList = ref([]);
const docsLoading = ref(false);
const docsError = ref(null);
// index of the "New document" sentinel in documentList, or -1 when none
const newDocumentIndex = ref(-1);

// Snapshot of the last successfully saved state — used to skip no-op autosaves.
const lastSaved = ref({ id: null, title: '', text: '' });

const initialLoad = ref(true);

const updateUrlParam = (key, value) => {
  const params = new URLSearchParams(window.location.search);
  if (value !== null && value !== undefined && value !== '') {
    params.set(key, String(value));
  } else {
    params.delete(key);
  }
  const search = params.toString();
  window.history.pushState({}, '', window.location.pathname + (search ? '?' + search : ''));
};

const isDirty = computed(() =>
  memoText.value !== lastSaved.value.text ||
  documentTitle.value !== lastSaved.value.title ||
  currentDocId.value !== lastSaved.value.id
);

// Don't autosave a blank new-document sentinel that was never touched.
const canSave = computed(() =>
  !(currentDocId.value === null && !memoText.value && !documentTitle.value)
);

const getBaseUrl = () => {
  const protocol = import.meta.env.ENV_SERVER_PROTOCOL || window.location.protocol.replace(':', '');
  const address = import.meta.env.ENV_SERVER_ADDRESS || window.location.host;
  return `${protocol}://${address}`;
};

const userIdParam = () =>
  userId.value ? `userId=${encodeURIComponent(userId.value)}` : '';


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
        newDocumentIndex.value = -1;
        if (initialLoad.value) {
          initialLoad.value = false;
          const idParam = new URLSearchParams(window.location.search).get('id');
          if (idParam) {
            const doc = documentList.value.find(d => String(d.id) === String(idParam));
            if (doc) loadDocument(doc);
          }
        }
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

// Determine whether a list entry is the currently active one.
// The new-document sentinel has id === null; it is identified by index.
const isActiveDoc = (doc, index) => {
  if (doc.id === null) return index === newDocumentIndex.value;
  return currentDocId.value === doc.id;
};

// Called when the user clicks a link in the left panel.
const selectDoc = (doc) => {
  // Save the current document before navigating away.
  if (isDirty.value && canSave.value) {
    saveMemo();
  }
  if (doc.id === null) {
    // Sentinel — already selected via newDocument(); nothing to fetch.
    currentDocId.value = null;
    documentTitle.value = doc.title || '';
    memoText.value = '';
    updateUrlParam('id', null);
    return;
  }
  updateUrlParam('id', doc.id);
  loadDocument(doc);
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
        const text = JSON.parse(request.responseText).text || '';
        memoText.value = text;
        lastSaved.value = { id: doc.id, title: doc.title || '', text };
        if (editorActivateFilter && filterValue.value) editorActivateFilter();
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

const newDocument = () => {
  // Remove any existing unsaved sentinel first.
  if (newDocumentIndex.value !== -1) {
    documentList.value.splice(newDocumentIndex.value, 1);
  }
  const sentinel = { id: null, title: 'New document' };
  documentList.value.unshift(sentinel);
  newDocumentIndex.value = 0;
  currentDocId.value = null;
  documentTitle.value = '';
  memoText.value = '';
  updateUrlParam('id', null);
  if (editorActivateFilter && filterValue.value) editorActivateFilter();
};

const deleteDocument = (doc) => {
  const label = doc.title || doc.id;
  if (!window.confirm(`Delete "${label}"?`)) return;
  const uid = userIdParam();
  const url = `${getBaseUrl()}/api/v1/markdown.deleteDocument${uid ? '?' + uid : ''}`;
  const payload = JSON.stringify({ id: doc.id });
  const request = new XMLHttpRequest();
  request.open('POST', url, true);
  request.withCredentials = true;
  request.setRequestHeader('Content-Type', 'application/json');
  request.onload = () => {
    if (request.status === 200) {
      if (currentDocId.value === doc.id) {
        currentDocId.value = null;
        documentTitle.value = '';
        memoText.value = '';
        if (editorActivateFilter && filterValue.value) editorActivateFilter();
      }
      loadDocumentList();
    } else {
      console.error('Error deleting document:', request.status);
    }
  };
  request.onerror = () => console.error('Connection error deleting document');
  request.send(payload);
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
        lastSaved.value = { id: data.id, title: documentTitle.value, text: memoText.value };
        // Update the list in-place to avoid a full reload.
        if (newDocumentIndex.value !== -1) {
          // Replace the unsaved sentinel with the real entry.
          documentList.value.splice(newDocumentIndex.value, 1, { id: data.id, title: documentTitle.value });
          newDocumentIndex.value = -1;
        } else {
          // Update the title of the existing entry.
          const idx = documentList.value.findIndex(d => d.id === data.id);
          if (idx !== -1) documentList.value[idx] = { ...documentList.value[idx], title: documentTitle.value };
        }
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

const handlePopState = () => {
  const idParam = new URLSearchParams(window.location.search).get('id');
  if (idParam) {
    const doc = documentList.value.find(d => String(d.id) === String(idParam));
    if (doc) loadDocument(doc);
  } else {
    currentDocId.value = null;
    documentTitle.value = '';
    memoText.value = '';
  }
};

let autosaveTimer = null;

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  const filterParam = params.get('filter');
  if (filterParam !== null) {
    filterValue.value = filterParam;
  }
  loadDocumentList();
  autosaveTimer = setInterval(() => {
    if (isDirty.value && canSave.value) {
      saveMemo();
    }
  }, 5000);
  window.addEventListener('popstate', handlePopState);

  // filteredState holds the non-matching line "gaps" while a filter is active.
  // gaps[0] = lines before first match, gaps[i] = lines after match i-1, etc.
  let filteredState = null; // { gaps: string[][] }
  let settingEditorValue = false; // guard against reentrant change events

  // Rebuild full text by interleaving new visible lines with stored gap lines.
  const rebuildFromGaps = (visibleLines, gaps) => {
    const originalMatchCount = gaps.length - 1;
    const result = [...gaps[0]];
    visibleLines.forEach((line, i) => {
      result.push(line);
      if (i + 1 < gaps.length) result.push(...gaps[i + 1]);
    });
    // Include gaps of any visible lines the user deleted
    for (let i = visibleLines.length; i < originalMatchCount; i++) {
      result.push(...gaps[i + 1]);
    }
    return result.join('\n');
  };

  const activateFilter = () => {
    if (!editor) return;
    const tokens = getFilterTokens(filterValue.value);
    const lines = memoText.value.split('\n');
    const gaps = [[]];
    const visibleLines = [];
    for (const line of lines) {
      if (tokens.some(t => line.includes(t))) {
        visibleLines.push(line);
        gaps.push([]);
      } else {
        gaps[gaps.length - 1].push(line);
      }
    }
    filteredState = { gaps };
    const content = visibleLines.join('\n');
    if (editor.getValue() !== content) {
      settingEditorValue = true;
      editor.setValue(content);
      settingEditorValue = false;
    }
  };

  const deactivateFilter = () => {
    filteredState = null;
    if (!editor) return;
    const content = memoText.value;
    if (editor.getValue() !== content) {
      settingEditorValue = true;
      editor.setValue(content);
      settingEditorValue = false;
    }
  };

  // Create Monaco editor
  editor = monaco.editor.create(editorContainer.value, {
    value: memoText.value,
    language: 'markdown',
    theme: 'vs',
    automaticLayout: true,
    wordWrap: 'on',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 14,
    lineHeight: 21,
    renderLineHighlight: 'none',
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    readOnly: false,
  });

  editor.onKeyDown((e) => {
    if (filteredState && e.keyCode === monaco.KeyCode.Enter) {
      e.preventDefault();
      e.stopPropagation();
    }
    if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyS) {
      e.preventDefault();
      e.stopPropagation();
      if (canSave.value) saveMemo();
    }
  });

  editor.onDidPaste((e) => {
    if (!filteredState) return;
    const model = editor.getModel();
    if (!model) return;
    const pastedText = model.getValueInRange(e.range);
    if (!/\r|\n/.test(pastedText)) return;
    const sanitized = pastedText.replace(/\r?\n|\r/g, ' ');
    editor.executeEdits('sanitize-paste', [{
      range: e.range,
      text: sanitized,
      forceMoveMarkers: true,
    }]);
  });

  editor.onDidChangeModelContent(() => {
    if (settingEditorValue) return;
    if (filteredState) {
      memoText.value = rebuildFromGaps(editor.getValue().split('\n'), filteredState.gaps);
    } else {
      memoText.value = editor.getValue();
    }
  });

  // Sync external memoText changes into the editor (e.g. document load)
  watch(memoText, (newVal) => {
    if (!editor || filteredState) return;
    if (editor.getValue() !== newVal) {
      settingEditorValue = true;
      editor.setValue(newVal);
      settingEditorValue = false;
    }
  });

  // Activate or deactivate filtered editing when filter text changes
  watch(filterValue, (newVal) => {
    if (!editor) return;
    if (newVal) activateFilter();
    else deactivateFilter();
  });

  // Expose activateFilter so document-load code can refresh the filtered view
  editorActivateFilter = activateFilter;
});

onUnmounted(() => {
  clearInterval(autosaveTimer);
  window.removeEventListener('popstate', handlePopState);
  editor?.dispose();
  editor = null;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0.75rem 0.75rem 1rem;
  font-weight: 700;
  font-size: 0.8rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid #e2e8f0;
}

.new-doc-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: white;
  color: #334155;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  flex-shrink: 0;
}

.new-doc-button:hover {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
  background: #eff6ff;
  color: #1d4ed8;
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

.doc-row {
  display: flex;
  align-items: center;
  transition: background 0.15s;
}

.doc-row:hover {
  background: #e2e8f0;
}

.doc-row.active {
  background: #dbeafe;
}

.doc-row.active .doc-link {
  color: #1d4ed8;
  font-weight: 600;
}

.doc-link {
  flex: 1;
  min-width: 0;
  text-align: left;
  padding: 0.55rem 0.5rem 0.55rem 1rem;
  font-size: 0.9rem;
  color: #334155;
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-delete {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  margin-right: 0.35rem;
  border: none;
  border-radius: 5px;
  background: none;
  color: #94a3b8;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s, color 0.15s;
}

.doc-row:hover .doc-delete {
  opacity: 1;
}

.doc-delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

.doc-delete svg {
  width: 0.85rem;
  height: 0.85rem;
  pointer-events: none;
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

.monaco-container {
  position: absolute;
  inset: 0;
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
