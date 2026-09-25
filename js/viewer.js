/**
 * Visualizador 3D. A-Frame gerencia cena, câmera, luzes e o carregamento GLB (gltf-model);
 * o Three.js embutido no A-Frame (AFRAME.THREE) é usado só para enquadramento, órbita,
 * raycasting e liberação de memória — um único renderer.
 */
import { createPlaceholderCar } from './placeholder-car.js';

const THREE = AFRAME.THREE;
const { degToRad, clamp } = THREE.MathUtils;

const INITIAL_YAW = -0.65; // vista 3/4 frontal
const DEFAULT_PITCH = degToRad(12);
const PITCH_MIN = degToRad(3);
const PITCH_MAX = degToRad(40);
const DAMPING = 9; // maior = segue a entrada mais rápido

// Distâncias da câmera em múltiplos do raio da esfera que envolve o modelo.
const DISTANCE_MIN = 1.3; // impede a câmera de entrar no veículo
const DISTANCE_DEFAULT = 3.3;
const DISTANCE_MAX = 5; // impede afastar demais
// Em telas estreitas (retrato) a câmera recua proporcionalmente para o carro caber na largura.
const REFERENCE_ASPECT = 1.2;

// Vistas predefinidas (yaw do veículo). A frente do modelo aponta para +Z, em direção à câmera.
const VIEW_YAWS = {
  front: 0,
  side: -Math.PI / 2,
  rear: Math.PI,
};

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

function whenSceneLoaded(sceneEl) {
  return new Promise((resolve) => {
    if (sceneEl.hasLoaded) resolve();
    else sceneEl.addEventListener('loaded', resolve, { once: true });
  });
}

async function assetExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Caixa usada no enquadramento, ignorando o que não é o carro em si — comum em modelos
 * convertidos (Sketchfab/FBX): peças soltas muito longe do conjunto e planos de sombra transparentes.
 * As peças soltas também são ocultadas, para não aparecerem "voando" pela cena.
 */
function computeFramingBox(model) {
  const parts = [];
  model.traverse((object) => {
    if (!object.isMesh || !object.visible) return;
    const box = new THREE.Box3().setFromObject(object, true);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3()).toArray();
    const isFlatShadow = object.material?.transparent && Math.min(...size) <= Math.max(...size) * 0.001;
    if (!isFlatShadow) parts.push({ object, box, center: box.getCenter(new THREE.Vector3()) });
  });
  if (parts.length === 0) return new THREE.Box3();

  const quantile = (values, q) => values.slice().sort((a, b) => a - b)[Math.floor((values.length - 1) * q)];
  const median = new THREE.Vector3(
    quantile(parts.map((part) => part.center.x), 0.5),
    quantile(parts.map((part) => part.center.y), 0.5),
    quantile(parts.map((part) => part.center.z), 0.5)
  );
  const distances = parts.map((part) => part.center.distanceTo(median));
  const limit = quantile(distances, 0.75) * 3;

  const box = new THREE.Box3();
  const strayNames = [];
  parts.forEach((part, index) => {
    if (distances[index] <= limit) {
      box.union(part.box);
    } else {
      part.object.visible = false;
      strayNames.push(part.object.name || '(sem nome)');
    }
  });
  if (strayNames.length > 0) {
    console.warn(`[viewer] ${strayNames.length} peça(s) solta(s) longe do modelo foram ocultadas: ${strayNames.join(', ')}`);
  }
  return box;
}

/**
 * Ambiente de estúdio (reflexos) gerado em tempo real, sem arquivos HDR externos.
 * Materiais PBR metálicos de GLBs reais ficam quase pretos sem um mapa de ambiente.
 */
function applyStudioEnvironment(sceneEl) {
  const studio = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(24, 12, 24), new THREE.MeshBasicMaterial({ color: 0x15181d, side: THREE.BackSide }));
  room.position.y = 5;
  studio.add(room);

  const softbox = (width, height, position, intensity) => {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(intensity), side: THREE.DoubleSide });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    panel.position.set(...position);
    panel.lookAt(0, 0.5, 0);
    studio.add(panel);
  };
  softbox(14, 4, [0, 10.8, 0], 3); // teto
  softbox(8, 4, [11.8, 4, 2], 1.6); // laterais
  softbox(8, 4, [-11.8, 4, -2], 1.2);
  softbox(10, 3, [0, 3, 11.8], 0.8); // frente
  softbox(10, 3, [0, 3, -11.8], 0.5); // fundo

  const pmrem = new THREE.PMREMGenerator(sceneEl.renderer);
  sceneEl.object3D.environment = pmrem.fromScene(studio, 0.04).texture;
  pmrem.dispose();
  disposeObject3D(studio);
}

function disposeObject3D(root) {
  root.traverse((object) => {
    object.geometry?.dispose();
    const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value?.isTexture) value.dispose();
      }
      material.dispose();
    }
  });
}

export class VehicleViewer {
  constructor({ sceneEl, rootEl, cameraEl, ringEl, overlayEl, noticeEl, onVehicleClick = () => {} }) {
    Object.assign(this, { sceneEl, rootEl, cameraEl, ringEl, overlayEl, noticeEl, onVehicleClick });
    this.overlayTextEl = overlayEl.querySelector('[data-overlay-text]');

    this.yaw = this.yawGoal = INITIAL_YAW;
    this.pitch = this.pitchGoal = DEFAULT_PITCH;
    this.distance = this.distanceGoal = this.defaultDistance = 7;
    this.minDistance = 3;
    this.maxDistance = 11;
    this.target = new THREE.Vector3(0, 0.6, 0);
    this.targetGoal = this.target.clone();

    this.modelEl = null;
    this.loadToken = 0;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.lookMatrix = new THREE.Matrix4();

    this.ready = whenSceneLoaded(sceneEl).then(() => {
      applyStudioEnvironment(sceneEl);
      sceneEl.setAttribute('vehicle-viewer-tick', '');
      sceneEl.components['vehicle-viewer-tick'].viewer = this;
    });
  }

  bindInput(input) {
    input.on('rotate', (deltaYaw, deltaPitch) => this.rotate(deltaYaw, deltaPitch));
    input.on('zoom', (factor) => this.zoom(factor));
    input.on('select', (x, y) => this.select(x, y));
  }

  rotate(deltaYaw, deltaPitch) {
    this.yawGoal += deltaYaw;
    this.pitchGoal = clamp(this.pitchGoal + deltaPitch, PITCH_MIN, PITCH_MAX);
  }

  zoom(factor) {
    this.distanceGoal = clamp(this.distanceGoal * factor, this.minDistance, this.maxDistance);
  }

  /** Gira até uma vista predefinida pelo caminho mais curto. Retorna false se a vista não existir. */
  setView(view) {
    const yaw = VIEW_YAWS[view];
    if (yaw === undefined) return false;
    const fullTurns = Math.round((this.yawGoal - yaw) / (Math.PI * 2));
    this.yawGoal = yaw + fullTurns * Math.PI * 2;
    this.pitchGoal = DEFAULT_PITCH;
    this.distanceGoal = this.defaultDistance;
    return true;
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
      this.frameModel(modelEl.getObject3D('mesh'));
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
      this.frameModel(model);
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

  /** Centraliza o modelo sobre a plataforma e ajusta os limites de câmera ao seu tamanho. */
  frameModel(model) {
    const root = this.rootEl.object3D;
    const savedYaw = root.rotation.y;
    root.rotation.y = 0;
    root.updateMatrixWorld(true);

    let box = computeFramingBox(model);
    if (box.isEmpty()) {
      console.warn('[viewer] Modelo sem geometria visível.');
      root.rotation.y = savedYaw;
      return;
    }

    // Protege contra exportações em escala errada (ex.: centímetros).
    const largestSide = Math.max(...box.getSize(new THREE.Vector3()).toArray());
    if (largestSide > 30 || largestSide < 1) {
      console.warn(`[viewer] Escala suspeita (${largestSide.toFixed(2)} unidades). Reescalando para ~4,5 m.`);
      model.scale.multiplyScalar(4.5 / largestSide);
      model.updateMatrixWorld(true);
      box = computeFramingBox(model);
    }

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= box.min.y;
    root.rotation.y = savedYaw;

    const radius = size.length() / 2;
    this.minDistance = radius * DISTANCE_MIN;
    this.maxDistance = radius * DISTANCE_MAX;
    this.distanceGoal = this.defaultDistance = radius * DISTANCE_DEFAULT;
    this.pitchGoal = DEFAULT_PITCH;
    this.targetGoal.set(0, size.y * 0.42, 0);
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
    const t = 1 - Math.exp(-DAMPING * deltaTime);
    this.yaw += (this.yawGoal - this.yaw) * t;
    this.pitch += (this.pitchGoal - this.pitch) * t;
    this.distance += (this.distanceGoal - this.distance) * t;
    this.target.lerp(this.targetGoal, t);

    this.rootEl.object3D.rotation.y = this.yaw;

    const aspect = this.sceneEl.camera?.aspect || REFERENCE_ASPECT;
    const distance = this.distance * Math.max(1, REFERENCE_ASPECT / aspect);
    const camera = this.cameraEl.object3D;
    camera.position.set(
      this.target.x,
      this.target.y + Math.sin(this.pitch) * distance,
      this.target.z + Math.cos(this.pitch) * distance
    );
    // Matrix4.lookAt segue a convenção de câmera (olha para -Z), ao contrário de Object3D.lookAt em grupos.
    this.lookMatrix.lookAt(camera.position, this.target, camera.up);
    camera.quaternion.setFromRotationMatrix(this.lookMatrix);
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
