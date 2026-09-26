# Guia de tratamento de modelos 3D

Passo a passo para levar um modelo 3D (baixado, comprado ou modelado) até o showroom, passando pelo Blender.

Siga as etapas na ordem. A [checklist final](#checklist-final) resume tudo para conferir antes de publicar.

```text
Escolher o modelo → Importar no Blender → Limpar → Escala e orientação → Nomear
→ Materiais → Otimizar → Exportar GLB → Salvar no projeto → Registrar no JSON → Testar → Publicar
```

> O [blender-export.md](blender-export.md) detalha as opções da janela de exportação. Este guia cobre o processo inteiro.

---

## 1. Escolher o modelo

Antes de baixar, verifique:

| Item | O que procurar |
|---|---|
| **Licença** | Prefira **CC0** (domínio público) ou **CC-BY** (exige crédito). Evite licenças que proíbem redistribuição, porque o GLB fica público no GitHub Pages. Confira a licença na página do modelo, não só no nome dele: o `concept-car-003` diz "CC0" no título, mas os metadados do arquivo citam outra licença. |
| **Marcas** | Modelos de carros reais (logos e nomes de fabricantes) podem ter restrição de uso comercial de marca, mesmo com licença livre. |
| **Formato** | Em ordem de preferência: `.blend` > `.glb`/`.gltf` > `.fbx` > `.obj`. FBX costuma trazer escalas e armatures desnecessárias. |
| **Complexidade** | Veja o número de triângulos na página. Acima de ~1 milhão, espere bastante trabalho de otimização. |
| **Texturas** | Prefira modelos com texturas PBR (base color, roughness/metallic, normal). |

Anote a URL, o autor e a licença. Você vai precisar deles na [etapa 12](#12-publicar).

## 2. Organizar os arquivos de trabalho

Os arquivos-fonte **não vão para o repositório**, só o `.glb` final:

```text
Fora do repositório (ex.: Documentos/showroom-3d-fontes/)
└── concept-car-003/
    ├── original/                  # download original, intocado
    ├── concept-car-003.blend      # arquivo de trabalho
    └── LICENSE.txt                # URL, autor e licença anotados

Dentro do repositório
└── assets/models/concept-car-003.glb   # só o resultado final
```

Assim você sempre pode refazer o tratamento a partir do original.

## 3. Importar no Blender

1. Abra um arquivo novo: *File → New → General*. Apague o cubo, a câmera e a luz padrão (`A`, depois `X`).
2. Importe: *File → Import → glTF 2.0 / FBX / Wavefront (.obj)*.
3. Salve já como `.blend` na pasta de trabalho.
4. Ative as estatísticas: no cabeçalho do viewport, *Overlays → Statistics*. Anote os triângulos iniciais.

## 4. Limpar a cena

Modelos baixados quase sempre trazem coisas que não fazem parte do carro.

### 4.1 Peças soltas

1. No viewport, pressione `Home` para enquadrar **tudo**. Se o carro aparecer minúsculo, existem objetos longe dele.
2. No *Outliner*, clique nos objetos um por um (`.` do teclado numérico enquadra o selecionado) e **apague** o que estiver fora do carro.
3. Confira de novo com `Home`: o enquadramento deve mostrar só o carro.

> No `concept-car-003` eram **23 objetos** a até 270 m do carro (relógio do painel, telas etc.). O viewer esconde essas peças automaticamente e avisa no console, mas elas continuam pesando no download. O certo é apagá-las (ou reposicioná-las, se forem peças úteis).

### 4.2 Itens que devem sair

| Remover | Por quê |
|---|---|
| Câmeras e luzes | A cena do site já tem as suas |
| Planos de chão e de sombra (ex.: `ground_shadow`) | O site já tem plataforma; planos grandes atrapalham o enquadramento |
| Objetos ocultos (ícone de olho fechado no Outliner) | São exportados mesmo assim, conforme as opções |
| Peças internas nunca vistas (motor completo, parafusos) | Pesam sem aparecer, a menos que você planeje o modo interior (Fase 5) |

### 4.3 Armature (esqueleto) desnecessária

Conversões do Sketchfab e de FBX costumam ligar quase todas as peças a um esqueleto sem animação útil. Isso complica medidas e raycasting.

1. Selecione as malhas ligadas a ela. Na aba *Modifiers* (ícone de chave), no modificador **Armature**, use *Apply* (`Ctrl+A` sobre o modificador).
2. Apague o objeto **Armature**.
3. Mantenha a armature **só** se houver animação que você vá usar (portas, por exemplo, na Fase 4).

### 4.4 Dados órfãos

*File → Clean Up → Purge Unused Data* (repita até não restar nada). Isso remove materiais, texturas e malhas que não estão mais em uso.

## 5. Escala, orientação e origem

O site espera **metros**, **frente virada para −Y** no Blender e o carro **apoiado no chão**.

1. **Escala:** abra o painel lateral (`N`, aba *Item*) e veja **Dimensions**. Um carro de passeio tem cerca de 4,0–5,0 m de comprimento, 1,7–2,0 m de largura e 1,4–1,8 m de altura. Se aparecer 450 m ou 0,045 m, selecione tudo e escale (`S`) até o tamanho real.
2. **Orientação:** na vista de cima (`7` do teclado numérico), a frente do carro deve apontar **para baixo na tela (−Y)**. Gire com `R Z 90` (ou `180`) se precisar.
3. **Chão:** as rodas devem tocar **Z = 0**.
4. **Origem:** posicione o 3D Cursor em `0,0,0` (`Shift+C`), selecione tudo e use *Object → Set Origin → Origin to 3D Cursor*. O carro deve ficar centralizado em X/Y.
5. **Aplicar transformações:** selecione tudo e use `Ctrl+A → All Transforms`. Depois disso, *Location* deve ficar `0`, *Rotation* `0°` e *Scale* `1`.

> Portas, capô e porta-malas que um dia serão animados (Fase 4) devem ter a **origem no eixo da dobradiça**. Ajuste com *Set Origin → Origin to 3D Cursor* depois de posicionar o cursor na dobradiça.

## 6. Hierarquia e nomes

Nomes previsíveis permitem interagir com as peças no futuro (Fases 2, 3 e 7). Use exatamente estes, em inglês:

| Objeto | Nome |
|---|---|
| Carroceria (lataria pintada) | `Body` |
| Portas | `Door_FL`, `Door_FR`, `Door_RL`, `Door_RR` (Front/Rear, Left/Right) |
| Capô / porta-malas | `Hood`, `Trunk` |
| Rodas | `Wheel_FL`, `Wheel_FR`, `Wheel_RL`, `Wheel_RR` |
| Vidros | `Glass` |
| Interior | `Interior` |
| Faróis / lanternas | `Headlights`, `Taillights` |

Partes que não precisam de interação podem ser **unidas** (`Ctrl+J`) nas peças acima ou em um objeto `Details`. Isso também reduz draw calls (veja a [etapa 8](#8-otimizar)).

## 7. Materiais e texturas

- Use apenas **Principled BSDF**. Nós procedurais (Noise, Voronoi etc.) **não são exportados** para glTF e precisam ser "assados" (*bake*) em textura.
- Chame o material da pintura de **`Paint`**. Isso vai permitir trocar a cor em tempo real na Fase 7.
- **Vidro:** *Alpha* entre 0,2 e 0,4. Nas configurações do material, *Blend Mode* deve ser **Alpha Blend**.
- **Luzes:** use *Emission* nos faróis e lanternas.
- **Texturas:** no máximo **2048 × 2048** (1024 quando possível), empacotadas no `.glb` (a exportação `.glb` já embute).
- Aplique a cor do veículo em `colorHex` no JSON (etapa 10) com um valor parecido com a pintura.

## 8. Otimizar

Metas para o site carregar bem, inclusive no celular:

| Métrica | Meta | Limite | Onde ver |
|---|---|---|---|
| Triângulos | ≤ 300 mil | 500 mil | *Overlays → Statistics* |
| Tamanho do `.glb` | ≤ 15 MB | 30 MB | Explorador de arquivos |
| Objetos (malhas) | ≤ 50 | 100 | Outliner |
| Materiais | ≤ 20 | 30 | *Blender File* no Outliner |
| Texturas | ≤ 2048 px | 4096 px | *Image Editor* |

> Referência: o `concept-car-003` original tem **38 MB, ~800 mil triângulos e 252 malhas**. Funciona, mas está acima das metas.

Técnicas, da mais segura para a mais agressiva:

1. **Apagar o invisível:** faces internas, parte de baixo do chassi e interior, se não houver modo interior.
2. **Merge by Distance:** em *Edit Mode*, selecione tudo e use `M → By Distance` para remover vértices duplicados.
3. **Unir objetos:** peças com o mesmo material que não precisam de interação (`Ctrl+J`).
4. **Decimate:** modificador *Decimate → Collapse*, com *Ratio* entre 0,3 e 0,7, **só** em peças pouco visíveis (interior, chassi, pneus internos). Evite na carroceria.
5. **Reduzir texturas:** redimensione imagens maiores que 2048 px.

Compare os triângulos com o valor anotado na etapa 3.

## 9. Exportar o GLB

*File → Export → glTF 2.0 (.glb/.gltf)*. As opções essenciais (detalhes em [blender-export.md](blender-export.md)):

| Opção | Valor |
|---|---|
| Format | **glTF Binary (.glb)** |
| Include → Limit to | **Visible Objects** |
| Transform | **+Y Up** marcado |
| Mesh | **Apply Modifiers** marcado |
| Material | Export |
| Animation | Desmarcado (a menos que use animações) |
| Compression | Desmarcado (o site ainda não tem decodificador Draco) |

Salve direto na pasta do projeto, conforme a etapa seguinte.

## 10. Salvar no projeto e registrar

### 10.1 Nomes e pastas

Use o mesmo identificador (`id`) em todos os arquivos, em **kebab-case** (minúsculas, hífens, sem acentos):

| Arquivo | Caminho | Formato |
|---|---|---|
| Modelo | `assets/models/<id>.glb` | GLB |
| Thumbnail do catálogo | `assets/images/<id>.webp` | WebP, **480 × 270** (16:9), fundo escuro |

Exemplo: `id` = `concept-car-003` → `assets/models/concept-car-003.glb` e `assets/images/concept-car-003.webp`.

**Thumbnail:** renderize no Blender (câmera em 3/4 frontal, fundo `#0d0f12`) ou tire um print do próprio showroom. Depois converta para WebP (qualidade ~80).

### 10.2 Registrar no catálogo

Adicione um item em `data/vehicles.json`. A ordem no arquivo é a ordem na tela, e o primeiro abre selecionado:

```json
{
  "id": "concept-car-003",
  "brand": "Concept",
  "model": "Car 003",
  "version": "Protótipo de demonstração",
  "year": 2025,
  "mileage": 0,
  "engine": "Elétrico (conceito)",
  "transmission": "Automático",
  "color": "Grafite",
  "colorHex": "#2b2e33",
  "body": "Hatch",
  "fuel": "Elétrico",
  "price": 450000,
  "model3d": "assets/models/concept-car-003.glb",
  "thumbnail": "assets/images/concept-car-003.webp",
  "gallery": [
    { "label": "Frente", "view": "front", "image": "assets/images/views/front.svg" },
    { "label": "Lateral", "view": "side", "image": "assets/images/views/side.svg" },
    { "label": "Traseira", "view": "rear", "image": "assets/images/views/rear.svg" },
    { "label": "Interior", "view": "interior", "image": "assets/images/views/interior.svg" }
  ]
}
```

Nenhum código precisa ser alterado.

## 11. Testar

1. Rode o servidor local na raiz do projeto: `python -m http.server 8000`. Abra `http://localhost:8000` e o console do navegador (`F12`).
2. Selecione o veículo e verifique:

| Verificação | Esperado | Se falhar |
|---|---|---|
| Aviso "Modelo provisório" | **Não** aparece | O caminho em `model3d` não bate com o arquivo |
| Tamanho e posição | Carro centralizado, apoiado na plataforma | Refaça a etapa 5 |
| Botão **Frente** | Mostra a **frente** do carro | Frente não está em −Y: gire 180° (ou 90°) e reexporte |
| Botões **Lateral** / **Traseira** | Vistas corretas | Idem |
| Pintura e vidros | Cores e transparência corretas | Refaça a etapa 7 |
| Nada "voando" pela cena, mesmo com zoom máximo | Nada fora do carro | Refaça a etapa 4.1 |
| Clique no carro | Painel da direita pisca em azul | Normalmente é consequência de escala ou peças soltas |

3. Mensagens do console que indicam problema no modelo:

| Mensagem | Significado | Correção |
|---|---|---|
| `N peça(s) solta(s) longe do modelo foram ocultadas` | Há objetos fora do carro | Etapa 4.1 |
| `Escala suspeita (...). Reescalando para ~4,5 m.` | Modelo em unidade errada | Etapa 5 |
| `Falha ao carregar ...` | GLB corrompido ou com extensão sem suporte | Reexporte sem compressão |

4. **Validador oficial (opcional):** arraste o `.glb` no [glTF Validator](https://github.khronos.org/glTF-Validator/) ou no [gltf.report](https://gltf.report/). O ideal é zero erros; avisos podem ser aceitáveis.

## 12. Publicar

1. **Crédito:** se a licença exigir (CC-BY) ou se o modelo for de terceiros, adicione autor, link e licença na seção **Créditos** do `README.md`.
2. **Tamanho no Git:** o GitHub avisa acima de **50 MB** e **recusa arquivos acima de 100 MB**. Mantenha os GLBs abaixo de 30 MB. Com muitos modelos grandes, avalie Git LFS ou um CDN (Fase 16).
3. Faça o commit do `.glb`, do `.webp` e do `vehicles.json` juntos. O push na `main` publica automaticamente no GitHub Pages.

---

## Checklist final

- [ ] Licença verificada; autor, link e licença anotados
- [ ] Original guardado fora do repositório; `.blend` de trabalho salvo
- [ ] Peças soltas, câmeras, luzes, planos de sombra e objetos ocultos removidos
- [ ] Armature removida (ou mantida só se houver animação usada)
- [ ] *Purge Unused Data* executado
- [ ] Dimensões em metros e realistas
- [ ] Frente em −Y, rodas em Z = 0, origem no centro do piso
- [ ] Transformações aplicadas (`Ctrl+A → All Transforms`)
- [ ] Objetos nomeados (`Body`, `Door_FL`, `Wheel_FL`...) e material da pintura chamado `Paint`
- [ ] Só Principled BSDF; texturas ≤ 2048 px
- [ ] ≤ 300 mil triângulos e `.glb` ≤ 15 MB (ou justificativa para passar disso)
- [ ] Exportado como `.glb` com **+Y Up**, sem compressão
- [ ] Salvo como `assets/models/<id>.glb` + thumbnail `assets/images/<id>.webp` (480 × 270)
- [ ] Registrado em `data/vehicles.json`
- [ ] Testado localmente: sem "Modelo provisório", vistas corretas, nada voando, console sem avisos do viewer
- [ ] Créditos no README, se necessário
