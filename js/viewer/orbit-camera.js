/**
 * Órbita da câmera em torno do veículo: yaw (giro do carro), pitch (elevação da câmera)
 * e distância (zoom), com limites e suavização. Não conhece o DOM nem o A-Frame.
 */
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
const TARGET_HEIGHT = 0.42; // altura do ponto observado, em fração da altura do modelo

// Em telas estreitas (retrato) a câmera recua proporcionalmente para o carro caber na largura.
const REFERENCE_ASPECT = 1.2;

// Vistas predefinidas (yaw do veículo). A frente do modelo aponta para +Z, em direção à câmera.
const VIEW_YAWS = {
  front: 0,
  side: -Math.PI / 2,
  rear: Math.PI,
};

export class OrbitCamera {
  constructor() {
    this.yaw = this.yawGoal = INITIAL_YAW;
    this.pitch = this.pitchGoal = DEFAULT_PITCH;
    this.distance = this.distanceGoal = this.defaultDistance = 7;
    this.minDistance = 3;
    this.maxDistance = 11;
    this.target = new THREE.Vector3(0, 0.6, 0);
    this.targetGoal = this.target.clone();
    this.lookMatrix = new THREE.Matrix4();
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

  /** Ajusta limites, distância padrão e ponto observado ao tamanho do modelo (Vector3, em metros). */
  fitTo(size) {
    const radius = size.length() / 2;
    this.minDistance = radius * DISTANCE_MIN;
    this.maxDistance = radius * DISTANCE_MAX;
    this.distanceGoal = this.defaultDistance = radius * DISTANCE_DEFAULT;
    this.pitchGoal = DEFAULT_PITCH;
    this.targetGoal.set(0, size.y * TARGET_HEIGHT, 0);
  }

  /** Avança a suavização e aplica o resultado ao veículo (yaw) e à câmera. */
  update(deltaTime, vehicleObject, cameraObject, aspect = REFERENCE_ASPECT) {
    const t = 1 - Math.exp(-DAMPING * deltaTime);
    this.yaw += (this.yawGoal - this.yaw) * t;
    this.pitch += (this.pitchGoal - this.pitch) * t;
    this.distance += (this.distanceGoal - this.distance) * t;
    this.target.lerp(this.targetGoal, t);

    vehicleObject.rotation.y = this.yaw;

    const distance = this.distance * Math.max(1, REFERENCE_ASPECT / aspect);
    cameraObject.position.set(
      this.target.x,
      this.target.y + Math.sin(this.pitch) * distance,
      this.target.z + Math.cos(this.pitch) * distance
    );
    // Matrix4.lookAt segue a convenção de câmera (olha para -Z), ao contrário de Object3D.lookAt em grupos.
    this.lookMatrix.lookAt(cameraObject.position, this.target, cameraObject.up);
    cameraObject.quaternion.setFromRotationMatrix(this.lookMatrix);
  }
}
