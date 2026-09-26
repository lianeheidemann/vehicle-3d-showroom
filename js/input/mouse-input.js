const ROTATE_SPEED = 0.008; // rad por pixel
const PITCH_SPEED = 0.004;
const WHEEL_ZOOM_SPEED = 0.0015;
const CLICK_TOLERANCE = 6; // px — acima disso é arrasto, não clique

/** Mouse / caneta: arrastar gira, scroll aproxima/afasta, clique sem arrasto seleciona. */
export function attachMouseInput(element, input) {
  let drag = null;

  element.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    drag = { startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false };
    element.setPointerCapture(event.pointerId);
    element.classList.add('is-dragging');
  });

  element.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerType === 'touch') return;
    input.rotate((event.clientX - drag.lastX) * ROTATE_SPEED, (event.clientY - drag.lastY) * PITCH_SPEED);
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > CLICK_TOLERANCE) drag.moved = true;
  });

  const endDrag = (event) => {
    if (!drag || event.pointerType === 'touch') return;
    if (event.type === 'pointerup' && !drag.moved) input.select(event.clientX, event.clientY);
    drag = null;
    element.classList.remove('is-dragging');
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
  };
  element.addEventListener('pointerup', endDrag);
  element.addEventListener('pointercancel', endDrag);

  element.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const pixels = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16 : event.deltaY;
      input.zoom(Math.exp(pixels * WHEEL_ZOOM_SPEED));
    },
    { passive: false }
  );
}
