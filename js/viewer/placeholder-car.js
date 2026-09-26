/**
 * Carro provisório feito com primitivas Three.js.
 * Usado apenas enquanto o GLB exportado do Blender não existir em assets/models/.
 * Medidas em metros; a frente do carro aponta para +Z (convenção glTF).
 */
const THREE = AFRAME.THREE;

// Perfis laterais (x = comprimento, y = altura). Carroceria até a linha de cintura + cabine (vidros).
const SHAPES = {
  sedan: {
    width: 1.8,
    body: [[-2.3, 0.3], [2.3, 0.3], [2.36, 0.6], [2.2, 0.8], [0.9, 0.92], [-1.8, 0.95], [-2.3, 0.9], [-2.36, 0.6]],
    cabin: [[0.95, 0.9], [0.15, 1.4], [-0.95, 1.42], [-1.85, 0.94]],
    wheelRadius: 0.33,
    wheelbaseHalf: 1.37,
    lightY: 0.7,
    headlightZ: 2.33,
    taillightZ: -2.38,
  },
  suv: {
    width: 1.85,
    body: [[-2.2, 0.4], [2.2, 0.4], [2.25, 0.75], [2.1, 1.0], [1.0, 1.1], [-2.1, 1.12], [-2.25, 0.75]],
    cabin: [[1.05, 1.08], [0.35, 1.62], [-1.95, 1.62], [-2.1, 1.1]],
    wheelRadius: 0.37,
    wheelbaseHalf: 1.32,
    lightY: 0.88,
    headlightZ: 2.22,
    taillightZ: -2.23,
  },
};

function extrudeProfile(points, width, bevel) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: width - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
  });
  // Extrusão vai para +Z; gira para que o comprimento fique em Z (frente = +Z) e centraliza a largura.
  geometry.rotateY(-Math.PI / 2);
  geometry.translate(width / 2 - bevel, 0, 0);
  return geometry;
}

export function createPlaceholderCar(vehicle) {
  const spec = /suv/i.test(vehicle.body ?? '') ? SHAPES.suv : SHAPES.sedan;
  const group = new THREE.Group();
  group.name = 'PlaceholderCar';

  const paint = new THREE.MeshStandardMaterial({ color: vehicle.colorHex || '#9aa1ab', metalness: 0.35, roughness: 0.38 });
  const glass = new THREE.MeshStandardMaterial({ color: '#1f2934', metalness: 0.4, roughness: 0.15 });
  const tire = new THREE.MeshStandardMaterial({ color: '#111214', roughness: 0.9 });
  const rim = new THREE.MeshStandardMaterial({ color: '#a8aeb6', metalness: 0.7, roughness: 0.3 });
  const headlight = new THREE.MeshStandardMaterial({ color: '#dfe8ff', emissive: '#cfe0ff', emissiveIntensity: 0.9 });
  const taillight = new THREE.MeshStandardMaterial({ color: '#5a0d10', emissive: '#e5484d', emissiveIntensity: 0.7 });

  group.add(new THREE.Mesh(extrudeProfile(spec.body, spec.width, 0.06), paint));
  group.add(new THREE.Mesh(extrudeProfile(spec.cabin, spec.width * 0.86, 0.05), glass));

  const tireGeometry = new THREE.CylinderGeometry(spec.wheelRadius, spec.wheelRadius, 0.24, 32).rotateZ(Math.PI / 2);
  const rimGeometry = new THREE.CylinderGeometry(spec.wheelRadius * 0.6, spec.wheelRadius * 0.6, 0.26, 24).rotateZ(Math.PI / 2);
  const wheelX = spec.width / 2 - 0.1;
  for (const x of [-wheelX, wheelX]) {
    for (const z of [-spec.wheelbaseHalf, spec.wheelbaseHalf]) {
      const wheel = new THREE.Group();
      wheel.position.set(x, spec.wheelRadius, z);
      wheel.add(new THREE.Mesh(tireGeometry, tire), new THREE.Mesh(rimGeometry, rim));
      group.add(wheel);
    }
  }

  const lightGeometry = new THREE.BoxGeometry(0.38, 0.08, 0.04);
  for (const x of [-0.58, 0.58]) {
    const head = new THREE.Mesh(lightGeometry, headlight);
    head.position.set(x, spec.lightY, spec.headlightZ);
    const tail = new THREE.Mesh(lightGeometry, taillight);
    tail.position.set(x, spec.lightY + 0.05, spec.taillightZ);
    group.add(head, tail);
  }

  return group;
}
