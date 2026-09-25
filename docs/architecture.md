# Arquitetura

## Visão geral

```text
index.html
  ├── A-Frame (script clássico, CDN) ─ inclui Three.js + renderer WebGL
  └── js/app.js (módulo ES)
        ├── fetch data/vehicles.json
        ├── catalog.js        lista → onSelect(vehicle)
        ├── vehicle-info.js   painel direito
        ├── gallery.js        miniaturas de vistas
        ├── viewer.js         VehicleViewer (cena A-Frame)
        └── input-manager.js  ← mouse / touch / keyboard / gamepad
```

## Renderização: A-Frame → Three.js → WebGL

- A cena, as luzes, a plataforma e a câmera são declaradas em HTML (`<a-scene>` em `index.html`).
- O GLB é carregado pelo componente nativo `gltf-model` do A-Frame.
- O Three.js usado é sempre `AFRAME.THREE`. Nenhuma outra cópia do Three.js é carregada e não existe segundo renderer.
- O componente `vehicle-viewer-tick`, registrado em `viewer.js`, chama `VehicleViewer.update()` a cada frame do A-Frame para aplicar a suavização de rotação, ângulo e zoom.

## Viewer

`VehicleViewer` (`js/viewer.js`):

| Responsabilidade | Como |
|---|---|
| Carregar modelo | `HEAD` no `model3d`. Se o arquivo existe, usa `gltf-model`; se não, usa `createPlaceholderCar()` |
| Um modelo por vez | `clearModel()` antes de cada carga; um token descarta cargas antigas que terminem fora de ordem |
| Liberar memória | `disposeObject3D()` percorre o modelo e chama `dispose()` em geometrias, materiais e texturas |
| Enquadramento | `Box3` do modelo: centraliza em X/Z, apoia no piso (Y = 0) e deriva as distâncias mín./padrão/máx. do raio. Peças soltas muito longe do conjunto e planos de sombra transparentes (comuns em exportações do Sketchfab) são ignorados na medição |
| Iluminação | Luzes do A-Frame + mapa de ambiente de estúdio gerado com `PMREMGenerator` (reflexos para materiais PBR, sem arquivo HDR) |
| Vistas | `setView('front' \| 'side' \| 'rear')` gira o veículo pelo caminho mais curto e restaura ângulo e distância padrão |
| Rotação | O yaw gira o **veículo** (`#vehicle-root`); o pitch muda a elevação da câmera entre 3° e 40° |
| Zoom | Distância da câmera limitada entre 1,3× e 5× o raio do modelo, então a câmera não entra no carro nem se afasta demais |
| Telas estreitas | A distância é compensada pelo aspect ratio para o carro caber na largura |
| Suavização | Interpolação exponencial (`1 - e^(-k·dt)`) em direção aos valores alvo |
| Clique | `THREE.Raycaster.setFromCamera` + `intersectObject(modelo, true)` → pulso no anel da plataforma + destaque do painel |

Estados do overlay: `loading`, `ready`, `placeholder` (aviso discreto), `error` ("Não foi possível carregar o modelo 3D.").

## Entrada

```text
Mouse ─────┐
Touch ─────┤
Keyboard ──┤
Gamepad ───┘
            ↓
      InputManager  → rotate(dYaw, dPitch) · zoom(fator) · select(x, y)
            ↓
      VehicleViewer
```

- As fontes de entrada não conhecem o viewer, só chamam o `InputManager`.
- `zoom` é multiplicativo (`< 1` aproxima), o que deixa scroll, pinça, gatilhos e teclado consistentes.
- O mouse usa Pointer Events e ignora `pointerType === 'touch'`, que fica com o `touch-input.js`, então não há eventos duplicados.
- Clique e toque só viram `select` se o ponteiro se mover menos de ~6–10 px. Acima disso é arrasto.
- O gamepad só roda o loop `requestAnimationFrame` enquanto há controle conectado.

Para adicionar uma nova ação (ex.: `resetCamera` para o botão Y na Fase 8): crie o método no `InputManager`, inscreva o viewer em `bindInput()` e chame a ação nas fontes desejadas.

## Tratamento de erros

| Situação | Usuário vê | Console |
|---|---|---|
| `vehicles.json` ausente/inválido | Mensagem no catálogo (com dica de servidor local se `file://`) | `console.error` com detalhes |
| GLB inexistente | Modelo provisório + aviso | `console.info` |
| GLB corrompido/falha no loader | "Não foi possível carregar o modelo 3D." | `console.error` |
| Thumbnail ausente | Placeholder hachurado | `console.warn` |
| Sem Gamepad API | "Gamepad indisponível neste navegador" | `console.info` |
| Sem controle | "Nenhum controle conectado" | — |

O `HEAD` de um GLB que ainda não existe aparece no console como um 404 de rede. Isso é esperado enquanto os modelos não forem exportados.
