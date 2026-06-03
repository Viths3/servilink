const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export const imgUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
  return `${BASE}${path}`;
};
