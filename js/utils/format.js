const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat('pt-BR');

export const formatPrice = (value) => priceFormatter.format(value);
export const formatMileage = (km) => `${numberFormatter.format(km)} km`;
