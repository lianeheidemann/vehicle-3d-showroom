import { formatMileage, formatPrice } from '../utils/format.js';

const SPEC_FIELDS = [
  ['Ano', (v) => String(v.year)],
  ['Quilometragem', (v) => formatMileage(v.mileage)],
  ['Motor', (v) => v.engine],
  ['Câmbio', (v) => v.transmission],
  ['Cor', (v) => v.color],
  ['Carroceria', (v) => v.body],
  ['Combustível', (v) => v.fuel],
];

/** Painel direito com os dados do veículo selecionado. */
export function createVehicleInfo(panelEl, { onAction }) {
  const field = (name) => panelEl.querySelector(`[data-field="${name}"]`);
  const specsEl = field('specs');

  panelEl.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => onAction(button.dataset.action));
  });

  return {
    render(vehicle) {
      panelEl.classList.remove('is-empty');
      field('brand').textContent = vehicle.brand;
      field('model').textContent = vehicle.model;
      field('version').textContent = vehicle.version;
      field('price').textContent = formatPrice(vehicle.price);

      specsEl.replaceChildren(
        ...SPEC_FIELDS.map(([label, getValue]) => {
          const row = document.createElement('div');
          row.className = 'spec';
          const dt = document.createElement('dt');
          dt.textContent = label;
          const dd = document.createElement('dd');
          dd.textContent = getValue(vehicle) ?? '—';
          if (label === 'Cor' && vehicle.colorHex) {
            const swatch = document.createElement('span');
            swatch.className = 'swatch';
            swatch.style.background = vehicle.colorHex;
            dd.prepend(swatch);
          }
          row.append(dt, dd);
          return row;
        })
      );
    },

    /** Destaque rápido quando o usuário clica no modelo 3D. */
    highlight() {
      panelEl.classList.remove('is-highlighted');
      void panelEl.offsetWidth; // reinicia a animação CSS
      panelEl.classList.add('is-highlighted');
    },

    showEmpty(message) {
      panelEl.classList.add('is-empty');
      field('empty').textContent = message;
    },
  };
}
