/** Indicador de controle na barra inferior. */
export function renderGamepadStatus(el, { supported, connected, name }) {
  el.dataset.state = !supported ? 'unsupported' : connected ? 'connected' : 'idle';
  el.textContent = !supported
    ? 'Gamepad indisponível neste navegador'
    : connected
      ? `Controle conectado${name ? ` · ${name}` : ''}`
      : 'Nenhum controle conectado';
  el.title = el.textContent;
}
