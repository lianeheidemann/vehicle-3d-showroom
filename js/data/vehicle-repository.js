/**
 * Acesso ao catálogo. Hoje lê o JSON estático; no futuro pode trocar por uma API
 * sem que o resto da aplicação mude.
 */
const DATA_URL = 'data/vehicles.json';

export async function loadVehicles() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status} ao buscar ${DATA_URL}`);
  const vehicles = await response.json();
  if (!Array.isArray(vehicles) || vehicles.length === 0) throw new Error(`${DATA_URL} não contém uma lista de veículos`);
  return vehicles;
}
