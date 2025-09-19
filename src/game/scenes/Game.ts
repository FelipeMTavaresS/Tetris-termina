import { Scene } from 'phaser';

type Cell = number | null;

const GRID_W = 10;
const GRID_H = 20;
const CELL_SIZE = 32;

// Cores base por forma (paleta neon/terminal)
const SHAPE_COLORS = [
    0x00FFFF, // I 
    0xFFFF00, // O 
    0xe000ff, // T
    0x00aa66, // S
    0xFF0000, // Z
    0x0000FF, // J
    0xFFD700  // L
];

const SHAPES: Array<Array<Array<[number, number]>>> = [
    // I - peça I
    [
        [[-2,0],[-1,0],[0,0],[1,0]],
        [[0,-1],[0,0],[0,1],[0,2]]
    ],
    // O - peça O
    [
        [[0,0],[1,0],[0,1],[1,1]]
    ],
    // T - peça T
    [
        [[-1,0],[0,0],[1,0],[0,1]],
        [[0,-1],[0,0],[1,0],[0,1]],
        [[0,-1],[-1,0],[0,0],[1,0]],
        [[0,-1],[0,0],[-1,0],[0,1]]
    ],
    // S - peça S
    [
        [[0,0],[1,0],[-1,1],[0,1]],
        [[0,-1],[0,0],[1,0],[1,1]]
    ],
    // Z - peça Z
    [
        [[-1,0],[0,0],[0,1],[1,1]],
        [[1,-1],[0,0],[1,0],[0,1]]
    ],
    // J - peça J
    [
        [[-1,0],[0,0],[1,0],[-1,1]],
        [[0,-1],[0,0],[0,1],[1,1]],
        [[1,-1],[-1,0],[0,0],[1,0]],
        [[-1,-1],[0,-1],[0,0],[0,1]]
    ],
    // L - peça L
    [
        [[-1,0],[0,0],[1,0],[1,1]],
        [[0,-1],[0,0],[0,1],[1,-1]],
        [[-1,-1],[-1,0],[0,0],[1,0]],
        [[-1,1],[0,-1],[0,0],[0,1]]
    ]
];

function randInt(max: number) { return Math.floor(Math.random() * max); }

export class Game extends Scene {
    grid: Cell[][];
    graphics: Phaser.GameObjects.Graphics;
    lastDrop = 0;
    dropInterval = 500; // ms
    cursors: any;
    holdKey: any;
    hold: { shape: number, color: number } | null = null;
    holdUsed = false; // não pode segurar repetidamente até a peça travar
    current: {
        shape: number,
        rot: number,
        x: number,
        y: number,
        cells: Array<[number, number]>,
        color: number
    } | null = null;
    score = 0;
    lines = 0;
    level = 1;
    // score/info são exibidos pelo overlay HTML do HUD
    gameOver = false;
    gameOverText?: Phaser.GameObjects.Text | null = null;
    holdText!: Phaser.GameObjects.Text;
    controlsText!: Phaser.GameObjects.Text;
    holdEmptyText!: Phaser.GameObjects.Text;
    nextEmptyText!: Phaser.GameObjects.Text;
    hudFont: string = 'monospace';
    // HUD / barra lateral
    hudX = 0;
    hudW = 220;
    nextShape: number | null = null;

    constructor () {
        super('Game');
        this.grid = Array.from({ length: GRID_H }, () => Array.from({ length: GRID_W }, () => null));
    }

    create () {
    // fundo preto tratado por CSS/config, desenhar grade e peças com estilo terminal
        this.graphics = this.add.graphics();

        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.addKeys({
                left: Phaser.Input.Keyboard.KeyCodes.LEFT,
                right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
                down: Phaser.Input.Keyboard.KeyCodes.DOWN,
                up: Phaser.Input.Keyboard.KeyCodes.UP,
                space: Phaser.Input.Keyboard.KeyCodes.SPACE
            });
            this.holdKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        }

    // HUD é gerenciado pelo overlay HTML; não são necessários objetos de texto do Phaser

        this.spawnPiece();
        this.createHUD();

    // eventos de entrada para rotação
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-UP', () => { this.rotatePiece(); });
            this.input.keyboard.on('keydown-SPACE', () => { this.hardDrop(); });
            this.input.keyboard.on('keydown-C', () => { this.holdPiece(); });
            this.input.keyboard.on('keydown-R', () => { this.restart(); });
        }

    // Botão Restart no HUD (o handler de clique já existe) - garantir que seja exibido quando necessário
        const restartBtn = document.getElementById('hud-restart-btn');
        if (restartBtn) restartBtn.addEventListener('click', () => { this.restart(); });

    }

    // segurar/trocar a peça atual
    holdPiece() {
        if (this.gameOver) return;
        if (!this.current) return;
    if (this.holdUsed) return; // já usado durante esta queda

        const curShape = this.current.shape;

        if (!this.hold) {
            // colocar a peça atual no hold e gerar uma nova peça
            this.hold = { shape: curShape, color: this.current.color };
            this.holdUsed = true;
            this.spawnPiece();
        } else {
            // trocar a peça atual com a do hold
            const heldShape = this.hold.shape;
            // armazenar a peça atual no hold
            this.hold = { shape: curShape, color: this.current.color };
            // substituir a peça atual pela mantida (resetar rotação/posição)
            const rotations = SHAPES[heldShape];
            const rot = 0;
            const cells = rotations[rot];
            const x = Math.floor(GRID_W / 2);
            const y = -2;
            const color = SHAPE_COLORS[heldShape % SHAPE_COLORS.length];
            this.current = { shape: heldShape, rot, x, y, cells, color };
            this.holdUsed = true;
        }
    }

    update(time: number) {
    if (this.gameOver) return;

    // controlar movimento lateral (resposta imediata simples)
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.movePiece(-1);
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.movePiece(1);
        }
        if (this.cursors.down.isDown) {
            // queda mais rápida enquanto segura para baixo
            if (time - this.lastDrop > 50) {
                this.stepDown();
                this.lastDrop = time;
            }
        }

        if (time - this.lastDrop > this.dropInterval) {
            this.stepDown();
            this.lastDrop = time;
        }

    this.render();
    }

    spawnPiece() {
        // permitir segurar novamente para a nova peça gerada
        this.holdUsed = false;
        const shape = randInt(SHAPES.length);
        const rotations = SHAPES[shape];
        const rot = 0;
        const cells = rotations[rot];
        const x = Math.floor(GRID_W / 2);
    const y = -2; // iniciar acima da grade
    // atribuir cor para a forma
    const color = SHAPE_COLORS[shape % SHAPE_COLORS.length];

        this.current = { shape, rot, x, y, cells, color };

        if (this.collides(this.current, 0, 0)) {
            this.endGame();
        }
    }

    rotatePiece() {
        if (!this.current) return;
        const rotations = SHAPES[this.current.shape];
        const newRot = (this.current.rot + 1) % rotations.length;
        const cells = rotations[newRot];
        const test = { ...this.current, rot: newRot, cells };
        if (!this.collides(test, 0, 0)) {
            this.current.rot = newRot;
            this.current.cells = cells;
        }
    }

    movePiece(dir: number) {
        if (!this.current) return;
        if (!this.collides(this.current, dir, 0)) {
            this.current.x += dir;
        }
    }

    stepDown() {
        if (!this.current) return;
        if (!this.collides(this.current, 0, 1)) {
            this.current.y += 1;
        } else {
            this.lockPiece();
        }
    }

    hardDrop() {
        if (!this.current) return;
        while (!this.collides(this.current, 0, 1)) {
            this.current.y += 1;
            this.score += 2;
        }
        this.lockPiece();
    }

    collides(piece: any, dx: number, dy: number) {
        for (const cell of piece.cells) {
            const cx = piece.x + cell[0] + dx;
            const cy = piece.y + cell[1] + dy;
            if (cx < 0 || cx >= GRID_W) return true;
            if (cy >= GRID_H) return true;
            if (cy >= 0 && this.grid[cy][cx]) return true;
        }
        return false;
    }

    lockPiece() {
        if (!this.current) return;
    // se qualquer parte da peça estiver acima da grade visível ao travar, é game over
        let aboveTop = false;
        for (const cell of this.current.cells) {
            const cx = this.current.x + cell[0];
            const cy = this.current.y + cell[1];
            if (cy < 0) { aboveTop = true; }
            if (cy >= 0 && cy < GRID_H && cx >= 0 && cx < GRID_W) {
                this.grid[cy][cx] = this.current.color;
            }
        }
        this.clearLines();
        if (aboveTop) {
            // lock completado mas parte da peça fica acima da tela: terminar o jogo
            this.endGame();
            return;
        }
        this.spawnPiece();
    }

    clearLines() {
        let cleared = 0;
        for (let y = GRID_H - 1; y >= 0; y--) {
            if (this.grid[y].every(c => c !== null)) {
                // remover linha
                this.grid.splice(y, 1);
                this.grid.unshift(Array.from({ length: GRID_W }, () => null));
                cleared++;
                y++; // recheck same index
            }
        }
        if (cleared > 0) {
            this.lines += cleared;
            this.score += cleared * 100;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 500 - (this.level - 1) * 40);
        }
    }

    endGame() {
        this.gameOver = true;
    // mostrar Game Over no HUD DOM e botão de reiniciar
    const go = document.getElementById('hud-gameover');
    const rb = document.getElementById('hud-restart-btn');
    if (go) { go.style.display = 'block'; go.setAttribute('aria-hidden', 'false'); }
    if (rb) rb.style.display = 'inline-block';
    }

    restart() {
        // hide DOM HUD game over and restart button
        const go = document.getElementById('hud-gameover');
        const rb = document.getElementById('hud-restart-btn');
        if (go) { go.style.display = 'none'; go.setAttribute('aria-hidden', 'true'); }
        if (rb) rb.style.display = 'none';
        // reset state
        this.gameOver = false;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropInterval = 500;
        // clear grid
        this.grid = Array.from({ length: GRID_H }, () => Array.from({ length: GRID_W }, () => null));
        // clear HUD DOM values immediately
        const scoreEl = document.getElementById('hud-score'); if (scoreEl) scoreEl.innerText = '0';
        const infoEl = document.getElementById('hud-info'); if (infoEl) infoEl.innerHTML = `LINES: 0<br>LEVEL: 1`;
        const holdPreview = document.getElementById('hud-hold-preview'); if (holdPreview) holdPreview.innerHTML = '';
        this.hold = null;
        // spawn a fresh piece and continue
        this.spawnPiece();
    }

    render() {
        const gx = Math.floor((this.scale.width - GRID_W * CELL_SIZE) / 2);
        const gy = Math.floor((this.scale.height - GRID_H * CELL_SIZE) / 2);

        this.graphics.clear();

    // fundo da matriz
        this.graphics.fillStyle(0x001100, 1);
        this.graphics.fillRect(gx - 4, gy - 4, GRID_W * CELL_SIZE + 8, GRID_H * CELL_SIZE + 8);

    // linhas da grade
        this.graphics.lineStyle(1, 0x003300, 0.4);
        for (let i = 0; i <= GRID_W; i++) {
            const x = gx + i * CELL_SIZE;
            this.graphics.beginPath();
            this.graphics.moveTo(x, gy);
            this.graphics.lineTo(x, gy + GRID_H * CELL_SIZE);
            this.graphics.strokePath();
        }
        for (let i = 0; i <= GRID_H; i++) {
            const y = gy + i * CELL_SIZE;
            this.graphics.beginPath();
            this.graphics.moveTo(gx, y);
            this.graphics.lineTo(gx + GRID_W * CELL_SIZE, y);
            this.graphics.strokePath();
        }

    // desenhar blocos fixos
        for (let y = 0; y < GRID_H; y++) {
            for (let x = 0; x < GRID_W; x++) {
                const color = this.grid[y][x];
                if (color) {
                    this.drawCell(gx, gy, x, y, color);
                }
            }
        }

    // desenhar peça atual
        if (this.current) {
            for (const cell of this.current.cells) {
                const cx = this.current.x + cell[0];
                const cy = this.current.y + cell[1];
                if (cy >= 0) this.drawCell(gx, gy, cx, cy, this.current.color);
            }
        }

    // atualizar overlay DOM do HUD
        this.updateHudDom();
    }

    // Criação e desenho do HUD
    createHUD() {
        this.hudW = 220;
        this.hudX = Math.floor(this.scale.width - this.hudW - 24);
    // reposicionar textos para a área do HUD
    // O HUD será renderizado como overlay HTML (ver index.html)
    // O posicionamento ainda é monitorado para atualizações responsivas
    }

    updateHUDValues() {
        // mantido por compatibilidade, se necessário
    }

    drawHUD() {
        // O HUD não é mais desenhado aqui; o overlay DOM cuida disso.
    }

    drawPreviewSmall(baseX: number, baseY: number, shapeIdx: number, color: number, cellSize: number) {
        const cells = SHAPES[shapeIdx][0];
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const c of cells) {
            minX = Math.min(minX, c[0]);
            maxX = Math.max(maxX, c[0]);
            minY = Math.min(minY, c[1]);
            maxY = Math.max(maxY, c[1]);
        }
        const w = (maxX - minX + 1) * cellSize;
        const h = (maxY - minY + 1) * cellSize;
        const offsetX = Math.floor(((this.hudW - 32) - w) / 2);
        const offsetY = Math.floor(((60) - h) / 2);
        for (const c of cells) {
            const px = baseX + offsetX + (c[0] - minX) * cellSize;
            const py = baseY + offsetY + (c[1] - minY) * cellSize;
            this.graphics.fillStyle(color, 1);
            this.graphics.fillRect(px, py, cellSize - 2, cellSize - 2);
            const inner = Phaser.Display.Color.GetColor(Math.floor(((color >> 16) & 0xff) * 0.25),
                                                       Math.floor(((color >> 8) & 0xff) * 0.25),
                                                       Math.floor((color & 0xff) * 0.25));
            this.graphics.fillStyle(inner, 1);
            this.graphics.fillRect(px + 3, py + 3, cellSize - 8, cellSize - 8);
        }
    }

    // --- DOM HUD helpers -------------------------------------------------
    updateHudDom() {
        // Score and info
        const scoreEl = document.getElementById('hud-score');
        const infoEl = document.getElementById('hud-info');
        const barFill = document.getElementById('hud-bar-fill');
        if (scoreEl) scoreEl.innerText = String(this.score);
        if (infoEl) infoEl.innerHTML = `LINES: ${this.lines}<br>LEVEL: ${this.level}`;
        if (barFill) barFill.style.width = `${Math.floor((this.lines % 10) / 10 * 100)}%`;

        // Hold preview
        const holdPreview = document.getElementById('hud-hold-preview');
        if (holdPreview) {
            holdPreview.innerHTML = '';
            if (this.hold) {
                this.renderPreviewDom(holdPreview, this.hold.shape, this.hold.color);
            } else {
                holdPreview.innerText = 'Empty';
            }
        }

        // Next preview
        const nextPreview = document.getElementById('hud-next-preview');
        if (nextPreview) {
            nextPreview.innerHTML = '';
            const nextS = this.nextShape ?? (this.current ? ((this.current.shape + 1) % SHAPES.length) : 0);
            const nextColor = SHAPE_COLORS[nextS % SHAPE_COLORS.length];
            this.renderPreviewDom(nextPreview, nextS, nextColor);
        }
    }

    renderPreviewDom(container: HTMLElement, shapeIdx: number, color: number) {
    // criar uma pequena grade de divs para representar blocos
        const cells = SHAPES[shapeIdx][0];
    // calcular limites
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const c of cells) { minX = Math.min(minX, c[0]); maxX = Math.max(maxX, c[0]); minY = Math.min(minY, c[1]); maxY = Math.max(maxY, c[1]); }
        const w = maxX - minX + 1;
        const h = maxY - minY + 1;
    // contêiner dimensionado como grade CSS – usar variável CSS para o tamanho das tiles
    // assim as prévias escalam responsivamente
        const hudEl = document.getElementById('hud') || container;
        const cs = window.getComputedStyle(hudEl as Element);
        let tileStr = cs.getPropertyValue('--preview-tile') || '16px';
        tileStr = tileStr.trim();
        let tile = 16;
        if (tileStr.endsWith('px')) {
            tile = parseInt(tileStr.replace('px', ''), 10) || 16;
        } else {
            // fallback caso o valor não esteja em px
            const n = parseInt(tileStr, 10);
            if (!Number.isNaN(n)) tile = n;
        }
        const gap = Math.max(2, Math.round(tile * 0.125));
        container.style.display = 'grid';
        container.style.gridTemplateColumns = `repeat(${w}, ${tile}px)`;
        container.style.gridAutoRows = `${tile}px`;
        container.style.gap = `${gap}px`;
    // criar células
        for (let row = 0; row < h; row++) {
            for (let col = 0; col < w; col++) {
                const div = document.createElement('div');
                div.style.width = `${tile}px`;
                div.style.height = `${tile}px`;
                div.style.background = 'transparent';
                container.appendChild(div);
            }
        }
    // preencher células
        for (const c of cells) {
            const cx = c[0] - minX;
            const cy = c[1] - minY;
            const idx = cy * w + cx;
            const child = container.children[idx] as HTMLElement;
            const hex = '#' + ('000000' + color.toString(16)).slice(-6);
            child.style.background = hex;
            const glow = Math.max(4, Math.round(tile * 0.4));
            child.style.boxShadow = `0 0 ${glow}px ${hex}`;
        }
    }

    // Permite alterar a fonte do HUD em tempo de execução
    setHudFont(fontName: string) {
        this.hudFont = fontName;
    // aplicar a fonte aos elementos DOM do HUD
        const hud = document.getElementById('hud');
        if (hud) hud.style.fontFamily = fontName;
    }

    drawCell(gx: number, gy: number, gridX: number, gridY: number, color: number) {
        const x = gx + gridX * CELL_SIZE + 1;
        const y = gy + gridY * CELL_SIZE + 1;
        const size = CELL_SIZE - 2;

    // converter cor numérica para componentes RGB
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;

    // cor do contorno mais clara (limitada)
        const outline = Phaser.Display.Color.GetColor(
            Math.min(255, Math.floor(r * 1.2)),
            Math.min(255, Math.floor(g * 1.2)),
            Math.min(255, Math.floor(b * 1.2))
        );

    // sombra interna mais escura
        const inner = Phaser.Display.Color.GetColor(
            Math.max(0, Math.floor(r * 0.25)),
            Math.max(0, Math.floor(g * 0.25)),
            Math.max(0, Math.floor(b * 0.25))
        );

    // preenchimento principal (brilho)
        this.graphics.fillStyle(color, 1);
        this.graphics.fillRect(x, y, size, size);

    // retângulo interno mais escuro para visual "pixel"
        this.graphics.fillStyle(inner, 1);
        this.graphics.fillRect(x + 4, y + 4, size - 8, size - 8);

    // contorno
        this.graphics.lineStyle(2, outline, 0.8);
        this.graphics.strokeRect(x, y, size, size);
    }
}
