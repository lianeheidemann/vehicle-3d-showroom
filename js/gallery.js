/**
 * Miniaturas de vistas (frente, lateral, traseira, interior) abaixo do visualizador.
 * No MVP apenas marcam a vista ativa; câmeras predefinidas ficam para a Fase 6.
 */
export function createGallery(containerEl) {
  let buttons = [];

  function setActive(index) {
    buttons.forEach((button, i) => {
      button.classList.toggle('is-active', i === index);
      button.setAttribute('aria-pressed', String(i === index));
    });
  }

  return {
    render(views = []) {
      buttons = views.map((view, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'gallery__item';

        const img = document.createElement('img');
        img.src = view.image;
        img.alt = '';
        img.addEventListener('error', () => img.remove(), { once: true });

        const label = document.createElement('span');
        label.textContent = view.label;

        button.append(img, label);
        button.addEventListener('click', () => setActive(index));
        return button;
      });
      containerEl.replaceChildren(...buttons);
      containerEl.hidden = buttons.length === 0;
      setActive(0);
    },
  };
}
