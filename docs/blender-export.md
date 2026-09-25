# Exportando veículos do Blender para GLB

## Preparação da cena

1. **Escala:** 1 unidade = 1 metro (*Scene Properties → Units → Metric, Unit Scale 1.0*). Um sedã deve medir por volta de 4,5 m. O viewer reescala automaticamente modelos com escala muito fora (ex.: exportados em centímetros), mas é melhor exportar certo.
2. **Orientação:** no Blender, a frente do carro para **−Y** e o teto para **+Z**. Com a opção *+Y Up* do exportador, isso vira frente em **+Z** no glTF, a mesma convenção do carro provisório.
3. **Origem:** no centro do carro, na altura do piso. O viewer centraliza e apoia o modelo no chão mesmo assim.
4. **Aplicar transformações:** selecione tudo → *Ctrl+A → All Transforms*.
5. **Materiais:** use *Principled BSDF*. Cor, metalness, roughness, normal e emission são exportados.
6. **Remova** câmeras, luzes, objetos ocultos e modificadores desnecessários.

## Nomes dos objetos (preparação para a Fase 3)

Mesmo que o MVP trate o carro como um objeto só, já nomeie as partes:

```text
Body
Door_FL  Door_FR  Door_RL  Door_RR
Hood     Trunk
Wheel_FL Wheel_FR Wheel_RL Wheel_RR
Interior
Glass
```

Para portas, capô e porta-malas, coloque a origem de cada objeto no eixo da dobradiça. Isso vai facilitar as animações da Fase 4.

## Exportação

*File → Export → glTF 2.0 (.glb/.gltf)*

| Opção | Valor |
|---|---|
| Format | glTF Binary (`.glb`) |
| Include | Selected Objects (ou Visible Objects) |
| Transform | +Y Up ✔ |
| Data → Mesh | Apply Modifiers ✔, UVs ✔, Normals ✔ |
| Data → Material | Export |
| Data → Compression | Desligado no MVP (veja abaixo) |
| Animation | Desligado no MVP |

Salve em `assets/models/` com o nome definido em `model3d` no `data/vehicles.json`.

## Orçamento sugerido para web

- Até ~150–300 mil triângulos por veículo.
- Texturas de até 2048 px (1024 px quando possível), preferindo WebP ou KTX2 no futuro.
- Arquivo `.glb` idealmente abaixo de 10–15 MB.

## Compressão (futuro)

O A-Frame suporta Draco (configurando `gltf-model="dracoDecoderPath: ..."` no `<a-scene>`) e Meshopt. Ativar compressão exige configurar o decoder no `index.html`, e isso está planejado na Fase 17.

## Checklist rápido

- [ ] Escala em metros e transformações aplicadas
- [ ] Frente do carro em −Y no Blender
- [ ] Objetos nomeados
- [ ] Exportado como `.glb` em `assets/models/`
- [ ] Testado em `http://localhost:8000`, sem o aviso "Modelo provisório"
