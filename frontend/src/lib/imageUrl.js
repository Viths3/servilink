const BASE = '';

export const imgUrl = (path) => {
  if (!path || path === 'REMOVED_BY_MODERATOR') return null;
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
  return `${BASE}${path}`;
};
