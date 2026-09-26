/**
 * Leitura de gamepad via Gamepad API (navigator.getGamepads()).
 *
 * Funciona com qualquer controle que o navegador reconheça no mapeamento "standard":
 * Xbox/XInput e controles virtuais como o DroidJoy ou o InputMapper (que expõem um controle
 * XInput no Windows). Nenhuma integração específica com esses programas é necessária.
 *
 *   Setas ← → (D-pad)     → girar o veículo para a esquerda / direita
 *   Analógico esquerdo X  → girar o veículo
 *   Analógico esquerdo Y  → ângulo vertical da câmera
 *   RT (botão 7)          → aproximar
 *   LT (botão 6)          → afastar
 */
const DEADZONE = 0.15;
const ROTATE_SPEED = 2.4; // rad/s com o analógico no máximo
const DPAD_ROTATE_SPEED = 1.6; // rad/s enquanto a seta estiver pressionada
const PITCH_SPEED = 1.0;
const ZOOM_SPEED = 1.3;
const TRIGGER_THRESHOLD = 0.05;

const AXIS_LEFT_X = 0;
const AXIS_LEFT_Y = 1;
const BUTTON_LT = 6;
const BUTTON_RT = 7;
const BUTTON_DPAD_LEFT = 14;
const BUTTON_DPAD_RIGHT = 15;

function applyDeadzone(value = 0) {
  if (Math.abs(value) < DEADZONE) return 0;
  return (value - Math.sign(value) * DEADZONE) / (1 - DEADZONE);
}

function triggerValue(gamepad, index) {
  const value = gamepad.buttons[index]?.value ?? 0;
  return value > TRIGGER_THRESHOLD ? value : 0;
}

function isPressed(gamepad, index) {
  return Boolean(gamepad.buttons[index]?.pressed);
}

function findActiveGamepad() {
  try {
    return Array.from(navigator.getGamepads()).find((gamepad) => gamepad && gamepad.connected) ?? null;
  } catch (error) {
    console.warn('[gamepad] Não foi possível ler os controles:', error);
    return null;
  }
}

/**
 * @param {import('./input-manager.js').InputManager} input
 * @param {{ onStatusChange?: (status: { supported: boolean, connected: boolean, name?: string }) => void }} options
 */
export function attachGamepadInput(input, { onStatusChange = () => {} } = {}) {
  if (typeof navigator.getGamepads !== 'function') {
    console.info('[gamepad] Gamepad API não suportada neste navegador.');
    onStatusChange({ supported: false, connected: false });
    return;
  }

  let frameId = null;
  let lastTime = 0;

  const reportStatus = () => {
    const gamepad = findActiveGamepad();
    onStatusChange({ supported: true, connected: Boolean(gamepad), name: gamepad?.id });
  };

  const poll = (time) => {
    const gamepad = findActiveGamepad();
    if (!gamepad) {
      stop();
      reportStatus();
      return;
    }

    const deltaTime = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0;
    lastTime = time;

    const stickX = applyDeadzone(gamepad.axes[AXIS_LEFT_X]);
    const stickY = applyDeadzone(gamepad.axes[AXIS_LEFT_Y]);
    const dpadX = Number(isPressed(gamepad, BUTTON_DPAD_RIGHT)) - Number(isPressed(gamepad, BUTTON_DPAD_LEFT));
    const yawSpeed = stickX * ROTATE_SPEED + dpadX * DPAD_ROTATE_SPEED;
    if (yawSpeed || stickY) input.rotate(yawSpeed * deltaTime, -stickY * PITCH_SPEED * deltaTime);

    const zoomIn = triggerValue(gamepad, BUTTON_RT);
    const zoomOut = triggerValue(gamepad, BUTTON_LT);
    if (zoomIn || zoomOut) input.zoom(Math.exp((zoomOut - zoomIn) * ZOOM_SPEED * deltaTime));

    frameId = requestAnimationFrame(poll);
  };

  const start = () => {
    if (frameId !== null) return;
    lastTime = 0;
    frameId = requestAnimationFrame(poll);
  };

  const stop = () => {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
  };

  window.addEventListener('gamepadconnected', (event) => {
    console.info(`[gamepad] Conectado: ${event.gamepad.id} (mapeamento: ${event.gamepad.mapping || 'não padrão'})`);
    reportStatus();
    start();
  });

  window.addEventListener('gamepaddisconnected', (event) => {
    console.info(`[gamepad] Desconectado: ${event.gamepad.id}`);
    reportStatus(); // o loop encerra sozinho quando não houver controle ativo
  });

  reportStatus();
  if (findActiveGamepad()) start();
}
