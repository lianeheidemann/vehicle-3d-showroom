/** Indicador de controle na barra inferior: bolinha verde + "Conectado" quando há um controle. */
export function renderGamepadStatus(el, { supported, connected, name }) {
  el.dataset.state = !supported ? 'unsupported' : connected ? 'connected' : 'idle';
  el.textContent = !supported
    ? 'Gamepad indisponível neste navegador'
    : connected
      ? 'Conectado'
      : 'Nenhum controle conectado';
  // O nome do controle (ex.: "Xbox 360 Controller (XInput STANDARD GAMEPAD)") fica na dica ao passar o mouse.
  el.title = connected && name ? `Controle conectado: ${name}` : el.textContent;
}
