/**
 * Normaliza as diferentes entradas (mouse, touch, teclado, gamepad) em três ações:
 *
 *   rotate(deltaYaw, deltaPitch)  — radianos
 *   zoom(factor)                  — multiplicador da distância (< 1 aproxima, > 1 afasta)
 *   select(clientX, clientY)      — coordenadas de tela para raycasting
 *
 * As fontes de entrada chamam esses métodos; o viewer apenas se inscreve nas ações.
 */
export class InputManager {
  constructor() {
    this.listeners = { rotate: [], zoom: [], select: [] };
  }

  on(action, listener) {
    if (!this.listeners[action]) throw new Error(`Ação de entrada desconhecida: ${action}`);
    this.listeners[action].push(listener);
  }

  rotate(deltaYaw, deltaPitch = 0) {
    this.emit('rotate', deltaYaw, deltaPitch);
  }

  zoom(factor) {
    if (Number.isFinite(factor) && factor > 0) this.emit('zoom', factor);
  }

  select(clientX, clientY) {
    this.emit('select', clientX, clientY);
  }

  emit(action, ...args) {
    for (const listener of this.listeners[action]) listener(...args);
  }
}
