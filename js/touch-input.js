const ROTATE_SPEED = 0.01; // rad por pixel
const PITCH_SPEED = 0.005;
const TAP_TOLERANCE = 10; // px
const TAP_MAX_DURATION = 400; // ms

/** Touch: um dedo gira, pinça aproxima/afasta, toque rápido seleciona. */
export function attachTouchInput(element, input) {
  let gesture = null;

  const distance = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

  const startRotate = (touch, isTapCandidate) => {
    gesture = {
      type: 'rotate',
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      startTime: performance.now(),
      isTap: isTapCandidate,
    };
  };

  element.addEventListener(
    'touchstart',
    (event) => {
      event.preventDefault();
      if (event.touches.length === 1) startRotate(event.touches[0], true);
      else if (event.touches.length === 2) gesture = { type: 'pinch', lastDistance: distance(event.touches) };
    },
    { passive: false }
  );

  element.addEventListener(
    'touchmove',
    (event) => {
      event.preventDefault();
      if (!gesture) return;

      if (gesture.type === 'rotate' && event.touches.length === 1) {
        const touch = event.touches[0];
        input.rotate((touch.clientX - gesture.lastX) * ROTATE_SPEED, (touch.clientY - gesture.lastY) * PITCH_SPEED);
        gesture.lastX = touch.clientX;
        gesture.lastY = touch.clientY;
        if (Math.hypot(touch.clientX - gesture.startX, touch.clientY - gesture.startY) > TAP_TOLERANCE) gesture.isTap = false;
      } else if (gesture.type === 'pinch' && event.touches.length === 2) {
        const current = distance(event.touches);
        if (current > 0) input.zoom(gesture.lastDistance / current);
        gesture.lastDistance = current;
      }
    },
    { passive: false }
  );

  const onTouchEnd = (event) => {
    if (!gesture) return;
    const remaining = event.touches.length;

    if (gesture.type === 'rotate' && remaining === 0 && event.type === 'touchend' && gesture.isTap
      && performance.now() - gesture.startTime < TAP_MAX_DURATION) {
      input.select(gesture.startX, gesture.startY);
    }

    // Ao soltar um dedo da pinça, o dedo restante continua girando (sem virar "toque").
    if (remaining === 1) startRotate(event.touches[0], false);
    else if (remaining === 0) gesture = null;
  };
  element.addEventListener('touchend', onTouchEnd);
  element.addEventListener('touchcancel', onTouchEnd);
}
