import { formatMileage, formatPrice } from './format.js';

/** Lista lateral de veículos. Só exibe thumbnails — os modelos 3D são carregados sob demanda. */
export function createCatalog(listEl, countEl, { onSelect }) {
  const items = new Map();

  function createItem(vehicle) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'vehicle-card';
    button.setAttribute('aria-pressed', 'false');

    const thumb = document.createElement('div');
    thumb.className = 'vehicle-card__thumb';
    const img = document.createElement('img');
    img.src = vehicle.thumbnail;
    img.alt = '';
    img.loading = 'lazy';
    img.addEventListener('error', () => {
      console.warn(`[catalog] Thumbnail não encontrada: ${vehicle.thumbnail}`);
      thumb.classList.add('is-missing');
      img.remove();
    }, { once: true });
    thumb.append(img);

    const body = document.createElement('div');
    body.className = 'vehicle-card__body';
    body.append(
      textEl('span', 'vehicle-card__title', `${vehicle.brand} ${vehicle.model}`),
      textEl('span', 'vehicle-card__meta', `${vehicle.year} | ${formatMileage(vehicle.mileage)}`),
      textEl('span', 'vehicle-card__price', formatPrice(vehicle.price))
    );

    button.append(thumb, body);
    button.addEventListener('click', () => onSelect(vehicle));

    const li = document.createElement('li');
    li.append(button);
    return li;
  }

  return {
    render(vehicles) {
      listEl.replaceChildren();
      items.clear();
      for (const vehicle of vehicles) {
        const li = createItem(vehicle);
        items.set(vehicle.id, li.firstElementChild);
        listEl.append(li);
      }
      countEl.textContent = `${vehicles.length} disponíveis`;
    },

    setActive(id) {
      for (const [itemId, button] of items) {
        const isActive = itemId === id;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      }
    },

    showError(message) {
      listEl.replaceChildren(textEl('li', 'state-message', message));
      countEl.textContent = '';
    },
  };
}

function textEl(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}
