/**
 * Visualizador 3D. A-Frame gerencia cena, câmera, luzes e o carregamento GLB (gltf-model);
 * o Three.js embutido no A-Frame (AFRAME.THREE) é usado só para órbita, enquadramento,
 * raycasting e liberação de memória — um único renderer.
 *
 * Esta classe orquestra: carregar/descartar o modelo, estados da interface e raycasting.
 * Órbita, enquadramento e iluminação ficam nos módulos importados abaixo.
 */
import { frameModel } from './model-framing.js';
import { OrbitCamera } from './orbit-camera.js';
import { createPlaceholderCar } from './placeholder-car.js';
import { applyStudioEnvironment } from './studio-environment.js';
import { assetExists, disposeObject3D, whenSceneLoaded } from './three-utils.js';

const THREE = AFRAME.THREE;

const MESSAGES = {
  loading: 'Carregando modelo 3D…',
  error: 'Não foi possível carregar o modelo 3D.',
};

AFRAME.registerComponent('vehicle-viewer-tick', {
  init() {
    this.viewer = null;
  },
  tick(time, delta) {
    this.viewer?.update(Math.min(delta, 100) / 1000);
  },
});

export class VehicleViewer {
  constructor({ sceneEl, rootEl, cameraEl, ringEl, overlayEl, noticeEl, onVehicleClick = () => {} }) {
    Object.assign(this, { sceneEl, rootEl, cameraEl, ringEl, overlayEl, noticeEl, onVehicleClick });
    this.overlayTextEl = overlayEl.querySelector('[data-overlay-text]');

    this.orbit = new OrbitCamera();
    this.modelEl = null;
    this.loadToken = 0;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.ready = whenSceneLoaded(sceneEl).then(() => {
      applyStudioEnvironment(sceneEl);
      sceneEl.setAttribute('vehicle-viewer-tick', '');
      sceneEl.components['vehicle-viewer-tick'].viewer = this;
    });
  }

  bindInput(input) {
    input.on('rotate', (deltaYaw, deltaPitch) => this.orbit.rotate(deltaYaw, deltaPitch));
    input.on('zoom', (factor) => this.orbit.zoom(factor));
    input.on('select', (x, y) => this.select(x, y));
  }

  /** Gira até uma vista predefinida ('front' | 'side' | 'rear'). Retorna false se não existir. */
  setView(view) {
    return this.orbit.setView(view);
  }

  /** Carrega o modelo do veículo, descartando o anterior. Apenas um modelo fica na cena. */
  async load(vehicle) {
    const token = ++this.loadToken;
    this.clearModel();
    this.setState('loading');
    await this.ready;

    const hasModelFile = Boolean(vehicle.model3d) && (await assetExists(vehicle.model3d));
    if (token !== this.loadToken) return;

    if (!hasModelFile) {
      // GLB ainda não exportado do Blender: usa o carro provisório.
      // Basta colocar o arquivo no caminho de `model3d` (data/vehicles.json) para ele ser usado.
      console.info(`[viewer] ${vehicle.model3d} não encontrado — exibindo modelo provisório.`);
      const modelEl = this.createModelEntity();
      modelEl.setObject3D('mesh', createPlaceholderCar(vehicle));
      this.fitModel(modelEl.getObject3D('mesh'));
      this.setState('placeholder');
      return;
    }

    const modelEl = this.createModelEntity();
    modelEl.addEventListener('model-loaded', () => {
      const model = modelEl.getObject3D('mesh');
      if (token !== this.loadToken) {
        if (model) disposeObject3D(model);
        return;
      }
      this.fitModel(model);
      this.setState('ready');
    }, { once: true });
    modelEl.addEventListener('model-error', (event) => {
      if (token !== this.loadToken) return;
      console.error(`[viewer] Falha ao carregar ${vehicle.model3d}`, event.detail);
      this.clearModel();
      this.setState('error');
    }, { once: true });
    modelEl.setAttribute('gltf-model', `url(${vehicle.model3d})`);
  }

  createModelEntity() {
    const modelEl = document.createElement('a-entity');
    modelEl.classList.add('vehicle-model');
    this.rootEl.appendChild(modelEl);
    this.modelEl = modelEl;
    return modelEl;
  }

  clearModel() {
    const modelEl = this.modelEl;
    if (!modelEl) return;
    this.modelEl = null;
    disposeObject3D(modelEl.object3D);
    modelEl.parentNode?.removeChild(modelEl);
  }

  fitModel(model) {
    const size = frameModel(model, this.rootEl.object3D);
    if (size) this.orbit.fitTo(size);
  }

  /** Raycasting: verifica se o ponto de tela atinge o modelo. */
  select(clientX, clientY) {
    const camera = this.sceneEl.camera;
    if (!this.modelEl || !camera) return;

    const rect = this.sceneEl.canvas.getBoundingClientRect();
    this.pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, camera);

    const hits = this.raycaster.intersectObject(this.modelEl.object3D, true);
    if (hits.length === 0) return;
    this.ringEl.emit('pulse');
    this.onVehicleClick(hits[0]);
  }

  update(deltaTime) {
    this.orbit.update(deltaTime, this.rootEl.object3D, this.cameraEl.object3D, this.sceneEl.camera?.aspect);
  }

  setState(state) {
    const message = MESSAGES[state];
    this.overlayEl.hidden = !message;
    this.overlayEl.dataset.state = state;
    this.overlayTextEl.textContent = message ?? '';
    this.noticeEl.hidden = state !== 'placeholder';
  }

  showMessage(text) {
    this.loadToken++;
    this.clearModel();
    this.setState('error');
    this.overlayTextEl.textContent = text;
  }
}
