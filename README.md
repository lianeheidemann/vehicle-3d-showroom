<div align="center">

# Vehicle 3D Showroom

[![Live Demo](https://img.shields.io/badge/Live_Demo-Abrir_showroom-3b82f6?style=for-the-badge&logo=githubpages&logoColor=white&labelColor=0d1117)](https://lianeheidemann.github.io/vehicle-3d-showroom/)
[![Deploy](https://img.shields.io/badge/Deploy-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white&labelColor=0d1117)](https://github.com/lianeheidemann/vehicle-3d-showroom/actions/workflows/pages.yml)

<p><img height="22" alt="HTML5" src="https://img.shields.io/badge/HTML5-161b22?style=for-the-badge&logo=html5&logoColor=E34F26">&nbsp;<img height="22" alt="CSS3" src="https://img.shields.io/badge/CSS3-161b22?style=for-the-badge&logo=css&logoColor=1572B6">&nbsp;<img height="22" alt="JavaScript" src="https://img.shields.io/badge/JavaScript-161b22?style=for-the-badge&logo=javascript&logoColor=F7DF1E">&nbsp;<img height="22" alt="A-Frame" src="https://img.shields.io/badge/A--Frame-161b22?style=for-the-badge&logo=aframe&logoColor=EF2D5E">&nbsp;<img height="22" alt="Three.js" src="https://img.shields.io/badge/Three.js-161b22?style=for-the-badge&logo=threedotjs&logoColor=white">&nbsp;<img height="22" alt="WebGL" src="https://img.shields.io/badge/WebGL-161b22?style=for-the-badge&logo=webgl&logoColor=D8303B">&nbsp;<img height="22" alt="Blender" src="https://img.shields.io/badge/Blender-161b22?style=for-the-badge&logo=blender&logoColor=F5792A">&nbsp;<img height="22" alt="Controle Xbox" src="https://img.shields.io/badge/Controle_Xbox-compat%C3%ADvel-161b22?style=for-the-badge&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI%2BPHBhdGggZmlsbD0iIzEwN0MxMCIgZD0iTTcgN2gxMGE1IDUgMCAwIDEgNC45IDRsLjkgNC42YTIuNiAyLjYgMCAwIDEtNC41IDIuM0wxNi40IDE2SDcuNmwtMS45IDEuOWEyLjYgMi42IDAgMCAxLTQuNS0yLjNsLjktNC42QTUgNSAwIDAgMSA3IDd6bTAgM3YxLjVINS41VjEzSDd2MS41aDEuNVYxM0gxMHYtMS41SDguNVYxMHptOS41IDBhMSAxIDAgMSAwIDAgMiAxIDEgMCAwIDAgMC0yem0tMiAyYTEgMSAwIDEgMCAwIDIgMSAxIDAgMCAwIDAtMnoiLz48L3N2Zz4%3D"></p>

**Showroom automotivo 3D para a web: explore, gire e aproxime veículos em modelos em alta resolução direto no navegador.**

<img src="midia/interface/interface-desktop-v2.webp" alt="Tela do Vehicle 3D Showroom" width="100%">

</div>

## Sobre

Catálogo de veículos com visualizador 3D interativo: o cliente escolhe um carro, gira, aproxima e consulta a ficha técnica. É um site **100% estático**, sem backend nem build, publicado no GitHub Pages.

- Modelos **GLB/glTF** carregados sob demanda, com enquadramento automático e iluminação de estúdio
- Vistas **Frente / Lateral / Traseira**, zoom com limites e clique no veículo
- Mouse, touch, teclado e **controle de Xbox** (com fio, Bluetooth ou emulado pelo InputMapper)
- Catálogo em um único [`data/vehicles.json`](data/vehicles.json)

> [!NOTE]
> Modelos usados são apenas para demonstração.

### Versão mobile

<p align="left"><img src="midia/interface/interface-mobile-v2.webp" alt="Interface do Vehicle 3D Showroom rodando no celular" width="300"></p>

## Executar

```bash
git clone https://github.com/lianeheidemann/vehicle-3d-showroom.git
cd vehicle-3d-showroom
python -m http.server 8000
```

Acesse **http://localhost:8000**. Não abra o `index.html` direto pelo arquivo (`file://`), porque o navegador bloqueia o carregamento do catálogo.

O deploy é automático: cada push na `main` publica no [GitHub Pages](https://lianeheidemann.github.io/vehicle-3d-showroom/).

## Controles

Compatível com **controle de Xbox** (Xbox One, Series X|S e Xbox 360) e com qualquer controle que o Windows reconheça como Xbox, como os emulados pelo InputMapper.

| Ação | Mouse | Touch | Teclado | Controle Xbox |
|---|---|---|---|---|
| Girar | Arrastar | Um dedo | `←` `→` | Setas `←` `→` ou analógico esquerdo |
| Ângulo vertical | Arrastar na vertical | Um dedo | `↑` `↓` | Analógico esquerdo |
| Zoom | Scroll | Pinça | `+` `-` | R / L (ou RT / LT) |
| Detalhes | — | — | — | — |

<p align="left"><img src="docs/images/xbox-controls.svg" alt="Botões do controle Xbox usados no showroom: L afasta e R aproxima (LT e RT também), analógico esquerdo gira e ajusta o ângulo, setas esquerda e direita giram o carro" width="640"></p>

**InputMapper:** ative a emulação de *Xbox 360 Controller* e pressione um botão com a página em foco para o navegador reconhecer o controle.

## Estrutura

```text
index.html · css/ · data/vehicles.json · assets/ (models, images, icon)
js/
├── app.js     # compõe os módulos
├── data/      # leitura do catálogo
├── input/     # mouse, touch, teclado, gamepad → Input Manager
├── viewer/    # cena 3D: carga, órbita, enquadramento, iluminação
├── ui/        # catálogo, ficha, vistas, avisos
└── utils/     # formatação
```

## Documentação

| Documento | Conteúdo |
|---|---|
| [Arquitetura](docs/01-architecture.md) | Módulos, dependências e decisões técnicas |
| [Guia de modelos 3D](docs/02-3d-models-guide.md) | Como tratar, salvar e publicar modelos no Blender |
| [Roadmap](docs/03-roadmap.md) | Próximas fases |

## Créditos e licença

- **Concept Car 003:** [FREE Concept Car 003 (CC0)](https://sketchfab.com/3d-models/free-concept-car-003-public-domain-cc0-77664fc474c444f4947e9834ed0d30ad), de [Unity Fan](https://sketchfab.com/unityfan777), no Sketchfab.
- Código sob a licença [MIT](LICENSE). Modelos de terceiros seguem suas próprias licenças.
