/** Libera da GPU geometrias, materiais e texturas de um objeto e de seus filhos. */
export function disposeObject3D(root) {
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

export function whenSceneLoaded(sceneEl) {
  return new Promise((resolve) => {
    if (sceneEl.hasLoaded) resolve();
    else sceneEl.addEventListener('loaded', resolve, { once: true });
  });
}

export async function assetExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}
