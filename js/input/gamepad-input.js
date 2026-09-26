/**
 * Leitura de gamepad via Gamepad API (navigator.getGamepads()).
 *
 * Funciona com qualquer controle que o navegador reconheça no mapeamento "standard":
 * Xbox/XInput e controles emulados pelo InputMapper (que expõe um controle XInput no Windows).
 * Nenhuma integração específica com o InputMapper é necessária.
 *
 *   Setas ← → (D-pad)     → girar o veículo para a esquerda / direita
 *   Analógico esquerdo X  → girar o veículo
 *   Analógico esquerdo Y  → ângulo vertical da câmera
 *   R / RB (botão 5)      → aproximar   (em apps que numeram a partir de 1, aparece como 6)
 *   L / LB (botão 4)      → afastar     (em apps que numeram a partir de 1, aparece como 5)
 *   RT / LT               → também aproximam / afastam, como alternativa
 *
 * Com o InputMapper o navegador costuma ver dois controles: o físico (mapeamento não padrão)
 * e o Xbox 360 virtual (mapeamento "standard"). O virtual tem prioridade.
 */
const DEADZONE = 0.15;
const ROTATE_SPEED = 2.4; // rad/s com o analógico no máximo
const DPAD_ROTATE_SPEED = 1.6; // rad/s enquanto a seta estiver pressionada
const PITCH_SPEED = 1.0;
const ZOOM_SPEED = 1.3;
const TRIGGER_THRESHOLD = 0.05;

const AXIS_LEFT_X = 0;
const AXIS_LEFT_Y = 1;
const BUTTON_LB = 4;
const BUTTON_RB = 5;
const BUTTON_LT = 6; // só no mapeamento "standard"; fora dele, 6/7 costumam ser Back/Start
const BUTTON_RT = 7;
const BUTTON_DPAD_LEFT = 14;
const BUTTON_DPAD_RIGHT = 15;
// Fora do mapeamento "standard", muitos drivers expõem os gatilhos como eixos: -1 solto, 1 apertado.
const AXIS_LT_FALLBACK = 2;
const AXIS_RT_FALLBACK = 5;
const AXIS_RESTING = -0.9;

function applyDeadzone(value = 0) {
  if (Math.abs(value) < DEADZONE) return 0;
  return (value - Math.sign(value) * DEADZONE) / (1 - DEADZONE);
}

function buttonValue(gamepad, index) {
  const button = gamepad.buttons[index];
  return button ? Math.max(button.value, button.pressed ? 1 : 0) : 0;
}

/**
 * Intensidade de zoom (0 a 1) de um lado: botão de ombro (L/R) ou gatilho (LT/RT).
 * Fora do mapeamento "standard", o gatilho é lido pelo eixo equivalente — só depois de
 * vê-lo em repouso (-1), para um eixo que começa em 0 não virar zoom sozinho.
 */
function zoomValue(gamepad, bumperIndex, triggerIndex, axisIndex, restingAxes) {
  let value = buttonValue(gamepad, bumperIndex);

  if (gamepad.mapping === 'standard') {
    value = Math.max(value, buttonValue(gamepad, triggerIndex));
  } else {
    const axis = gamepad.axes[axisIndex];
    const key = `${gamepad.index}:${axisIndex}`;
    if (axis !== undefined && axis <= AXIS_RESTING) restingAxes.add(key);
    if (restingAxes.has(key)) value = Math.max(value, (axis + 1) / 2);
  }
  return value > TRIGGER_THRESHOLD ? value : 0;
}

function isPressed(gamepad, index) {
  return Boolean(gamepad.buttons[index]?.pressed);
}

/** Controle usado: prefere o de mapeamento "standard" (ex.: Xbox 360 virtual do InputMapper). */
function findActiveGamepad() {
  try {
    const gamepads = Array.from(navigator.getGamepads()).filter((gamepad) => gamepad && gamepad.connected);
    return gamepads.find((gamepad) => gamepad.mapping === 'standard') ?? gamepads[0] ?? null;
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
  let activeId = null;
  const restingAxes = new Set();

  const reportStatus = () => {
    const gamepad = findActiveGamepad();
    if (!gamepad) activeId = null;
    onStatusChange({ supported: true, connected: Boolean(gamepad), name: gamepad?.id });
  };

  const poll = (time) => {
    const gamepad = findActiveGamepad();
    if (!gamepad) {
      stop();
      reportStatus();
      return;
    }

    if (gamepad.id !== activeId) {
      activeId = gamepad.id;
      console.info(`[gamepad] Usando: ${gamepad.id} (mapeamento: ${gamepad.mapping || 'não padrão'})`);
    }

    const deltaTime = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0;
    lastTime = time;

    const stickX = applyDeadzone(gamepad.axes[AXIS_LEFT_X]);
    const stickY = applyDeadzone(gamepad.axes[AXIS_LEFT_Y]);
    const dpadX = Number(isPressed(gamepad, BUTTON_DPAD_RIGHT)) - Number(isPressed(gamepad, BUTTON_DPAD_LEFT));
    const yawSpeed = stickX * ROTATE_SPEED + dpadX * DPAD_ROTATE_SPEED;
    if (yawSpeed || stickY) input.rotate(yawSpeed * deltaTime, -stickY * PITCH_SPEED * deltaTime);

    const zoomIn = zoomValue(gamepad, BUTTON_RB, BUTTON_RT, AXIS_RT_FALLBACK, restingAxes);
    const zoomOut = zoomValue(gamepad, BUTTON_LB, BUTTON_LT, AXIS_LT_FALLBACK, restingAxes);
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
