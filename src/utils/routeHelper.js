export const getPageFromPath = (path = '') => {
  if (path.includes('/admin/markdown')) return 'markdown';
  if (path.includes('/nonogram/finished_nonograms')) return 'finished';
  if (path.includes('/shopping')) return 'shopping';
  if (path.includes('/nonogram/about')) return 'about';
  if (path.includes('/nonogram/contacts')) return 'contacts';
  if (path.includes('/nonogram')) return 'main';
  return 'landing';
};
