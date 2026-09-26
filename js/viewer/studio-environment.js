import { disposeObject3D } from './three-utils.js';

const THREE = AFRAME.THREE;

/**
 * Ambiente de estúdio (reflexos) gerado em tempo real, sem arquivos HDR externos.
 * Materiais PBR metálicos de GLBs reais ficam quase pretos sem um mapa de ambiente.
 */
export function applyStudioEnvironment(sceneEl) {
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
