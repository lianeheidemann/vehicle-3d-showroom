/**
 * Prepara um modelo recém-carregado para o showroom: esconde peças soltas, corrige escala
 * absurda, centraliza sobre a plataforma e apoia no piso.
 */
const THREE = AFRAME.THREE;

const TYPICAL_CAR_LENGTH = 4.5; // metros
const SCALE_SANITY_RANGE = [1, 30]; // fora disso, a exportação provavelmente usou outra unidade

/**
 * Caixa do modelo ignorando o que não é o carro em si — comum em modelos convertidos
 * (Sketchfab/FBX): peças soltas muito longe do conjunto e planos de sombra transparentes.
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
 * Normaliza o modelo dentro de `rootObject` (que pode estar girado) e retorna seu tamanho
 * final em metros, ou null se não houver geometria visível.
 */
export function frameModel(model, rootObject) {
  const savedYaw = rootObject.rotation.y;
  rootObject.rotation.y = 0;
  rootObject.updateMatrixWorld(true);

  try {
    let box = computeFramingBox(model);
    if (box.isEmpty()) {
      console.warn('[viewer] Modelo sem geometria visível.');
      return null;
    }

    const largestSide = Math.max(...box.getSize(new THREE.Vector3()).toArray());
    const [minSide, maxSide] = SCALE_SANITY_RANGE;
    if (largestSide > maxSide || largestSide < minSide) {
      console.warn(`[viewer] Escala suspeita (${largestSide.toFixed(2)} unidades). Reescalando para ~4,5 m.`);
      model.scale.multiplyScalar(TYPICAL_CAR_LENGTH / largestSide);
      model.updateMatrixWorld(true);
      box = computeFramingBox(model);
    }

    const center = box.getCenter(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= box.min.y;
    return box.getSize(new THREE.Vector3());
  } finally {
    rootObject.rotation.y = savedYaw;
  }
}
