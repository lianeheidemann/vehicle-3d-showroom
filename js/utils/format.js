const numberFormatter = new Intl.NumberFormat('pt-BR');

export const formatMileage = (km) => `${numberFormatter.format(km)} km`;
