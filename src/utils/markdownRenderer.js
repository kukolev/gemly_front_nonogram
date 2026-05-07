import hljs from 'highlight.js/lib/common';
import { marked } from 'marked';

const renderer = new marked.Renderer();

renderer.code = (token) => {
  const code = token?.text ?? '';
  const language = (token?.lang || '').trim().split(/\s+/)[0];
  const hasLanguage = language && hljs.getLanguage(language);
  const highlighted = hasLanguage
    ? hljs.highlight(code, { language }).value
    : hljs.highlightAuto(code).value;
  const languageClass = language ? ` language-${language}` : '';

  return `<pre><code class="hljs${languageClass}">${highlighted}</code></pre>`;
};

export const renderMarkdown = (value) => marked.parse(value || '', { renderer });
