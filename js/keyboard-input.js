const ROTATE_STEP = 0.12; // rad
const PITCH_STEP = 0.05;
const ZOOM_STEP = 0.9;

const KEY_ACTIONS = {
  ArrowLeft: (input) => input.rotate(-ROTATE_STEP, 0),
  ArrowRight: (input) => input.rotate(ROTATE_STEP, 0),
  ArrowUp: (input) => input.rotate(0, PITCH_STEP),
  ArrowDown: (input) => input.rotate(0, -PITCH_STEP),
  '+': (input) => input.zoom(ZOOM_STEP),
  '=': (input) => input.zoom(ZOOM_STEP),
  '-': (input) => input.zoom(1 / ZOOM_STEP),
};

/** Teclado: setas giram, + / - aproximam e afastam. */
export function attachKeyboardInput(target, input) {
  target.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;

    const action = KEY_ACTIONS[event.key];
    if (!action) return;
    event.preventDefault();
    action(input);
  });
}
