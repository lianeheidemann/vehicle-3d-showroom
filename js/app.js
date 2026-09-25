import { createCatalog } from './catalog.js';
import { createGallery } from './gallery.js';
import { attachGamepadInput } from './gamepad-input.js';
import { InputManager } from './input-manager.js';
import { attachKeyboardInput } from './keyboard-input.js';
import { attachMouseInput } from './mouse-input.js';
import { showToast } from './toast.js';
import { attachTouchInput } from './touch-input.js';
import { createVehicleInfo } from './vehicle-info.js';
import { VehicleViewer } from './viewer.js';

const DATA_URL = 'data/vehicles.json';

const ACTION_MESSAGES = {
  interest: 'Demonstração: o contato com a loja será habilitado em uma próxima versão.',
  visit: 'Demonstração: o agendamento de visitas será habilitado em uma próxima versão.',
};

const VIEW_UNAVAILABLE_MESSAGE = 'A vista interior será habilitada em uma próxima versão.';

async function loadVehicles() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status} ao buscar ${DATA_URL}`);
  const vehicles = await response.json();
  if (!Array.isArray(vehicles) || vehicles.length === 0) throw new Error(`${DATA_URL} não contém uma lista de veículos`);
  return vehicles;
}

function renderGamepadStatus(el, { supported, connected, name }) {
  el.dataset.state = !supported ? 'unsupported' : connected ? 'connected' : 'idle';
  el.textContent = !supported
    ? 'Gamepad indisponível neste navegador'
    : connected
      ? `Controle conectado${name ? ` · ${name}` : ''}`
      : 'Nenhum controle conectado';
  el.title = el.textContent;
}

async function main() {
  const stageEl = document.getElementById('viewer-stage');
  const input = new InputManager();

  const info = createVehicleInfo(document.getElementById('vehicle-info'), {
    onAction: (action) => showToast(ACTION_MESSAGES[action] ?? 'Função disponível em breve.'),
  });
  const gallery = createGallery(document.getElementById('gallery'), {
    onSelect: (view) => {
      if (viewer.setView(view)) return true;
      showToast(VIEW_UNAVAILABLE_MESSAGE);
      return false;
    },
  });

  const viewer = new VehicleViewer({
    sceneEl: document.getElementById('scene'),
    rootEl: document.getElementById('vehicle-root'),
    cameraEl: document.getElementById('camera'),
    ringEl: document.getElementById('platform-ring'),
    overlayEl: document.getElementById('viewer-overlay'),
    noticeEl: document.getElementById('viewer-notice'),
    onVehicleClick: () => info.highlight(),
  });
  viewer.bindInput(input);
  input.on('rotate', () => gallery.clearActive());

  attachMouseInput(stageEl, input);
  attachTouchInput(stageEl, input);
  attachKeyboardInput(window, input);
  const gamepadStatusEl = document.getElementById('gamepad-status');
  attachGamepadInput(input, { onStatusChange: (status) => renderGamepadStatus(gamepadStatusEl, status) });

  const catalog = createCatalog(document.getElementById('vehicle-list'), document.getElementById('catalog-count'), {
    onSelect: selectVehicle,
  });

  function selectVehicle(vehicle) {
    catalog.setActive(vehicle.id);
    info.render(vehicle);
    gallery.render(vehicle.gallery);
    viewer.load(vehicle);
  }

  let vehicles;
  try {
    vehicles = await loadVehicles();
  } catch (error) {
    console.error('[app] Falha ao carregar o catálogo:', error);
    const hint = location.protocol === 'file:'
      ? 'Abra o projeto por um servidor local (veja o README).'
      : 'Tente recarregar a página.';
    catalog.showError(`Não foi possível carregar os veículos. ${hint}`);
    info.showEmpty('Catálogo indisponível no momento.');
    gallery.render([]);
    viewer.showMessage('Nenhum veículo para exibir.');
    return;
  }

  catalog.render(vehicles);
  selectVehicle(vehicles[0]);
}

main();
