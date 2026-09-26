/**
 * Ponto de entrada: cria os módulos, conecta uns aos outros e carrega o catálogo.
 * Nenhuma regra de negócio mora aqui — só a composição.
 */
import { loadVehicles } from './data/vehicle-repository.js';
import { attachGamepadInput } from './input/gamepad-input.js';
import { InputManager } from './input/input-manager.js';
import { attachKeyboardInput } from './input/keyboard-input.js';
import { attachMouseInput } from './input/mouse-input.js';
import { attachTouchInput } from './input/touch-input.js';
import { createCatalog } from './ui/catalog.js';
import { createGallery } from './ui/gallery.js';
import { renderGamepadStatus } from './ui/gamepad-status.js';
import { showToast } from './ui/toast.js';
import { createVehicleInfo } from './ui/vehicle-info.js';
import { VehicleViewer } from './viewer/vehicle-viewer.js';

const ACTION_MESSAGES = {
  interest: 'Demonstração: o contato com a loja será habilitado em uma próxima versão.',
  visit: 'Demonstração: o agendamento de visitas será habilitado em uma próxima versão.',
};
const VIEW_UNAVAILABLE_MESSAGE = 'A vista interior será habilitada em uma próxima versão.';

const byId = (id) => document.getElementById(id);

function createViewer({ onVehicleClick }) {
  return new VehicleViewer({
    sceneEl: byId('scene'),
    rootEl: byId('vehicle-root'),
    cameraEl: byId('camera'),
    ringEl: byId('platform-ring'),
    overlayEl: byId('viewer-overlay'),
    noticeEl: byId('viewer-notice'),
    onVehicleClick,
  });
}

/** Liga todas as fontes de entrada ao mesmo InputManager. */
function attachInputs(input) {
  const stageEl = byId('viewer-stage');
  const gamepadStatusEl = byId('gamepad-status');
  attachMouseInput(stageEl, input);
  attachTouchInput(stageEl, input);
  attachKeyboardInput(window, input);
  attachGamepadInput(input, { onStatusChange: (status) => renderGamepadStatus(gamepadStatusEl, status) });
}

function catalogErrorMessage() {
  const hint = location.protocol === 'file:'
    ? 'Abra o projeto por um servidor local (veja o README).'
    : 'Tente recarregar a página.';
  return `Não foi possível carregar os veículos. ${hint}`;
}

async function main() {
  const input = new InputManager();

  const info = createVehicleInfo(byId('vehicle-info'), {
    onAction: (action) => showToast(ACTION_MESSAGES[action] ?? 'Função disponível em breve.'),
  });
  const viewer = createViewer({ onVehicleClick: () => info.highlight() });
  const gallery = createGallery(byId('gallery'), {
    onSelect: (view) => {
      if (viewer.setView(view)) return true;
      showToast(VIEW_UNAVAILABLE_MESSAGE);
      return false;
    },
  });
  const catalog = createCatalog(byId('vehicle-list'), byId('catalog-count'), { onSelect: selectVehicle });

  viewer.bindInput(input);
  input.on('rotate', () => gallery.clearActive());
  attachInputs(input);

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
    catalog.showError(catalogErrorMessage());
    info.showEmpty('Catálogo indisponível no momento.');
    gallery.render([]);
    viewer.showMessage('Nenhum veículo para exibir.');
    return;
  }

  catalog.render(vehicles);
  selectVehicle(vehicles[0]);
}

main();
