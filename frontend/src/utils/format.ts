export const formatCurrency = (val: any) => {
  const value = Number(val);
  if (isNaN(value)) return '$0';

  if (value < 0) {
    return '-$' + new Intl.NumberFormat('es-CO').format(Math.abs(Math.round(value)));
  }

  return '$' + new Intl.NumberFormat('es-CO').format(Math.round(value));
};

export const formatInputNumber = (value: string) => {
  const val = value.replace(/[^0-9]/g, '');
  if (!val) return '';
  return new Intl.NumberFormat('es-CO').format(parseInt(val, 10));
};

export const parseFormattedNumber = (value: string) => {
  const cleanValue = String(value).replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
};
