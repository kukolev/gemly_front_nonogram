export const getFilterTokens = (filterValue = '') =>
  filterValue
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

export const filterMarkdownLines = (text = '', filterValue = '') => {
  if (!text) {
    return '';
  }

  const tokens = getFilterTokens(filterValue);
  if (!tokens.length) {
    return text;
  }

  return text
    .split(/\r?\n/)
    .filter((line) => tokens.some((token) => line.includes(token)))
    .join('\n');
};
