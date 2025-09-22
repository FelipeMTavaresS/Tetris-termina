import Phaser from 'phaser';

export class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    create() {
    const { width, height } = this.scale;

    // Selected start level (default)
    let level = 1;

        // Fundo semi-transparente (apenas criar, sem guardar referência)
        this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0);

        // Título removido: usamos somente arte ASCII abaixo

        

        // ASCII art to place INSIDE the button (array of safe strings)
        const btnAscii = [
            '                                           ',
            '       ___       _      _                  ',
            '      |_ _|_ __ (_) ___(_) __ _ _ __       ',
            "       | || '_ \\| |/ __| |/ _` | '__|      ",
            '       | || | | | | (__| | (_| | |         ',
            '      |___|_| |_|_|\\___|_|\\__,_|_|         ',
            '                                           ',
            ''
        ];

        // Create the ASCII text first to measure size (use larger font for readability)
        const asciiText = this.add.text(0, 0, btnAscii.join('\n'), {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#00ff6a',
            align: 'left',
            shadow: { offsetX: 1, offsetY: 1, color: '#001100', blur: 0, stroke: true, fill: true }
        }).setOrigin(0.5).setStroke('#002200', 1);

    // compute button size from text + padding
    const btnH = Math.max(56, asciiText.height + 24);
        const btnX = width / 2;
    const btnY = height * 0.52;

    // place text centered (set higher depth so it's above the rectangles)
    asciiText.setPosition(btnX, btnY).setDepth(2);

    // Removida a borda/fundo: o texto ASCII é clicável diretamente
    asciiText.setInteractive({ useHandCursor: true });

    // subtle background rect which appears on hover to improve contrast
    const hoverBg = this.add.rectangle(btnX, btnY, Math.max(180, asciiText.width + 28), btnH, 0x000000, 0).setOrigin(0.5).setDepth(1);
    // Make sure the background is behind the text
    hoverBg.setDepth(asciiText.depth - 1);

        // Hover / active visual no próprio texto
        asciiText.on('pointerover', () => {
            asciiText.setColor('#b7ffbf');
            hoverBg.setFillStyle(0x000000, 0.45);
        });
        asciiText.on('pointerout', () => {
            asciiText.setColor('#00ff6a');
            hoverBg.setFillStyle(0x000000, 0);
        });

        // click animation: a small scale pop + color flash then start scene
        const playClickAnimationAndStart = () => {
            // quick flash to white-green and pop
            this.tweens.addCounter({
                from: 0,
                to: 1,
                duration: 140,
                ease: 'Cubic.easeOut',
                onStart: () => {
                    // pop scale
                    this.tweens.add({ targets: asciiText, scaleX: 1.06, scaleY: 1.06, duration: 90, yoyo: true, ease: 'Sine.easeOut' });
                },
                onUpdate: (tween) => {
                    const raw = tween.getValue();
                    const v = raw == null ? 0 : Number(raw);
                    // interpolate color towards a brighter tint
                    if (v > 0.5) asciiText.setColor('#ffffff');
                },
                onComplete: () => {
                    this.scene.start('Game', { startLevel: level });
                }
            });
        };

        asciiText.on('pointerdown', playClickAnimationAndStart);

        // Dica rápida estilo terminal
        this.add.text(width / 2, height * 0.75, 'Pressione ESPAÇO para iniciar', {
            fontFamily: 'Courier New, monospace',
            fontSize: '14px',
            color: '#00ff6a'
        }).setOrigin(0.5);

        // Iniciar por tecla Espaço
        this.input.keyboard?.on('keydown-SPACE', () => {
            playClickAnimationAndStart();
        });

        // --- Pulsing animation aplicado ao texto ASCII para chamar atenção
        this.tweens.add({
            targets: asciiText,
            scaleX: 1.02,
            scaleY: 1.02,
            yoyo: true,
            repeat: -1,
            duration: 600,
            ease: 'Sine.easeInOut'
        });

        // ASCII TITLE (small) above main title for terminal feel
        const ascii = [
            '████████╗███████╗████████╗██████╗ ██╗███████╗',
            '╚══██╔══╝██╔════╝╚══██╔══╝██╔══██╗██║██╔════╝',
            '   ██║   █████╗     ██║   ██████╔╝██║███████╗',
            '   ██║   ██╔══╝     ██║   ██╔══██╗██║╚════██║',
            '   ██║   ███████╗   ██║   ██║  ██║██║███████║',
            '   ╚═╝   ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚══════╝'
        ];
        this.add.text(width / 2, height * 0.18, ascii.join('\n'), {
            fontFamily: 'monospace',
            fontSize: '10px',
            color: '#00ff6a',
            align: 'center'
        }).setOrigin(0.5);

    // Level selector UI (terminal style)
        const levelText = this.add.text(width / 2, btnY + btnH + 28, `Nível: ${level}`, {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#00ff6a'
        }).setOrigin(0.5);

        // Left/right keys to change level
        this.input.keyboard?.on('keydown-LEFT', () => {
            level = Math.max(1, level - 1);
            levelText.setText(`Nível: ${level}`);
        });
        this.input.keyboard?.on('keydown-RIGHT', () => {
            level = Math.min(10, level + 1);
            levelText.setText(`Nível: ${level}`);
        });

        // Click on levelText cycles
        levelText.setInteractive({ useHandCursor: true });
        levelText.on('pointerdown', () => {
            level = (level % 10) + 1;
            levelText.setText(`Nível: ${level}`);
        });
    }
}
