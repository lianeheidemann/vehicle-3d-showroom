# Próximas implementações

Evoluções planejadas, organizadas por fase. Nada disto faz parte do MVP.

**Base já existente no MVP:** catálogo via JSON, viewer A-Frame com carga sob demanda e descarte de modelos, Input Manager (`rotate` / `zoom` / `select`), raycasting no modelo e leitura inicial da Gamepad API.

---

## Fase 2: Hotspots no veículo

Pontos interativos no modelo 3D: motor, roda, farol, porta, porta-malas, painel.

```text
clicar no hotspot → abrir pequeno painel → mostrar informação daquela parte
```

Informações possíveis: especificação, descrição, foto, vídeo, observação, estado da peça.

*Ponto de partida:* adicionar `hotspots: [{ id, label, position: [x,y,z], ... }]` por veículo no JSON e criar entidades filhas de `#vehicle-root`. Com isso elas giram junto com o carro e são testadas no mesmo raycast do `select`.

## Fase 3: Partes individuais do modelo

Objetos separados no Blender: `Body`, `Door_FL`, `Door_FR`, `Door_RL`, `Door_RR`, `Hood`, `Trunk`, `Wheel_FL`, `Wheel_FR`, `Wheel_RL`, `Wheel_RR`.

- clicar na porta → destacar porta
- clicar na roda → mostrar especificação
- clicar no motor → abrir informações

*Ponto de partida:* o raycast em `viewer.js` já retorna `hits[0].object`. Basta subir na hierarquia até achar um nome conhecido.

## Fase 4: Animações

Abrir/fechar portas, capô e porta-malas, girar rodas, animação da câmera e transição suave entre ângulos. Preparar as animações no Blender e exportá-las dentro do GLB (`animation-mixer` do A-Frame).

## Fase 5: Interior do veículo

Modo `3D exterior | Interior`: câmera dentro do veículo, rotação limitada e visualização de painel, bancos, console, volante e multimídia.

## Fase 6: Câmeras predefinidas

Posições: Frente, Traseira, Lateral esquerda, Lateral direita, Superior, Interior.

```text
câmera atual → interpolação suave → nova posição
```

*Já implementado:* Frente, Lateral e Traseira pelas miniaturas (`VehicleViewer.setView`, com interpolação suave pelo caminho mais curto). *Falta:* lateral esquerda/direita separadas, superior e interior.

## Fase 7: Personalização visual

Seletor de cor (Branco, Preto, Prata, Azul, Vermelho) trocando o material da carroceria em tempo real, sem carregar outro GLB por cor. Depende do material `Body` nomeado na Fase 3.

## Fase 8: Melhorias do Gamepad / DroidJoy

| Controle | Ação |
|---|---|
| Analógico esquerdo | Rotação |
| Analógico direito | Câmera |
| RT / LT | Zoom + / − |
| A | Selecionar / abrir informações |
| B | Fechar / voltar |
| Y | Resetar câmera |
| X | Alternar exterior/interior |

Indicador "🎮 Controle conectado", mostrando o nome (ex.: *Xbox Controller*, *DroidJoy Virtual Gamepad*) quando a Gamepad API informar. O MVP já mostra um status simples na barra inferior.

## Fase 9: Busca e filtros

Busca por marca, modelo e ano (o campo no topo já existe, desabilitado). Filtros por faixa de preço, ano, carroceria, combustível, câmbio e quilometragem, operando sobre o JSON local.

## Fase 10: Comparação de veículos

Selecionar dois veículos e comparar preço, motor, ano, km e câmbio lado a lado, com opção de alternar rapidamente entre os dois modelos 3D.

## Fase 11: Favoritos

Botão de coração salvando em `localStorage`. Se no futuro houver backend, associar os favoritos à conta do usuário.

## Fase 12: Compartilhamento

URLs diretas por veículo:

```text
/#vehicle=corolla-2024
```

(com hash, compatível com GitHub Pages sem configuração de servidor).

## Fase 13: Contato

Integrar "Tenho interesse" com WhatsApp, formulário, e-mail ou CRM.

## Fase 14: Agendamento

"Agendar visita" com data, horário, veículo, nome, telefone e e-mail. Requer backend ou serviço externo.

## Fase 15: Painel administrativo

Aplicação **separada** para vendedores cadastrarem veículo, preço, informações, imagens, GLB e disponibilidade. Requer backend, autenticação, banco de dados e armazenamento de arquivos. Não deve ser misturada com o site estático.

## Fase 16: Armazenamento dos modelos

Com mais veículos, tirar os GLBs grandes do GitHub Pages:

```text
GitHub               → código
Cloud storage / CDN  → GLB, texturas, imagens
```

Avaliar Cloudflare R2, AWS S3 e CDN. Como `model3d` já é uma URL, basta apontar para o novo domínio (com CORS liberado).

## Fase 17: Otimização 3D

```text
Blender → redução de polígonos → texturas otimizadas → compressão → GLB → Web
```

Avaliar Draco, Meshopt, KTX2, WebP, AVIF e lazy loading. Adicionar indicador de progresso do download (o MVP mostra apenas "Carregando modelo 3D…").

## Fase 18: Visualização em AR

"Ver na minha garagem" com tecnologias compatíveis com dispositivos móveis (WebXR AR, `model-viewer`/Quick Look).

## Fase 19: Visualização VR

Aproveitar o suporte a WebXR do A-Frame para um showroom virtual:

```text
Showroom virtual → usuário entra → anda entre veículos → seleciona um carro → consulta informações
```

Hoje os botões de VR do A-Frame ficam desativados (`vr-mode-ui="enabled: false"`).
