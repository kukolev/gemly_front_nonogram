export const getFilterTokens = (filterValue = '') =>
  filterValue
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

// A filter token is a tag when it is wrapped in square brackets, e.g. [+v1]
export const isTagToken = (token) => token.startsWith('[') && token.endsWith(']');

// A line is a tag line when it starts (optionally with whitespace) with a [tag] pattern
export const isTagLine = (line) => /^\s*\[.*?\]/.test(line);

// Indentation width: number of leading whitespace characters.
const getIndent = (line) => line.length - line.trimStart().length;

const isBlankLine = (line) => line.trim().length === 0;

// Returns a boolean array marking which lines to keep when filtering by content.
// A line is kept when it matches a token, plus each match keeps its ancestor
// lines: the preceding lines with strictly smaller indentation that form its
// parent chain (the nearest line at each shallower indent level). Blank lines
// never match and are never treated as ancestors.
export const selectMatchingLines = (lines, tokens) => {
  const keep = new Array(lines.length).fill(false);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isBlankLine(line)) continue;
    if (!tokens.some((token) => line.includes(token))) continue;

    keep[i] = true;

    // Walk upward, keeping the nearest ancestor at each shallower indent level.
    let threshold = getIndent(line);
    for (let j = i - 1; j >= 0 && threshold > 0; j--) {
      if (isBlankLine(lines[j])) continue;
      const indent = getIndent(lines[j]);
      if (indent < threshold) {
        keep[j] = true;
        threshold = indent;
      }
    }
  }

  return keep;
};

// Returns a boolean array marking which lines to keep when filtering by tags.
// A line is kept when it is a tag line that matches a token. Each match also
// keeps:
//   * its ancestor lines  - the nearest preceding line at each shallower indent
//     level (the parent chain), just like content filtering does, and
//   * its body            - the following lines indented deeper than the tag
//     (its subtree), stopping once indentation returns to the tag's level.
// Blank lines never match, are never treated as ancestors, and are kept only
// when they sit between body lines of a matched tag.
export const selectMatchingTagLines = (lines, tokens) => {
  const keep = new Array(lines.length).fill(false);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!isTagLine(line)) continue;
    if (!tokens.some((token) => line.includes(token))) continue;

    keep[i] = true;
    const tagIndent = getIndent(line);

    // Walk upward, keeping the nearest ancestor at each shallower indent level.
    let threshold = tagIndent;
    for (let j = i - 1; j >= 0 && threshold > 0; j--) {
      if (isBlankLine(lines[j])) continue;
      const indent = getIndent(lines[j]);
      if (indent < threshold) {
        keep[j] = true;
        threshold = indent;
      }
    }

    // Walk downward, keeping the tag's body (lines indented deeper than the
    // tag). Blank lines are buffered and only kept once a deeper line follows,
    // so trailing blanks after the body are not pulled in.
    let pendingBlanks = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (isBlankLine(lines[j])) {
        pendingBlanks.push(j);
        continue;
      }
      if (getIndent(lines[j]) <= tagIndent) break;
      for (const b of pendingBlanks) keep[b] = true;
      pendingBlanks = [];
      keep[j] = true;
    }
  }

  return keep;
};

const filterByTagSections = (text, tokens) => {
  const lines = text.split(/\r?\n/);
  const keep = selectMatchingTagLines(lines, tokens);
  return lines.filter((_, i) => keep[i]).join('\n');
};

export const filterMarkdownLines = (text = '', filterValue = '') => {
  if (!text) {
    return '';
  }

  const tokens = getFilterTokens(filterValue);
  if (!tokens.length) {
    return text;
  }

  if (tokens.every(isTagToken)) {
    return filterByTagSections(text, tokens);
  }

  const lines = text.split(/\r?\n/);
  const keep = selectMatchingLines(lines, tokens);
  return lines.filter((_, i) => keep[i]).join('\n');
};
