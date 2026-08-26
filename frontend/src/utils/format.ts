// Formatea números a formato de moneda sin decimales y con separadores de miles
export const formatCurrency = (value: number | undefined | null) => {
  if (!value) return '$0';
  return '$' + new Intl.NumberFormat('es-CO').format(Math.round(value));
};

// Formatea un string mientras se escribe en un input (ej: 12345 -> 12.345)
export const formatInputNumber = (value: string) => {
  const val = value.replace(/[^0-9]/g, '');
  if (!val) return '';
  return new Intl.NumberFormat('es-CO').format(parseInt(val));
};

// Convierte un string formateado de vuelta a número (ej: "12.345" -> 12345)
export const parseFormattedNumber = (value: string) => {
  return parseFloat(value.replace(/\./g, '')) || 0;
};
