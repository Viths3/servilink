export const normalizeTel = (val) => {
  if (!val) return '+593';
  const numeros = val.replace(/\D/g, '');
  if (numeros.startsWith('0')) return '+593' + numeros.slice(1);
  if (numeros.startsWith('593')) return '+' + numeros;
  return '+593' + numeros;
};
