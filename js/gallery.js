/**
 * Miniaturas de vistas (frente, lateral, traseira, interior) abaixo do visualizador.
 * Ao clicar, avisa `onSelect(view)`; a vista só fica marcada se `onSelect` retornar true
 * (ex.: "interior" ainda não tem câmera própria).
 */
export function createGallery(containerEl, { onSelect = () => true } = {}) {
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
        img.draggable = false;
        img.addEventListener('error', () => img.remove(), { once: true });

        const label = document.createElement('span');
        label.textContent = view.label;

        button.append(img, label);
        button.addEventListener('click', () => {
          if (onSelect(view.view)) setActive(index);
        });
        return button;
      });
      containerEl.replaceChildren(...buttons);
      containerEl.hidden = buttons.length === 0;
      setActive(-1); // o veículo abre na vista 3/4 padrão, que não corresponde a nenhuma miniatura
    },

    /** Desmarca a vista quando o usuário gira o carro manualmente. */
    clearActive() {
      setActive(-1);
    },
  };
}
