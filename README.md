# Tetris - Phaser + Vite + TypeScript

Uma implementação simples de Tetris feita com Phaser 3, empacotada com Vite e escrita em TypeScript. O visual segue um estilo "terminal verde" com fontes monoespaçadas, efeitos de brilho e um HUD em HTML/CSS ao lado do canvas.

Este repositório é ideal para estudo, experimentos e como base para adicionar melhorias (sons, rankings, SRS, tutoriais, etc.).

## Principais recursos

- Mecânica básica de Tetris (movimentação, rotação, queda suave e queda rápida)
- Hold/Swap (tecla C)
- Próxima peça exibida (preview)
- HUD em HTML/CSS ao lado do canvas: pontuação, linhas, nível, barra de progresso, previews de Hold/Next e controles
- Estilo visual "terminal verde" com brilho, dissolução de linha e efeito especial em TETRIS (flash + scanlines + banner piscando)
- Limpeza de linhas com animação de dissolução (modo terminal) segura para múltiplas linhas simultâneas
- Reiniciar via botão no HUD ou tecla R
- Detecta Game Over quando peça trava acima do topo
- Projeto em TypeScript com configuração Phaser + Vite pronta para desenvolvimento

## Requisitos

- Node.js (recomenda-se a versão LTS mais recente)
- npm (vem com Node.js)

## Scripts úteis

Abra um terminal no diretório do projeto e rode:

```bash
npm install
npm run dev        # inicia servidor de desenvolvimento (hot-reload)
npm run build      # cria build de produção em dist/
```

Alternativas para não enviar dados anônimos (veja "Sobre log.js" mais abaixo):

```bash
npm run dev-nolog
npm run build-nolog
```

## Estrutura do projeto (resumo)

- `index.html` - Página que contém o canvas do jogo e o HUD overlay em HTML/CSS
- `public/style.css` - Estilos globais e layout do HUD (estética terminal)
- `src/main.ts` - Bootstrap da aplicação (entrada do Vite)
- `src/game/main.ts` - Configuração do Phaser (tamanho do canvas, scale mode)
- `src/game/scenes/Game.ts` - Lógica do jogo (spawns, movimentos, colisões, desenho)

## Controles

- ← / → : mover peça para os lados
- ↓ : soft drop (queda mais rápida enquanto segurado)
- ↑ : rotacionar a peça
- Space : hard drop (queda instantânea)
- C : segurar/trocar peça (hold)
- R : reiniciar o jogo
- Botão Restart no HUD também reinicia

## Como funciona o HUD

O HUD foi implementado como um overlay HTML/CSS posicionado ao lado do canvas. Isso facilita tipografia, responsividade e previews (Hold/Next) usando pequenas grades CSS. A fonte utilizada por padrão é `Share Tech Mono` (Google Fonts) para reforçar o visual "terminal".

O conjunto canvas+HUD está envolvido por um elemento `.game-wrap` que é escalado via CSS transform por um pequeno script para ajustar suavemente o layout em viewports menores, mantendo a proporção.

## Personalização rápida

- Fonte do HUD: edite `index.html` para trocar a fonte ou chame `setHudFont()` no código para alterar dinamicamente.
- Cores: cada forma tem uma cor definida em `src/game/scenes/Game.ts` no array `SHAPE_COLORS`.
- Tamanho das células: altere `CELL_SIZE` em `src/game/scenes/Game.ts` e ajuste o `CANVAS_W/CANVAS_H` em `src/game/main.ts` se necessário.

## Sobre log.js

O projeto contém um pequeno utilitário `log.js` que faz uma chamada silenciosa para um domínio usado pelos mantenedores do template para coletar métricas anônimas de uso (nome do template, ambiente dev/build e versão do Phaser). Nenhum dado pessoal é coletado. Se você preferir não enviar nada, há três opções:

1) Use os scripts `dev-nolog` / `build-nolog` já inclusos no `package.json`.
2) Remova o arquivo `log.js` e remova sua chamada nos scripts do `package.json`.
3) Ignore — a chamada é silenciosa e não envia dados pessoais.

## Nota sobre build/scale

O jogo é renderizado em um canvas com tamanho fixo (calculado a partir da grade 10x20 e `CELL_SIZE`). Para manter alinhamento previsível entre o canvas e o HUD, o modo de escala do Phaser está definido como `Scale.NONE` e um wrapper `.game-wrap` é usado para escalonamento via CSS (script em `index.html`).

## Executando localmente (passo-a-passo)

1. Instale dependências:

```bash
npm install
```

2. Rode em modo desenvolvimento:

```bash
npm run dev
```

3. Abra `http://localhost:8080` (ou o endereço mostrado no terminal) e jogue.

4. Para criar produção:

```bash
npm run build
```

## Deploy / Publicação

### Build de Produção

```bash
npm install
npm run build
```
Gera a pasta `dist/` pronta para servir estaticamente.

### GitHub Pages (mesmo repositório)
1. Crie branch `gh-pages` ou use workflow (veja abaixo).
2. Ative Pages apontando para a pasta `gh-pages` (root) nas settings.
3. Adicione um GitHub Action (exemplo abaixo) para publicar automaticamente.

Workflow sugerido (`.github/workflows/deploy.yml`):
```yaml
name: Deploy
on:
	push:
		branches: [ master ]
permissions:
	contents: write
jobs:
	build:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v4
			- uses: actions/setup-node@v4
				with:
					node-version: 20
					cache: npm
			- run: npm ci
			- run: npm run build
			- name: Publish
				uses: peaceiris/actions-gh-pages@v4
				with:
					github_token: ${{ secrets.GITHUB_TOKEN }}
					publish_dir: ./dist
```

### Subpasta em Portfólio
Copie o conteúdo de `dist/` para `meu-portfolio/games/tetris/` e linke com:
```html
<a href="games/tetris/">Terminal Tetris</a>
```

### Embed via iframe
```html
<iframe src="games/tetris/index.html" width="640" height="720" style="border:0;background:#000" loading="lazy"></iframe>
```

### Vercel / Netlify
- Vercel: Importar repositório, build: `npm run build`, output: `dist`.
- Netlify: Arrastar pasta `dist/` para o painel ou configurar build igual.

### Ajustes de Caminho
`index.html` já usa caminhos relativos (`favicon.png`, `style.css`, `./src/main.ts`), então funciona em subpastas.

## Próximos passos e ideias

- Adicionar efeitos sonoros (drop, line clear, game over)
- Ranking local / online
- Suportar teclas alternativas / touch / mobile layout
- Implementar SRS (Super Rotation System)
- Sistema de combos e back-to-back Tetris
- Tema alternável (ex: amber, cyan monocromático, dark matrix)

## Créditos

Baseado no template Phaser + Vite + TypeScript. Criado e mantido por você — sinta-se livre para adaptar e publicar suas melhorias.

License: MIT
